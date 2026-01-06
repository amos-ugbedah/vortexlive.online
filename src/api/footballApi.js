import axios from 'axios';

// --- YOUR TRIPLE KEYS ---
const KEY_API_SPORTS = '0131b99f8e87a724c92f8b455cc6781d'; 
const KEY_APIFootball_COM = '0e3ac987340e582eb85a41758dc7c33a5dfcec72f940e836d960fe68a28fe904';
const KEY_ALL_SPORTS = '0e3ac987340e582eb85a41758dc7c33a5dfcec72f940e836d960fe68a28fe904'; 

const getToday = () => new Date().toISOString().split('T')[0];

/**
 * THE SMART SWITCHER
 * Optimizations: Timeout handling and underscore error variables.
 */
export const getLiveScores = async () => {
    // 1. TRY API-SPORTS (Detailed Match Events)
    try {
        const res = await axios.get('https://v3.football.api-sports.io/fixtures', {
            params: { live: 'all' },
            headers: { 'x-apisports-key': KEY_API_SPORTS },
            timeout: 4000 // If it takes >4s, move to backup
        });
        if (res.data.response?.length > 0) {
            return { source: 'api-sports', data: res.data.response };
        }
    } catch (_error) { 
        console.warn("API-Sports slow/failed, jumping to AllSportsAPI..."); 
    }

    // 2. TRY ALLSPORTSAPI (High Frequency - 260/hr)
    try {
        const res = await axios.get('https://allsportsapi.com/api/football/', {
            params: {
                met: 'Livescore',
                APIkey: KEY_ALL_SPORTS
            },
            timeout: 4000
        });
        if (res.data.result?.length > 0) {
            return { source: 'allsportsapi', data: res.data.result };
        }
    } catch (_error) { 
        console.warn("AllSportsAPI slow/failed, jumping to APIFootball.com..."); 
    }

    // 3. TRY APIFOOTBALL.COM (Final Reliable Backup)
    try {
        const res = await axios.get('https://apiv2.apifootball.com/', {
            params: {
                action: 'get_events',
                match_live: '1',
                APIkey: KEY_APIFootball_COM,
                from: getToday(),
                to: getToday()
            },
            timeout: 5000
        });
        if (res.data && !res.data.error) {
            return { source: 'apifootball', data: res.data };
        }
    } catch (_error) { 
        console.error("CRITICAL: All APIs have failed."); 
    }

    return { source: 'none', data: [] };
};