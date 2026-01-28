/*eslint-disable */
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const axios = require("axios");

if (admin.apps.length === 0) admin.initializeApp();
const db = admin.firestore();

const TELEGRAM_TOKEN = "8126112394:AAH7-da80z0C7tLco-ZBoZryH_6hhZBKfhE";
const CHAT_ID = "@LivefootballVortex";

// Helper for Telegram
const sendTelegram = async (msg) => {
    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID, 
            text: msg, 
            parse_mode: 'Markdown'
        });
    } catch (error) {
        console.error("Telegram Post Error:", error.message);
    }
};

// European league IDs (same as Python)
const EUROPEAN_LEAGUE_IDS = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 29, 30, 31, 34, 39, 
    45, 48, 61, 66, 78, 81, 88, 94, 135, 137, 140, 141, 143, 227, 848
];

const EUROPEAN_KEYWORDS = [
    "PREMIER", "LALIGA", "SERIE A", "BUNDESLIGA", "LIGUE 1", 
    "CHAMPIONS", "EUROPA", "CONFERENCE", "EREDIVISIE", "PORTUGAL",
    "UEFA", "EUROPEAN", "ENGLAND", "SPAIN", "ITALY", "GERMANY", "FRANCE"
];

const EXCLUDE_KEYWORDS = [
    "AFRICA", "EGYPT", "KENYA", "CAF", "ASIA", "USA", "MLS",
    "U23", "U21", "U19", "U18", "U17", "WOMEN", "RESERVE", "YOUTH"
];

function isEuropeanLeague(leagueName, leagueId) {
    const leagueUpper = leagueName.toUpperCase();
    
    // Check by ID first
    if (EUROPEAN_LEAGUE_IDS.includes(leagueId)) {
        return true;
    }
    
    // Must contain European keyword
    const hasEuropeanKeyword = EUROPEAN_KEYWORDS.some(keyword => 
        leagueUpper.includes(keyword)
    );
    
    if (!hasEuropeanKeyword) return false;
    
    // Must NOT contain excluded keywords
    const hasExcluded = EXCLUDE_KEYWORDS.some(keyword => 
        leagueUpper.includes(keyword)
    );
    
    return !hasExcluded;
}

/**
 * ⚽ LIVE SCORE SCRAPER - EUROPEAN LEAGUES ONLY
 */
export const vortexLiveScraper = onSchedule({
    schedule: "every 2 minutes",
    timeZone: "Africa/Lagos",
    region: "europe-west1"
}, async () => {
    try {
        const response = await axios.get('https://prod-public-api.livescore.com/v1/api/app/live/soccer/1.00', { timeout: 10000 });
        const stages = response.data.Stages || [];
        const batch = db.batch();
        let updateCount = 0;

        const jsSlugify = (text) => {
            return text.toString().toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/[-\s]+/g, '-')
                .trim()
                .replace(/^-+|-+$/g, '');
        };

        const today = new Date().toLocaleDateString('en-CA', {timeZone: 'Africa/Lagos'});

        for (const stage of stages) {
            const leagueName = stage.Snm || 'Unknown';
            const leagueId = parseInt(stage.Sid || 0);
            
            // FILTER: Only process European leagues
            if (!isEuropeanLeague(leagueName, leagueId)) {
                continue;
            }
            
            // Skip youth/women leagues
            const leagueUpper = leagueName.toUpperCase();
            if (["U23", "U21", "U19", "U18", "U17", "WOMEN"].some(k => leagueUpper.includes(k))) {
                continue;
            }

            for (const event of stage.Events) {
                const homeName = event.T1[0].Nm;
                const awayName = event.T2[0].Nm;
                
                // Skip youth/women teams
                const homeUpper = homeName.toUpperCase();
                const awayUpper = awayName.toUpperCase();
                if (["U23", "U21", "U19", "U18", "U17", "WOMEN"].some(k => 
                    homeUpper.includes(k) || awayUpper.includes(k))) {
                    continue;
                }
                
                const matchId = `${jsSlugify(homeName)}-vs-${jsSlugify(awayName)}-${today}`;
                const matchRef = db.collection("matches").doc(matchId);
                const doc = await matchRef.get();

                if (doc.exists) {
                    batch.update(matchRef, {
                        "home.score": parseInt(event.Tr1 || 0),
                        "away.score": parseInt(event.Tr2 || 0),
                        "status": event.Eps,
                        "minute": parseInt(event.Epi || 0),
                        "lastUpdated": admin.firestore.FieldValue.serverTimestamp(),
                        "league": leagueName,
                        "leagueId": leagueId
                    });
                    updateCount++;
                }
            }
        }
        
        if (updateCount > 0) {
            await batch.commit();
            console.log(`✅ Updated ${updateCount} European matches`);
        }
    } catch (error) {
        console.error("Scraper Error:", error.message);
    }
});

/**
 * ⚽ VORTEX MONITOR: Handles Goals, Kickoff, HT, and FT alerts.
 */
