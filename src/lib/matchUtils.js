/* eslint-disable */
// ============================================================
// CONFIGURATION, CONSTANTS & MAPS
// ============================================================

const STATUS_MAP = {
    'TBD': 'NS', 'NS': 'NS', '1': 'NS', '1H': '1H', '2H': '2H', 'HT': 'HT', 'ET': 'ET',
    'BT': 'BT', 'P': 'P', 'SUSP': 'SUSP', 'INT': 'SUSP', 'FT': 'FT', 'AET': 'FT',
    'PEN': 'FT', 'PST': 'PST', 'CANC': 'CANC', 'ABD': 'ABD', 'AWD': 'AWD', 'WO': 'AWD',
    'LIVE': 'LIVE', 'IN_PLAY': 'LIVE', 'INPLAY': 'LIVE', '1ST': '1H', '2ND': '2H',
    'PAUSED': 'HT', 'FINISHED': 'FT', 'SCHEDULED': 'NS', 
    'TIMED': 'NS', 'POSTPONED': 'PST', 'DELAYED': 'SUSP', 'ABANDONED': 'ABD',
    '2': '1H', '3': 'HT', '4': '2H', '5': 'ET', '6': 'P', '7': 'FT',
    '8': 'SUSP', '9': 'CANC', '10': 'ABD', '11': 'AWD', '12': 'POSTP',
    '13': 'INT', '14': 'TBD'
};

// Optimization: Use Set for O(1) lookup
const ELITE_LEAGUES = new Set([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 29, 30, 31, 34, 39, 45, 48, 61, 
    66, 78, 81, 88, 94, 135, 137, 140, 141, 143, 227, 848,
    42, 43, 44, 46, 47, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
    100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110,
    200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210,
    300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310,
]);

const TOP_5_TEAMS = [
    "REAL MADRID", "BARCELONA", "MANCHESTER CITY", "ARSENAL", "LIVERPOOL", 
    "MANCHESTER UNITED", "CHELSEA", "BAYERN MUNICH", "INTER MILAN", "AC MILAN",
    "PSG", "JUVENTUS", "ATLETICO MADRID", "BAYER LEVERKUSEN", "DORTMUND"
];

const TOP_TEAMS = [
    ...TOP_5_TEAMS,
    "TOTTENHAM", "TOTTENHAM HOTSPUR", "SPURS", "NEWCASTLE UNITED", "NEWCASTLE",
    "ASTON VILLA", "VILLA", "NAPOLI", "ROMA", "LAZIO", "BENFICA", "PORTO", "SPORTING",
    "AJAX", "FEYENOORD", "PSV"
];

const BLOCK_LIST = ["KENYA", "EGYPT", "LIBYA", "JORDAN", "VIETNAM", "GHANA", "NIGERIA"];
const IGNORE_KEYWORDS = ["U23", "U21", "U19", "U18", "U17", "WOMEN", "RESERVE", "YOUTH", "ACADEMY", "B TEAM"];

export const FALLBACK_LOGO = "https://cdn-icons-png.flaticon.com/512/33/33736.png";

// ============================================================
// CORE MATCH UTILITIES
// ============================================================

export const normalizeTeamName = (name) => {
    if (!name) return '';
    try {
        return String(name).toLowerCase()
            .replace(/\s+(fc|cf|sc|afc|cfc|united|city|real|cf|atletico|at\.?|deportivo|sporting|olympique|olympiacos|dynamo|zenit|shakhtar|besiktas|galatasaray|fenerbahce|ajax|psv|benfica|porto)$/gi, '')
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    } catch (e) {
        return String(name || '').toLowerCase().trim();
    }
};

export const generatePermanentMatchId = (home, away, kickoffDate) => {
    const homeNorm = normalizeTeamName(home);
    const awayNorm = normalizeTeamName(away);
    
    let datePart;
    if (kickoffDate) {
        try {
            if (kickoffDate.includes('-')) {
                datePart = kickoffDate.substring(0, 10);
            } else if (kickoffDate.length >= 8) {
                datePart = `${kickoffDate.substring(0,4)}-${kickoffDate.substring(4,6)}-${kickoffDate.substring(6,8)}`;
            } else {
                datePart = new Date().toISOString().split('T')[0];
            }
        } catch (e) {
            datePart = new Date().toISOString().split('T')[0];
        }
    } else {
        datePart = new Date().toISOString().split('T')[0];
    }
    
    return `${homeNorm}-vs-${awayNorm}-${datePart}`.substring(0, 150);
};

