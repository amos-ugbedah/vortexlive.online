/* eslint-disable */
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const axios = require("axios");

if (admin.apps.length === 0) { 
    admin.initializeApp(); 
}
const db = admin.firestore();

// ========================
// CONFIGURATION - STRICT ELITE ONLY
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
    "3d8bb3c294a4b486d95057721a00d13ed22eacc05e57ad357bc8b3872d8d68a8",
    "36d031751e132991fd998a3f0f5088b7d1f2446ca9b44351b2a90fde76581478",
    "714aeef1f191d12498698e299e0b8008"
];

const TELEGRAM_TOKEN = "8126112394:AAH7-da80z0C7tLco-ZBoZryH_6hhZBKfhE";
const CHAT_ID = "@LivefootballVortex";

// UPDATED STRICT LIST (Top 5 Europe, Major Cups, and International Senior)
const ELITE_LEAGUES = [
    // --- CLUB CONTINENTAL ---
    2,   // Champions League
    3,   // Europa League
    848, // UEFA Super Cup
    5,   // UEFA Conference League
    12,  // AFC Champions League
    13,  // Libertadores
    
    // --- EUROPE TOP 5 + MAJOR ---
    39,  // Premier League (England)
    140, // La Liga (Spain)
    135, // Serie A (Italy)
    78,  // Bundesliga (Germany)
    61,  // Ligue 1 (France)
    88,  // Eredivisie (Netherlands)
    94,  // Primeira Liga (Portugal)
    
    // --- MAJOR DOMESTIC CUPS ---
    45,  // FA Cup (England)
    48,  // League Cup (England)
    143, // Copa del Rey (Spain)
    137, // Coppa Italia
    81,  // DFB Pokal (Germany)
    66,  // Coupe de France
    
    // --- INTERNATIONAL (SENIOR ONLY) ---
    1,   // World Cup
    4,   // Euro Championship
    227, // AFCON (Senior)
    11,  // Copa América
    7,   // Asian Cup
    5,   // UEFA Nations League
    31,  // World Cup Qualifiers (Europe)
    34,  // World Cup Qualifiers (South America)
    29,  // World Cup Qualifiers (Africa)
    30,  // World Cup Qualifiers (Asia)
    10,  // Friendlies (International)
];

const STREAM_SOURCES = [
   "https://givemereddistreams.top",    
    "https://sportsbay.dk",
    "https://thestreameast.life",
    "https://soccertvhd.com",
    "https://streameast.app/soccer",
    "https://cricfree.live/football"
];

const STATUS_MAP = {
    'TBD': 'NS', 'NS': 'NS', '1H': '1H', 'HT': 'HT', '2H': '2H', 'ET': 'ET',
    'BT': 'BT', 'P': 'P', 'SUSP': 'SUSP', 'INT': 'SUSP', 'FT': 'FT', 'AET': 'FT',
    'PEN': 'FT', 'PST': 'PST', 'CANC': 'CANC', 'ABD': 'ABD', 'AWD': 'AWD', 'WO': 'AWD',
    'LIVE': 'LIVE', 'IN_PLAY': 'LIVE', 'PAUSED': 'HT', 'FINISHED': 'FT', 'SCHEDULED': 'NS', 'TIMED': 'NS'
};

// ========================
// UTILITIES
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

const normalizeStatus = (apiStatus) => STATUS_MAP[String(apiStatus).toUpperCase()] || 'NS';

const isEliteLeague = (leagueId) => ELITE_LEAGUES.includes(Number(leagueId));

const generateStreamUrls = (matchId) => ({
    streamUrl1: Buffer.from(`${STREAM_SOURCES[0]}/${matchId}`).toString('base64'),
    streamUrl2: Buffer.from(`${STREAM_SOURCES[1]}/${matchId}`).toString('base64'),
    streamUrl3: Buffer.from(`${STREAM_SOURCES[2]}/${matchId}`).toString('base64'),
    streamQuality1: "HD", streamQuality2: "SD", streamQuality3: "LD",
    streamServer1: "Server 1", streamServer2: "Server 2", streamServer3: "Server 3"
});

const calculateMatchMinuteAndStatus = (kickoffTime) => {
    const now = new Date();
    const kickoff = new Date(kickoffTime);
    const diffMinutes = Math.floor((now - kickoff) / (1000 * 60));
    if (diffMinutes < 0) return { minute: 0, status: 'NS' };
    if (diffMinutes <= 45) return { minute: diffMinutes, status: '1H' };
    if (diffMinutes <= 60) return { minute: 45, status: 'HT' };
    if (diffMinutes <= 105) return { minute: diffMinutes - 15, status: '2H' };
    return { minute: 90, status: 'FT' };
};

