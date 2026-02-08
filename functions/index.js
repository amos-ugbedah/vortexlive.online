/* eslint-disable */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { Storage } = require('@google-cloud/storage');
const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('fluent-ffmpeg');

if (admin.apps.length === 0) admin.initializeApp();
const db = admin.firestore();
const execPromise = util.promisify(exec);

const storage = new Storage();
const bucketName = 'vortex-live-3a8cb.appspot.com'; 
const bucket = storage.bucket(bucketName);

// ============================================================
// CONFIGURATION - UPDATED WITH VIDEO DURATION LOGIC
// ============================================================

const CONFIG = {
    TELEGRAM: { 
        TOKEN: "8126112394:AAH7-da80z0C7tLco-ZBoZryH_6hhZBKfhE", 
        CHAT: "@LivefootballVortex" 
    },
    VIDEO: {
        TEMP_DIR: path.join(os.tmpdir(), 'vortex_videos'),
        RESOLUTIONS: { '360p': '640x360', '480p': '854x480', '720p': '1280x720', '1080p': '1920x1080' },
        DEFAULT_RESOLUTION: '480p',
        BITRATE: '800k',
        AUDIO_BITRATE: '64k',
        FPS: 25,
        EVENT_TYPES: {
            GOAL: { color: 'red', icon: '⚽', duration: 12 },
            SAVE: { color: 'blue', icon: '🧤', duration: 8 },
            HIGHLIGHT: { color: 'white', icon: '🎬', duration: 15 }
        },
        // VIDEO DURATION CONFIG - MATCHING PYTHON CONFIG
        DURATION_CONFIG: {
            defaultMinutes: 0.5,  // 30 seconds - minimal safe duration
            statusBasedAdjustment: {
                NS: 0.5,   // Not started: minimal duration
                '1H': 1.0, // First half: 1 minute
                '2H': 1.5, // Second half: 1.5 minutes
                HT: 0.5,   // Halftime: minimal duration
                ET: 2.0,   // Extra time: 2 minutes
                FT: 3.0,   // Finished: 3 minutes for highlights
                LIVE: 1.0, // Live: 1 minute
                P: 0.5,    // Penalty: minimal
                SUSP: 0.5  // Suspended: minimal
            }
        }
    }
};

// ============================================================
// UTILITIES
// ============================================================

class Utils {
    static decode64(str) {
        try {
            if (str && !str.startsWith('http')) return Buffer.from(str, 'base64').toString();
            return str;
        } catch { return str; }
    }

    static ensureDir(dirPath) {
        if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
    }

    // VIDEO DURATION HELPER - MATCHES PYTHON LOGIC
    static generateHighlightDuration(matchStatus = 'NS', isPriority = false) {
        try {
            const config = CONFIG.VIDEO.DURATION_CONFIG;
            
            // Get base duration from status-based adjustment
            let baseDuration = config.statusBasedAdjustment[matchStatus] || config.defaultMinutes;
            
            // For priority matches, add slight boost but keep minimal
            if (isPriority) {
                baseDuration = Math.min(baseDuration + 0.3, 5.0);  // Cap at 5 minutes
            }
            
            // Ensure duration is at least the minimum safe duration
            const duration = Math.max(baseDuration, config.defaultMinutes);
            
            // Round to 1 decimal place for cleaner display
            return Math.round(duration * 10) / 10;
            
        } catch (error) {
            console.warn("Error generating duration, using default:", error);
            return CONFIG.VIDEO.DURATION_CONFIG.defaultMinutes;
        }
    }
}

// ============================================================
// IMPROVED VIDEO PROCESSOR - WITH 480P ENFORCEMENT
// ============================================================

class VideoProcessor {
    constructor() {
        this.tempDir = CONFIG.VIDEO.TEMP_DIR;
        Utils.ensureDir(this.tempDir);
    }

