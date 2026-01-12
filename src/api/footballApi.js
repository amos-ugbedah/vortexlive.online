import axios from 'axios';

// --- YOUR CONSOLIDATED KEYS ---
const API_KEYS = [
    "c07116b7224340b30c1a2f4cbbf4abe7", // API-Sports
    "0e3ac987340e582eb85a41758dc7c33a5dfcec72f940e836d960fe68a28fe904", // AllSports/APIFootball
    "3671908177msh066f984698c094ap1c8360jsndb2bc44e1c65", // RapidAPI
    "700ca9a1ed18bf1b842e0210e9ae73ce",
    "2f977aee380c7590bcf18759dfc18aacd0827b65c4d5df6092ecad5f29aebc33",
    "13026e250b0dc9c788acceb0c5ace63c",
    "36d031751e132991fd998a3f0f5088b7d1f2446ca9b44351b2a90fde76581478",
    "08a2395d18de848b4d3542d71234a61212aa43a3027ba11d7d3de3682c6159aa",
    "3d8bb3c294a4b486d95057721a00d13ed22eacc05e57ad357bc8b3872d8d68a8",
    "3d8bb3c294a4b486d95057721a00d13ed22eacc05e57ad357bc8b3872d8d68a8"
];

const getToday = () => new Date().toISOString().split('T')[0];

export const getLiveScores = async () => {
    let lastError = "";

    for (let i = 0; i < API_KEYS.length; i++) {
        const key = API_KEYS[i].trim();
        
        try {
            // STRATEGY 1: RAPID API (Detects by 'msh')
            if (key.includes('msh')) {
                const res = await axios.get('https://api-football-v1.p.rapidapi.com/v3/fixtures', {
                    params: { live: 'all' },
                    headers: { 'x-rapidapi-key': key, 'x-rapidapi-host': 'api-football-v1.p.rapidapi.com' },
                    timeout: 5000
                });
                if (res.data.response?.length > 0) return { source: 'rapid-api', data: res.data.response };
            }

            // STRATEGY 2: API-SPORTS (Detects by length 32)
            else if (key.length === 32) {
                const res = await axios.get('https://v3.football.api-sports.io/fixtures', {
                    params: { live: 'all' },
                    headers: { 'x-apisports-key': key },
                    timeout: 5000
                });
                // Check if API returned an error in the body (like "Suspended")
                if (res.data.errors && Object.keys(res.data.errors).length > 0) {
                    console.warn(`Key ${i+1} (API-Sports) error:`, res.data.errors);
                    continue;
                }
                if (res.data.response?.length > 0) return { source: 'api-sports', data: res.data.response };
            }

            // STRATEGY 3: ALLSPORTS / APIFOOTBALL (Detects by length 64)
            else if (key.length === 64) {
                // Try AllSportsAPI structure
                const res = await axios.get('https://allsportsapi.com/api/football/', {
                    params: { met: 'Livescore', APIkey: key },
                    timeout: 5000
                });
                if (res.data.result?.length > 0) return { source: 'allsportsapi', data: res.data.result };
            }

        } catch (err) {
            console.error(`Vortex Key ${i+1} failed: ${err.message}`);
            lastError = err.message;
        }
    }

    return { source: 'none', data: [], error: lastError };
};