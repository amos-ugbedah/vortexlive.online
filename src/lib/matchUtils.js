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

// PERMANENT MATCH ID GENERATION - MUST MATCH PYTHON AND FIREBASE FUNCTIONS EXACTLY
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

// NORMALIZE STATUS - MATCHES ALL 3 PARTS EXACTLY
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

// IS ELITE MATCH - MATCHES ALL 3 PARTS EXACTLY (WITH SAFE STRING CONVERSION)
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

// Check if match contains top teams - NOW USES OFFICIAL TOP_5_TEAMS
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

// UPDATED NORMALIZE MATCH WITH PERMANENT ID SUPPORT AND ERROR HANDLING
export const normalizeMatch = (data, id) => {
    if (!data) return null;
    
    try {
        // Generate permanent ID if not provided or if current ID is not permanent
        let safeId = id || data.id || '';
        const homeName = data.home?.name || '';
        const awayName = data.away?.name || '';
        const kickoff = data.kickoff || '';
        
        if (homeName && awayName) {
            // Check if current ID is permanent (follows format: {home}-vs-{away}-{date})
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

        // Check if this match contains top teams
        const hasTopTeam = containsTopTeam(data);
        
        // Determine if match is elite (using unified logic)
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
        // Return a minimal valid match object to prevent crashes
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
        
        // If minute is a positive number (and not finished), it's live
        if (minute > 0 && minute < 120 && !isMatchFinished(match)) {
            return true;
        }
        
        // Use expanded live statuses from unified STATUS_MAP
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
        // Upcoming is only NS or 1
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

// ENHANCED: Check if match is elite (including top teams)
export const isEliteMatchFromData = (match) => {
    if (!match) return false;
    
    try {
        // Check if it's marked as priority in data
        if (match.isPriority === true) return true;
        
        // Check if it's marked as elite in data
        if (match.isElite === true) return true;
        
        // Check if contains top teams
        if (containsTopTeam(match)) return true;
        
        // Use the unified isEliteMatch function
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
            // Show minute if available, otherwise just LIVE
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
        // If we have actual minute data, use it
        if (match.minute && match.minute > 0) {
            return Number(match.minute);
        }
        
        // Otherwise estimate from kickoff time
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

// Get team priority badge
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

// Sort matches with top teams first
export const sortMatchesByPriority = (matches) => {
    if (!matches || !Array.isArray(matches)) return [];
    
    try {
        return [...matches].sort((a, b) => {
            // First, check if either match has top teams
            const aHasTop = containsTopTeam(a);
            const bHasTop = containsTopTeam(b);
            
            if (aHasTop && !bHasTop) return -1;
            if (!aHasTop && bHasTop) return 1;
            
            // Both have or don't have top teams, sort by status
            // LIVE > UPCOMING > FINISHED
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
            
            // Both have same status, sort by kickoff time (earlier first)
            try {
                const aTime = new Date(a.kickoff || 0).getTime();
                const bTime = new Date(b.kickoff || 0).getTime();
                
                if (aLive || aUpcoming) {
                    // For live/upcoming, earliest first
                    return aTime - bTime;
                } else {
                    // For finished, most recent first
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

// Helper to get all matches that should be displayed
export const getDisplayMatches = (matches) => {
    if (!matches || !Array.isArray(matches)) return [];
    
    try {
        // Filter out matches that shouldn't be displayed
        const filteredMatches = matches.filter(match => {
            if (!match) return false;
            
            try {
                // Check ignore keywords in team names
                const homeName = String(match.home?.name || '').toUpperCase();
                const awayName = String(match.away?.name || '').toUpperCase();
                
                if (IGNORE_KEYWORDS.some(k => homeName.includes(k) || awayName.includes(k))) {
                    return false;
                }
                
                // Check block list in league name
                const leagueName = String(match.league || '').toUpperCase();
                if (BLOCK_LIST.some(c => leagueName.includes(c))) {
                    return false;
                }
                
                return true;
            } catch (e) {
                console.error('Error filtering match:', e);
                return true; // Keep match if error during filtering
            }
        });
        
        return sortMatchesByPriority(filteredMatches);
    } catch (e) {
        console.error('Error in getDisplayMatches:', e);
        return matches || [];
    }
};

// Find match by teams and date (to handle API ID changes)
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

// Validate if match has permanent ID
export const hasValidPermanentId = (match) => {
    if (!match || !match.id) return false;
    
    try {
        // Check if ID follows permanent format: {home}-vs-{away}-{date}
        const id = String(match.id);
        return id.includes('-vs-') && id.split('-vs-').length === 2;
    } catch (e) {
        console.error('Error in hasValidPermanentId:', e);
        return false;
    }
};

// Generate match search key (for search functionality)
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

// Check if match should be featured (top teams + live/upcoming)
export const isFeaturedMatch = (match) => {
    if (!match) return false;
    
    try {
        // Must have top teams
        if (!containsTopTeam(match)) return false;
        
        // Must be live or upcoming (not finished)
        return isMatchLive(match) || isMatchUpcoming(match);
    } catch (e) {
        console.error('Error in isFeaturedMatch:', e);
        return false;
    }
};

// Get match category for filtering
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

// Debug function to check match data
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

// Export all functions
export default { 
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
    generatePermanentMatchId,
    hasValidPermanentId,
    generateMatchSearchKey,
    isFeaturedMatch,
    getMatchCategory
};