exports.vortexLiveMonitor = onSchedule({ 
    schedule: "every 2 minutes", 
    timeZone: "Africa/Lagos", 
    region: "europe-west1" 
}, async () => {
    // Only check matches that are elite (isElite: true)
    const snap = await db.collection("matches")
        .where("isElite", "==", true)
        .get();
    
    for (const doc of snap.docs) {
        const current = doc.data();
        const matchRef = doc.ref;
        
        const hName = current.home.name;
        const aName = current.away.name;
        const league = current.league || '';
        const hScore = Number(current.home?.score || 0);
        const aScore = Number(current.away?.score || 0);
        const lastAlertScore = current.lastAlertScore || { h: 0, a: 0 };
        const lastStatus = current.lastStatus || "NS";
        const currentStatus = current.status;

        let alertMsg = "";

        // 1. GOAL DETECTION
        if (hScore > lastAlertScore.h || aScore > lastAlertScore.a) {
            // Special UEFA alert
            const isUEFA = league.toUpperCase().includes('UEFA') || 
                          league.toUpperCase().includes('CHAMPIONS') ||
                          league.toUpperCase().includes('EUROPA');
            
            if (isUEFA) {
                alertMsg = `⭐ *UEFA GOAL!* \n\n${hName} *${hScore} - ${aScore}* ${aName}\n🏆 ${league}\n\n📺 Watch: https://vortexlive.online/match/${doc.id}`;
            } else {
                alertMsg = `⚽ *GOAL!* \n\n${hName} *${hScore} - ${aScore}* ${aName}\n📺 Watch: https://vortexlive.online/match/${doc.id}`;
            }
            await matchRef.update({ lastAlertScore: { h: hScore, a: aScore } });
        } 
        // 2. KICKOFF (Start of 1st Half)
        else if (lastStatus === "NS" && (currentStatus === "1H" || currentStatus === "LIVE")) {
            alertMsg = `▶️ *KICK OFF!* \n\n${hName} *${hScore} - ${aScore}* ${aName}\n\n📺 Stream: https://vortexlive.online/match/${doc.id}`;
        }
        // 3. HALF TIME
        else if (lastStatus !== "HT" && currentStatus === "HT") {
            alertMsg = `⏸ *HALF TIME* \n\n${hName} *${hScore} - ${aScore}* ${aName}\n\nPlayers are taking a break. Stay tuned!`;
        }
        // 4. START OF 2ND HALF
        else if (lastStatus === "HT" && currentStatus === "2H") {
            alertMsg = `▶️ *SECOND HALF STARTED* \n\n${hName} *${hScore} - ${aScore}* ${aName}\n\n📺 Stream: https://vortexlive.online/match/${doc.id}`;
        }
        // 5. FULL TIME
        else if (lastStatus !== "FT" && currentStatus === "FT") {
            alertMsg = `🏁 *FULL TIME* \n\n${hName} *${hScore} - ${aScore}* ${aName}\n\nThanks for watching on Vortex!`;
        }

        if (alertMsg) {
            await sendTelegram(alertMsg);
            await matchRef.update({ lastStatus: currentStatus });
        }
    }
});

/**
 * 🔔 MATCH ANNOUNCER: Alerts 5-10 minutes before kickoff.
 */
export const matchAnnouncer = onSchedule({
    schedule: "every 5 minutes",
    timeZone: "Africa/Lagos",
    region: "europe-west1"
}, async () => {
    const now = new Date();
    const tenMinsLater = new Date(now.getTime() + 10 * 60000);

    // Only announce elite matches
    const snap = await db.collection("matches")
        .where("isElite", "==", true)
        .where("status", "==", "NS")
        .where("announced", "==", false)
        .get();

    for (const doc of snap.docs) {
        const match = doc.data();
        const kickoff = new Date(match.kickoff);

        if (kickoff <= tenMinsLater) {
            const timeStr = kickoff.toLocaleTimeString('en-GB', { 
                hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' 
            });
            
            // Special UEFA announcement
            const league = match.league || '';
            const isUEFA = league.toUpperCase().includes('UEFA') || 
                          league.toUpperCase().includes('CHAMPIONS') ||
                          league.toUpperCase().includes('EUROPA');
            
            let msg;
            if (isUEFA) {
                msg = `⭐ *UEFA MATCH ALERT*\n\n⚽ ${match.home.name} vs ${match.away.name}\n🏆 ${league}\n⏰ Kickoff: ${timeStr} (Lagos)\n\n📺 Stream: https://vortexlive.online/match/${doc.id}`;
            } else {
                msg = `🔔 *UPCOMING MATCH ALERT*\n\n⚽ ${match.home.name} vs ${match.away.name}\n⏰ Kickoff: ${timeStr} (Lagos)\n\n📺 Stream: https://vortexlive.online/match/${doc.id}`;
            }
            
            await sendTelegram(msg);
            await doc.ref.update({ announced: true });
        }
    }
});

/**
 * Morning Cleanup (Wipes everything at 6:45am)
 */
exports.morningCleanup = onSchedule({ 
    schedule: "45 6 * * *", 
    timeZone: "Africa/Lagos" 
}, async () => {
    const snap = await db.collection("matches").get();
    const batch = db.batch();
    snap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log("✅ Morning cleanup completed");
});