/* eslint-disable */
// UNIFIED STATUS MAP - MATCHES ALL 3 PARTS EXACTLY
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

const ELITE_LEAGUES = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 29, 30, 31, 34, 39, 45, 48, 61, 
    66, 78, 81, 88, 94, 135, 137, 140, 141, 143, 227, 848,
    42, 43, 44, 46, 47, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
    100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110,
    200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210,
    300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310,
];

// TOP TEAMS LIST - MATCHES ALL 3 PARTS
const TOP_5_TEAMS = [
    "REAL MADRID", "BARCELONA", "MANCHESTER CITY", "ARSENAL", "LIVERPOOL", 
    "MANCHESTER UNITED", "CHELSEA", "BAYERN MUNICH", "INTER MILAN", "AC MILAN",
    "PSG", "JUVENTUS", "ATLETICO MADRID", "BAYER LEVERKUSEN", "DORTMUND"
];

// EXPANDED TOP TEAMS - INCLUDES TOTTENHAM AND OTHER TOP CLUBS (FOR DISPLAY)
const TOP_TEAMS = [
    ...TOP_5_TEAMS,
    "TOTTENHAM", "TOTTENHAM HOTSPUR", "SPURS",
    "NEWCASTLE UNITED", "NEWCASTLE",
    "ASTON VILLA", "VILLA",
    "NAPOLI", "ROMA", "LAZIO",
    "BENFICA", "PORTO", "SPORTING",
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
                const now = new Date();
                datePart = now.toISOString().split('T')[0];
            }
        } catch (e) {
            const now = new Date();
            datePart = now.toISOString().split('T')[0];
        }
    } else {
        const now = new Date();
        datePart = now.toISOString().split('T')[0];
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
        // Convert all inputs to strings safely
        const ln = String(leagueName || '').toUpperCase();
        const h = String(home || '').toUpperCase();
        const a = String(away || '').toUpperCase();
        const lid = Number(leagueId || 0);
        
        // Check ignore keywords
        if (IGNORE_KEYWORDS.some(k => h.includes(k) || a.includes(k))) return false;
        
        // Check block list
        if (BLOCK_LIST.some(c => ln.includes(c))) return false;
        
        // Check elite leagues
        if (ELITE_LEAGUES.includes(lid)) return true;
        
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
        console.error('Error in isEliteMatch:', e);
        return false;
    }
};

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

export const containsTopTeam = (match) => {
    if (!match || !match.home || !match.away) return false;
    
    try {
        const homeName = String(match.home.name || '').toUpperCase();
        const awayName = String(match.away.name || '').toUpperCase();
        
        return TOP_5_TEAMS.some(team => {
            const homeContainsTeam = homeName.includes(team);
            const awayContainsTeam = awayName.includes(team);
            
            return homeContainsTeam || awayContainsTeam;
        });
    } catch (e) {
        console.error('Error in containsTopTeam:', e);
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
        
        if (homeName && awayName) {
            const isPermanentId = safeId && safeId.includes('-vs-') && safeId.split('-vs-').length === 2;
            
            if (!isPermanentId || !safeId) {
                safeId = generatePermanentMatchId(homeName, awayName, kickoff);
            }
        }
        
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
        } catch (e) { 
            kickoffDate = new Date().toISOString(); 
        }

        const hasTopTeam = containsTopTeam(data);
        
        const isElite = (() => {
            try {
                if (data.isPriority === true) return true;
                if (data.isElite === true) return true;
                
                const leagueId = Number(data.leagueId || 0);
                const leagueName = String(data.league || '');
                
                return isEliteMatch(leagueName, leagueId, homeName, awayName);
            } catch (e) {
                console.error('Error determining elite status:', e);
                return false;
            }
        })();

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
            isElite: !!(data.isPriority || data.isElite || isElite || hasTopTeam),
            isPriority: !!(data.isPriority || hasTopTeam),
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
            _rawData: data
        };
    } catch (error) {
        console.error('Error normalizing match:', error, data);
        return {
            id: id || 'error',
            home: { name: 'Error', logo: FALLBACK_LOGO, score: 0, searchName: '' },
            away: { name: 'Error', logo: FALLBACK_LOGO, score: 0, searchName: '' },
            status: 'NS',
            minute: 0,
            league: 'Unknown',
            leagueId: 0,
            leagueLogo: FALLBACK_LOGO,
            isElite: false,
            isPriority: false,
            kickoff: new Date().toISOString(),
            venue: 'Unknown',
            referee: 'Unknown',
            streamUrl1: '',
            streamUrl2: '',
            streamUrl3: '',
            aiPick: 'Vortex AI: Analyzing...',
            lastUpdated: null,
            addedManually: false,
            isPermanent: false,
            apiMatchId: '',
            lastAlertScore: { h: 0, a: 0 },
            lastStatus: 'NS',
            _rawData: data
        };
    }
};

