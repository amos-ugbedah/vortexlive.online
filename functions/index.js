/* eslint-disable */

// Using v1 syntax which is more stable
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

if (admin.apps.length === 0) admin.initializeApp();
const db = admin.firestore();

// ============================================================
// CONFIGURATION
// ============================================================

const CONFIG = {
    TELEGRAM: { TOKEN: "8126112394:AAH7-da80z0C7tLco-ZBoZryH_6hhZBKfhE", CHAT: "@LivefootballVortex" },
    STREAMS: ["https://thestreameast.life", "https://soccertvhd.com", "https://givemereddistreams.top"],
    STATUS_MAP: { TBD: 'NS', NS: 'NS', 1: 'NS', '1H': '1H', '2H': '2H', HT: 'HT', ET: 'ET', BT: 'BT', P: 'P', SUSP: 'SUSP', INT: 'SUSP', FT: 'FT', AET: 'FT', PEN: 'FT', PST: 'PST', CANC: 'CANC', ABD: 'ABD', AWD: 'AWD', WO: 'AWD', LIVE: 'LIVE', 'IN_PLAY': 'LIVE', INPLAY: 'LIVE', '1ST': '1H', '2ND': '2H', PAUSED: 'HT', FINISHED: 'FT', SCHEDULED: 'NS', TIMED: 'NS', POSTPONED: 'PST', DELAYED: 'SUSP', ABANDONED: 'ABD', 2: '1H', 3: 'HT', 4: '2H', 5: 'ET', 6: 'P', 7: 'FT', 8: 'SUSP', 9: 'CANC', 10: 'ABD', 11: 'AWD', 12: 'POSTP', 13: 'INT', 14: 'TBD' },
    ELITE_LEAGUES: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 29, 30, 31, 34, 39, 45, 48, 61, 66, 78, 81, 88, 94, 135, 137, 140, 141, 143, 227, 848],
    TOP_TEAMS: ["REAL MADRID", "BARCELONA", "MANCHESTER CITY", "ARSENAL", "LIVERPOOL", "MANCHESTER UNITED", "CHELSEA", "BAYERN MUNICH", "INTER MILAN", "AC MILAN", "PSG", "JUVENTUS", "ATLETICO MADRID", "BAYER LEVERKUSEN", "DORTMUND"],
    BLOCK_LIST: ["KENYA", "EGYPT", "LIBYA", "JORDAN", "VIETNAM", "GHANA", "NIGERIA"],
    IGNORE_KEYWORDS: ["U23", "U21", "U19", "U18", "U17", "WOMEN", "RESERVE", "YOUTH", "ACADEMY", "B TEAM"]
};

// ============================================================
// UTILITIES
// ============================================================

