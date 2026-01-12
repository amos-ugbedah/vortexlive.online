/* eslint-disable */
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const axios = require("axios");

// Initialize Firebase Admin
if (admin.apps.length === 0) { 
    admin.initializeApp(); 
}
const db = admin.firestore();

// ========================
// CONFIGURATION - UPDATED BUT OPTIMIZED
// ========================
const API_KEYS = [
    "c07116b7224340b30c1a2f4cbbf4abe7", 
    "0e3ac987340e582eb85a41758dc7c33a5dfcec72f940e836d960fe68a28fe904", 
    "3671908177msh066f984698c094ap1c8360jsndb2bc44e1c65", 
    "700ca9a1ed18bf1b842e0210e9ae73ce", 
    "2f977aee380c7590bcf18759dfc18aacd0827b65c4d5df6092ecad5f29aebc33", 
    "13026e250b0dc9c788acceb0c5ace63c", 
    "36d031751e132991fd998a3f0f5088b7d1f2446ca9b44351b2a90fde76581478",
    "08a2395d18de848b4d3542d71234a61212aa43a3027ba11d7d3de3682c6159aa",
    "3d8bb3c294a4b486d95057721a00d13ed22eacc05e57ad357bc8b3872d8d68a8"
];

const TELEGRAM_TOKEN = "8126112394:AAH7-da80z0C7tLco-ZBoZryH_6hhZBKfhE";
const CHAT_ID = "@LivefootballVortex";

// UPDATED ELITE LEAGUES - BUT WE'LL FILTER PROPERLY
const ELITE_LEAGUES = [
    // Original working leagues
    1,    // UEFA Champions League
    39,   // Premier League
    140,  // La Liga
    135,  // Serie A
    78,   // Bundesliga
    61,   // Ligue 1
    2,    // UEFA Europa League
    3,    // UEFA Europa Conference League
    848,  // UEFA Super Cup
    307,  // FIFA Club World Cup
    88,   // Eredivisie
    94,   // Primeira Liga
    
    // NEW: Major Domestic Cups YOU WANTED
    45,   // FA Cup (England) - WAS MISSING
    48,   // Coupe de France - WAS MISSING
    143,  // Copa del Rey (Spain)
    137,  // Coppa Italia
    81,   // DFB-Pokal (Germany)
    
    // NEW: International Competitions
    5,    // UEFA Nations League
    4,    // European Championship
    10,   // World Cup
    13,   // Africa Cup of Nations
    11,   // Copa América
    
    // Keep your original ones
    12,   // AFC Champions League
    667,  // CONMEBOL Libertadores
    10,   // CONMEBOL Sudamericana
];

// Keep your original stream sources
const STREAM_SOURCES = [
    "https://www.score808.com/live",
    "https://streameast.app/soccer",
    "https://cricfree.live/football",
    "https://live.soccerstreams.net/event",
    "https://buffstreams.app/soccer",
    "https://reddit.soccerstreamlinks.com"
];

const STATUS_MAP = {
    'TBD': 'NS', 'NS': 'NS', '1H': '1H', 'HT': 'HT', '2H': '2H', 'ET': 'ET',
    'BT': 'BT', 'P': 'P', 'SUSP': 'SUSP', 'INT': 'SUSP', 'FT': 'FT', 'AET': 'FT',
    'PEN': 'FT', 'PST': 'PST', 'CANC': 'CANC', 'ABD': 'ABD', 'AWD': 'AWD', 'WO': 'AWD',
    'LIVE': 'LIVE', 'IN_PLAY': 'LIVE', 'PAUSED': 'HT', 'FINISHED': 'FT', 'SCHEDULED': 'NS', 'TIMED': 'NS'
};

// ========================
// UTILITY FUNCTIONS - KEEP ORIGINAL
// ========================