export const normalizeStatus = (statusRaw) => {
    if (!statusRaw) return 'NS';
    try {
        const s = String(statusRaw).toUpperCase().trim();
        if (STATUS_MAP[s]) return STATUS_MAP[s];
        if (/^\d+$/.test(s)) return 'LIVE';
        if (s.includes("'") || s.includes("MIN")) return 'LIVE';
        return 'NS';
    } catch (e) {
        return 'NS';
    }
};

export const isEliteMatch = (leagueName, leagueId, home = "", away = "") => {
    try {
        const ln = String(leagueName || '').toUpperCase();
        const h = String(home || '').toUpperCase();
        const a = String(away || '').toUpperCase();
        const lid = Number(leagueId || 0);
        
        if (IGNORE_KEYWORDS.some(k => h.includes(k) || a.includes(k))) return false;
        if (BLOCK_LIST.some(c => ln.includes(c))) return false;
        if (ELITE_LEAGUES.has(lid)) return true;
        
        const ELITE_KEYWORDS = [
            "PREMIER LEAGUE", "LALIGA", "SERIE A", "BUNDESLIGA", "LIGUE 1", 
            "CHAMPIONS LEAGUE", "EUROPA LEAGUE", "CONFERENCE LEAGUE", 
            "EREDIVISIE", "LIGA PORTUGAL", "PRIMEIRA LIGA", "FA CUP", 
            "COPA DEL REY", "COPPA ITALIA", "COUPE DE FRANCE", "DFB POKAL", 
            "KNVB BEKER", "TAÇA DE PORTUGAL", "EUROPEAN CHAMPIONSHIP", 
            "WORLD CUP", "NATIONS LEAGUE", "INTERNATIONAL FRIENDLIES",
            "EUROPA", "CONFERENCE", "SUPER CUP", "CLUB WORLD CUP",
            "UEFA", "PREMIER", "DIVISION", "CHAMPIONSHIP", "LEAGUE", "CUP"
        ];
        
        if (ELITE_KEYWORDS.some(k => ln.includes(k))) {
            if (["BEACH", "INDOOR", "FUTSAL"].some(k => ln.includes(k))) return false;
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
};

export const containsTopTeam = (match) => {
    if (!match || !match.home || !match.away) return false;
    try {
        const homeName = String(match.home.name || '').toUpperCase();
        const awayName = String(match.away.name || '').toUpperCase();
        return TOP_5_TEAMS.some(team => homeName.includes(team) || awayName.includes(team));
    } catch (e) {
        return false;
    }
};

export const isMatchFinished = (match) => {
    if (!match) return false;
    try {
        const status = String(match.status || '').toUpperCase();
        return ['FT', 'FINISHED', 'AET', 'PEN', 'ABD', 'AWD', 'CANC', 'POSTPONED', 'PST'].includes(status);
    } catch (e) {
        return false;
    }
};

export const isMatchLive = (match) => {
    if (!match) return false;
    try {
        const status = String(match.status || '').toUpperCase();
        const minute = Number(match.minute || 0);
        if (minute > 0 && minute < 120 && !isMatchFinished(match)) return true;
        
        const liveStatuses = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'IN_PLAY', 'INPLAY', '1ST', '2ND', '2', '3', '4', '5', '6'];
        const isMinuteNumeric = /^\d+$/.test(status) && status !== '1' && status !== 'NS';
        return (liveStatuses.includes(status) || isMinuteNumeric) && !isMatchFinished(match);
    } catch (e) {
        return false;
    }
};

export const isMatchUpcoming = (match) => {
    if (!match) return false;
    try {
        const status = String(match.status || '').toUpperCase();
        return (status === 'NS' || status === '1' || status === 'SCHEDULED' || status === 'TIMED' || status === 'TBD') && 
               !isMatchLive(match) && 
               !isMatchFinished(match);
    } catch (e) {
        return false;
    }
};

export const normalizeMatch = (data, id) => {
    if (!data) return null;
    try {
        let safeId = id || data.id || '';
        const homeName = data.home?.name || '';
        const awayName = data.away?.name || '';
        const kickoff = data.kickoff || '';
        
        if (homeName && awayName && (!safeId || !safeId.includes('-vs-'))) {
            safeId = generatePermanentMatchId(homeName, awayName, kickoff);
        }
        
        let kickoffDate;
        if (data.kickoff?.toDate) kickoffDate = data.kickoff.toDate().toISOString();
        else if (data.kickoff) kickoffDate = new Date(data.kickoff).toISOString();
        else kickoffDate = new Date().toISOString();

        const hasTopTeamFlag = containsTopTeam(data);
        const isElite = !!(data.isPriority || data.isElite || isEliteMatch(data.league, data.leagueId, homeName, awayName) || hasTopTeamFlag);

        return {
            id: safeId,
            home: {
                name: homeName,
                logo: data.home?.logo || FALLBACK_LOGO,
                score: Number(data.home?.score || 0),
                searchName: normalizeTeamName(homeName)
            },
            away: {
                name: awayName,
                logo: data.away?.logo || FALLBACK_LOGO,
                score: Number(data.away?.score || 0),
                searchName: normalizeTeamName(awayName)
            },
            status: normalizeStatus(data.status),
            minute: Number(data.minute || 0),
            league: String(data.league || 'Unknown League'),
            leagueId: Number(data.leagueId || 0),
            leagueLogo: data.leagueLogo || FALLBACK_LOGO,
            isElite: isElite,
            isPriority: !!(data.isPriority || hasTopTeamFlag),
            kickoff: kickoffDate,
            venue: data.venue || 'Stadium TBD',
            referee: data.referee || 'Referee TBD',
            streamUrl1: data.streamUrl1 || '',
            streamUrl2: data.streamUrl2 || '',
            streamUrl3: data.streamUrl3 || '',
            aiPick: data.aiPick || 'Vortex AI: Analyzing match patterns...',
            lastUpdated: data.lastUpdated,
            addedManually: !!data.addedManually,
            isPermanent: true,
            apiMatchId: data.apiMatchId || '',
            lastAlertScore: data.lastAlertScore || { h: Number(data.home?.score || 0), a: Number(data.away?.score || 0) },
            lastStatus: data.lastStatus || normalizeStatus(data.status),
            hasVideoHighlights: !!data.hasVideoHighlights,
            videoHighlightCount: Number(data.videoHighlightCount || 0),
            // ADDED: Video duration from database or default to 12 seconds
            videoDuration: data.videoDuration || 0.2,
            _rawData: data
        };
    } catch (error) {
        console.error('Error normalizing match:', error);
        return null;
    }
};

// ============================================================
// VIDEO HIGHLIGHT FUNCTIONS (UPDATED FOR 12-SECOND DURATION)
// ============================================================

const getAPIBase = () => {
    try {
        if (import.meta && import.meta.env && import.meta.env.VITE_FUNCTIONS_URL) {
            return import.meta.env.VITE_FUNCTIONS_URL;
        }
        return 'https://us-central1-votexlive-3a8cb.cloudfunctions.net';
    } catch (error) {
        return 'https://us-central1-votexlive-3a8cb.cloudfunctions.net';
    }
};

export const HIGHLIGHT_API_BASE = getAPIBase();

export const VIDEO_HIGHLIGHT_API = {
  generate: `${HIGHLIGHT_API_BASE}/generateVideoHighlight`,
  matchHighlights: `${HIGHLIGHT_API_BASE}/getMatchVideoHighlights`,
  allHighlights: `${HIGHLIGHT_API_BASE}/getAllVideoHighlights`,
  highlightById: `${HIGHLIGHT_API_BASE}/getVideoHighlightById`,
  delete: `${HIGHLIGHT_API_BASE}/deleteVideoHighlight`,
  stats: `${HIGHLIGHT_API_BASE}/getVideoHighlightStats`,
  clientGenerate: `${HIGHLIGHT_API_BASE}/generateHighlightFromClient`
};

export const canGenerateVideoHighlight = (match) => {
  if (!match) return false;
  const status = String(match.status || '').toUpperCase();
  const validStatuses = ['LIVE', '1H', '2H', 'HT', 'ET', 'FT'];
  return (isMatchLive(match) || isMatchFinished(match)) && validStatuses.includes(status);
};

export const generateVideoHighlightTitle = (match, duration = 12, eventType = 'goal') => {
  if (!match || !match.home || !match.away) return 'Vortex Video Highlight';
  const score = `${match.home.score || 0}-${match.away.score || 0}`;
  const eventLabels = { 'goal': 'Goal', 'save': 'Great Save', 'foul': 'Foul', 'card': 'Card', 'chance': 'Chance', 'custom': 'Highlight' };
  return `${eventLabels[eventType] || 'Highlight'}: ${match.home.name} ${score} ${match.away.name} (${duration}s) - Vortex Live`;
};

export const generateVideoFilename = (match, duration = 12, eventType = 'goal') => {
  if (!match || !match.home || !match.away) return `vortex_video_${Date.now()}.mp4`;
  const home = String(match.home.name || 'Home').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
  const away = String(match.away.name || 'Away').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
  return `vortex_${eventType}_${home}_vs_${away}_${duration}s_${Date.now()}.mp4`;
};

export const generateVideoHighlight = async (matchId, options = {}) => {
  try {
    // Use 12 seconds as default duration
    const defaultOptions = {
      duration: 12, // 12 seconds as requested
      vortexEngine: 'v3-flash'
    };
    
    const response = await fetch(VIDEO_HIGHLIGHT_API.generate, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
          matchId, 
          ...defaultOptions,
          ...options 
      })
    });
    if (!response.ok) throw new Error(`Vortex Cloud Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error generating video highlight:', error);
    throw error;
  }
};

export const getMatchVideoHighlights = async (matchId) => {
  try {
    const response = await fetch(`${VIDEO_HIGHLIGHT_API.matchHighlights}?matchId=${encodeURIComponent(matchId)}`);
    const result = await response.json();
    return result.success ? result.highlights : [];
  } catch (error) {
    return [];
  }
};

export const getAllVideoHighlights = async (limit = 20) => {
  try {
    const response = await fetch(`${VIDEO_HIGHLIGHT_API.allHighlights}?limit=${limit}`);
    const result = await response.json();
    return result.success ? result.highlights : [];
  } catch (error) {
    return [];
  }
};

export const getVideoHighlightById = async (highlightId) => {
    try {
      const response = await fetch(`${VIDEO_HIGHLIGHT_API.highlightById}?highlightId=${encodeURIComponent(highlightId)}`);
      const result = await response.json();
      return result.success ? result.highlight : null;
    } catch (error) { return null; }
};

export const deleteVideoHighlight = async (highlightId) => {
    const response = await fetch(VIDEO_HIGHLIGHT_API.delete, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ highlightId })
    });
    return await response.json();
};

export const getVideoHighlightStats = async () => {
    const response = await fetch(VIDEO_HIGHLIGHT_API.stats);
    const result = await response.json();
    return result.success ? result.stats : null;
};

// ============================================================
// VIDEO UI & FORMATTING HELPERS (UPDATED FOR 12 SECONDS)
// ============================================================

export const getVideoDurationOptions = () => [
  { label: '12 SEC', value: 12, description: 'Max duration for highlights' },
  { label: '8 SEC', value: 8, description: 'Short clip for stories' }
];

export const VIDEO_EVENT_TYPES = [
  { value: 'goal', label: 'GOAL', icon: '⚽', color: 'text-green-500', bg: 'bg-green-600' },
  { value: 'save', label: 'SAVE', icon: '✋', color: 'text-blue-500', bg: 'bg-blue-600' },
  { value: 'foul', label: 'FOUL', icon: '🟨', color: 'text-yellow-500', bg: 'bg-yellow-600' },
  { value: 'card', label: 'CARD', icon: '🟥', color: 'text-orange-500', bg: 'bg-orange-600' },
  { value: 'chance', label: 'CHANCE', icon: '🎯', color: 'text-purple-500', bg: 'bg-purple-600' },
  { value: 'custom', label: 'CUSTOM', icon: '🎬', color: 'text-red-500', bg: 'bg-red-600' }
];

export const VIDEO_QUALITY_OPTIONS = [
  { value: 'sd', label: 'SD', description: '480p - Faster processing' },
  { value: 'hd', label: 'HD', description: '720p - Recommended' },
  { value: 'fhd', label: 'FHD', description: '1080p - Best quality' }
];

export const formatVideoFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 MB';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) { size /= 1024; unitIndex++; }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

export const estimateVideoFileSize = (durationSeconds, quality = 'hd') => {
  // For 12 seconds, adjust estimates
  const bitrates = { 'sd': 800, 'hd': 1500, 'fhd': 3000 };
  const bytes = ((bitrates[quality] || 1500) * 1000 * durationSeconds) / 8;
  return formatVideoFileSize(bytes);
};

export const getVideoFeatures = () => [
  '12-second max duration for efficiency',
  'Dynamic overlays (score, teams, league, minute)',
  'Vortex Live watermark branding',
  'MP4 format (H.264) for social media',
  'Optimized for WhatsApp, Telegram, Instagram'
];

export const getVideoProcessingStages = () => [
  { stage: 0, label: 'Downloading 12-second stream segment...', progress: 30 },
  { stage: 1, label: 'Applying slow motion effects...', progress: 60 },
  { stage: 2, label: 'Adding overlays and graphics...', progress: 80 },
  { stage: 3, label: 'Uploading to cloud storage...', progress: 95 },
  { stage: 4, label: 'Finalizing video...', progress: 100 }
];

export const calculateVideoTimestamp = (minute) => {
  const m = parseInt(minute) || 0;
  return `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}:00`;
};

export const shareVideoToSocial = (videoUrl, match, platform = 'whatsapp') => {
  if (!videoUrl || !match) return;
  const message = `🎥 Watch this 12-second highlight from ${match.home.name} vs ${match.away.name} on Vortex Live!`;
  const platforms = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(message + ' ' + videoUrl)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(videoUrl)}&text=${encodeURIComponent(message)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(videoUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}`
  };
  window.open(platforms[platform] || platforms.whatsapp, '_blank', 'noopener,noreferrer');
};