const Utils = {
    telegram: async (msg) => {
        try {
            await axios.post(`https://api.telegram.org/bot${CONFIG.TELEGRAM.TOKEN}/sendMessage`, {
                chat_id: CONFIG.TELEGRAM.CHAT, text: msg, parse_mode: 'Markdown'
            });
        } catch (e) { console.error("Telegram Error:", e.message); }
    },

    encode64: (str) => Buffer.from(str).toString('base64'),
    
    decode64: (str) => {
        try {
            if (str && !str.startsWith('http')) {
                return Buffer.from(str, 'base64').toString();
            }
            return str;
        } catch {
            return str;
        }
    },

    normTeam: (name) => name ? name.toLowerCase()
        .replace(/\s+(fc|cf|sc|afc|cfc|united|city|real|cf|atletico|at\.?|deportivo|sporting|olympique|olympiacos|dynamo|zenit|shakhtar|besiktas|galatasaray|fenerbahce|ajax|psv|benfica|porto)$/gi, '')
        .replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim() : '',

    permId: (home, away, date) => {
        const h = Utils.normTeam(home), a = Utils.normTeam(away);
        let d;
        if (date) {
            if (date.includes('-')) d = date.substring(0, 10);
            else if (date.length >= 8) d = `${date.substring(0,4)}-${date.substring(4,6)}-${date.substring(6,8)}`;
            else d = new Date().toISOString().split('T')[0];
        } else d = new Date().toISOString().split('T')[0];
        return `${h}-vs-${a}-${d}`.substring(0, 150);
    },

    normStatus: (s) => {
        if (!s) return 'NS';
        const status = String(s).toUpperCase().trim();
        if (CONFIG.STATUS_MAP[status]) return CONFIG.STATUS_MAP[status];
        if (/^\d+$/.test(status) || status.includes("'") || status.includes("MIN")) return 'LIVE';
        return 'NS';
    },

    isElite: (league, id, home = "", away = "") => {
        const ln = String(league || '').toUpperCase(), h = String(home || '').toUpperCase(), a = String(away || '').toUpperCase();
        if (CONFIG.IGNORE_KEYWORDS.some(k => h.includes(k) || a.includes(k))) return false;
        if (CONFIG.BLOCK_LIST.some(c => ln.includes(c))) return false;
        if (CONFIG.ELITE_LEAGUES.includes(Number(id || 0))) return true;
        
        const ELITE_KEYWORDS = ["PREMIER LEAGUE", "LALIGA", "SERIE A", "BUNDESLIGA", "LIGUE 1", "CHAMPIONS LEAGUE", "EUROPA LEAGUE", "CONFERENCE LEAGUE", "EREDIVISIE", "LIGA PORTUGAL", "PRIMEIRA LIGA", "FA CUP", "COPA DEL REY", "COPPA ITALIA", "COUPE DE FRANCE", "DFB POKAL", "KNVB BEKER", "TAÇA DE PORTUGAL", "EUROPEAN CHAMPIONSHIP", "WORLD CUP", "NATIONS LEAGUE", "INTERNATIONAL FRIENDLIES", "EUROPA", "CONFERENCE", "SUPER CUP", "CLUB WORLD CUP", "UEFA", "PREMIER", "DIVISION", "CHAMPIONSHIP", "LEAGUE", "CUP"];
        
        return ELITE_KEYWORDS.some(k => ln.includes(k)) && !["BEACH", "INDOOR", "FUTSAL"].some(k => ln.includes(k));
    },

    isPriority: (home, away) => CONFIG.TOP_TEAMS.some(t => 
        String(home || '').toUpperCase().includes(t) || String(away || '').toUpperCase().includes(t))
};

// ============================================================
// MATCH PROCESSING
// ============================================================