const fetchWithRotation = async (endpoint) => {
    let lastError = "";
    for (let i = 0; i < API_KEYS.length; i++) {
        try {
            const key = API_KEYS[i];
            const isRapid = key.includes("msh");
            const config = {
                method: 'get',
                url: isRapid ? `https://api-football-v1.p.rapidapi.com/v3/${endpoint}` : `https://v3.football.api-sports.io/${endpoint}`,
                headers: {
                    'Accept': 'application/json',
                    ...(isRapid ? { 'x-rapidapi-key': key, 'x-rapidapi-host': 'api-football-v1.p.rapidapi.com' } 
                                : { 'x-apisports-key': key, 'x-apisports-host': 'v3.football.api-sports.io' })
                },
                timeout: 15000
            };
            const response = await axios(config);
            if (response.data.errors && Object.keys(response.data.errors).length > 0) {
                lastError = JSON.stringify(response.data.errors);
                continue; 
            }
            return response.data;
        } catch (err) { 
            lastError = err.message;
            if (err.response?.status === 429) await new Promise(r => setTimeout(r, 1000));
        }
    }
    throw new Error(`ALL_KEYS_EXHAUSTED: ${lastError}`);
};

const sendTelegram = async (msg) => {
    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID, text: msg, parse_mode: 'Markdown'
        });
    } catch (e) { console.error("Telegram Error:", e.message); }
};

const normalizeStatus = (apiStatus) => {
    if (!apiStatus) return 'NS';
    return STATUS_MAP[String(apiStatus).toUpperCase()] || 'NS';
};

const generateAIPick = (home, away) => {
    const picks = [
        `Vortex AI: Aggressive play expected from ${home}`,
        `AI Prediction: ${away} will focus on defense`,
        `High probability of goals in second half`,
        `${home} has strong home advantage statistics`,
        `Expect tactical midfield battle`,
        `${away} performs well in away matches`,
        `High-intensity match with multiple shots expected`,
        `AI predicts over 2.5 total goals`,
        `Both teams expected to score`
    ];
    return picks[Math.floor(Math.random() * picks.length)];
};

const isEliteLeague = (leagueId) => ELITE_LEAGUES.includes(Number(leagueId));

const generateStreamUrls = (matchId) => {
    return {
        streamUrl1: Buffer.from(`${STREAM_SOURCES[0]}/${matchId}`).toString('base64'),
        streamUrl2: Buffer.from(`${STREAM_SOURCES[1]}/${matchId}`).toString('base64'),
        streamUrl3: Buffer.from(`${STREAM_SOURCES[2]}/${matchId}`).toString('base64'),
        streamQuality1: "HD",
        streamQuality2: "SD", 
        streamQuality3: "LD",
        streamServer1: "Server 1 (Primary)",
        streamServer2: "Server 2 (Backup)",
        streamServer3: "Server 3 (Emergency)"
    };
};

// ========================
// CORE SYNC ENGINE - FIXED WITH PROPER FILTERING
// ========================

const runGlobalSync = async () => {
    const today = new Date().toISOString().split('T')[0];
    console.log(`Fetching matches for: ${today}`);
    
    try {
        const data = await fetchWithRotation(`fixtures?date=${today}`);
        let matches = data.response || [];
        
        console.log(`Total API matches: ${matches.length}`);
        
        // CRITICAL FIX: Filter FIRST, then sort and limit
        // 1. Filter for elite leagues only
        let eliteMatches = matches.filter(m => isEliteLeague(m.league.id));
        console.log(`Elite league matches after filter: ${eliteMatches.length}`);
        
        // 2. If no elite matches today, use your original logic as fallback
        if (eliteMatches.length === 0) {
            console.log("No elite matches today, using original logic");
            matches.sort((a, b) => (isEliteLeague(b.league.id) ? 1 : 0) - (isEliteLeague(a.league.id) ? 1 : 0));
            eliteMatches = matches.slice(0, 50); // Limit to 50
        } else {
            // 3. Sort elite matches by time (earliest first)
            eliteMatches.sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date));
            
            // 4. Limit to exactly 50-55 matches as you requested
            eliteMatches = eliteMatches.slice(0, 55);
        }
        
        console.log(`Final matches to store: ${eliteMatches.length}`);
        
        // Log what we're storing
        eliteMatches.forEach((m, i) => {
            console.log(`${i+1}. ${m.teams.home.name} vs ${m.teams.away.name} (${m.league.name})`);
        });

        const batch = db.batch();
        for (const m of eliteMatches) {
            const matchId = String(m.fixture.id); 
            const matchRef = db.collection("matches").doc(matchId);
            
            const streamUrls = generateStreamUrls(matchId);
            
            const matchData = {
                id: matchId,
                home: { 
                    name: m.teams.home.name, 
                    logo: m.teams.home.logo, 
                    score: Number(m.goals.home ?? 0) 
                },
                away: { 
                    name: m.teams.away.name, 
                    logo: m.teams.away.logo, 
                    score: Number(m.goals.away ?? 0) 
                },
                status: normalizeStatus(m.fixture.status.short),
                minute: Number(m.fixture.status.elapsed || 0),
                league: m.league.name,
                isElite: isEliteLeague(m.league.id),
                kickoff: m.fixture.date,
                aiPick: generateAIPick(m.teams.home.name, m.teams.away.name),
                
                streamUrl1: streamUrls.streamUrl1,
                streamUrl2: streamUrls.streamUrl2,
                streamUrl3: streamUrls.streamUrl3,
                streamQuality1: streamUrls.streamQuality1,
                streamQuality2: streamUrls.streamQuality2,
                streamQuality3: streamUrls.streamQuality3,
                streamServer1: streamUrls.streamServer1,
                streamServer2: streamUrls.streamServer2,
                streamServer3: streamUrls.streamServer3,
                
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            };
            batch.set(matchRef, matchData, { merge: true });
        }
        
        await batch.commit();
        console.log(`Successfully stored ${eliteMatches.length} matches`);
        
        return { 
            count: eliteMatches.length,
            eliteCount: eliteMatches.filter(m => isEliteLeague(m.league.id)).length
        };
        
    } catch (error) {
        console.error("Error in runGlobalSync:", error);
        throw error;
    }
};

