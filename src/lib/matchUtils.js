/* eslint-disable */

/**
 * STATUS_MAP: Standardizes various API status strings to Vortex internals.
 */
const STATUS_MAP = {
  'TBD': 'NS', 'NS': 'NS', '1H': '1H', '2H': '2H', 'HT': 'HT', 'ET': 'ET',
  'BT': 'BT', 'P': 'P', 'SUSP': 'SUSP', 'INT': 'SUSP', 'FT': 'FT', 'AET': 'FT',
  'PEN': 'FT', 'PST': 'PST', 'CANC': 'CANC', 'ABD': 'ABD', 'AWD': 'AWD', 'WO': 'AWD',
  'LIVE': 'LIVE', 'IN_PLAY': 'LIVE', 'PAUSED': 'HT', 'FINISHED': 'FT', 'SCHEDULED': 'NS', 'TIMED': 'NS'
};

// UPDATED: EUROPEAN & UEFA LEAGUES ONLY (same as Python)
const ELITE_LEAGUES = [
  1,    // World Cup
  2,    // Champions League
  3,    // Europa League
  4,    // Premier League
  5,    // La Liga
  6,    // Serie A
  7,    // Bundesliga
  8,    // Ligue 1
  9,    // Primeira Liga
  10,   // Eredivisie
  11,   // Championship
  12,   // FA Cup
  13,   // Copa del Rey
  14,   // Coppa Italia
  29,   // EFL Cup
  30,   // Coupe de France
  31,   // DFB Pokal
  34,   // KNVB Beker
  39,   // Taça de Portugal
  45,   // Serie B
  48,   // Ligue 2
  61,   // Bundesliga 2
  66,   // La Liga 2
  78,   // UEFA Nations League
  81,   // European Championship
  88,   // Conference League
  94,   // Super Cup (UEFA)
  135,  // EFL Trophy
  137,  // FA Trophy
  140,  // National League
  141,  // National League North/South
  143,  // Scottish Premiership
  227,  // Turkish Süper Lig
  848   // International Friendlies (European teams only)
];

// NEW: Keywords to identify European/UEFA competitions
const EUROPEAN_KEYWORDS = [
  "PREMIER", "LALIGA", "SERIE A", "BUNDESLIGA", "LIGUE 1", 
  "CHAMPIONS", "EUROPA", "CONFERENCE", "EREDIVISIE", "PORTUGAL",
  "UEFA", "EUROPEAN", "ENGLAND", "SPAIN", "ITALY", "GERMANY", "FRANCE"
];

// NEW: Keywords to exclude (African/Asian leagues)
const EXCLUDE_KEYWORDS = [
  "AFRICA", "AFRICAN", "CAF", "EGYPT", "KENYA", "NIGERIA", "SOUTH AFRICA",
  "ASIA", "ASIAN", "AFC", "CHINA", "JAPAN", "KOREA", "AUSTRALIA",
  "USA", "MLS", "MEXICO", "BRAZIL", "ARGENTINA", "CHILE"
];

// NEW: Check if league is European/UEFA
export const isEuropeanLeague = (leagueName, leagueId) => {
  if (!leagueName) return false;
  
  const leagueUpper = leagueName.toUpperCase();
  
  // Check by ID first (most reliable)
  if (ELITE_LEAGUES.includes(leagueId)) {
    return true;
  }
  
  // Must contain at least ONE European keyword
  const hasEuropeanKeyword = EUROPEAN_KEYWORDS.some(keyword => 
    leagueUpper.includes(keyword)
  );
  
  if (!hasEuropeanKeyword) return false;
  
  // Must NOT contain any exclude keywords
  const hasExcluded = EXCLUDE_KEYWORDS.some(keyword => 
    leagueUpper.includes(keyword)
  );
  
  return !hasExcluded;
};

const decodeBase64 = (str) => {
  try {
    if (!str) return '';
    return typeof Buffer !== 'undefined' 
      ? Buffer.from(str, 'base64').toString() 
      : atob(str);
  } catch (e) {
    return str; 
  }
};

export const normalizeMatch = (data, id) => {
  if (!data) return null;
  const safeId = String(data.id || id || '');
  
  const normalizeStatus = (status) => {
    if (!status) return 'NS';
    const statusStr = String(status).toUpperCase().trim();
    return STATUS_MAP[statusStr] || 'NS';
  };

  let kickoffDate;
  if (data.kickoff?.toDate) {
    kickoffDate = data.kickoff.toDate().toISOString();
  } else {
    kickoffDate = data.kickoff || new Date().toISOString();
  }

  // Check if this is a European/UEFA match
  const isUEFA = data.league?.toUpperCase().includes('UEFA') || 
                data.league?.toUpperCase().includes('CHAMPIONS') ||
                data.league?.toUpperCase().includes('EUROPA');
  
  const isEliteMatch = data.isElite || 
                      isEuropeanLeague(data.league, Number(data.leagueId)) ||
                      ELITE_LEAGUES.includes(Number(data.leagueId));

  return {
    id: safeId,
    home: {
      name: data.home?.name || 'Home Team',
      logo: data.home?.logo || '',
      score: Number(data.home?.score || 0)
    },
    away: {
      name: data.away?.name || 'Away Team',
      logo: data.away?.logo || '',
      score: Number(data.away?.score || 0)
    },
    status: normalizeStatus(data.status),
    minute: Number(data.minute || 0),
    league: data.league || 'Unknown League',
    leagueId: Number(data.leagueId || 0),
    leagueLogo: data.leagueLogo || '',
    isElite: isEliteMatch, // UPDATED: Use the European check
    isUEFA: isUEFA, // NEW: Flag for UEFA matches
    kickoff: kickoffDate,
    venue: data.venue || 'Stadium TBD',
    referee: data.referee || 'Referee TBD',
    streamUrl1: data.streamUrl1 || '',
    streamUrl2: data.streamUrl2 || '',
    streamUrl3: data.streamUrl3 || '',
    streamQuality1: data.streamQuality1 || 'HD',
    streamServer1: data.streamServer1 || 'StreamEast',
    aiPick: data.aiPick || 'Vortex AI: Analyzing match patterns...',
    lastUpdated: data.lastUpdated,
    addedManually: !!data.addedManually
  };
};