const processMatch = (event, stage) => {
    try {
        const home = event.T1?.[0] || { Nm: 'Unknown' }, away = event.T2?.[0] || { Nm: 'Unknown' };
        const homeName = home.Nm || 'Unknown', awayName = away.Nm || 'Unknown';
        const league = stage.Snm || 'Unknown', leagueId = parseInt(stage.Sid || 0);
        
        if (!Utils.isPriority(homeName, awayName) && !Utils.isElite(league, leagueId, homeName, awayName)) return null;
        
        const status = Utils.normStatus(event.Eps || 'NS'), kickoffRaw = String(event.Esd || '');
        let kickoffIso;
        
        try {
            if (kickoffRaw && kickoffRaw.length >= 14) {
                kickoffIso = `${kickoffRaw.substring(0,4)}-${kickoffRaw.substring(4,6)}-${kickoffRaw.substring(6,8)}T${kickoffRaw.substring(8,10)}:${kickoffRaw.substring(10,12)}:${kickoffRaw.substring(12,14)}Z`;
            } else kickoffIso = new Date().toISOString();
        } catch { kickoffIso = new Date().toISOString(); }
        
        return {
            id: Utils.permId(homeName, awayName, kickoffRaw),
            apiMatchId: String(event.Eid || ''),
            home: { name: homeName, score: parseInt(event.Tr1 || 0), logo: home.Img || '', searchName: Utils.normTeam(homeName) },
            away: { name: awayName, score: parseInt(event.Tr2 || 0), logo: away.Img || '', searchName: Utils.normTeam(awayName) },
            status, minute: parseInt(event.Epi || 0), league, leagueId,
            leagueLogo: `https://www.footyaccumulators.com/images/leagues/${leagueId}.png`,
            kickoff: kickoffIso, isElite: true, isPriority: Utils.isPriority(homeName, awayName),
            announced: false, isPermanent: true, viewCount: 0,
            lastAlertScore: { h: parseInt(event.Tr1 || 0), a: parseInt(event.Tr2 || 0) },
            lastStatus: status, createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
    } catch (e) { console.error("Parse Error:", e); return null; }
};

// ============================================================
// FETCH MATCHES
// ============================================================

const fetchMatches = async () => {
    try {
        console.log('Fetching matches...');
        const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const matches = [];
        const headers = { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' };
        
        // Today's matches
        try {
            const res = await axios.get(`https://prod-public-api.livescore.com/v1/api/app/date/soccer/${today}/0?MD=1`, { timeout: 15000, headers });
            if (res.data?.Stages) {
                for (const stage of res.data.Stages) {
                    if (stage.Events) for (const event of stage.Events) {
                        const match = processMatch(event, stage);
                        if (match) matches.push(match);
                    }
                }
            }
        } catch (e) { console.error('Today fetch:', e.message); }
        
        // Live matches
        try {
            const res = await axios.get('https://prod-public-api.livescore.com/v1/api/app/live/soccer?MD=1', { timeout: 10000, headers });
            if (res.data?.Stages) {
                for (const stage of res.data.Stages) {
                    if (stage.Events) for (const event of stage.Events) {
                        const match = processMatch(event, stage);
                        if (match && !matches.find(m => m.id === match.id)) matches.push(match);
                    }
                }
            }
        } catch (e) { console.log('Live fetch:', e.message); }
        
        console.log(`Found ${matches.length} matches`);
        return matches;
    } catch (error) { console.error('Fetch Error:', error.message); return []; }
};

// ============================================================
// MAIN SCRAPER - FIXED v1 SYNTAX
// ============================================================

exports.vortexLiveScraper = functions
    .runWith({
        timeoutSeconds: 120,
        memory: '256MB'  // Changed from '256MiB' to '256MB'
    })
    .pubsub.schedule('every 2 minutes')
    .timeZone('Africa/Lagos')
    .onRun(async (context) => {
        try {
            const matches = await fetchMatches();
            if (matches.length === 0) return console.log('No matches');
            
            const existing = await db.collection("matches").get();
            const existingMap = {};
            existing.forEach(doc => { existingMap[doc.id] = { ref: doc.ref, data: doc.data() }; });
            
            const batch = db.batch();
            let updates = 0, news = 0;
            
            for (const match of matches) {
                try {
                    if (existingMap[match.id]) {
                        const old = existingMap[match.id].data;
                        const update = {
                            status: match.status,
                            "home.score": match.home.score,
                            "away.score": match.away.score,
                            minute: match.minute || 0,
                            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
                            isPriority: match.isPriority || false,
                            apiMatchId: match.apiMatchId || ""
                        };
                        
                        if (match.home.score > old.home?.score || match.away.score > old.away?.score) {
                            update.lastAlertScore = { h: match.home.score, a: match.away.score };
                        }
                        
                        batch.update(existingMap[match.id].ref, update);
                        updates++;
                    } else {
                        // Check for existing match with same teams/date
                        let existingId = null;
                        for (const id in existingMap) {
                            const e = existingMap[id].data;
                            if (match.home.name.toLowerCase() === e.home?.name?.toLowerCase() &&
                                match.away.name.toLowerCase() === e.away?.name?.toLowerCase() &&
                                (!match.kickoff || !e.kickoff || match.kickoff.split('T')[0] === e.kickoff.split('T')[0])) {
                                existingId = id; break;
                            }
                        }
                        
                        if (existingId) {
                            batch.update(existingMap[existingId].ref, {
                                status: match.status,
                                "home.score": match.home.score,
                                "away.score": match.away.score,
                                minute: match.minute || 0,
                                lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
                                isPriority: match.isPriority || false,
                                apiMatchId: match.apiMatchId || ""
                            });
                            updates++;
                        } else {
                            batch.set(db.collection("matches").doc(match.id), {
                                ...match,
                                lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
                                streamUrl1: Utils.encode64(CONFIG.STREAMS[0]),
                                streamUrl2: Utils.encode64(CONFIG.STREAMS[1]),
                                streamUrl3: Utils.encode64(CONFIG.STREAMS[2]),
                                streamQuality1: "HD",
                                streamServer1: "StreamEast",
                                aiPick: "Vortex AI: Analyzing...",
                                addedManually: false,
                                hasHighlights: false
                            });
                            news++;
                        }
                    }
                } catch (e) { console.error('Match error:', e.message); }
            }
            
            if (updates > 0 || news > 0) {
                await batch.commit();
                console.log(`✅ Updated ${updates}, created ${news}`);
            }
        } catch (e) { console.error("Scraper Error:", e.message); }
    });

// ============================================================
// MATCH MONITOR - FIXED v1 SYNTAX
// ============================================================

exports.vortexLiveMonitor = functions
    .runWith({
        timeoutSeconds: 120,
        memory: '256MB'
    })
    .pubsub.schedule('every 2 minutes')
    .timeZone('Africa/Lagos')
    .onRun(async (context) => {
        const snap = await db.collection("matches").get();
        const batch = db.batch();
        let updates = false;
        
        for (const doc of snap.docs) {
            const m = doc.data();
            const h = m.home?.score || 0, a = m.away?.score || 0;
            const last = m.lastAlertScore || { h: 0, a: 0 };
            const lastStatus = m.lastStatus || "NS";
            let msg = "";
            
            if (h > last.h || a > last.a) {
                msg = `⚽ *GOAL!*\n\n${m.home.name} *${h} - ${a}* ${m.away.name}\n\n📺 https://vortexlive.online/match/${doc.id}`;
                batch.update(doc.ref, { lastAlertScore: { h, a } });
                updates = true;
            } 
            
            if ((lastStatus === "NS" || lastStatus === "1") && (m.status === "1H" || m.status === "LIVE")) {
                msg = `▶️ *KICK OFF!*\n\n${m.home.name} vs ${m.away.name}\n\n📺 https://vortexlive.online/match/${doc.id}`;
            } else if (lastStatus !== "HT" && m.status === "HT") {
                msg = `⏸ *HALF TIME*\n\n${m.home.name} *${h} - ${a}* ${m.away.name}`;
            } else if (lastStatus !== "FT" && m.status === "FT") {
                msg = `🏁 *FULL TIME*\n\n${m.home.name} *${h} - ${a}* ${m.away.name}`;
            }
            
            if (msg) {
                await Utils.telegram(msg);
                batch.update(doc.ref, { lastStatus: m.status });
                updates = true;
            }
        }
        
        if (updates) await batch.commit();
    });

// ============================================================
// MATCH ANNOUNCER - FIXED v1 SYNTAX
// ============================================================

exports.matchAnnouncer = functions
    .runWith({
        timeoutSeconds: 120,
        memory: '256MB'
    })
    .pubsub.schedule('every 5 minutes')
    .timeZone('Africa/Lagos')
    .onRun(async (context) => {
        const now = new Date();
        const soon = new Date(now.getTime() + 10 * 60000);
        const snap = await db.collection("matches").where("status", "in", ["NS", "1"]).where("announced", "==", false).get();
        
        for (const doc of snap.docs) {
            const m = doc.data();
            if (!m.kickoff) continue;
            const kickoff = new Date(m.kickoff);
            if (kickoff <= soon) {
                const time = kickoff.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' });
                await Utils.telegram(`🔔 *UPCOMING*\n\n⚽ ${m.home.name} vs ${m.away.name}\n⏰ ${time}\n\n📺 https://vortexlive.online/match/${doc.id}`);
                await doc.ref.update({ announced: true });
            }
        }
    });

// ============================================================
// CLEANUP - FIXED v1 SYNTAX
// ============================================================

exports.morningCleanup = functions
    .runWith({
        timeoutSeconds: 300,
        memory: '256MB'
    })
    .pubsub.schedule('45 6 * * *')
    .timeZone('Africa/Lagos')
    .onRun(async (context) => {
        try {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            const snap = await db.collection("matches")
                .where("status", "in", ["FT", "CANC", "ABD", "AWD", "POSTP"])
                .where("lastUpdated", "<", yesterday)
                .get();
                
            const count = snap.size;
            if (count === 0) return console.log("No cleanup needed");
            
            for (let i = 0; i < snap.docs.length; i += 400) {
                const batch = db.batch();
                snap.docs.slice(i, i + 400).forEach(doc => batch.delete(doc.ref));
                await batch.commit();
            }
            
            console.log(`✅ Cleaned ${count} matches`);
            await Utils.telegram(`🧹 Cleaned ${count} old matches.`);
            
        } catch (error) { console.error("Cleanup error:", error); }
    });

// ============================================================
// HIGHLIGHT HTTP ENDPOINTS - FIXED v1 SYNTAX
// ============================================================

exports.generateHighlight = functions
    .runWith({
        timeoutSeconds: 120,
        memory: '256MB'
    })
    .https.onRequest(async (req, res) => {
        try {
            res.set('Access-Control-Allow-Origin', '*');
            res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            
            if (req.method === 'OPTIONS') {
                res.status(204).send('');
                return;
            }
            
            const { matchId, duration = 120, streamSource = 'streamUrl1' } = req.method === 'GET' ? req.query : req.body;
            
            if (!matchId) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Missing matchId parameter'
                });
            }
            
            console.log(`Generating highlight for match: ${matchId} from stream: ${streamSource}`);
            
            try {
                const match = await db.collection("matches").doc(matchId).get();
                if (!match.exists) throw new Error('Match not found');
                
                const data = match.data();
                const home = data.home?.name || 'Home', away = data.away?.name || 'Away';
                const league = data.league || 'Unknown', score = `${data.home?.score || 0}-${data.away?.score || 0}`;
                
                if (!['LIVE', '1H', '2H', 'HT', 'ET', 'FT'].includes(data.status || 'NS')) {
                    throw new Error('Highlights only for live/finished matches');
                }
                
                // Get the stream URL based on source parameter
                const streamKey = streamSource || 'streamUrl1';
                const streamUrlEncoded = data[streamKey];
                
                if (!streamUrlEncoded) {
                    throw new Error(`Stream source ${streamSource} not available for this match`);
                }
                
                // Decode the stream URL
                const streamUrl = Utils.decode64(streamUrlEncoded);
                
                const dur = Math.max(60, Math.min(duration, 300));
                const query = encodeURIComponent(`${home} vs ${away} ${score} ${league} highlights`);
                const expires = new Date(Date.now() + 72 * 60 * 60 * 1000);
                
                // Generate highlight data with actual stream info
                const highlight = {
                    matchId, 
                    home, 
                    away, 
                    league, 
                    score, 
                    status: data.status,
                    minute: data.minute || 0,
                    duration: dur,
                    streamSource: streamKey,
                    streamUrl: streamUrl,
                    streamServer: data.streamServer1 || 'StreamEast',
                    streamQuality: data.streamQuality1 || 'HD',
                    quality: '720p',
                    generatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    expiresAt: expires.toISOString(),
                    viewCount: 0,
                    isActive: true,
                    watermark: true,
                    isStreamBased: true
                };
                
                // Store in Firestore
                await db.collection("highlights").doc(matchId).set(highlight, { merge: true });
                
                // Update match document
                await db.collection("matches").doc(matchId).update({ 
                    hasHighlights: true, 
                    highlightGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
                    lastStreamSource: streamKey
                });
                
                const result = { 
                    success: true, 
                    message: 'Highlight generated successfully from stream',
                    data: {
                        matchId,
                        home,
                        away,
                        league,
                        score,
                        status: data.status,
                        watchUrl: streamUrl,
                        downloadUrl: `https://vortexlive.online/highlights/${matchId}`,
                        duration: dur,
                        quality: '720p',
                        streamSource: streamKey,
                        streamServer: data.streamServer1 || 'StreamEast',
                        expiresAt: expires.toISOString(),
                        generatedAt: new Date().toISOString()
                    }
                };
                
                res.status(200).json(result);
                
            } catch (error) {
                console.error('Highlight generation error:', error);
                
                if (error.message === 'Match not found') {
                    return res.status(404).json({ 
                        success: false, 
                        error: 'Match not found',
                        message: 'The specified match could not be found'
                    });
                }
                
                if (error.message.includes('Highlights only') || error.message.includes('Stream source')) {
                    return res.status(400).json({ 
                        success: false, 
                        error: error.message,
                        message: error.message
                    });
                }
                
                return res.status(500).json({ 
                    success: false, 
                    error: 'Internal server error',
                    message: 'Failed to generate highlight. Please try again.'
                });
            }
            
        } catch (error) {
            console.error('Highlight generation error:', error);
            return res.status(500).json({ 
                success: false, 
                error: 'Internal server error',
                message: 'Failed to generate highlight. Please try again.'
            });
        }
    });

