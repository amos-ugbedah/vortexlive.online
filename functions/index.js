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
// UTILITY FUNCTIONS - UPDATED WITH AUTO-DETECTION
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
// NEW: AUTO LIVE DETECTION FUNCTIONS
// ========================

/**
 * Calculate exact minute based on kickoff time
 * Follows match timeline logic:
 * 0-45 mins: First half (1H)
 * 45-60 mins: Half time (HT)
 * 60-105 mins: Second half (2H)
 * 105-120 mins: Full time (FT)
 * 120-135 mins: Extra time first half (ET)
 * 135-150 mins: Extra time half time (HT)
 * 150-165 mins: Extra time second half (ET)
 * 165-180 mins: Match finished (FT)
 */
const calculateMatchMinuteAndStatus = (kickoffTime) => {
    const now = new Date();
    const kickoff = new Date(kickoffTime);
    const diffMs = now - kickoff;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    // If match hasn't started yet
    if (diffMinutes < 0) {
        return { minute: 0, status: 'NS' };
    }
    
    // Regular time logic
    if (diffMinutes <= 45) {
        return { minute: diffMinutes, status: '1H' };
    } else if (diffMinutes <= 60) {
        return { minute: 45, status: 'HT' };
    } else if (diffMinutes <= 105) {
        return { minute: diffMinutes - 15, status: '2H' }; // -15 for halftime
    } else if (diffMinutes <= 120) {
        return { minute: 90, status: 'FT' };
    }
    
    // Extra time logic
    else if (diffMinutes <= 135) {
        return { minute: diffMinutes - 30, status: 'ET' }; // Extra time first half
    } else if (diffMinutes <= 150) {
        return { minute: 105, status: 'HT' }; // Extra time halftime
    } else if (diffMinutes <= 165) {
        return { minute: diffMinutes - 45, status: 'ET' }; // Extra time second half
    } else if (diffMinutes <= 180) {
        return { minute: 120, status: 'FT' }; // Match finished
    }
    
    // Match definitely finished if > 180 minutes
    return { minute: 120, status: 'FT' };
};

/**
 * Detect and update matches that should be live based on kickoff time
 * This works even if external API doesn't mark them as live
 */
const autoDetectLiveMatches = async () => {
    console.log("🔍 Auto Live Detection running...");
    
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000)); // Matches that started up to 1 hour ago
    const threeHoursAgo = new Date(now.getTime() - (3 * 60 * 60 * 1000)); // Matches that started up to 3 hours ago
    
    try {
        // Get all matches that are scheduled to have started recently
        const matchesSnapshot = await db.collection("matches")
            .where("status", "in", ["NS", "1H", "HT", "2H"]) // Only check matches that aren't finished
            .get();
        
        console.log(`Checking ${matchesSnapshot.size} matches for auto-detection`);
        
        let newlyDetectedCount = 0;
        let updatedCount = 0;
        
        for (const doc of matchesSnapshot.docs) {
            const match = doc.data();
            const matchId = doc.id;
            const kickoffTime = match.kickoff;
            
            if (!kickoffTime) continue;
            
            const { minute, status } = calculateMatchMinuteAndStatus(kickoffTime);
            
            // Only update if match has actually started (status changed from NS to something else)
            // OR if minute has changed significantly
            const shouldUpdate = 
                (match.status === 'NS' && status !== 'NS') || // Match just started
                (match.status !== status) || // Status changed
                (match.minute !== minute && Math.abs(match.minute - minute) >= 2); // Minute changed significantly
            
            if (shouldUpdate) {
                const updates = {
                    status: status,
                    minute: minute,
                    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                };
                
                // If match just started, send notification
                if (match.status === 'NS' && status !== 'NS') {
                    await sendTelegram(
                        `🔄 *Auto-Detected LIVE Match!*\n` +
                        `⚽ ${match.home.name} vs ${match.away.name}\n` +
                        `🏆 ${match.league}\n` +
                        `⏰ Minute: ${minute}' | Status: ${status}\n` +
                        `🔴 Match automatically detected as live!`
                    );
                    newlyDetectedCount++;
                }
                
                await doc.ref.update(updates);
                updatedCount++;
                
                console.log(`Updated ${match.home.name} vs ${match.away.name}: ${match.status} -> ${status}, ${match.minute}' -> ${minute}'`);
            }
        }
        
        console.log(`Auto-detection complete: ${newlyDetectedCount} newly detected, ${updatedCount} updated`);
        
        return { newlyDetectedCount, updatedCount };
        
    } catch (error) {
        console.error("Auto-detection error:", error);
        throw error;
    }
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
            
            // ✅ UPDATED: Add ALL fields frontend expects
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
                // ✅ ADDED: Frontend needs these
                leagueId: m.league.id,
                leagueCountry: m.league.country || '',
                leagueLogo: m.league.logo || '',
                isElite: isEliteLeague(m.league.id),
                // ✅ FIXED: Convert to Lagos time (UTC+1)
                kickoff: new Date(new Date(m.fixture.date).getTime() + (60 * 60 * 1000)).toISOString(),
                // ✅ ADDED: Venue and referee data
                venue: m.fixture.venue?.name || 'Stadium TBD',
                referee: m.fixture.referee || 'Referee TBD',
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
                
                // ✅ ADDED: Manual match flags
                addedManually: false,
                streamsManuallyUpdated: false,
                
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
// EXPORTED FUNCTIONS - UPDATED WITH AUTO DETECTION
// ========================

