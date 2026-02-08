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
        // VIDEO DURATION CONFIG - UPDATED TO MATCH PYTHON (12 SECONDS/0.2 MINUTES)
        DURATION_CONFIG: {
            defaultMinutes: 0.2,  // 12 seconds
            statusBasedAdjustment: {
                NS: 0.2,   // Not started: 12 seconds
                '1H': 0.2, // First half: 12 seconds
                '2H': 0.2, // Second half: 12 seconds
                HT: 0.2,   // Halftime: 12 seconds
                ET: 0.2,   // Extra time: 12 seconds
                FT: 0.2,   // Finished: 12 seconds
                LIVE: 0.2, // Live: 12 seconds
                P: 0.2,    // Penalty: 12 seconds
                SUSP: 0.2  // Suspended: 12 seconds
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

    // VIDEO DURATION HELPER - MATCHES PYTHON LOGIC (ALWAYS 12 SECONDS)
    static generateHighlightDuration(matchStatus = 'NS', isPriority = false) {
        try {
            // ALWAYS RETURN 12 SECONDS (0.2 MINUTES) AS REQUESTED
            return 0.2;
            
        } catch (error) {
            console.warn("Error generating duration, using default:", error);
            return 0.2; // Always 12 seconds
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
                '-t', duration.toString(),
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

            exec(cmd, { timeout: 150000 }, (error, stdout, stderr) => {
                if (error) {
                    console.error("FFmpeg Download Error:", stderr);
                    reject(new Error(`Stream Capture Failed: ${error.message}`));
                } else {
                    console.log("FFmpeg download completed successfully");
                    resolve(outputPath);
                }
            });
        });
    }

    async addMatchOverlay(inputPath, outputPath, metadata) {
        const { home, away, score, league, minute } = metadata;
        const cleanHome = home.replace(/'/g, "").substring(0, 20);
        const cleanAway = away.replace(/'/g, "").substring(0, 20);

        const filters = [
            `drawtext=text='${cleanHome}  ${score}  ${cleanAway}':fontsize=32:fontcolor=white:x=(w-text_w)/2:y=30:box=1:boxcolor=black@0.7:boxborderw=8`,
            `drawtext=text='${league.substring(0, 30)} | ${minute}':fontsize=18:fontcolor=yellow:x=(w-text_w)/2:y=75:box=1:boxcolor=black@0.5:boxborderw=5`,
            `drawtext=text='VORTEX LIVE':fontsize=16:fontcolor=white@0.4:x=w-text_w-15:y=h-text_h-15`
        ];

        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .videoFilter(filters.join(','))
                .on('end', () => {
                    console.log("Overlay added successfully");
                    resolve(outputPath);
                })
                .on('error', (err) => {
                    console.error("FFmpeg overlay error:", err);
                    reject(err);
                })
                .save(outputPath);
        });
    }

    async uploadToStorage(filePath, destination) {
        try {
            console.log(`Uploading to storage: ${destination}`);
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
            
            const publicUrl = `https://storage.googleapis.com/${bucketName}/highlights/${destination}`;
            console.log(`Upload complete: ${publicUrl}`);
            return publicUrl;
        } catch (error) {
            console.error("Storage upload error:", error);
            throw error;
        }
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
            // Don't throw - Telegram failure shouldn't break the process
        }
    }

    cleanupFiles(...files) {
        files.forEach(f => { 
            if (f && fs.existsSync(f)) {
                try {
                    fs.unlinkSync(f);
                    console.log(`Cleaned up file: ${f}`);
                } catch (err) {
                    console.error(`Error cleaning up file ${f}:`, err);
                }
            }
        });
    }
}

// ============================================================
// CORS HELPER FUNCTION
// ============================================================

const handleCors = (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return true;
    }
    return false;
};

// ============================================================
// STREAM VALIDATION HELPER
// ============================================================

const getValidStreamUrl = (matchData) => {
    if (!matchData) return null;
    
    // Check all stream URLs for valid .m3u8 links
    const streamUrls = [
        matchData.streamUrl1,
        matchData.streamUrl2,
        matchData.streamUrl3
    ];
    
    for (const streamUrl of streamUrls) {
        if (streamUrl) {
            try {
                const decodedUrl = Utils.decode64(streamUrl);
                if (decodedUrl.includes('.m3u8')) {
                    console.log(`Found valid .m3u8 stream: ${decodedUrl.substring(0, 50)}...`);
                    return decodedUrl;
                }
            } catch (error) {
                console.warn(`Error decoding stream URL: ${error.message}`);
            }
        }
    }
    
    return null;
};