exports.getHighlightStatus = functions
    .runWith({
        timeoutSeconds: 60,
        memory: '256MB'
    })
    .https.onRequest(async (req, res) => {
        try {
            res.set('Access-Control-Allow-Origin', '*');
            res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.set('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.status(204).send('');
                return;
            }
            
            const { matchId } = req.query;
            
            if (!matchId) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Missing matchId parameter' 
                });
            }
            
            console.log(`Getting highlight status for match: ${matchId}`);
            
            try {
                const doc = await db.collection("highlights").doc(matchId).get();
                if (!doc.exists) {
                    return res.status(404).json({ 
                        exists: false, 
                        message: 'No highlight found' 
                    });
                }
                
                const data = doc.data();
                const now = new Date();
                const expires = new Date(data.expiresAt);
                
                const status = {
                    exists: true,
                    status: now > expires ? 'expired' : 'available',
                    isExpired: now > expires,
                    expiresAt: expires.toISOString(),
                    timeRemaining: expires - now,
                    data: data,
                    message: now > expires ? 
                        'Highlight has expired. Generate a new one.' : 
                        'Highlight is available for viewing.'
                };
                
                return res.status(200).json({
                    success: true,
                    ...status
                });
                
            } catch (error) {
                console.error('Error getting highlight status:', error);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Internal server error',
                    message: 'Failed to get highlight status'
                });
            }
            
        } catch (error) {
            console.error('Get highlight status error:', error);
            return res.status(500).json({ 
                success: false, 
                error: 'Internal server error',
                message: 'Failed to get highlight status'
            });
        }
    });

