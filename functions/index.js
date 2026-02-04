/* eslint-disable */
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const axios = require("axios");

if (admin.apps.length === 0) admin.initializeApp();
const db = admin.firestore();

const TELEGRAM_TOKEN = "8126112394:AAH7-da80z0C7tLco-ZBoZryH_6hhZBKfhE";
const CHAT_ID = "@LivefootballVortex";

const STATUS_MAP = { '1': 'NS', '2': '1H', '3': 'HT', '4': '2H', 'FT': 'FT' };

const sendTelegram = async (msg) => {
    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID, text: msg, parse_mode: 'Markdown'
        });
    } catch (e) { console.error("Telegram Post Error:", e.message); }
};

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

        const jsSlugify = (text) => text.toString().toLowerCase().replace(/[^\w\s-]/g, '').replace(/[-\s]+/g, '-').trim().replace(/^-+|-+$/g, '');
        const todayDate = new Date().toLocaleDateString('en-CA', {timeZone: 'Africa/Lagos'}); 

        for (const stage of stages) {
            for (const event of stage.Events) {
                const matchId = `${jsSlugify(event.T1[0].Nm)}-vs-${jsSlugify(event.T2[0].Nm)}-${todayDate}`;
                const matchRef = db.collection("matches").doc(matchId);
                const doc = await matchRef.get();

                if (doc.exists) {
                    const rawStatus = String(event.Eps);
                    let finalStatus = STATUS_MAP[rawStatus] || rawStatus;
                    if (/^\d+$/.test(rawStatus) && rawStatus !== '1') finalStatus = 'LIVE';

                    batch.update(matchRef, {
                        "home.score": parseInt(event.Tr1 || 0),
                        "away.score": parseInt(event.Tr2 || 0),
                        "status": finalStatus, 
                        "minute": parseInt(event.Epi || 0),
                        "lastUpdated": admin.firestore.FieldValue.serverTimestamp()
                    });
                    updateCount++;
                }
                if (updateCount >= 450) break; 
            }
        }
        if (updateCount > 0) await batch.commit();
    } catch (e) { console.error("Scraper Error:", e.message); }
});

exports.vortexLiveMonitor = onSchedule({ 
    schedule: "every 2 minutes", 
    timeZone: "Africa/Lagos", region: "europe-west1" 
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

exports.matchAnnouncer = onSchedule({
    schedule: "every 5 minutes",
    timeZone: "Africa/Lagos", region: "europe-west1"
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

exports.morningCleanup = onSchedule({ 
    schedule: "45 6 * * *", 
    timeZone: "Africa/Lagos", region: "europe-west1"
}, async () => {
    const snap = await db.collection("matches").get();
    const size = snap.size;
    if (size === 0) return;

    for (let i = 0; i < snap.docs.length; i += 400) {
        const chunk = snap.docs.slice(i, i + 400);
        const batch = db.batch();
        chunk.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    }
    await sendTelegram(`🧹 *Vortex Cleanup:* Database purged. Removed ${size} stale matches.`);
});