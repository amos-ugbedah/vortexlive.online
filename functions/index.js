/* eslint-disable */
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const axios = require("axios");

if (admin.apps.length === 0) admin.initializeApp();
const db = admin.firestore();

const TELEGRAM_TOKEN = "8126112394:AAH7-da80z0C7tLco-ZBoZryH_6hhZBKfhE";
const CHAT_ID = "@LivefootballVortex";

// UNIFIED STATUS MAP - MATCHES ALL 3 PARTS EXACTLY
const STATUS_MAP = {
    'TBD': 'NS', 'NS': 'NS', '1': 'NS', '1H': '1H', '2H': '2H', 'HT': 'HT', 'ET': 'ET',
    'BT': 'BT', 'P': 'P', 'SUSP': 'SUSP', 'INT': 'SUSP', 'FT': 'FT', 'AET': 'FT',
    'PEN': 'FT', 'PST': 'PST', 'CANC': 'CANC', 'ABD': 'ABD', 'AWD': 'AWD', 'WO': 'AWD',
    'LIVE': 'LIVE', 'IN_PLAY': 'LIVE', 'INPLAY': 'LIVE', '1ST': '1H', '2ND': '2H',
    'PAUSED': 'HT', 'FINISHED': 'FT', 'SCHEDULED': 'NS', 
    'TIMED': 'NS', 'POSTPONED': 'PST', 'DELAYED': 'SUSP', 'ABANDONED': 'ABD',
    '2': '1H', '3': 'HT', '4': '2H', '5': 'ET', '6': 'P', '7': 'FT',
    '8': 'SUSP', '9': 'CANC', '10': 'ABD', '11': 'AWD', '12': 'POSTP',
    '13': 'INT', '14': 'TBD'
};

const ELITE_LEAGUES = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 29, 30, 31, 34, 39, 45, 48, 61, 
    66, 78, 81, 88, 94, 135, 137, 140, 141, 143, 227, 848,
    42, 43, 44, 46, 47, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
    100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110,
    200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210,
    300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310,
];

const TOP_5_TEAMS = [
    "REAL MADRID", "BARCELONA", "MANCHESTER CITY", "ARSENAL", "LIVERPOOL", 
    "MANCHESTER UNITED", "CHELSEA", "BAYERN MUNICH", "INTER MILAN", "AC MILAN",
    "PSG", "JUVENTUS", "ATLETICO MADRID", "BAYER LEVERKUSEN", "DORTMUND"
];

const BLOCK_LIST = ["KENYA", "EGYPT", "LIBYA", "JORDAN", "VIETNAM", "GHANA", "NIGERIA"];
const IGNORE_KEYWORDS = ["U23", "U21", "U19", "U18", "U17", "WOMEN", "RESERVE", "YOUTH", "ACADEMY", "B TEAM"];

const STREAM_SOURCES = [
    "https://thestreameast.life",
    "https://soccertvhd.com",
    "https://givemereddistreams.top"
];

const sendTelegram = async (msg) => {
    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID, text: msg, parse_mode: 'Markdown'
        });
    } catch (e) { console.error("Telegram Post Error:", e.message); }
};

