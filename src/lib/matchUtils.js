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

const ELITE_LEAGUES = [
  1, 2, 3, 4, 5, 7, 10, 11, 12, 13, 29, 30, 31, 34, 39, 45, 48, 61, 66, 78, 81, 88, 94, 135, 137, 140, 143, 227, 848
];

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
    isElite: data.isElite || ELITE_LEAGUES.includes(Number(data.leagueId)),
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
    announced: !!data.announced,
    addedManually: !!data.addedManually
  };
};

export const isMatchLive = (match) => {
  if (!match) return false;
  const status = String(match.status).toUpperCase();
  if (isMatchFinished(match) || status === 'NS') return false;
  const liveStatuses = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'IN_PLAY'];
  const hasStarted = new Date() >= new Date(match.kickoff);
  return liveStatuses.includes(status) || (hasStarted && !match.addedManually);
};

export const isMatchUpcoming = (match) => {
  if (!match) return false;
  const status = String(match.status).toUpperCase();
  const hasStarted = new Date() >= new Date(match.kickoff);
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
  if (isNaN(min) || min <= 0) return isMatchLive(match) ? 1 : null;
  return min > 90 ? "90+" : min;
};

export const getDecodedStreamUrl = (url, fallbackIndex = 0) => {
  const sources = [
    "https://thestreameast.life",
    "https://soccertvhd.com",
    "https://givemereddistreams.top"
  ];
  if (!url || url === '') return sources[fallbackIndex];
  return decodeBase64(url);
};

export const getStreamCount = (match) => {
  if (!match) return 0;
  let count = 0;
  if (match.streamUrl1 && match.streamUrl1.length > 5) count++;
  if (match.streamUrl2 && match.streamUrl2.length > 5) count++;
  if (match.streamUrl3 && match.streamUrl3.length > 5) count++;
  return count;
};

export const formatAIPick = (text) => text || 'Vortex AI: Analyzing match patterns...';

export const sortMatches = (matches) => {
  if (!matches) return [];
  return [...matches].sort((a, b) => {
    const aLive = isMatchLive(a);
    const bLive = isMatchLive(b);
    if (aLive && !bLive) return -1;
    if (!aLive && bLive) return 1;
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
  normalizeMatch, formatMatchTime, isMatchLive, isMatchUpcoming, isMatchFinished, isEliteMatch,
  isAutoDetected, getMatchStatusText, calculateEstimatedStatus, calculateEstimatedMinute,
  getDecodedStreamUrl, getStreamCount, formatAIPick, sortMatches
};

export { STATUS_MAP, ELITE_LEAGUES, decodeBase64 };