// ========================
// EXPORTED FUNCTIONS - KEEP ORIGINAL BUT UPDATE MEMORY
// ========================

// 1. Live Bot (Every 2 Minutes) - INCREASE MEMORY
exports.vortexLiveBot = onSchedule({ 
    schedule: "every 2 minutes", 
    timeZone: "Africa/Lagos", 
    region: "us-central1",
    memory: "512MiB",  // Increased from default
    timeoutSeconds: 120
}, async () => {
    console.log("Live Bot running at:", new Date().toISOString());
    
    const settingsDoc = await db.collection("settings").doc("bot").get();
    if (settingsDoc.exists && settingsDoc.data().isActive === false) return;

    try {
        const data = await fetchWithRotation('fixtures?live=all');
        const liveMatches = data.response || [];
        console.log(`Live matches found: ${liveMatches.length}`);
        
        // Filter live matches for elite leagues only
        const eliteLiveMatches = liveMatches.filter(m => isEliteLeague(m.league.id));
        console.log(`Elite live matches: ${eliteLiveMatches.length}`);
        
        for (const m of eliteLiveMatches) {
            const matchId = String(m.fixture.id);
            const matchRef = db.collection("matches").doc(matchId);
            const oldDoc = await matchRef.get();
            
            const updateData = {
                "home.score": Number(m.goals.home ?? 0),
                "away.score": Number(m.goals.away ?? 0),
                status: normalizeStatus(m.fixture.status.short),
                minute: Number(m.fixture.status.elapsed || 0),
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            };

            if (oldDoc.exists) {
                const old = oldDoc.data();
                if (m.goals.home > (old.home?.score || 0) || m.goals.away > (old.away?.score || 0)) {
                    await sendTelegram(`⚽ *GOAL!* ${m.teams.home.name} ${m.goals.home}-${m.goals.away} ${m.teams.away.name}`);
                }
                await matchRef.update(updateData);
            } else {
                const streamUrls = generateStreamUrls(matchId);
                
                await matchRef.set({
                    ...updateData,
                    id: matchId,
                    home: { name: m.teams.home.name, logo: m.teams.home.logo, score: m.goals.home },
                    away: { name: m.teams.away.name, logo: m.teams.away.logo, score: m.goals.away },
                    league: m.league.name,
                    isElite: isEliteLeague(m.league.id),
                    kickoff: m.fixture.date,
                    aiPick: generateAIPick(m.teams.home.name, m.teams.away.name),
                    streamUrl1: streamUrls.streamUrl1,
                    streamUrl2: streamUrls.streamUrl2,
                    streamUrl3: streamUrls.streamUrl3,
                    streamQuality1: streamUrls.streamQuality1,
                    streamQuality2: streamUrls.streamQuality2,
                    streamQuality3: streamUrls.streamQuality3,
                    streamServer1: streamUrls.streamServer1,
                    streamServer2: streamUrls.streamServer2,
                    streamServer3: streamUrls.streamServer3
                }, { merge: true });
            }
        }
        
        console.log("Live Bot completed successfully");
        
    } catch (error) {
        console.error("Live Bot error:", error);
        await sendTelegram(`❌ Live Bot Error: ${error.message}`);
    }
});

