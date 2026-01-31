/* eslint-disable */
const STATUS_MAP = {
  'TBD': 'NS', 'NS': 'NS', '1': 'NS', '1H': '1H', '2H': '2H', 'HT': 'HT', 'ET': 'ET',
  'BT': 'BT', 'P': 'P', 'SUSP': 'SUSP', 'INT': 'SUSP', 'FT': 'FT', 'AET': 'FT',
  'PEN': 'FT', 'PST': 'PST', 'CANC': 'CANC', 'ABD': 'ABD', 'AWD': 'AWD', 'WO': 'AWD',
  'LIVE': 'LIVE', 'IN_PLAY': 'LIVE', 'PAUSED': 'HT', 'FINISHED': 'FT', 'SCHEDULED': 'NS', 'TIMED': 'NS',
  '2': '1H', '3': 'HT', '4': '2H'
};

const ELITE_LEAGUES = [
  1, 2, 3, 4, 5, 7, 10, 11, 12, 13, 29, 30, 31, 34, 39, 45, 48, 61, 66, 78, 81, 88, 94, 135, 137, 140, 143, 227, 848
];

export const normalizeMatch = (data, id) => {
  if (!data) return null;
  const safeId = id || data.id || Math.random().toString(36).substr(2, 9);
  
  const normalizeStatus = (status) => {
    if (!status) return 'NS';
    const statusStr = String(status).toUpperCase().trim();
    // Check if it is a number (minute) and NOT '1'
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
    } else {
      kickoffDate = new Date().toISOString();
    }
  } catch (e) { kickoffDate = new Date().toISOString(); }

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
    addedManually: !!data.addedManually
  };
};

export const isMatchLive = (match) => {
  if (!match) return false;
  const status = String(match.status).toUpperCase();
  const liveStatuses = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'IN_PLAY'];
  // If status is a minute (number other than 1), it is live
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

export default { normalizeMatch, formatMatchTime, isMatchLive, isMatchUpcoming, isMatchFinished, getMatchStatusText };