export const getVideoProgressLabel = (progress) => {
    if (progress < 30) return 'Downloading 12-second stream segment...';
    if (progress < 60) return 'Applying slow motion effects...';
    if (progress < 90) return 'Adding overlays and graphics...';
    if (progress < 100) return 'Uploading to cloud storage...';
    return 'Video ready!';
};

// ============================================================
// OTHER MISC MATCH HELPERS
// ============================================================

export const formatMatchTime = (kickoff) => {
    if (!kickoff) return 'TBD';
    try {
        return new Date(kickoff).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' });
    } catch (e) { return 'TBD'; }
};

export const getMatchStatusText = (match) => {
    if (!match) return '';
    if (isMatchFinished(match)) return 'Full Time';
    if (match.status === 'HT') return 'Half Time';
    if (isMatchLive(match)) return match.minute > 0 ? `${match.minute}'` : "LIVE";
    if (isMatchUpcoming(match)) return formatMatchTime(match.kickoff);
    return match.status;
};

export const sortMatchesByPriority = (matches) => {
    if (!matches || !Array.isArray(matches)) return [];
    return [...matches].sort((a, b) => {
        const aHasTop = containsTopTeam(a);
        const bHasTop = containsTopTeam(b);
        if (aHasTop && !bHasTop) return -1;
        if (!aHasTop && bHasTop) return 1;
        
        const aLive = isMatchLive(a);
        const bLive = isMatchLive(b);
        if (aLive && !bLive) return -1;
        if (!aLive && bLive) return 1;
        
        return new Date(a.kickoff || 0) - new Date(b.kickoff || 0);
    });
};