// PERMANENT MATCH ID GENERATION - MUST MATCH PYTHON EXACTLY
function normalizeTeamName(name) {
    if (!name) return '';
    return name.toLowerCase()
        .replace(/\s+(fc|cf|sc|afc|cfc|united|city|real|cf|atletico|at\.?|deportivo|sporting|olympique|olympiacos|dynamo|zenit|shakhtar|besiktas|galatasaray|fenerbahce|ajax|psv|benfica|porto)$/gi, '')
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function generatePermanentMatchId(home, away, kickoffDate) {
    const homeNorm = normalizeTeamName(home);
    const awayNorm = normalizeTeamName(away);
    
    let datePart;
    if (kickoffDate) {
        if (kickoffDate.includes('-')) {
            datePart = kickoffDate.substring(0, 10);
        } else if (kickoffDate.length >= 8) {
            datePart = `${kickoffDate.substring(0,4)}-${kickoffDate.substring(4,6)}-${kickoffDate.substring(6,8)}`;
        } else {
            const now = new Date();
            datePart = now.toISOString().split('T')[0];
        }
    } else {
        const now = new Date();
        datePart = now.toISOString().split('T')[0];
    }
    
    return `${homeNorm}-vs-${awayNorm}-${datePart}`.substring(0, 150);
}

// Helper functions that match Python
function encodeBase64(plainStr) {
    try {
        return Buffer.from(plainStr).toString('base64');
    } catch (e) {
        return plainStr;
    }
}

function normalizeStatus(statusRaw) {
    if (!statusRaw) return 'NS';
    const s = String(statusRaw).toUpperCase().trim();
    if (STATUS_MAP[s]) return STATUS_MAP[s];
    if (/^\d+$/.test(s)) return 'LIVE';
    if (s.includes("'") || s.includes("MIN")) return 'LIVE';
    return 'NS';
}

function isEliteMatch(leagueName, leagueId, home = "", away = "") {
    const ln = leagueName.toUpperCase();
    const h = home.toUpperCase();
    const a = away.toUpperCase();
    
    if (IGNORE_KEYWORDS.some(k => h.includes(k) || a.includes(k))) return false;
    if (BLOCK_LIST.some(c => ln.includes(c))) return false;
    if (ELITE_LEAGUES.includes(Number(leagueId))) return true;
    
    const ELITE_KEYWORDS = [
        "PREMIER LEAGUE", "LALIGA", "SERIE A", "BUNDESLIGA", "LIGUE 1", 
        "CHAMPIONS LEAGUE", "EUROPA LEAGUE", "CONFERENCE LEAGUE", 
        "EREDIVISIE", "LIGA PORTUGAL", "PRIMEIRA LIGA", "FA CUP", 
        "COPA DEL REY", "COPPA ITALIA", "COUPE DE FRANCE", "DFB POKAL", 
        "KNVB BEKER", "TAÇA DE PORTUGAL", "EUROPEAN CHAMPIONSHIP", 
        "WORLD CUP", "NATIONS LEAGUE", "INTERNATIONAL FRIENDLIES",
        "EUROPA", "CONFERENCE", "SUPER CUP", "CLUB WORLD CUP",
        "UEFA", "PREMIER", "DIVISION", "CHAMPIONSHIP", "LEAGUE", "CUP"
    ];
    
    if (ELITE_KEYWORDS.some(k => ln.includes(k))) {
        if (["BEACH", "INDOOR", "FUTSAL"].some(k => ln.includes(k))) return false;
        return true;
    }
    
    return false;
}

// Parse match data - MUST MATCH PYTHON
function parseMatchData(event, stage) {
    try {
        const homeTeam = event.T1 && event.T1[0] ? event.T1[0] : { Nm: 'Unknown' };
        const awayTeam = event.T2 && event.T2[0] ? event.T2[0] : { Nm: 'Unknown' };
        const homeName = homeTeam.Nm || 'Unknown';
        const awayName = awayTeam.Nm || 'Unknown';
        
        const leagueName = stage.Snm || 'Unknown League';
        const leagueId = parseInt(stage.Sid || 0);
        const leagueLogo = `https://www.footyaccumulators.com/images/leagues/${leagueId}.png`;
        
        const isPriority = TOP_5_TEAMS.some(team => 
            homeName.toUpperCase().includes(team) || awayName.toUpperCase().includes(team)
        );
        
        if (!isPriority && !isEliteMatch(leagueName, leagueId, homeName, awayName)) {
            return null;
        }
        
        const statusRaw = event.Eps || 'NS';
        const kickoffRaw = String(event.Esd || '');
        
        let kickoffIso;
        try {
            if (kickoffRaw && kickoffRaw.length >= 14) {
                const year = kickoffRaw.substring(0, 4);
                const month = kickoffRaw.substring(4, 6);
                const day = kickoffRaw.substring(6, 8);
                const hour = kickoffRaw.substring(8, 10);
                const minute = kickoffRaw.substring(10, 12);
                const second = kickoffRaw.substring(12, 14);
                kickoffIso = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
            } else {
                kickoffIso = new Date().toISOString();
            }
        } catch (e) {
            kickoffIso = new Date().toISOString();
        }
        
        // GENERATE PERMANENT MATCH ID (same as Python)
        const permanentId = generatePermanentMatchId(homeName, awayName, kickoffRaw);
        
        return {
            id: permanentId,
            apiMatchId: String(event.Eid || ''),
            home: {
                name: homeName,
                score: parseInt(event.Tr1 || 0),
                logo: homeTeam.Img || '',
                searchName: normalizeTeamName(homeName)
            },
            away: {
                name: awayName,
                score: parseInt(event.Tr2 || 0),
                logo: awayTeam.Img || '',
                searchName: normalizeTeamName(awayName)
            },
            status: normalizeStatus(statusRaw),
            minute: parseInt(event.Epi || 0),
            league: leagueName,
            leagueId: leagueId,
            leagueLogo: leagueLogo,
            kickoff: kickoffIso,
            isElite: true,
            isPriority: isPriority,
            announced: false,
            isPermanent: true,
            lastAlertScore: { h: parseInt(event.Tr1 || 0), a: parseInt(event.Tr2 || 0) },
            lastStatus: normalizeStatus(statusRaw),
            viewCount: 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
    } catch (e) {
        console.error("Error parsing match:", e);
        return null;
    }
}

// Find existing match by teams and date (handles API ID changes)
async function findMatchByTeamsAndDate(scrapedMatch, existingMatches) {
    const scrapedHome = scrapedMatch.home?.name?.toLowerCase().trim() || '';
    const scrapedAway = scrapedMatch.away?.name?.toLowerCase().trim() || '';
    const scrapedDate = scrapedMatch.kickoff ? scrapedMatch.kickoff.split('T')[0] : '';
    
    for (const matchId in existingMatches) {
        const matchData = existingMatches[matchId];
        const existingData = matchData.data;
        const existingHome = existingData.home?.name?.toLowerCase().trim() || '';
        const existingAway = existingData.away?.name?.toLowerCase().trim() || '';
        const existingDate = existingData.kickoff ? existingData.kickoff.split('T')[0] : '';
        
        // Check if it's the same match (same teams on same day)
        if (scrapedHome === existingHome && scrapedAway === existingAway && 
            (!scrapedDate || !existingDate || scrapedDate === existingDate)) {
            return matchId;
        }
    }
    
    return null;
}

// Fetch ALL matches including upcoming, live, and finished
async function fetchAllMatches() {
    try {
        console.log('Fetching all matches from Livescore...');
        
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
        
        const matches = [];
        
        // ENDPOINT 1: Get today's matches (includes upcoming, live, and recent finished)
        try {
            const response1 = await axios.get(`https://prod-public-api.livescore.com/v1/api/app/date/soccer/${dateStr}/0?MD=1`, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json'
                }
            });
            
            if (response1.data && response1.data.Stages) {
                console.log(`Found ${response1.data.Stages.length} stages in today's matches`);
                
                for (const stage of response1.data.Stages) {
                    if (stage.Events && stage.Events.length > 0) {
                        for (const event of stage.Events) {
                            const match = parseMatchData(event, stage);
                            if (match) {
                                matches.push(match);
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Error fetching today matches:', e.message);
        }
        
        // ENDPOINT 2: Get live matches specifically
        try {
            const response2 = await axios.get('https://prod-public-api.livescore.com/v1/api/app/live/soccer?MD=1', {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json'
                }
            });
            
            if (response2.data && response2.data.Stages) {
                // Add live matches if not already in list
                for (const stage of response2.data.Stages) {
                    if (stage.Events && stage.Events.length > 0) {
                        for (const event of stage.Events) {
                            const match = parseMatchData(event, stage);
                            if (match) {
                                // Check if already exists
                                const existing = matches.find(m => m.id === match.id);
                                if (!existing) {
                                    matches.push(match);
                                }
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.log('Live endpoint failed:', e.message);
        }
        
        console.log(`Total matches found: ${matches.length}`);
        return matches;
        
    } catch (error) {
        console.error('Error fetching matches:', error.message);
        return [];
    }
}

// MAIN SCRAPER - USES UNIFIED LOGIC
exports.vortexLiveScraper = onSchedule({
    schedule: "every 2 minutes",
    timeZone: "Africa/Lagos",
    region: "europe-west1"
}, async () => {
    try {
        const allMatches = await fetchAllMatches();
        
        if (allMatches.length === 0) {
            console.log('No matches found');
            return;
        }
        
        const batch = db.batch();
        let updateCount = 0;
        let newCount = 0;
        
        // Get all existing matches
        const activeDocs = await db.collection("matches").get();
        const existingMatches = {};
        activeDocs.forEach(doc => {
            existingMatches[doc.id] = {
                ref: doc.ref,
                data: doc.data()
            };
        });

        for (const scrapedMatch of allMatches) {
            try {
                const scrapedId = scrapedMatch.id;
                
                if (existingMatches[scrapedId]) {
                    // UPDATE EXISTING MATCH with same permanent ID
                    const targetRef = existingMatches[scrapedId].ref;
                    const oldData = existingMatches[scrapedId].data;
                    
                    const updatePayload = {
                        status: scrapedMatch.status,
                        "home.score": scrapedMatch.home.score,
                        "away.score": scrapedMatch.away.score,
                        minute: scrapedMatch.minute || 0,
                        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
                        isPriority: scrapedMatch.isPriority || false,
                        apiMatchId: scrapedMatch.apiMatchId || ""
                    };
                    
                    // Check for score changes
                    const oldH = oldData.home?.score || 0;
                    const oldA = oldData.away?.score || 0;
                    const newH = scrapedMatch.home.score;
                    const newA = scrapedMatch.away.score;
                    
                    if (newH > oldH || newA > oldA) {
                        updatePayload.lastAlertScore = { h: newH, a: newA };
                    }
                    
                    batch.update(targetRef, updatePayload);
                    updateCount++;
                    
                } else {
                    // Check if this match already exists with different permanent ID
                    const existingMatchId = await findMatchByTeamsAndDate(scrapedMatch, existingMatches);
                    
                    if (existingMatchId) {
                        // Update existing match
                        const targetRef = existingMatches[existingMatchId].ref;
                        
                        const updatePayload = {
                            status: scrapedMatch.status,
                            "home.score": scrapedMatch.home.score,
                            "away.score": scrapedMatch.away.score,
                            minute: scrapedMatch.minute || 0,
                            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
                            isPriority: scrapedMatch.isPriority || false,
                            apiMatchId: scrapedMatch.apiMatchId || ""
                        };
                        
                        batch.update(targetRef, updatePayload);
                        updateCount++;
                        
                        console.log(`Updated existing match (ID changed): ${scrapedMatch.home.name} vs ${scrapedMatch.away.name}`);
                        
                    } else {
                        // CREATE NEW MATCH
                        const matchData = {
                            ...scrapedMatch,
                            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
                            streamUrl1: encodeBase64(STREAM_SOURCES[0]),
                            streamUrl2: encodeBase64(STREAM_SOURCES[1]),
                            streamUrl3: encodeBase64(STREAM_SOURCES[2]),
                            streamQuality1: "HD",
                            streamServer1: "StreamEast",
                            aiPick: "Vortex AI: Analyzing match patterns...",
                            addedManually: false
                        };
                        
                        const matchRef = db.collection("matches").doc(scrapedId);
                        batch.set(matchRef, matchData);
                        newCount++;
                        
                        console.log(`Created new match: ${scrapedMatch.home.name} vs ${scrapedMatch.away.name}`);
                    }
                }
                
            } catch (matchError) {
                console.error('Error processing match:', matchError.message);
            }
        }
        
        if (updateCount > 0 || newCount > 0) {
            await batch.commit();
            console.log(`✅ Updated ${updateCount} matches, created ${newCount} new matches`);
            
            // Log status breakdown
            const statusCount = {};
            allMatches.forEach(match => {
                const status = match.status;
                statusCount[status] = (statusCount[status] || 0) + 1;
            });
            console.log('Match status breakdown:', statusCount);
        }
        
    } catch (e) { 
        console.error("Scraper Error:", e.message);
        if (e.response) {
            console.error("Response data:", e.response.data);
        }
    }
});

// MATCH MONITOR - UNCHANGED
exports.vortexLiveMonitor = onSchedule({ 
    schedule: "every 2 minutes", 
    timeZone: "Africa/Lagos", 
    region: "europe-west1" 
}, async () => {
    const snap = await db.collection("matches").get();
    const batch = db.batch();
    let hasUpdates = false;
    
    for (const doc of snap.docs) {
        const current = doc.data();
        const hScore = Number(current.home?.score || 0);
        const aScore = Number(current.away?.score || 0);
        const lastAlertScore = current.lastAlertScore || { h: 0, a: 0 };
        const lastStatus = current.lastStatus || "NS";
        const currentStatus = current.status;
        let alertMsg = "";

        if (hScore > lastAlertScore.h || aScore > lastAlertScore.a) {
            alertMsg = `⚽ *GOAL!* \n\n${current.home.name} *${hScore} - ${aScore}* ${current.away.name}\n\n📺 Watch: https://vortexlive.online/match/${doc.id}`;
            batch.update(doc.ref, { lastAlertScore: { h: hScore, a: aScore } });
            hasUpdates = true;
        } 
        
        if ((lastStatus === "NS" || lastStatus === "1") && (currentStatus === "1H" || currentStatus === "LIVE")) {
            alertMsg = `▶️ *KICK OFF!* \n\n${current.home.name} vs ${current.away.name}\n\n📺 Stream: https://vortexlive.online/match/${doc.id}`;
        } else if (lastStatus !== "HT" && currentStatus === "HT") {
            alertMsg = `⏸ *HALF TIME* \n\n${current.home.name} *${hScore} - ${aScore}* ${current.away.name}`;
        } else if (lastStatus !== "FT" && currentStatus === "FT") {
            alertMsg = `🏁 *FULL TIME* \n\n${current.home.name} *${hScore} - ${aScore}* ${current.away.name}`;
        }

        if (alertMsg) {
            await sendTelegram(alertMsg);
            batch.update(doc.ref, { lastStatus: currentStatus });
            hasUpdates = true;
        }
    }
    if (hasUpdates) await batch.commit();
});

// MATCH ANNOUNCER - UNCHANGED
exports.matchAnnouncer = onSchedule({
    schedule: "every 5 minutes",
    timeZone: "Africa/Lagos", 
    region: "europe-west1"
}, async () => {
    const now = new Date();
    const tenMinsLater = new Date(now.getTime() + 10 * 60000);
    const snap = await db.collection("matches").where("status", "in", ["NS", "1"]).where("announced", "==", false).get();

    for (const doc of snap.docs) {
        const match = doc.data();
        if(!match.kickoff) continue;
        const kickoff = new Date(match.kickoff);
        if (kickoff <= tenMinsLater) {
            const timeStr = kickoff.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' });
            await sendTelegram(`🔔 *UPCOMING MATCH ALERT*\n\n⚽ ${match.home.name} vs ${match.away.name}\n⏰ Kickoff: ${timeStr}\n\n📺 Stream: https://vortexlive.online/match/${doc.id}`);
            await doc.ref.update({ announced: true });
        }
    }
});

// MORNING CLEANUP - KEEP RECENT MATCHES
exports.morningCleanup = onSchedule({ 
    schedule: "45 6 * * *", 
    timeZone: "Africa/Lagos", 
    region: "europe-west1"
}, async () => {
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Only delete matches older than 24 hours AND finished
        const snap = await db.collection("matches")
            .where("status", "in", ["FT", "CANC", "ABD", "AWD", "POSTP"])
            .where("lastUpdated", "<", yesterday)
            .get();
            
        const size = snap.size;
        if (size === 0) {
            console.log("No old finished matches to clean up");
            return;
        }

        for (let i = 0; i < snap.docs.length; i += 400) {
            const chunk = snap.docs.slice(i, i + 400);
            const batch = db.batch();
            chunk.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
        }
        
        console.log(`✅ Cleanup: Removed ${size} old finished matches`);
        await sendTelegram(`🧹 *Vortex Cleanup:* Removed ${size} old finished matches.`);
        
    } catch (error) {
        console.error("Cleanup error:", error);
    }
});

// MIGRATION FUNCTION - Run once to fix existing matches
exports.migrateToPermanentIds = onSchedule({
    schedule: "0 3 * * *", // Run daily at 3 AM
    timeZone: "Africa/Lagos",
    region: "europe-west1"
}, async () => {
    try {
        console.log("Starting migration to permanent IDs...");
        const matches = await db.collection("matches").get();
        let migrated = 0;
        let duplicates = 0;
        
        const migrationBatch = db.batch();
        const toDelete = [];
        
        for (const doc of matches.docs) {
            const data = doc.data();
            const home = data.home?.name || '';
            const away = data.away?.name || '';
            const kickoff = data.kickoff || '';
            
            if (home && away) {
                const permanentId = generatePermanentMatchId(home, away, kickoff);
                
                if (doc.id !== permanentId) {
                    // Check if permanent ID already exists
                    const existing = await db.collection("matches").doc(permanentId).get();
                    
                    if (!existing.exists) {
                        // Move to new permanent ID
                        const newData = {
                            ...data,
                            id: permanentId,
                            isPermanent: true,
                            home: {
                                ...data.home,
                                searchName: normalizeTeamName(home)
                            },
                            away: {
                                ...data.away,
                                searchName: normalizeTeamName(away)
                            }
                        };
                        
                        migrationBatch.set(db.collection("matches").doc(permanentId), newData);
                        toDelete.push(doc.ref);
                        migrated++;
                    } else {
                        // Merge data (keep the one with more info)
                        const existingData = existing.data();
                        const mergedData = {
                            ...existingData,
                            ...data,
                            id: permanentId,
                            isPermanent: true
                        };
                        
                        migrationBatch.set(existing.ref, mergedData);
                        toDelete.push(doc.ref);
                        duplicates++;
                    }
                }
            }
        }
        
        // Commit migrations
        if (migrationBatch._ops.length > 0) {
            await migrationBatch.commit();
        }
        
        // Delete old documents
        for (const ref of toDelete) {
            await ref.delete();
        }
        
        console.log(`✅ Migration complete: ${migrated} matches migrated, ${duplicates} duplicates merged`);
        await sendTelegram(`🔄 Database migrated: ${migrated} matches now use permanent IDs, ${duplicates} duplicates merged`);
        
    } catch (e) {
        console.error("Migration error:", e);
        await sendTelegram(`❌ Migration failed: ${e.message}`);
    }
});