export const isMatchLive = (match) => {
    if (!match) return false;
    
    try {
        const status = String(match.status || '').toUpperCase();
        const minute = Number(match.minute || 0);
        
        if (minute > 0 && minute < 120 && !isMatchFinished(match)) {
            return true;
        }
        
        const liveStatuses = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'IN_PLAY', 'INPLAY', '1ST', '2ND', '2', '3', '4', '5', '6'];
        const isMinuteNumeric = /^\d+$/.test(status) && status !== '1' && status !== 'NS';
        
        return (liveStatuses.includes(status) || isMinuteNumeric) && !isMatchFinished(match);
    } catch (e) {
        console.error('Error in isMatchLive:', e);
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
        console.error('Error in isMatchUpcoming:', e);
        return false;
    }
};

export const isMatchFinished = (match) => {
    if (!match) return false;
    try {
        const status = String(match.status || '').toUpperCase();
        return ['FT', 'FINISHED', 'AET', 'PEN', 'ABD', 'AWD', 'CANC', 'POSTPONED', 'PST'].includes(status);
    } catch (e) {
        console.error('Error in isMatchFinished:', e);
        return false;
    }
};

export const isEliteMatchFromData = (match) => {
    if (!match) return false;
    
    try {
        if (match.isPriority === true) return true;
        if (match.isElite === true) return true;
        
        if (containsTopTeam(match)) return true;
        
        const leagueId = Number(match.leagueId || 0);
        const leagueName = String(match.league || '');
        const homeName = String(match.home?.name || '');
        const awayName = String(match.away?.name || '');
        
        return isEliteMatch(leagueName, leagueId, homeName, awayName);
    } catch (e) {
        console.error('Error in isEliteMatchFromData:', e);
        return false;
    }
};

export const formatMatchTime = (kickoff) => {
    if (!kickoff) return 'TBD';
    try {
        return new Date(kickoff).toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit', 
            timeZone: 'Africa/Lagos' 
        });
    } catch (e) { 
        console.error('Error in formatMatchTime:', e);
        return 'TBD'; 
    }
};

export const getMatchStatusText = (match) => {
    if (!match) return '';
    
    try {
        if (isMatchFinished(match)) return 'Full Time';
        if (match.status === 'HT' || match.status === '3') return 'Half Time';
        
        if (isMatchLive(match)) {
            const min = Number(match.minute || 0);
            return min > 0 ? `${min}'` : "LIVE";
        }
        
        if (isMatchUpcoming(match)) return formatMatchTime(match.kickoff);
        
        return match.status;
    } catch (e) {
        console.error('Error in getMatchStatusText:', e);
        return '';
    }
};

export const calculateEstimatedMinute = (match) => {
    if (!match || !match.kickoff) return 0;
    
    try {
        if (match.minute && match.minute > 0) {
            return Number(match.minute);
        }
        
        const start = new Date(match.kickoff).getTime();
        const now = new Date().getTime();
        const diffMinutes = Math.floor((now - start) / 60000);
        if (diffMinutes < 0) return 0;
        if (diffMinutes > 45 && diffMinutes < 60) return 45;
        if (diffMinutes >= 60) return Math.min(diffMinutes - 15, 90);
        return diffMinutes;
    } catch (e) {
        console.error('Error in calculateEstimatedMinute:', e);
        return 0;
    }
};