// 1. UPDATED: vortexLiveBot (Every 2 Minutes) - Now with auto-detection PART 1
exports.vortexLiveBot = onSchedule({ 
    schedule: "every 2 minutes", 
    timeZone: "Africa/Lagos", 
    region: "us-central1",
    memory: "512MiB",
    timeoutSeconds: 120
}, async () => {
    console.log("🚀 Vortex Live Bot running at:", new Date().toISOString());
    
    const settingsDoc = await db.collection("settings").doc("bot").get();
    if (settingsDoc.exists && settingsDoc.data().isActive === false) return;

    try {
        // ========================
        // PART 1: Fetch matches already marked as LIVE by external API
        // ========================
        const data = await fetchWithRotation('fixtures?live=all');
        const liveMatches = data.response || [];
        console.log(`📊 API Live matches found: ${liveMatches.length}`);
        
        // Filter live matches for elite leagues only
        const eliteLiveMatches = liveMatches.filter(m => isEliteLeague(m.league.id));
        console.log(`🎯 Elite live matches from API: ${eliteLiveMatches.length}`);
        
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
                // Check for goals
                if (m.goals.home > (old.home?.score || 0) || m.goals.away > (old.away?.score || 0)) {
                    await sendTelegram(
                        `⚽ *GOAL!*\n` +
                        `${m.teams.home.name} ${m.goals.home}-${m.goals.away} ${m.teams.away.name}\n` +
                        `🏆 ${m.league.name}\n` +
                        `⏰ ${updateData.minute}' | ${updateData.status}`
                    );
                }
                await matchRef.update(updateData);
            } else {
                const streamUrls = generateStreamUrls(matchId);
                
                const newMatchData = {
                    ...updateData,
                    id: matchId,
                    home: { name: m.teams.home.name, logo: m.teams.home.logo, score: m.goals.home },
                    away: { name: m.teams.away.name, logo: m.teams.away.logo, score: m.goals.away },
                    league: m.league.name,
                    leagueId: m.league.id,
                    leagueCountry: m.league.country || '',
                    leagueLogo: m.league.logo || '',
                    isElite: isEliteLeague(m.league.id),
                    kickoff: new Date(new Date(m.fixture.date).getTime() + (60 * 60 * 1000)).toISOString(),
                    venue: m.fixture.venue?.name || 'Stadium TBD',
                    referee: m.fixture.referee || 'Referee TBD',
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
                    addedManually: false,
                    streamsManuallyUpdated: false
                };
                
                await matchRef.set(newMatchData, { merge: true });
            }
        }
        
        // ========================
        // PART 2: NEW - Automatically detect matches whose kickoff time has passed
        // ========================
        console.log("🔄 Starting auto-detection of matches...");
        const autoResult = await autoDetectLiveMatches();
        
        if (autoResult.newlyDetectedCount > 0) {
            await sendTelegram(
                `🔴 *Auto-Detection Summary*\n` +
                `Newly detected live matches: ${autoResult.newlyDetectedCount}\n` +
                `Total matches updated: ${autoResult.updatedCount}\n` +
                `✅ System is working even without API updates!`
            );
        }
        
        console.log(`✅ Live Bot completed: ${eliteLiveMatches.length} API live + ${autoResult.newlyDetectedCount} auto-detected`);
        
    } catch (error) {
        console.error("Live Bot error:", error);
        await sendTelegram(`❌ Live Bot Error: ${error.message}`);
    }
});

