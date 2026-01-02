import { db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

const uploadMatches = async () => {
  const matches = [
    { 
      id: "ars-new-2026", // Custom Unique ID
      home: "Arsenal", 
      away: "Newcastle", 
      status: "live", 
      score: "0-0", // Added score field
      time: "20:00", 
      date: "2026-01-02", // Added date field
      streamUrl: "https://daddylive.dad/embed/stream-1.php" 
    },
    // ... paste more here
  ];

  console.log("Syncing database...");
  try {
    for (const match of matches) {
      // setDoc prevents duplicates by using the ID we defined
      await setDoc(doc(db, "fixtures", match.id), match);
    }
    console.log("✅ VortexLive is Up to Date!");
  } catch (error) {
    console.error("❌ Sync Error:", error);
  }
};