// ============================================================
// MAIN HANDLER - UPDATED WITH VIDEO DURATION LOGIC
// ============================================================

exports.generateHighlight = functions.runWith({ 
    timeoutSeconds: 180,  // Reduced from 300 to 180 seconds
    memory: '2GB' 
}).https.onRequest(async (req, res) => {
    if (handleCors(req, res)) return;

    console.log("Highlight generation request received:", req.body);
    
    const rawVideo = path.join(os.tmpdir(), `raw_${uuidv4()}.mp4`);
    const finalVideo = path.join(os.tmpdir(), `final_${uuidv4()}.mp4`);
    const processor = new VideoProcessor();

    try {
        const { matchId, eventType = 'goal', timestamp = '00:00:00' } = req.body;
        
        if (!matchId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing matchId parameter' 
            });
        }

        const matchDoc = await db.collection("matches").doc(matchId).get();
        if (!matchDoc.exists) {
            return res.status(404).json({ 
                success: false, 
                error: 'Match not found in database' 
            });
        }

        const matchData = matchDoc.data();
        
        // USE VIDEO DURATION FROM DATABASE OR USE 12 SECONDS
        let duration = 12; // Default to 12 seconds as requested
        
        // Try to get video duration from database, but cap at 12 seconds
        if (matchData.videoDuration) {
            duration = Math.min(matchData.videoDuration, 12);
        }
        
        // Convert minutes to seconds if needed
        if (duration < 5) { // Assuming it's in minutes if < 5
            duration = duration * 60; // Convert minutes to seconds
        }
        
        // Ensure duration is between 1 and 12 seconds
        duration = Math.max(1, Math.min(duration, 12));
        
        console.log(`Using duration: ${duration} seconds for match ${matchId}`);

        // Get valid stream URL
        const streamUrl = getValidStreamUrl(matchData);

        if (!streamUrl) {
            return res.status(400).json({ 
                success: false, 
                error: 'No valid .m3u8 stream URL found for this match. Please ensure the match has working stream links.' 
            });
        }

        console.log(`Starting highlight for ${matchData.home?.name} vs ${matchData.away?.name}, duration: ${duration} seconds`);

        const meta = {
            home: matchData.home?.name || 'Home',
            away: matchData.away?.name || 'Away',
            score: `${matchData.home?.score || 0}-${matchData.away?.score || 0}`,
            league: matchData.league || 'Live Match',
            minute: matchData.minute || "LIVE"
        };

        console.log("Step 1: Downloading clip...");
        await processor.downloadClip(streamUrl, timestamp, duration, rawVideo);

        console.log("Step 2: Adding overlay...");
        await processor.addMatchOverlay(rawVideo, finalVideo, meta);

        console.log("Step 3: Uploading to storage...");
        const videoUrl = await processor.uploadToStorage(finalVideo, `${matchId}_${Date.now()}.mp4`);
        
        console.log("Step 4: Saving to database...");
        // Update database with highlight entry
        const highlightId = `hl_${uuidv4().substring(0,8)}`;
        await db.collection("videoHighlights").doc(highlightId).set({
            matchId,
            videoUrl,
            eventType,
            duration: duration,
            generatedAt: admin.firestore.FieldValue.serverTimestamp(),
            metadata: { 
                home: matchData.home?.name, 
                away: matchData.away?.name,
                status: matchData.status,
                isPriority: matchData.isPriority,
                league: matchData.league
            }
        });

        console.log("Step 5: Sending to Telegram...");
        // SEND TO TELEGRAM CHANNEL (non-blocking)
        processor.sendVideoToTelegram(videoUrl, meta, eventType).catch(err => {
            console.error("Telegram sending failed (non-critical):", err.message);
        });

        console.log("Highlight generation completed successfully");
        return res.status(200).json({ 
            success: true, 
            videoUrl, 
            highlightId, 
            duration,
            message: `Highlight generated successfully (${duration} seconds)` 
        });

    } catch (error) {
        console.error("Highlight Process Failed:", error);
        return res.status(500).json({ 
            success: false, 
            error: error.message,
            details: 'Please ensure: 1) Match has valid .m3u8 stream links, 2) Stream is currently live, 3) Firebase Storage is properly configured'
        });
    } finally {
        processor.cleanupFiles(rawVideo, finalVideo);
    }
});

