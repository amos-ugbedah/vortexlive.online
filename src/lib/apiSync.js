/* eslint-disable */
import { db } from "./firebase";
import { doc, writeBatch, serverTimestamp } from "firebase/firestore";

/**
 * Vortex Manual Sync Engine
 * Used in the Admin Panel to manually push/fix match data
 */
export const syncVortexEngine = async (matchesArray) => {
  if (!matchesArray || matchesArray.length === 0) return { success: false, count: 0 };

  const batch = writeBatch(db);
  let eliteCount = 0;

  // Logic perfectly aligned with backend Stream Server generation
  const generateStreamUrls = (matchId) => ({
    streamUrl1: btoa(`https://givemereddistreams.top/${matchId}`),
    streamUrl2: btoa(`https://soccertvhd.com/live/${matchId}`),
    streamUrl3: btoa(`https://thestreameast.life/match/${matchId}`),
    streamQuality1: "HD",
    streamServer1: "Server 1",
    streamServer2: "Server 2",
    streamServer3: "Server 3"
  });

  matchesArray.forEach((match) => {
    // Standardize IDs (supports both API-Football and Football-Data.org)
    const matchId = String(match.id || match.fixture?.id);
    const matchRef = doc(db, "matches", matchId);

    // 1. UTC to Lagos Time (+1 Hour)
    const apiDate = match.utcDate || match.kickoff || match.fixture?.date;
    const kickoffLagos = apiDate 
        ? new Date(new Date(apiDate).getTime() + 3600000).toISOString() 
        : new Date().toISOString();

    // 2. Status Mapping
    const internalStatus = mapStatus(match.status || match.fixture?.status?.short);
    
    // 3. Normalized Data Object
    const matchData = {
      id: matchId,
      home: {
        name: match.homeTeam?.name || match.teams?.home?.name || "TBD",
        logo: match.homeTeam?.logo || match.teams?.home?.logo || "",
        score: Number(match.score?.home ?? match.goals?.home ?? 0)
      },
      away: {
        name: match.awayTeam?.name || match.teams?.away?.name || "TBD",
        logo: match.awayTeam?.logo || match.teams?.away?.logo || "",
        score: Number(match.score?.away ?? match.goals?.away ?? 0)
      },
      status: internalStatus,
      // Priority: match.minute -> match.fixture.status.elapsed -> 0
      minute: Number(match.minute || match.fixture?.status?.elapsed || 0),
      kickoff: kickoffLagos, 
      league: match.competition?.name || match.league?.name || "Global League",
      leagueId: match.competition?.id || match.league?.id || 0,
      
      // Feature Flags
      isElite: match.isElite || false,
      aiPick: match.aiPick || "Vortex AI: Statistical analysis suggests high intensity.",
      
      // Streams
      ...generateStreamUrls(matchId),
      
      // Metadata
      lastUpdated: serverTimestamp(),
      addedManually: false
    };

    if (matchData.isElite) eliteCount++;
    batch.set(matchRef, matchData, { merge: true });
  });

  try {
    await batch.commit();
    return { success: true, count: matchesArray.length, eliteCount };
  } catch (error) {
    console.error("Vortex Manual Sync Error:", error);
    return { success: false, error: error.message };
  }
};

const mapStatus = (apiStatus) => {
  const live = ['IN_PLAY', 'LIVE', '1H', '2H', 'HT', 'ET', 'P', 'BT'];
  const finished = ['FINISHED', 'FT', 'AET', 'PEN'];
  
  const status = String(apiStatus).toUpperCase();
  if (live.includes(status)) return 'LIVE';
  if (finished.includes(status)) return 'FT';
  return 'NS'; 
};