// ========================
// CORE SYNC ENGINE - UPDATED FOR STRICTNESS
// ========================

const runGlobalSync = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    try {
        const data = await fetchWithRotation(`fixtures?date=${today}`);
        let allMatchesFromApi = data.response || [];

        // 1. FILTER: Strict keywords and League IDs
        let eliteMatches = allMatchesFromApi.filter(m => {
            const leagueName = m.league.name.toUpperCase();
            const isEliteId = isEliteLeague(m.league.id);
            
            // Exclude youth/women/reserves/lower divisions even if they are in an elite country
            const isSeniorMen = !leagueName.includes("U19") && 
                                !leagueName.includes("U21") && 
                                !leagueName.includes("U23") && 
                                !leagueName.includes("YOUTH") && 
                                !leagueName.includes("WOMEN") && 
                                !leagueName.includes("RESERVE") &&
                                !leagueName.includes("SUB");

            return isEliteId && isSeniorMen;
        });

        // 2. SORT: Elite matches by kickoff time
        eliteMatches.sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date));

        // 3. NO BACKFILL: We ONLY use eliteMatches. If there are only 5, we only show 5.
        const finalMatches = eliteMatches;

        const batch = db.batch();
        for (const m of finalMatches) {
            const matchId = String(m.fixture.id); 
            const matchRef = db.collection("matches").doc(matchId);
            const streamUrls = generateStreamUrls(matchId);
            
            batch.set(matchRef, {
                id: matchId,
                home: { name: m.teams.home.name, logo: m.teams.home.logo, score: Number(m.goals.home ?? 0) },
                away: { name: m.teams.away.name, logo: m.teams.away.logo, score: Number(m.goals.away ?? 0) },
                status: normalizeStatus(m.fixture.status.short),
                minute: Number(m.fixture.status.elapsed || 0),
                league: m.league.name,
                leagueId: m.league.id,
                leagueCountry: m.league.country || '',
                leagueLogo: m.league.logo || '',
                isElite: true,
                kickoff: new Date(new Date(m.fixture.date).getTime() + (60 * 60 * 1000)).toISOString(),
                venue: m.fixture.venue?.name || 'Stadium TBD',
                aiPick: "Elite Coverage", 
                ...streamUrls,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }
        
        await batch.commit();
        return { count: finalMatches.length, eliteCount: finalMatches.length };
        
    } catch (error) {
        console.error("Sync Error:", error);
        throw error;
    }
};

const autoDetectLiveMatches = async () => {
    const matchesSnapshot = await db.collection("matches").where("status", "in", ["NS", "1H", "HT", "2H"]).get();
    let updatedCount = 0;

    for (const doc of matchesSnapshot.docs) {
        const match = doc.data();
        const { minute, status } = calculateMatchMinuteAndStatus(match.kickoff);
        
        if (match.status !== status || Math.abs(match.minute - minute) >= 3) {
            await doc.ref.update({ status, minute, lastUpdated: admin.firestore.FieldValue.serverTimestamp() });
            updatedCount++;
        }
    }
    return { updatedCount };
};

// ========================
// SCHEDULED EXPORTS
// ========================

exports.vortexLiveBot = onSchedule({ 
    schedule: "every 2 minutes", 
    timeZone: "Africa/Lagos", 
    region: "us-central1"
}, async () => {
    try {
        const data = await fetchWithRotation('fixtures?live=all');
        const liveMatches = data.response || [];
        
        for (const m of liveMatches) {
            // Updated to be consistent with elite-only logic
            if (!isEliteLeague(m.league.id)) continue;
            
            const matchRef = db.collection("matches").doc(String(m.fixture.id));
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
                    await sendTelegram(`⚽ *GOAL!* ${m.teams.home.name} ${m.goals.home}-${m.goals.away} ${m.teams.away.name}\n🏆 ${m.league.name}`);
                }
                await matchRef.update(updateData);
            }
        }
        await autoDetectLiveMatches();
    } catch (e) { console.error("Bot Error:", e); }
});

exports.dailySync = onSchedule({ 
    schedule: "30 7 * * *", 
    timeZone: "Africa/Lagos", 
    region: "us-central1"
}, async () => {
    const res = await runGlobalSync();
    await sendTelegram(`🌅 *Sync Complete:* Found ${res.eliteCount} Elite matches today.`);
});

exports.emergencySync = onRequest({ cors: true, region: "us-central1" }, async (req, res) => {
    try {
        const result = await runGlobalSync();
        res.status(200).json({ success: true, ...result });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

exports.morningCleanup = onSchedule({ schedule: "45 6 * * *", timeZone: "Africa/Lagos", region: "us-central1" }, async () => {
    const snap = await db.collection("matches").get();
    const batch = db.batch();
    snap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
});