exports.getAvailableStreams = functions
    .runWith({
        timeoutSeconds: 60,
        memory: '256MB'
    })
    .https.onRequest(async (req, res) => {
        try {
            res.set('Access-Control-Allow-Origin', '*');
            res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.set('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.status(204).send('');
                return;
            }
            
            const { matchId } = req.query;
            
            if (!matchId) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Missing matchId parameter' 
                });
            }
            
            try {
                const match = await db.collection("matches").doc(matchId).get();
                if (!match.exists) {
                    return res.status(200).json({
                        success: true,
                        matchId,
                        streams: [],
                        count: 0
                    });
                }
                
                const data = match.data();
                const streams = [];
                
                ['streamUrl1', 'streamUrl2', 'streamUrl3'].forEach((key, index) => {
                    if (data[key]) {
                        streams.push({
                            key,
                            url: Utils.decode64(data[key]),
                            label: index === 0 ? 'Primary Stream' : `Backup Stream ${index}`,
                            server: index === 0 ? (data.streamServer1 || 'StreamEast') : `Backup Server ${index}`,
                            quality: index === 0 ? (data.streamQuality1 || 'HD') : 'HD'
                        });
                    }
                });
                
                return res.status(200).json({
                    success: true,
                    matchId,
                    streams,
                    count: streams.length
                });
                
            } catch (error) {
                console.error('Error getting available streams:', error);
                return res.status(200).json({
                    success: true,
                    matchId,
                    streams: [],
                    count: 0
                });
            }
            
        } catch (error) {
            console.error('Get streams error:', error);
            return res.status(500).json({ 
                success: false, 
                error: 'Internal server error'
            });
        }
    });