export const getTeamPriorityBadge = (match) => {
    if (!match) return null;
    
    try {
        const homeName = String(match.home?.name || '').toUpperCase();
        const awayName = String(match.away?.name || '').toUpperCase();
        
        const topHomeTeam = TOP_5_TEAMS.find(team => 
            homeName.includes(team) || team.includes(homeName)
        );
        
        const topAwayTeam = TOP_5_TEAMS.find(team => 
            awayName.includes(team) || team.includes(awayName)
        );
        
        return {
            homeIsTop: !!topHomeTeam,
            awayIsTop: !!topAwayTeam,
            topHomeName: topHomeTeam,
            topAwayName: topAwayTeam
        };
    } catch (e) {
        console.error('Error in getTeamPriorityBadge:', e);
        return { homeIsTop: false, awayIsTop: false, topHomeName: null, topAwayName: null };
    }
};

export const sortMatchesByPriority = (matches) => {
    if (!matches || !Array.isArray(matches)) return [];
    
    try {
        return [...matches].sort((a, b) => {
            const aHasTop = containsTopTeam(a);
            const bHasTop = containsTopTeam(b);
            
            if (aHasTop && !bHasTop) return -1;
            if (!aHasTop && bHasTop) return 1;
            
            const aLive = isMatchLive(a);
            const bLive = isMatchLive(b);
            const aUpcoming = isMatchUpcoming(a);
            const bUpcoming = isMatchUpcoming(b);
            const aFinished = isMatchFinished(a);
            const bFinished = isMatchFinished(b);
            
            if (aLive && !bLive) return -1;
            if (!aLive && bLive) return 1;
            
            if (aUpcoming && bFinished) return -1;
            if (aFinished && bUpcoming) return 1;
            
            try {
                const aTime = new Date(a.kickoff || 0).getTime();
                const bTime = new Date(b.kickoff || 0).getTime();
                
                if (aLive || aUpcoming) {
                    return aTime - bTime;
                } else {
                    return bTime - aTime;
                }
            } catch (e) {
                return 0;
            }
        });
    } catch (e) {
        console.error('Error in sortMatchesByPriority:', e);
        return matches || [];
    }
};

export const getDisplayMatches = (matches) => {
    if (!matches || !Array.isArray(matches)) return [];
    
    try {
        const filteredMatches = matches.filter(match => {
            if (!match) return false;
            
            try {
                const homeName = String(match.home?.name || '').toUpperCase();
                const awayName = String(match.away?.name || '').toUpperCase();
                
                if (IGNORE_KEYWORDS.some(k => homeName.includes(k) || awayName.includes(k))) {
                    return false;
                }
                
                const leagueName = String(match.league || '').toUpperCase();
                if (BLOCK_LIST.some(c => leagueName.includes(c))) {
                    return false;
                }
                
                return true;
            } catch (e) {
                console.error('Error filtering match:', e);
                return true;
            }
        });
        
        return sortMatchesByPriority(filteredMatches);
    } catch (e) {
        console.error('Error in getDisplayMatches:', e);
        return matches || [];
    }
};

export const findMatchByTeamsAndDate = (matches, homeName, awayName, dateStr) => {
    if (!matches || !Array.isArray(matches)) return null;
    
    try {
        const targetHome = String(homeName || '').toLowerCase().trim();
        const targetAway = String(awayName || '').toLowerCase().trim();
        const targetDate = dateStr ? String(dateStr).split('T')[0] : '';
        
        return matches.find(match => {
            try {
                const matchHome = String(match.home?.name || '').toLowerCase().trim();
                const matchAway = String(match.away?.name || '').toLowerCase().trim();
                const matchDate = match.kickoff ? String(match.kickoff).split('T')[0] : '';
                
                return matchHome === targetHome && 
                       matchAway === targetAway && 
                       (!targetDate || matchDate === targetDate);
            } catch (e) {
                return false;
            }
        });
    } catch (e) {
        console.error('Error in findMatchByTeamsAndDate:', e);
        return null;
    }
};

