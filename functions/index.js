/* eslint-disable */
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const axios = require("axios");

if (admin.apps.length === 0) { admin.initializeApp(); }
const db = admin.firestore();

// --- CONFIGURATION ---
// I have cleaned the list to ensure 13 unique positions (even if some are placeholders for now)
const API_KEYS = [
    "0131b99f8e87a724c92f8b455cc6781d", 
    "0e3ac987340e582eb85a41758dc7c33a5dfcec72f940e836d960fe68a28fe904", 
    "3671908177msh066f984698c094ap1c8360jsndb2bc44e1c65",
    "700ca9a1ed18bf1b842e0210e9ae73ce", 
    "2f977aee380c7590bcf18759dfc18aacd0827b65c4d5df6092ecad5f29aebc33", 
    "13026e250b0dc9c788acceb0c5ace63c", 
    "36d031751e132991fd998a3f0f5088b7d1f2446ca9b44351b2a90fde76581478",
    "08a2395d18de848b4d3542d71234a61212aa43a3027ba11d7d3de3682c6159aa",
    // Add any remaining keys here to reach 13
];

const TELEGRAM_TOKEN = "8126112394:AAH7-da80z0C7tLco-ZBoZryH_6hhZBKfhE";
const CHAT_ID = "@LivefootballVortex";
const ELITE_LEAGUES = [1, 39, 140, 135, 78, 61, 2, 3, 848, 307, 88, 94, 12, 667, 10]; 

// --- HELPERS ---
const sendTelegram = async (msg) => {
    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID, text: msg, parse_mode: 'Markdown'
        });
    } catch (e) { console.error("Telegram Error:", e.message); }
};

/**
 * Enhanced Fetch with Intelligent Rotation
 * It will try every key in the list before giving up.
 */
const fetchWithRotation = async (url) => {
    let lastError = "";
    
    for (let i = 0; i < API_KEYS.length; i++) {
        try {
            const currentKey = API_KEYS[i];
            const response = await axios.get(url, {
                headers: { 
                    'x-apisports-key': currentKey, 
                    'x-apisports-host': 'v3.football.api-sports.io' 
                },
                timeout: 15000 
            });

            // The API sometimes returns 200 OK but with errors in the body
            const apiErrors = response.data.errors;
            if (apiErrors && Object.keys(apiErrors).length > 0) {
                console.warn(`Vortex Key ${i+1} reporting API limit/error. Rotating...`);
                lastError = JSON.stringify(apiErrors);
                continue; 
            }

            // Update the Admin Panel status so you know which key worked
            await db.collection("settings").doc("bot").set({
                status: `Active: Key ${i+1} is processing data`,
                lastPulse: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            return response.data;
        } catch (err) { 
            console.error(`Vortex Key ${i+1} connection failure: ${err.message}`); 
            lastError = err.message;
        }
    }
    throw new Error(`ALL_KEYS_EXHAUSTED: ${lastError}`);
};

// --- CORE SYNC ENGINE ---
const runGlobalSync = async () => {
    const today = new Date().toISOString().split('T')[0];
    const data = await fetchWithRotation(`https://v3.football.api-sports.io/fixtures?date=${today}`);
    const matches = data.response || [];
    
    const batch = db.batch();
    let count = 0;
    let telegramSummary = `📅 *VORTEX GLOBAL SYNC: ${today}*\n\n`;

    for (const m of matches.slice(0, 400)) { 
        const matchRef = db.collection("matches").doc(`match_${m.fixture.id}`);
        const isElite = ELITE_LEAGUES.includes(m.league.id);

        batch.set(matchRef, {
            id: m.fixture.id,
            home: { name: m.teams.home.name, logo: m.teams.home.logo, score: m.goals.home ?? 0 },
            away: { name: m.teams.away.name, logo: m.teams.away.logo, score: m.goals.away ?? 0 },
            status: m.fixture.status.short || "NS",
            minute: m.fixture.status.elapsed || 0,
            league: m.league.name,
            isElite: isElite, 
            kickoff: m.fixture.date,
            // Automatic stream generation
            streamUrl1: Buffer.from(`https://www.score808.com/live/${m.fixture.id}`).toString('base64'),
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        if (isElite && count < 15) {
            telegramSummary += `⚽ ${m.teams.home.name} vs ${m.teams.away.name}\n`;
        }
        count++;
    }

    await batch.commit();
    return { count, summary: telegramSummary };
};

// --- TASKS ---

// 1. Live Score Bot (The Heartbeat)
exports.vortexLiveBot = onSchedule({ 
    schedule: "every 2 minutes", 
    timeZone: "Africa/Lagos", 
    memory: "512MiB" 
}, async () => {
    try {
        const settingsDoc = await db.collection("settings").doc("bot").get();
        if (!settingsDoc.exists || settingsDoc.data().isActive !== true) {
            console.log("Vortex Bot is currently toggled OFF.");
            return;
        }

        const data = await fetchWithRotation('https://v3.football.api-sports.io/fixtures?live=all');
        const liveMatches = data.response || [];
        
        for (const m of liveMatches) {
            const matchId = `match_${m.fixture.id}`;
            const matchRef = db.collection("matches").doc(matchId);
            const oldDoc = await matchRef.get();
            
            if (oldDoc.exists) {
                const oldData = oldDoc.data();
                
                // Detection for Goals
                const homeGoal = m.goals.home > (oldData.home.score || 0);
                const awayGoal = m.goals.away > (oldData.away.score || 0);

                if (homeGoal || awayGoal) {
                    await sendTelegram(`⚽ *GOALLL!!!*\n\n${m.teams.home.name} ${m.goals.home} - ${m.goals.away} ${m.teams.away.name}\n⏱ ${m.fixture.status.elapsed}'`);
                }

                await matchRef.update({
                    "home.score": m.goals.home ?? 0, 
                    "away.score": m.goals.away ?? 0,
                    status: m.fixture.status.short, 
                    minute: m.fixture.status.elapsed,
                    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                });
            }
        }
    } catch (e) { 
        console.error("Live Bot Error:", e.message); 
        // Log the error to the Admin Panel
        await db.collection("settings").doc("bot").update({ status: `ERROR: ${e.message}` });
    }
});

// 2. Midnight Database Cleanup
exports.morningCleanup = onSchedule({ schedule: "45 6 * * *", timeZone: "Africa/Lagos" }, async () => {
    const snap = await db.collection("matches").get();
    const batch = db.batch();
    snap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    await sendTelegram("🏁 *Vortex Database Cleared for the new day.*");
});

// 3. Automatic Daily Sync
exports.dailySync = onSchedule({ schedule: "30 7 * * *", timeZone: "Africa/Lagos" }, async () => {
    try {
        const result = await runGlobalSync();
        await sendTelegram(result.summary + `\n✅ *${result.count} Matches Processed!*`);
    } catch (e) { console.error("Daily Sync Failed:", e.message); }
});

// 4. Manual Sync Trigger (From Admin Button)
exports.emergencySync = onRequest({ cors: true, memory: "512MiB", timeoutSeconds: 300 }, async (req, res) => {
    try {
        const result = await runGlobalSync();
        res.status(200).send(`Success: Vortex Engine updated ${result.count} matches.`);
    } catch (e) { 
        res.status(500).send(`Engine Error: ${e.message}`); 
    }
});