exports.getAllHighlights = functions
    .runWith({
        timeoutSeconds: 60,
        memory: '256MB'
    })
    .https.onRequest(async (req, res) => {
        try {
            res.set('Access-Control-Allow-Origin', '*');
            
            const snap = await db.collection("highlights").orderBy("generatedAt", "desc").limit(20).get();
            
            const highlights = [];
            snap.forEach(doc => {
                highlights.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return res.status(200).json({
                success: true,
                count: highlights.length,
                highlights
            });
            
        } catch (error) {
            console.error('Get all highlights error:', error);
            return res.status(500).json({ 
                success: false, 
                error: 'Internal server error'
            });
        }
    });

// ============================================================
// HEALTH CHECK
// ============================================================

exports.health = functions
    .runWith({
        timeoutSeconds: 60,
        memory: '256MB'
    })
    .https.onRequest(async (req, res) => {
        try {
            res.set('Access-Control-Allow-Origin', '*');
            
            // Test database connection
            await db.collection("health").doc("check").set({
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                status: "healthy"
            });
            
            return res.status(200).json({
                success: true,
                status: "healthy",
                service: "vortex-live-functions",
                version: "2.8.0",
                timestamp: new Date().toISOString(),
                region: "us-central1",
                functions: [
                    "vortexLiveScraper",
                    "vortexLiveMonitor",
                    "matchAnnouncer",
                    "morningCleanup",
                    "generateHighlight",
                    "getHighlightStatus",
                    "getAvailableStreams",
                    "getAllHighlights"
                ]
            });
            
        } catch (error) {
            console.error('Health check error:', error);
            return res.status(500).json({
                success: false,
                status: "unhealthy",
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });