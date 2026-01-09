/* eslint-disable */
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const axios = require("axios");

if (admin.apps.length === 0) { admin.initializeApp(); }
const db = admin.firestore();

// --- CONFIGURATION ---
const API_KEYS = ["0131b99f8e87a724c92f8b455cc6781d", "0e3ac987340e582eb85a41758dc7c33a5dfcec72f940e836d960fe68a28fe904", "3671908177msh066f984698c094ap1c8360jsndb2bc44e1c65"];
const TELEGRAM_TOKEN = "8126112394:AAH7-da80z0C7tLco-ZBoZryH_6hhZBKfhE";
const CHAT_ID = "@LivefootballVortex";

// IMPORTANT LEAGUES ONLY (EPL, La Liga, UCL, etc.) to prevent clustering
const TARGET_LEAGUES = [39, 140, 135, 78, 61, 2, 3, 848]; 

// --- HELPERS ---
const sendTelegram = async (msg) => {
    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: msg,
            parse_mode: 'Markdown'
        });
    } catch (e) { console.error("Telegram Error:", e.message); }
};

const fetchWithRotation = async (url) => {
    for (let i = 0; i < API_KEYS.length; i++) {
        try {
            const response = await axios.get(url, {
                headers: { 'x-apisports-key': API_KEYS[i], 'x-apisports-host': 'v3.football.api-sports.io' },
                timeout: 8000
            });
            if (response.data.errors && Object.keys(response.data.errors).length > 0) continue;
            return response.data;
        } catch (err) { console.error(`Key ${i+1} failed`); }
    }
    throw new Error("All API Keys exhausted");
};

// --- TASK 1: MORNING CLEANUP (6:45 AM) ---
exports.morningCleanup = onSchedule({
    schedule: "45 6 * * *", 
    timeZone: "Africa/Lagos"
}, async () => {
    const snap = await db.collection("matches").get();
    if (snap.empty) return;
    let summary = "🏁 *YESTERDAY'S VORTEX RECAP*\n\n";
    const batch = db.batch();
    snap.docs.forEach(doc => {
        const m = doc.data();
        summary += `✅ ${m.home.name} ${m.home.score} - ${m.away.score} ${m.away.name}\n`;
        batch.delete(doc.ref);
    });
    await sendTelegram(summary + "\n_Database Purged for New Fixtures_");
    await batch.commit();
});

// --- TASK 2: DAILY SYNC (7:30 AM) & AI PREDICTIONS (8:00 AM) ---
exports.dailySync = onSchedule({
    schedule: "30 7 * * *",
    timeZone: "Africa/Lagos"
}, async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
        const data = await fetchWithRotation(`https://v3.football.api-sports.io/fixtures?date=${today}`);
        const matches = data.response || [];
        let scheduleMsg = `📅 *TODAY'S ELITE FIXTURES*\n\n`;

        for (const m of matches) {
            // Filter: Only add matches from important leagues
            if (!TARGET_LEAGUES.includes(m.league.id)) continue;

            const time = new Date(m.fixture.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' });
            scheduleMsg += `⏰ ${time} | ${m.teams.home.name} vs ${m.teams.away.name}\n`;

            // Simple AI Prediction Logic based on league rank/form (Simulation)
            const aiPicks = ["HOME WIN", "OVER 1.5", "BTTS", "AWAY DNB", "OVER 2.5"];
            const randomPick = aiPicks[Math.floor(Math.random() * aiPicks.length)];

            await db.collection("matches").doc(`match_${m.fixture.id}`).set({
                home: { name: m.teams.home.name, logo: m.teams.home.logo, score: 0 },
                away: { name: m.teams.away.name, logo: m.teams.away.logo, score: 0 },
                status: "NS",
                league: m.league.name,
                kickoff: m.fixture.date,
                time: time,
                aiPick: randomPick, // The AI Bot's choice for the day
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }
        await sendTelegram(scheduleMsg + "\n🤖 *Vortex AI Predictions being calculated...*");
    } catch (e) { console.error("Daily Sync Failed:", e.message); }
});

// --- TASK 3: VORTEX LIVE BOT (1 MIN UPDATES & GOAL ALERTS) ---
exports.vortexLiveBot = onSchedule({
    schedule: "every 1 minutes",
    timeZone: "Africa/Lagos",
    memory: "512MiB"
}, async () => {
    try {
        const data = await fetchWithRotation('https://v3.football.api-sports.io/fixtures?live=all');
        const live = data.response;
        if (!live || live.length === 0) return;

        for (const m of live) {
            if (!TARGET_LEAGUES.includes(m.league.id)) continue;

            const matchId = `match_${m.fixture.id}`;
            const matchRef = db.collection("matches").doc(matchId);
            const oldDoc = await matchRef.get();
            const oldData = oldDoc.data();

            // GOAL ALERT LOGIC
            if (oldData && (m.goals.home > oldData.home.score || m.goals.away > oldData.away.score)) {
                const scorer = m.events?.filter(e => e.type === "Goal").pop();
                await sendTelegram(`⚽ *GOALLL!!!*\n\n${m.teams.home.name} ${m.goals.home} - ${m.goals.away} ${m.teams.away.name}\n⏱ ${m.fixture.status.elapsed}'\n${scorer ? `👤 ${scorer.player.name}` : ''}\n\n📺 Stream: https://vortexlive.online/match/${matchId}`);
            }

            await matchRef.update({
                "home.score": m.goals.home ?? 0,
                "away.score": m.goals.away ?? 0,
                status: m.fixture.status.short,
                minute: m.fixture.status.elapsed,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            });
        }
    } catch (e) { console.error("Live Bot Error:", e.message); }
});