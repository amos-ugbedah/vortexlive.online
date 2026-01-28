/* eslint-disable */
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

/**
 * ⚽ LIVE SCORE SCRAPER
 * Mirroring Python ID Logic: slugify(home)-vs-slugify(away)-YYYY-MM-DD
 */
exports.vortexLiveScraper = onSchedule({
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
            for (const event of stage.Events) {
                const homeName = event.T1[0].Nm;
                const awayName = event.T2[0].Nm;
                const matchId = `${jsSlugify(homeName)}-vs-${jsSlugify(awayName)}-${today}`;

                const matchRef = db.collection("matches").doc(matchId);
                const doc = await matchRef.get();

                if (doc.exists) {
                    batch.update(matchRef, {
                        "home.score": parseInt(event.Tr1 || 0),
                        "away.score": parseInt(event.Tr2 || 0),
                        "status": event.Eps, // Use raw status from API for better monitoring
                        "minute": parseInt(event.Epi || 0),
                        "lastUpdated": admin.firestore.FieldValue.serverTimestamp()
                    });
                    updateCount++;
                }
            }
        }
        if (updateCount > 0) await batch.commit();
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
    // We check all matches that have been "touched" by the scraper (non-NS status)
    const snap = await db.collection("matches").get();
    
    for (const doc of snap.docs) {
        const current = doc.data();
        const matchRef = doc.ref;
        
        const hName = current.home.name;
        const aName = current.away.name;
        const hScore = Number(current.home?.score || 0);
        const aScore = Number(current.away?.score || 0);
        const lastAlertScore = current.lastAlertScore || { h: 0, a: 0 };
        const lastStatus = current.lastStatus || "NS";
        const currentStatus = current.status;

        let alertMsg = "";

        // 1. GOAL DETECTION
        if (hScore > lastAlertScore.h || aScore > lastAlertScore.a) {
            alertMsg = `⚽ *GOAL!* \n\n${hName} *${hScore} - ${aScore}* ${aName}\n\n📺 Watch: https://vortexlive.online/match/${doc.id}`;
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
exports.matchAnnouncer = onSchedule({
    schedule: "every 5 minutes",
    timeZone: "Africa/Lagos",
    region: "europe-west1"
}, async () => {
    const now = new Date();
    const tenMinsLater = new Date(now.getTime() + 10 * 60000);

    const snap = await db.collection("matches")
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
            const msg = `🔔 *UPCOMING MATCH ALERT*\n\n⚽ ${match.home.name} vs ${match.away.name}\n⏰ Kickoff: ${timeStr} (Lagos)\n\n📺 Stream: https://vortexlive.online/match/${doc.id}`;
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
});