export const hasValidPermanentId = (match) => {
    if (!match || !match.id) return false;
    
    try {
        const id = String(match.id);
        return id.includes('-vs-') && id.split('-vs-').length === 2;
    } catch (e) {
        console.error('Error in hasValidPermanentId:', e);
        return false;
    }
};

export const generateMatchSearchKey = (match) => {
    if (!match) return '';
    
    try {
        const home = String(match.home?.name || '');
        const away = String(match.away?.name || '');
        const league = String(match.league || '');
        
        return `${home} ${away} ${league}`.toLowerCase();
    } catch (e) {
        console.error('Error in generateMatchSearchKey:', e);
        return '';
    }
};

export const isFeaturedMatch = (match) => {
    if (!match) return false;
    
    try {
        if (!containsTopTeam(match)) return false;
        
        return isMatchLive(match) || isMatchUpcoming(match);
    } catch (e) {
        console.error('Error in isFeaturedMatch:', e);
        return false;
    }
};

export const getMatchCategory = (match) => {
    if (!match) return 'other';
    
    try {
        if (isMatchLive(match)) return 'live';
        if (isMatchUpcoming(match)) return 'upcoming';
        if (isMatchFinished(match)) return 'finished';
        
        return 'other';
    } catch (e) {
        console.error('Error in getMatchCategory:', e);
        return 'other';
    }
};

export const debugMatchData = (match, label = '') => {
    try {
        console.log(`🔍 DEBUG ${label}:`, {
            id: match?.id,
            home: match?.home?.name,
            away: match?.away?.name,
            status: match?.status,
            minute: match?.minute,
            isLive: isMatchLive(match),
            isElite: isEliteMatchFromData(match),
            hasTopTeam: containsTopTeam(match),
            leagueId: match?.leagueId,
            league: match?.league,
            isPriority: match?.isPriority,
            isPermanent: hasValidPermanentId(match),
            kickoff: match?.kickoff
        });
    } catch (e) {
        console.error('Error in debugMatchData:', e);
    }
};

// ============================================================
// STREAM-BASED HIGHLIGHT FUNCTIONS
// ============================================================

// Base URL for Firebase functions - FIXED FOR VITE
const getAPIBase = () => {
    try {
        // Vite environment variables (for modern React/Vue/Svelte apps)
        if (import.meta && import.meta.env && import.meta.env.VITE_FUNCTIONS_URL) {
            return import.meta.env.VITE_FUNCTIONS_URL;
        }
        
        // Create React App environment variables (backward compatibility)
        if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_FUNCTIONS_URL) {
            return process.env.REACT_APP_FUNCTIONS_URL;
        }
        
        // Default to the deployed Firebase function URL
        return 'https://us-central1-votexlive-3a8cb.cloudfunctions.net';
    } catch (error) {
        console.warn('Error getting API base URL:', error);
        return 'https://us-central1-votexlive-3a8cb.cloudfunctions.net';
    }
};

export const HIGHLIGHT_API_BASE = getAPIBase();

export const HIGHLIGHT_API = {
  generate: `${HIGHLIGHT_API_BASE}/generateHighlight`,
  status: `${HIGHLIGHT_API_BASE}/getHighlightStatus`,
  streams: `${HIGHLIGHT_API_BASE}/getAvailableStreams`,
  allHighlights: `${HIGHLIGHT_API_BASE}/getAllHighlights`
};

// Check if highlight can be generated for a match
export const canGenerateHighlight = (match) => {
  if (!match) return false;
  
  try {
    const status = String(match.status || '').toUpperCase();
    const validStatuses = ['LIVE', '1H', '2H', 'HT', 'ET', 'FT'];
    
    // Check if match is finished or live
    const isFinished = isMatchFinished(match);
    const isLive = isMatchLive(match);
    
    return (isLive || isFinished) && validStatuses.includes(status);
  } catch (e) {
    console.error('Error in canGenerateHighlight:', e);
    return false;
  }
};