// 2. NEW: autoLiveDetector (Every 1 Minute) - More frequent checking
exports.autoLiveDetector = onSchedule({ 
    schedule: "every 1 minutes", 
    timeZone: "Africa/Lagos", 
    region: "us-central1",
    memory: "256MiB",
    timeoutSeconds: 60
}, async () => {
    console.log("⏰ Auto Live Detector running at:", new Date().toISOString());
    
    try {
        // Run auto-detection logic
        const result = await autoDetectLiveMatches();
        
        // Only send summary if we detected something new
        if (result.newlyDetectedCount > 0) {
            console.log(`🎉 Auto-detector found ${result.newlyDetectedCount} new live matches`);
        }
        
        return result;
        
    } catch (error) {
        console.error("Auto-detector error:", error);
        // Don't send Telegram for this one to avoid spam
        return { error: error.message };
    }
});

// 3. Daily Sync (7:30 AM)
exports.dailySync = onSchedule({ 
    schedule: "30 7 * * *", 
    timeZone: "Africa/Lagos", 
    region: "us-central1",
    memory: "1GiB",
    timeoutSeconds: 300
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

// 4. Emergency Sync (HTTP Trigger)
exports.emergencySync = onRequest({ 
    cors: true, 
    region: "us-central1",
    memory: "1GiB",
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

// 5. Cleanup (Daily 6:45 AM)
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

// 6. Stream Update Function (Admin Panel)
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

// 7. Health Check
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
            checkedAt: new Date().toISOString(),
            autoDetection: 'active'
        }, { merge: true });
        
        const matchesSnapshot = await db.collection('matches').limit(5).get();
        
        res.status(200).json({
            status: 'healthy',
            service: 'vortex-live-backend',
            timestamp: new Date().toISOString(),
            matches: matchesSnapshot.size,
            eliteLeaguesConfigured: ELITE_LEAGUES.length,
            features: {
                autoLiveDetection: true,
                telegramNotifications: true,
                streamLinks: true
            }
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

// 8. Fix existing data
exports.fixExistingMatches = onRequest({
    cors: true,
    region: "us-central1",
    memory: "1GiB"
}, async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    
    try {
        const snapshot = await db.collection("matches").get();
        const batch = db.batch();
        
        let updated = 0;
        
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const updates = {};
            
            // Add missing league fields
            if (!data.leagueId) {
                const leagueMap = {
                    'Premier League': 39,
                    'La Liga': 140,
                    'Serie A': 135,
                    'Bundesliga': 78,
                    'Ligue 1': 61,
                    'Champions League': 1,
                    'Europa League': 2,
                    'FA Cup': 45,
                    'Copa del Rey': 143,
                    'Coppa Italia': 137,
                    'DFB-Pokal': 81
                };
                updates.leagueId = leagueMap[data.league] || 0;
            }
            
            if (!data.leagueCountry) updates.leagueCountry = '';
            if (!data.leagueLogo) updates.leagueLogo = '';
            if (!data.venue) updates.venue = 'Stadium TBD';
            if (!data.referee) updates.referee = 'Referee TBD';
            if (data.addedManually === undefined) updates.addedManually = false;
            if (data.streamsManuallyUpdated === undefined) updates.streamsManuallyUpdated = false;
            
            // Fix "TBA" team names
            if (data.home?.name === 'TBA' || data.home?.name === 'TBD') {
                updates['home.name'] = data.home?.name === 'TBA' ? '' : data.home?.name;
            }
            
            if (data.away?.name === 'TBA' || data.away?.name === 'TBD') {
                updates['away.name'] = data.away?.name === 'TBA' ? '' : data.away?.name;
            }
            
            // Convert kickoff to Lagos time if not already
            if (data.kickoff && !data.kickoff.includes('+01:00')) {
                try {
                    const date = new Date(data.kickoff);
                    const lagosTime = new Date(date.getTime() + (60 * 60 * 1000)).toISOString();
                    updates.kickoff = lagosTime;
                } catch (e) {
                    console.log(`Couldn't convert time for match ${doc.id}`);
                }
            }
            
            if (Object.keys(updates).length > 0) {
                batch.update(doc.ref, updates);
                updated++;
            }
        });
        
        await batch.commit();
        
        res.json({ 
            success: true, 
            updated: updated,
            total: snapshot.size,
            message: `Fixed ${updated} out of ${snapshot.size} matches`
        });
        
    } catch (error) {
        console.error("Fix error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 9. NEW: Manual trigger for auto-detection
exports.triggerAutoDetection = onRequest({
    cors: true,
    region: "us-central1",
    memory: "256MiB"
}, async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }
    
    try {
        console.log("Manual auto-detection triggered");
        const result = await autoDetectLiveMatches();
        
        res.status(200).json({
            success: true,
            message: "Auto-detection completed successfully",
            result: result
        });
        
    } catch (error) {
        console.error("Manual trigger error:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

console.log("✅ Firebase Functions code loaded with AUTO-LIVE DETECTION");