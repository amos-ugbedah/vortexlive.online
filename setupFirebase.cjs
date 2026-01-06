const admin = require('firebase-admin');
const serviceAccount = require("./serviceAccountKey.json");

if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function initializeDatabase() {
    console.log("🚀 Starting Firebase Auto-Setup with Triple Server Structure...");

    // Using a template ID to define the "blueprint"
    const templateRef = db.collection('matches').doc('template_id');

    const structure = {
        fixtureId: 0,
        league: "League Name", // e.g., Premier League
        competition: "Competition", // e.g., AFCON
        homeTeam: {
            name: "Home Team",
            logo: "https://link-to-logo.png"
        },
        awayTeam: {
            name: "Away Team",
            logo: "https://link-to-logo.png"
        },
        score: "0 - 0",
        status: "NS", // NS, LIVE, HT, FT
        
        // --- TRIPLE SERVER SYSTEM ---
        streamUrl1: "", // Auto-scraped by Bot (Source A)
        streamUrl2: "", // Auto-scraped by Bot (Source B)
        streamUrl3: "", // Your Manual "Gold" High-Quality Link
        
        activeServer: 1, // Default server for the player
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        kickOffTime: "", // Readable time for users
        isFeatured: false // Set to true to pin big games to top
    };

    try {
        await templateRef.set(structure);
        console.log("--------------------------------------------------");
        console.log("✅ SUCCESS: Your 'matches' collection is ready!");
        console.log("🚀 Triple Server structure is now live in Firestore.");
        console.log("--------------------------------------------------");
        console.log("👉 Now you can run your bot to start filling these fields.");
    } catch (error) {
        console.error("❌ Error setting up database:", error);
    }
}

initializeDatabase();