// 2. Daily Sync (7:30 AM) - INCREASE MEMORY & TIMEOUT
exports.dailySync = onSchedule({ 
    schedule: "30 7 * * *", 
    timeZone: "Africa/Lagos", 
    region: "us-central1",
    memory: "1GiB",  // Increased for processing more leagues
    timeoutSeconds: 300  // 5 minutes timeout
}, async () => {
    console.log("Daily Sync started at:", new Date().toISOString());
    
    try {
        const result = await runGlobalSync();
        await sendTelegram(`🌅 *Daily Sync Complete:* ${result.count} matches (${result.eliteCount} elite).`);
    } catch (error) {
        console.error("Daily Sync error:", error);
        await sendTelegram(`❌ Daily Sync Failed: ${error.message}`);
    }
});

// 3. Emergency Sync (HTTP Trigger) - INCREASE MEMORY
exports.emergencySync = onRequest({ 
    cors: true, 
    region: "us-central1",
    memory: "1GiB",  // Increased
    timeoutSeconds: 300
}, async (req, res) => {
    // Set CORS headers
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }
    
    console.log("Emergency Sync triggered");
    
    try {
        const result = await runGlobalSync();
        res.status(200).json({ 
            success: true, 
            updated: result.count,
            eliteCount: result.eliteCount,
            message: `Successfully updated ${result.count} matches (${result.eliteCount} elite).`
        });
    } catch (e) { 
        console.error("Emergency sync error:", e);
        res.status(500).json({ 
            success: false,
            error: e.message 
        }); 
    }
});

// 4. Cleanup (Daily 6:45 AM)
exports.morningCleanup = onSchedule({ 
    schedule: "45 6 * * *", 
    timeZone: "Africa/Lagos", 
    region: "us-central1"
}, async () => {
    console.log("Cleanup started");
    const snap = await db.collection("matches").get();
    const batch = db.batch();
    snap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    await sendTelegram("🏁 *Database Cleared for new day.*");
});

// 5. Stream Update Function (Admin Panel)
exports.updateStreams = onRequest({
    cors: true,
    region: "us-central1",
    memory: "256MiB",
    timeoutSeconds: 30
}, async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }
    
    try {
        const { matchId, stream1, stream2, stream3 } = req.body;
        
        if (!matchId) {
            return res.status(400).json({
                success: false,
                error: 'Missing matchId'
            });
        }
        
        const matchRef = db.collection('matches').doc(String(matchId));
        const updates = {
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        };
        
        if (stream1) updates.streamUrl1 = Buffer.from(stream1).toString('base64');
        if (stream2) updates.streamUrl2 = Buffer.from(stream2).toString('base64');
        if (stream3) updates.streamUrl3 = Buffer.from(stream3).toString('base64');
        
        await matchRef.update(updates);
        
        res.json({
            success: true,
            message: `Stream URLs updated for match ${matchId}`,
            matchId: matchId
        });
        
    } catch (error) {
        console.error('Update streams error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 6. Health Check
exports.healthCheck = onRequest({ 
    cors: true, 
    region: "us-central1",
    memory: "256MiB"
}, async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    
    try {
        const healthRef = db.collection('settings').doc('health');
        await healthRef.set({
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            status: 'healthy',
            checkedAt: new Date().toISOString()
        }, { merge: true });
        
        const matchesSnapshot = await db.collection('matches').limit(5).get();
        
        res.status(200).json({
            status: 'healthy',
            service: 'vortex-live-backend',
            timestamp: new Date().toISOString(),
            matches: matchesSnapshot.size,
            eliteLeaguesConfigured: ELITE_LEAGUES.length
        });
        
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            service: 'vortex-live-backend',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

console.log("✅ Firebase Functions code loaded successfully");