// Generate highlight title
export const generateHighlightTitle = (match, duration = 60, mode = 'best_moments') => {
  if (!match || !match.home || !match.away) return 'Vortex Highlights';
  
  const home = match.home.name || 'Home';
  const away = match.away.name || 'Away';
  const score = `${match.home.score || 0}-${match.away.score || 0}`;
  
  const durationText = duration <= 60 ? '1 min' : 
                      duration <= 120 ? '2 mins' : 
                      duration <= 180 ? '3 mins' : '5 mins';
  
  let title = `${home} vs ${away} ${score} - ${durationText} Highlights`;
  
  if (mode === 'goals_only') {
    title = `${home} vs ${away} ${score} - Goals Only`;
  } else if (mode === 'condensed') {
    title = `${home} vs ${away} ${score} - Quick Highlights`;
  } else if (mode === 'extended') {
    title = `${home} vs ${away} ${score} - Full Highlights`;
  }
  
  return title;
};

// Generate highlight filename
export const generateHighlightFilename = (match, duration = 60) => {
  if (!match || !match.home || !match.away) return `vortex_highlight_${Date.now()}.mp4`;
  
  const home = String(match.home.name || 'Home').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
  const away = String(match.away.name || 'Away').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
  const durationText = duration <= 60 ? '60s' : 
                      duration <= 120 ? '120s' : 
                      duration <= 180 ? '180s' : '300s';
  
  return `vortex_${home}_vs_${away}_${durationText}_${Date.now()}.mp4`;
};

// Call highlight generation API with stream source
export const generateHighlight = async (matchId, options = {}) => {
  try {
    const { 
      duration = 120, 
      mode = 'best_moments', 
      streamSource = 'streamUrl1',
      watermark = true
    } = options;
    
    const response = await fetch(HIGHLIGHT_API.generate, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        matchId,
        duration: parseInt(duration),
        streamSource,
        mode,
        watermark
      })
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('Error generating highlight:', error);
    throw error;
  }
};

