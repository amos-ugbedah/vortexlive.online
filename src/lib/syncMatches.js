import { db } from "./firebase";
import { collection, doc, setDoc, writeBatch } from "firebase/firestore";

// You can get a free key from football-data.org or api-football.com
const API_KEY = "YOUR_FOOTBALL_DATA_API_KEY"; 

export const fetchTodayMatches = async () => {
  try {
    const response = await fetch('https://api.football-data.org/v4/matches', {
      headers: { 'X-Auth-Token': API_KEY }
    });
    const data = await response.json();

    const batch = writeBatch(db);
    
    data.matches.forEach((match) => {
      // Create a unique ID for the match
      const matchId = match.id.toString();
      const matchRef = doc(db, "matches", matchId);

      const matchData = {
        id: matchId,
        homeTeam: {
          name: match.homeTeam.shortName || match.homeTeam.name,
          logo: match.homeTeam.crest
        },
        awayTeam: {
          name: match.awayTeam.shortName || match.awayTeam.name,
          logo: match.awayTeam.crest
        },
        kickOffTime: new Date(match.utcDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: match.utcDate,
        league: match.competition.name,
        streamUrl1: "", // Initialized empty for your sync logic to fill
        streamUrl2: "",
        streamUrl3: ""
      };

      batch.set(matchRef, matchData, { merge: true });
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error("Automation Error:", error);
    return false;
  }
};