    async downloadClip(streamUrl, timestamp, duration, outputPath) {
        return new Promise((resolve, reject) => {
            const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";
            const urlObj = new URL(streamUrl);
            const referer = `${urlObj.protocol}//${urlObj.hostname}/`;
            
            const res = CONFIG.VIDEO.RESOLUTIONS[CONFIG.VIDEO.DEFAULT_RESOLUTION];

            const cmd = [
                'ffmpeg',
                '-headers', `"${['User-Agent: ' + userAgent, 'Referer: ' + referer].join('\r\n')}"`,
                '-reconnect 1',
                '-reconnect_at_eof 1',
                '-reconnect_streamed 1',
                '-reconnect_delay_max 5',
                '-ss', timestamp,
                '-i', `"${streamUrl}"`,
                '-t', duration,
                '-c:v libx264',
                '-preset veryfast',
                `-b:v ${CONFIG.VIDEO.BITRATE}`,
                '-crf 26',
                '-c:a aac',
                `-b:a ${CONFIG.VIDEO.AUDIO_BITRATE}`,
                `-vf "scale=${res}:force_original_aspect_ratio=decrease,pad=${res}:(ow-iw)/2:(oh-ih)/2"`,
                `-r ${CONFIG.VIDEO.FPS}`,
                '-movflags +faststart',
                '-f mp4',
                '-y',
                `"${outputPath}"`
            ].join(' ');

            exec(cmd, { timeout: 180000 }, (error, stdout, stderr) => {
                if (error) {
                    console.error("FFmpeg Download Error:", stderr);
                    reject(new Error(`Stream Capture Failed: ${error.message}`));
                } else {
                    resolve(outputPath);
                }
            });
        });
    }

    async addMatchOverlay(inputPath, outputPath, metadata) {
        const { home, away, score, league, minute } = metadata;
        const cleanHome = home.replace(/'/g, "");
        const cleanAway = away.replace(/'/g, "");

        const filters = [
            `drawtext=text='${cleanHome}  ${score}  ${cleanAway}':fontsize=32:fontcolor=white:x=(w-text_w)/2:y=30:box=1:boxcolor=black@0.7:boxborderw=8`,
            `drawtext=text='${league} | ${minute}':fontsize=18:fontcolor=yellow:x=(w-text_w)/2:y=75:box=1:boxcolor=black@0.5:boxborderw=5`,
            `drawtext=text='VORTEX LIVE':fontsize=16:fontcolor=white@0.4:x=w-text_w-15:y=h-text_h-15`
        ];

        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .videoFilter(filters.join(','))
                .on('end', () => resolve(outputPath))
                .on('error', (err) => reject(err))
                .save(outputPath);
        });
    }

    async uploadToStorage(filePath, destination) {
        await bucket.upload(filePath, { 
            destination: `highlights/${destination}`, 
            resumable: false,
            metadata: { 
                contentType: 'video/mp4',
                cacheControl: 'public, max-age=31536000'
            } 
        });
        
        const file = bucket.file(`highlights/${destination}`);
        await file.makePublic();
        
        return `https://storage.googleapis.com/${bucketName}/highlights/${destination}`;
    }