// Check highlight status
export const checkHighlightStatus = async (matchId) => {
  try {
    const response = await fetch(`${HIGHLIGHT_API.status}?matchId=${encodeURIComponent(matchId)}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Error checking highlight status:', error);
    return { 
      success: false, 
      error: error.message,
      highlightAvailable: false 
    };
  }
};

// Get available streams for a match
export const getAvailableStreams = async (matchId) => {
  try {
    const response = await fetch(`${HIGHLIGHT_API.streams}?matchId=${encodeURIComponent(matchId)}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const result = await response.json();
    return result.success ? result.streams : [];
    
  } catch (error) {
    console.error('Error getting available streams:', error);
    return [];
  }
};

// Get all highlights
export const getAllHighlights = async (limit = 20) => {
  try {
    const response = await fetch(`${HIGHLIGHT_API.allHighlights}?limit=${limit}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const result = await response.json();
    return result.success ? result.highlights : [];
    
  } catch (error) {
    console.error('Error getting all highlights:', error);
    return [];
  }
};

// Format duration options for UI
export const getDurationOptions = () => [
  { label: '1 minute', value: 60, description: 'Quick highlights' },
  { label: '2 minutes', value: 120, description: 'Standard highlights' },
  { label: '3 minutes', value: 180, description: 'Extended highlights' },
  { label: '5 minutes', value: 300, description: 'Full highlights' }
];

// Format file size
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

// Estimate file size based on duration
export const estimateFileSize = (durationSeconds) => {
  // Rough estimate: 250KB per second of video
  const bytes = durationSeconds * 250 * 1024;
  return formatFileSize(bytes);
};

// Highlight mode options (updated for stream-based highlights)
export const HIGHLIGHT_MODES = [
  { value: 'best_moments', label: 'Best Moments', description: 'Goals, cards, and key events' },
  { value: 'goals_only', label: 'Goals Only', description: 'Only goal moments' },
  { value: 'extended', label: 'Extended', description: 'All key moments + build up play' },
  { value: 'condensed', label: 'Condensed', description: 'Short 3-minute highlights' }
];

// Check if match supports highlights
export const supportsHighlights = (match) => {
  if (!match) return false;
  return match.isElite || canGenerateHighlight(match);
};

// Get stream source label
export const getStreamSourceLabel = (sourceKey) => {
  const labels = {
    'streamUrl1': 'Primary Stream',
    'streamUrl2': 'Backup Stream 1',
    'streamUrl3': 'Backup Stream 2'
  };
  return labels[sourceKey] || sourceKey;
};

// Generate key moments from match data (simulation for UI)
export const generateKeyMomentsFromMatch = (match) => {
  const moments = [];
  
  if (!match) return moments;
  
  try {
    const homeScore = match.home?.score || 0;
    const awayScore = match.away?.score || 0;
    const minute = match.minute || 90;
    const homeName = match.home?.name || 'Home';
    const awayName = match.away?.name || 'Away';
    
    // Goals
    for (let i = 1; i <= homeScore; i++) {
      const goalMinute = Math.floor((i / (homeScore + 1)) * minute);
      moments.push({
        type: 'GOAL',
        minute: goalMinute,
        team: homeName,
        description: `${homeName} scores!`,
        importance: 10,
        icon: '⚽'
      });
    }
    
    for (let i = 1; i <= awayScore; i++) {
      const goalMinute = Math.floor((i / (awayScore + 1)) * minute);
      moments.push({
        type: 'GOAL',
        minute: goalMinute,
        team: awayName,
        description: `${awayName} scores!`,
        importance: 10,
        icon: '⚽'
      });
    }
    
    // Other key moments
    const eventTypes = [
      { type: 'YELLOW_CARD', icon: '🟨', weight: 0.3 },
      { type: 'RED_CARD', icon: '🟥', weight: 0.1 },
      { type: 'PENALTY', icon: '🎯', weight: 0.2 },
      { type: 'SAVE', icon: '✋', weight: 0.3 },
      { type: 'VAR_CHECK', icon: '📺', weight: 0.2 },
      { type: 'MISSED_CHANCE', icon: '😮', weight: 0.4 }
    ];
    
    const numMoments = Math.min(Math.floor(minute / 15), 8);
    
    for (let i = 0; i < numMoments; i++) {
      const minute = Math.floor(Math.random() * (match.minute || 90)) + 1;
      const event = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const team = Math.random() > 0.5 ? homeName : awayName;
      
      moments.push({
        type: event.type,
        minute: minute,
        team: team,
        description: `${event.icon} ${event.type.replace('_', ' ')} for ${team}`,
        importance: 5 + Math.floor(Math.random() * 5),
        icon: event.icon
      });
    }
    
    return moments.sort((a, b) => a.minute - b.minute);
    
  } catch (error) {
    console.error('Error generating key moments:', error);
    return moments;
  }
};

// Create downloadable highlight file (HTML simulation)
export const createDownloadableHighlight = (match, highlightData) => {
  if (!match || !highlightData) return null;
  
  const highlightContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${match.home.name} vs ${match.away.name} - Vortex Highlights</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            color: #ffffff;
            min-height: 100vh;
            padding: 2rem;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 3rem;
            padding-bottom: 2rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .vortex-badge {
            display: inline-block;
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 50px;
            font-weight: bold;
            font-size: 0.9rem;
            margin-bottom: 1rem;
            letter-spacing: 1px;
        }
        .match-title {
            font-size: 2.5rem;
            font-weight: 900;
            margin-bottom: 0.5rem;
            background: linear-gradient(135deg, #ffffff 0%, #d4d4d4 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-transform: uppercase;
        }
        .match-score {
            font-size: 3rem;
            font-weight: 900;
            margin: 1rem 0;
            color: #dc2626;
        }
        .match-info {
            display: flex;
            justify-content: center;
            gap: 2rem;
            margin: 2rem 0;
            flex-wrap: wrap;
        }
        .info-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 1.5rem;
            min-width: 200px;
            text-align: center;
        }
        .info-card h3 {
            font-size: 0.9rem;
            color: #a1a1aa;
            margin-bottom: 0.5rem;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .info-card p {
            font-size: 1.5rem;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            color: #a1a1aa;
            font-size: 0.9rem;
        }
        .watermark {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: linear-gradient(135deg, rgba(220, 38, 38, 0.9) 0%, rgba(153, 27, 27, 0.9) 100%);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            font-weight: bold;
            font-size: 1rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        @media (max-width: 768px) {
            .container { padding: 1rem; }
            .match-title { font-size: 1.8rem; }
            .match-score { font-size: 2.5rem; }
            .info-card { min-width: 150px; padding: 1rem; }
            .watermark { bottom: 1rem; right: 1rem; font-size: 0.9rem; padding: 0.75rem 1rem; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="vortex-badge">VORTEX LIVE HIGHLIGHTS</div>
            <h1 class="match-title">${match.home.name} vs ${match.away.name}</h1>
            <div class="match-score">${match.home.score} - ${match.away.score}</div>
            <p>${match.league} • ${match.status === 'FT' ? 'Full Time' : `Live ${match.minute || '0'}'`}</p>
        </div>

        <div class="match-info">
            <div class="info-card">
                <h3>Duration</h3>
                <p>${Math.floor(highlightData.duration / 60)} min</p>
            </div>
            <div class="info-card">
                <h3>Quality</h3>
                <p>${highlightData.quality || '720p'}</p>
            </div>
            <div class="info-card">
                <h3>Stream Source</h3>
                <p>${highlightData.streamSource || 'Primary'}</p>
            </div>
            <div class="info-card">
                <h3>Generated</h3>
                <p>${new Date().toLocaleDateString()}</p>
            </div>
        </div>

        <div class="footer">
            <p>Generated by Vortex Live AI • ${new Date().toLocaleDateString()} • vortexlive.online</p>
            <p style="margin-top: 0.5rem; font-size: 0.8rem; color: #71717a;">
                This highlight file contains key moments from the match. For full match experience, visit vortexlive.online
            </p>
        </div>
    </div>

    <div class="watermark">
        📍 vortexlive.online
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            setInterval(() => {
                const watermark = document.querySelector('.watermark');
                watermark.style.transform = 'rotate(1deg)';
                setTimeout(() => {
                    watermark.style.transform = 'rotate(-1deg)';
                }, 1000);
            }, 2000);
        });
    </script>
</body>
</html>`;

  const blob = new Blob([highlightContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  return {
    url,
    filename: generateHighlightFilename(match, highlightData.duration),
    blob
  };
};

// ============================================================
// Export all functions
// ============================================================

export default { 
    // Core functions
    normalizeTeamName,
    generatePermanentMatchId,
    normalizeStatus,
    isEliteMatch,
    normalizeMatch, 
    formatMatchTime, 
    isMatchLive, 
    isMatchUpcoming, 
    isMatchFinished, 
    isEliteMatchFromData, 
    getMatchStatusText,
    calculateEstimatedMinute,
    formatAIPick,
    getDecodedStreamUrl,
    isAutoDetected,
    getTeamPriorityBadge,
    sortMatchesByPriority,
    containsTopTeam,
    getDisplayMatches,
    debugMatchData,
    findMatchByTeamsAndDate,
    hasValidPermanentId,
    generateMatchSearchKey,
    isFeaturedMatch,
    getMatchCategory,
    
    // Highlight functions
    HIGHLIGHT_API_BASE,
    HIGHLIGHT_API,
    canGenerateHighlight,
    generateHighlightTitle,
    generateHighlightFilename,
    generateHighlight,
    checkHighlightStatus,
    getAvailableStreams,
    getAllHighlights,
    getDurationOptions,
    formatFileSize,
    estimateFileSize,
    HIGHLIGHT_MODES,
    supportsHighlights,
    getStreamSourceLabel,
    generateKeyMomentsFromMatch,
    createDownloadableHighlight
};