export const getDisplayMatches = (matches) => {
    if (!matches) return [];
    const filtered = matches.filter(match => {
        if (!match) return false;
        const h = String(match.home?.name || '').toUpperCase();
        const a = String(match.away?.name || '').toUpperCase();
        const l = String(match.league || '').toUpperCase();
        if (IGNORE_KEYWORDS.some(k => h.includes(k) || a.includes(k))) return false;
        if (BLOCK_LIST.some(c => l.includes(c))) return false;
        return true;
    });
    return sortMatchesByPriority(filtered);
};

// ============================================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================================

export const HIGHLIGHT_API = {
  generate: VIDEO_HIGHLIGHT_API.generate,
  status: VIDEO_HIGHLIGHT_API.matchHighlights,
  streams: `${HIGHLIGHT_API_BASE}/getAvailableStreams`,
  allHighlights: VIDEO_HIGHLIGHT_API.allHighlights
};

export const canGenerateHighlight = canGenerateVideoHighlight;
export const generateHighlightTitle = generateVideoHighlightTitle;
export const generateHighlightFilename = generateVideoFilename;
export const generateHighlight = generateVideoHighlight;
export const checkHighlightStatus = getMatchVideoHighlights;
export const getAllHighlights = getAllVideoHighlights;
export const getDurationOptions = getVideoDurationOptions;
export const formatFileSize = formatVideoFileSize;
export const estimateFileSize = estimateVideoFileSize;
export const supportsHighlights = canGenerateVideoHighlight;

export default { 
    normalizeTeamName, 
    generatePermanentMatchId, 
    normalizeStatus, 
    isEliteMatch, 
    normalizeMatch, 
    isMatchLive, 
    isMatchFinished, 
    getMatchStatusText,
    getDisplayMatches,
    sortMatchesByPriority,
    containsTopTeam,
    VIDEO_HIGHLIGHT_API,
    canGenerateVideoHighlight,
    generateVideoHighlight,
    getMatchVideoHighlights,
    calculateVideoTimestamp,
    shareVideoToSocial,
    getVideoProgressLabel,
    canGenerateHighlight,
    generateHighlight
};