/* eslint-disable */
const STATUS_MAP = {
  'TBD': 'NS', 'NS': 'NS', '1': 'NS', '1H': '1H', '2H': '2H', 'HT': 'HT', 'ET': 'ET',
  'BT': 'BT', 'P': 'P', 'SUSP': 'SUSP', 'INT': 'SUSP', 'FT': 'FT', 'AET': 'FT',
  'PEN': 'FT', 'PST': 'PST', 'CANC': 'CANC', 'ABD': 'ABD', 'AWD': 'AWD', 'WO': 'AWD',
  'LIVE': 'LIVE', 'IN_PLAY': 'LIVE', 'INPLAY': 'LIVE', 'PAUSED': 'HT', 'FINISHED': 'FT', 
  'SCHEDULED': 'NS', 'TIMED': 'NS', '2': '1H', '3': 'HT', '4': '2H'
};

const ELITE_LEAGUES = [
  1, 2, 3, 4, 5, 7, 10, 11, 12, 13, 29, 30, 31, 34, 39, 45, 48, 61, 66, 78, 81, 88, 94, 135, 137, 140, 143, 227, 848
];

export const FALLBACK_LOGO = "https://cdn-icons-png.flaticon.com/512/33/33736.png";

export const getDecodedStreamUrl = (url) => {
  if (!url) return '';
  try {
    if (url.startsWith('aHR0')) return atob(url);
    return url;
  } catch (e) { return url; }
};

export const isAutoDetected = (match) => {
  if (!match) return false;
  return !!(match.addedManually === false && match.status !== 'NS');
};

export const formatAIPick = (pick) => {
  if (!pick || pick.length < 5) return "Vortex AI: Analyzing match patterns...";
  return pick.replace('Vortex AI:', '').trim();
};

export const normalizeMatch = (data, id) => {
  if (!data) return null;
  const safeId = id || data.id || Math.random().toString(36).substr(2, 9);
  
  const normalizeStatus = (status) => {
    if (!status) return 'NS';
    const statusStr = String(status).toUpperCase().trim();
    if (/^\d+$/.test(statusStr) && statusStr !== '1') return 'LIVE';
    return STATUS_MAP[statusStr] || statusStr;
  };

  let kickoffDate;
  try {
    if (data.kickoff?.toDate) {
      kickoffDate = data.kickoff.toDate().toISOString();
    } else if (data.kickoff) {
      const d = new Date(data.kickoff);
      kickoffDate = isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
    } else { kickoffDate = new Date().toISOString(); }
  } catch (e) { kickoffDate = new Date().toISOString(); }

  return {
    id: safeId,
    home: {
      name: data.home?.name || 'Home Team',
      logo: data.home?.logo || FALLBACK_LOGO,
      score: Number(data.home?.score || 0)
    },
    away: {
      name: data.away?.name || 'Away Team',
      logo: data.away?.logo || FALLBACK_LOGO,
      score: Number(data.away?.score || 0)
    },
    status: normalizeStatus(data.status),
    minute: Number(data.minute || 0),
    league: data.league || 'Unknown League',
    leagueId: Number(data.leagueId || 0),
    leagueLogo: data.leagueLogo || FALLBACK_LOGO,
    isElite: !!(data.isPriority || data.isElite || ELITE_LEAGUES.includes(Number(data.leagueId))),
    isPriority: !!data.isPriority,
    kickoff: kickoffDate,
    venue: data.venue || 'Stadium TBD',
    referee: data.referee || 'Referee TBD',
    streamUrl1: data.streamUrl1 || '',
    streamUrl2: data.streamUrl2 || '',
    streamUrl3: data.streamUrl3 || '',
    aiPick: data.aiPick || 'Vortex AI: Analyzing match patterns...',
    lastUpdated: data.lastUpdated,
    addedManually: !!data.addedManually
  };
};

export const isMatchLive = (match) => {
  if (!match) return false;
  const status = String(match.status).toUpperCase();
  // Expanded logic to include "INPLAY" and "LIVE" strings
  const liveStatuses = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'IN_PLAY', 'INPLAY'];
  const isMinuteNumeric = /^\d+$/.test(status) && status !== '1';
  return (liveStatuses.includes(status) || isMinuteNumeric) && !isMatchFinished(match);
};

export const isMatchUpcoming = (match) => {
  if (!match) return false;
  const status = String(match.status).toUpperCase();
  const now = new Date();
  const kickoff = new Date(match.kickoff);
  return (status === 'NS' || status === '1') && now < kickoff;
};

export const isMatchFinished = (match) => {
  if (!match) return false;
  const status = String(match.status).toUpperCase();
  return ['FT', 'FINISHED', 'AET', 'PEN', 'ABD', 'AWD', 'CANC'].includes(status);
};

export const isEliteMatch = (match) => {
  if (!match) return false;
  return !!(match.isPriority || match.isElite || ELITE_LEAGUES.includes(Number(match.leagueId)));
};

export const formatMatchTime = (kickoff) => {
  if (!kickoff) return 'TBD';
  try {
    return new Date(kickoff).toLocaleTimeString('en-GB', { 
      hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' 
    });
  } catch (e) { return 'TBD'; }
};

export const getMatchStatusText = (match) => {
  if (!match) return '';
  if (isMatchFinished(match)) return 'Full Time';
  if (match.status === 'HT' || match.status === '3') return 'Half Time';
  if (isMatchLive(match)) {
    const min = Number(match.minute || 0);
    return min > 0 ? `${min}'` : "LIVE";
  }
  if (isMatchUpcoming(match)) return formatMatchTime(match.kickoff);
  return match.status;
};

export const calculateEstimatedMinute = (match) => {
  if (!match || !match.kickoff) return 0;
  const start = new Date(match.kickoff).getTime();
  const now = new Date().getTime();
  const diffMinutes = Math.floor((now - start) / 60000);
  if (diffMinutes < 0) return 0;
  if (diffMinutes > 45 && diffMinutes < 60) return 45;
  if (diffMinutes >= 60) return Math.min(diffMinutes - 15, 90);
  return diffMinutes;
};

export default { 
  normalizeMatch, 
  formatMatchTime, 
  isMatchLive, 
  isMatchUpcoming, 
  isMatchFinished, 
  isEliteMatch, 
  getMatchStatusText,
  calculateEstimatedMinute,
  formatAIPick,
  getDecodedStreamUrl,
  isAutoDetected
};