    async sendVideoToTelegram(videoUrl, metadata, eventType) {
        try {
            const { home, away, score, league } = metadata;
            const caption = `🎥 *NEW HIGHLIGHT* ${CONFIG.VIDEO.EVENT_TYPES[eventType.toUpperCase()]?.icon || '🎬'}\n\n🏆 ${league}\n⚽ ${home} ${score} ${away}\n\n⚡ *Vortex Live Exclusives*`;
            
            const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM.TOKEN}/sendVideo`;
            await axios.post(url, {
                chat_id: CONFIG.TELEGRAM.CHAT,
                video: videoUrl,
                caption: caption,
                parse_mode: 'Markdown'
            });
            console.log("Highlight sent to Telegram successfully.");
        } catch (err) {
            console.error("Failed to send highlight to Telegram:", err.message);
        }
    }

    cleanupFiles(...files) {
        files.forEach(f => { if (f && fs.existsSync(f)) fs.unlinkSync(f); });
    }
}

// ============================================================
// MAIN HANDLER - UPDATED WITH VIDEO DURATION LOGIC
// ============================================================

const handleCors = (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return true;
    }
    return false;
};

exports.generateHighlight = functions.runWith({ 
    timeoutSeconds: 300, 
    memory: '2GB' 
}).https.onRequest(async (req, res) => {
    if (handleCors(req, res)) return;

    const rawVideo = path.join(os.tmpdir(), `raw_${uuidv4()}.mp4`);
    const finalVideo = path.join(os.tmpdir(), `final_${uuidv4()}.mp4`);
    const processor = new VideoProcessor();

    try {
        const { matchId, eventType = 'goal', timestamp = '00:00:00' } = req.body;
        
        if (!matchId) return res.status(400).json({ success: false, error: 'Missing matchId' });

        const matchDoc = await db.collection("matches").doc(matchId).get();
        if (!matchDoc.exists) throw new Error('Match not found in database');

        const matchData = matchDoc.data();
        
        // USE VIDEO DURATION FROM DATABASE OR CALCULATE IT
        let duration = matchData.videoDuration || 12; // Default to 12 seconds if not set
        
        // Use automated streams for recording
        let streamUrl = Utils.decode64(matchData.streamUrl1 || matchData.streamUrl2 || matchData.streamUrl3);

        if (!streamUrl || !streamUrl.includes('.m3u8')) {
            throw new Error('Highlight Capture requires a direct .m3u8 stream. Manual iframes cannot be recorded.');
        }

        console.log(`Starting highlight for ${matchData.home?.name} vs ${matchData.away?.name}, duration: ${duration} minutes`);

        const meta = {
            home: matchData.home?.name || 'Home',
            away: matchData.away?.name || 'Away',
            score: `${matchData.home?.score || 0}-${matchData.away?.score || 0}`,
            league: matchData.league || 'Live Match',
            minute: matchData.minute || "LIVE"
        };

        await processor.downloadClip(streamUrl, timestamp, duration, rawVideo);

        await processor.addMatchOverlay(rawVideo, finalVideo, meta);

        const videoUrl = await processor.uploadToStorage(finalVideo, `${matchId}_${Date.now()}.mp4`);
        
        // Update database with highlight entry
        const highlightId = `hl_${uuidv4().substring(0,8)}`;
        await db.collection("videoHighlights").doc(highlightId).set({
            matchId,
            videoUrl,
            eventType,
            duration: duration, // Store the duration used
            generatedAt: admin.firestore.FieldValue.serverTimestamp(),
            metadata: { 
                home: matchData.home?.name, 
                away: matchData.away?.name,
                status: matchData.status,
                isPriority: matchData.isPriority
            }
        });

        // SEND TO TELEGRAM CHANNEL
        await processor.sendVideoToTelegram(videoUrl, meta, eventType);

        return res.status(200).json({ success: true, videoUrl, highlightId, duration });

    } catch (error) {
        console.error("Highlight Process Failed:", error);
        return res.status(500).json({ success: false, error: error.message });
    } finally {
        processor.cleanupFiles(rawVideo, finalVideo);
    }
});

exports.getMatchHighlights = functions.https.onRequest(async (req, res) => {
    handleCors(req, res);
    const { matchId } = req.query;
    const snap = await db.collection("videoHighlights").where("matchId", "==", matchId).orderBy("generatedAt", "desc").get();
    res.json({ success: true, highlights: snap.docs.map(d => d.data()) });
});

// ============================================================
// FUNCTION TO UPDATE VIDEO DURATION FOR EXISTING MATCHES
// ============================================================

exports.updateMatchDurations = functions.https.onRequest(async (req, res) => {
    if (handleCors(req, res)) return;
    
    try {
        const matchesSnap = await db.collection("matches").get();
        const batch = db.batch();
        let updatedCount = 0;
        
        for (const doc of matchesSnap.docs) {
            const matchData = doc.data();
            const status = matchData.status || 'NS';
            const isPriority = matchData.isPriority || false;
            
            // Generate video duration using the same logic
            const videoDuration = Utils.generateHighlightDuration(status, isPriority);
            
            // Only update if different
            if (matchData.videoDuration !== videoDuration) {
                batch.update(doc.ref, { videoDuration });
                updatedCount++;
            }
        }
        
        if (updatedCount > 0) {
            await batch.commit();
            return res.status(200).json({ 
                success: true, 
                message: `Updated video duration for ${updatedCount} matches` 
            });
        } else {
            return res.status(200).json({ 
                success: true, 
                message: 'All matches already have correct video durations' 
            });
        }
        
    } catch (error) {
        console.error("Error updating match durations:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
});