// ============================================================
// BACKWARD COMPATIBILITY - OLD ENDPOINT NAME
// ============================================================

exports.generateVideoHighlight = exports.generateHighlight;

// ============================================================
// GET MATCH HIGHLIGHTS FUNCTION
// ============================================================

exports.getMatchHighlights = functions.https.onRequest(async (req, res) => {
    if (handleCors(req, res)) return;
    
    try {
        const { matchId } = req.query;
        
        if (!matchId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing matchId parameter' 
            });
        }
        
        const snap = await db.collection("videoHighlights")
            .where("matchId", "==", matchId)
            .orderBy("generatedAt", "desc")
            .get();
            
        const highlights = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        return res.status(200).json({ 
            success: true, 
            highlights: highlights 
        });
        
    } catch (error) {
        console.error("Error getting match highlights:", error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ============================================================
// GET ALL HIGHLIGHTS FUNCTION
// ============================================================

exports.getAllVideoHighlights = functions.https.onRequest(async (req, res) => {
    if (handleCors(req, res)) return;
    
    try {
        const limit = parseInt(req.query.limit) || 20;
        
        const snap = await db.collection("videoHighlights")
            .orderBy("generatedAt", "desc")
            .limit(limit)
            .get();
            
        const highlights = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        return res.status(200).json({ 
            success: true, 
            highlights: highlights 
        });
        
    } catch (error) {
        console.error("Error getting all highlights:", error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ============================================================
// GET HIGHLIGHT BY ID FUNCTION
// ============================================================

exports.getVideoHighlightById = functions.https.onRequest(async (req, res) => {
    if (handleCors(req, res)) return;
    
    try {
        const { highlightId } = req.query;
        
        if (!highlightId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing highlightId parameter' 
            });
        }
        
        const doc = await db.collection("videoHighlights").doc(highlightId).get();
        
        if (!doc.exists) {
            return res.status(404).json({ 
                success: false, 
                error: 'Highlight not found' 
            });
        }
        
        return res.status(200).json({ 
            success: true, 
            highlight: {
                id: doc.id,
                ...doc.data()
            }
        });
        
    } catch (error) {
        console.error("Error getting highlight by ID:", error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ============================================================
// DELETE HIGHLIGHT FUNCTION
// ============================================================

exports.deleteVideoHighlight = functions.https.onRequest(async (req, res) => {
    if (handleCors(req, res)) return;
    
    try {
        const { highlightId } = req.body;
        
        if (!highlightId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing highlightId parameter' 
            });
        }
        
        await db.collection("videoHighlights").doc(highlightId).delete();
        
        return res.status(200).json({ 
            success: true, 
            message: 'Highlight deleted successfully' 
        });
        
    } catch (error) {
        console.error("Error deleting highlight:", error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ============================================================
// GET VIDEO HIGHLIGHT STATS FUNCTION
// ============================================================

exports.getVideoHighlightStats = functions.https.onRequest(async (req, res) => {
    if (handleCors(req, res)) return;
    
    try {
        const highlightsSnap = await db.collection("videoHighlights").get();
        const matchesSnap = await db.collection("matches").get();
        
        const stats = {
            totalHighlights: highlightsSnap.size,
            totalMatches: matchesSnap.size,
            recentHighlights: highlightsSnap.size,
            defaultDuration: 12 // 12 seconds as requested
        };
        
        return res.status(200).json({ 
            success: true, 
            stats: stats 
        });
        
    } catch (error) {
        console.error("Error getting highlight stats:", error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
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
            
            // Generate video duration using the same logic (always 12 seconds)
            const videoDuration = 0.2; // Always 12 seconds
            
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

// ============================================================
// HEALTH CHECK ENDPOINT
// ============================================================

exports.healthCheck = functions.https.onRequest(async (req, res) => {
    if (handleCors(req, res)) return;
    
    try {
        // Check Firebase connection
        const testDoc = await db.collection("system").doc("health_check").get();
        
        // Check Storage connection
        const [files] = await bucket.getFiles({ maxResults: 1 });
        
        return res.status(200).json({
            success: true,
            status: "healthy",
            timestamp: new Date().toISOString(),
            services: {
                firestore: "connected",
                storage: "connected",
                ffmpeg: "available"
            },
            config: {
                defaultDuration: 12,
                timeoutSeconds: 180
            }
        });
        
    } catch (error) {
        console.error("Health check failed:", error);
        return res.status(500).json({
            success: false,
            status: "unhealthy",
            error: error.message
        });
    }
});