export const isMatchLive = (match) => {
  if (!match) return false;
  const status = String(match.status).toUpperCase();
  
  // If scraper says it's Finished or Upcoming, it is NOT live.
  if (isMatchFinished(match) || status === 'NS') return false;

  const liveStatuses = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'IN_PLAY'];
  const hasStarted = new Date() >= new Date(match.kickoff);
  
  return liveStatuses.includes(status) || (hasStarted && !match.addedManually);
};

export const isMatchUpcoming = (match) => {
  if (!match) return false;
  const status = String(match.status).toUpperCase();
  const hasStarted = new Date() >= new Date(match.kickoff);
  // Match is only upcoming if status is NS AND kickoff hasn't happened yet
  return status === 'NS' && !hasStarted;
};

export const isMatchFinished = (match) => {
  if (!match) return false;
  const status = String(match.status).toUpperCase();
  return status === 'FT' || status === 'FINISHED' || status === 'AET' || status === 'PEN';
};

export const isEliteMatch = (match) => {
  if (!match) return false;
  return Boolean(match.isElite || ELITE_LEAGUES.includes(Number(match.leagueId)));
};

// NEW: Check if match is UEFA competition
export const isUEFAMatch = (match) => {
  if (!match || !match.league) return false;
  const leagueUpper = match.league.toUpperCase();
  return leagueUpper.includes('UEFA') || 
         leagueUpper.includes('CHAMPIONS') || 
         leagueUpper.includes('EUROPA') ||
         leagueUpper.includes('CONFERENCE');
};

export const isAutoDetected = (match) => {
  if (!match) return false;
  const hasStarted = new Date() >= new Date(match.kickoff);
  return !match.addedManually && hasStarted;
};

export const formatMatchTime = (kickoff) => {
  if (!kickoff) return 'TBD';
  try {
    const date = new Date(kickoff);
    return date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' 
    });
  } catch (e) { return 'TBD'; }
};

export const getMatchStatusText = (match) => {
  if (!match) return '';
  if (isMatchFinished(match)) return 'Full Time';
  if (match.status === 'HT') return 'Half Time';
  if (isMatchUpcoming(match)) return formatMatchTime(match.kickoff);
  
  // If match is live, show minute. If minute is 0 but it's live, show '1'
  if (isMatchLive(match)) {
    const min = Number(match.minute || 0);
    return min > 0 ? `${min}'` : "1'";
  }
  return match.status;
};

export const calculateEstimatedStatus = (match) => {
  if (isMatchFinished(match)) return "Full Time";
  if (match.status === 'HT') return "Half Time";
  if (isMatchLive(match)) return "Live";
  return "Scheduled";
};

export const calculateEstimatedMinute = (match) => {
  if (!match) return null;
  const min = Number(match.minute);
  if (isNaN(min) || min <= 0) {
    return isMatchLive(match) ? 1 : null;
  }
  return min > 90 ? "90+" : min;
};

export const getDecodedStreamUrl = (url, fallbackIndex = 0) => {
  const sources = [
    "https://thestreameast.life",
    "https://soccertvhd.com",
    "https://givemereddistreams.top"
  ];
  if (!url) return sources[fallbackIndex];
  return decodeBase64(url);
};

export const getStreamCount = (match) => {
  if (!match) return 0;
  let count = 0;
  if (match.streamUrl1) count++;
  if (match.streamUrl2) count++;
  if (match.streamUrl3) count++;
  return count;
};

export const formatAIPick = (text) => text || 'Vortex AI: Analyzing match patterns...';

// UPDATED: Sort matches with UEFA matches first
export const sortMatches = (matches) => {
  if (!matches) return [];
  return [...matches].sort((a, b) => {
    // UEFA matches get highest priority
    const aUEFA = isUEFAMatch(a);
    const bUEFA = isUEFAMatch(b);
    if (aUEFA && !bUEFA) return -1;
    if (!aUEFA && bUEFA) return 1;
    
    // Then sort by live status
    const aLive = isMatchLive(a);
    const bLive = isMatchLive(b);
    if (aLive && !bLive) return -1;
    if (!aLive && bLive) return 1;
    
    // Then sort by elite status
    const aElite = isEliteMatch(a);
    const bElite = isEliteMatch(b);
    if (aElite && !bElite) return -1;
    if (!aElite && bElite) return 1;
    
    // Then by finish status
    if (!aLive && !bLive) {
      const aFinished = isMatchFinished(a);
      const bFinished = isMatchFinished(b);
      if (aFinished && !bFinished) return 1;
      if (!aFinished && bFinished) return -1;
      return new Date(a.kickoff) - new Date(b.kickoff);
    }
    return 0;
  });
};

export default {
  normalizeMatch,
  formatMatchTime,
  isMatchLive,
  isMatchUpcoming,
  isMatchFinished,
  isEliteMatch,
  isUEFAMatch, // NEW
  isEuropeanLeague, // NEW
  isAutoDetected,
  getMatchStatusText,
  calculateEstimatedStatus,
  calculateEstimatedMinute,
  getDecodedStreamUrl,
  getStreamCount,
  formatAIPick,
  sortMatches
};

export { STATUS_MAP, ELITE_LEAGUES, EUROPEAN_KEYWORDS, EXCLUDE_KEYWORDS, decodeBase64 };