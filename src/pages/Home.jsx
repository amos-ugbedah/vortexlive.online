import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'; 
import { Zap, Users, RefreshCw, Volume2, Download, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import MatchCard from '../components/MatchCard';
import EmptyState from '../components/EmptyState';

const parseTime = (timeStr) => {
  if (!timeStr || ['TBD', '--', 'NS', 'LIVE', 'HT', 'FT'].includes(timeStr.toUpperCase())) return { totalMinutes: 9999 };
  try {
    let time = timeStr.toString().toUpperCase().trim();
    let isPM = time.includes('PM');
    time = time.replace(/AM|PM/, '').trim();
    const parts = time.split(':');
    let hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    if (isPM && hours < 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    return { totalMinutes: hours * 60 + minutes };
  } catch (e) { return { totalMinutes: 9999 }; }
};

const Home = () => {
  const [matches, setMatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [viewers] = useState(Math.floor(Math.random() * (4800 - 3200 + 1) + 3200));
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  
  const navigate = useNavigate();
  const prevScores = useRef({});
  const goalSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2042/2042-preview.mp3'); 

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const playGoalAlert = useCallback(() => {
    if (soundEnabled) goalSound.play().catch(() => {});
  }, [soundEnabled]);

  const handleAdminGate = () => {
    const pass = prompt("Enter Access Key:");
    if (pass === "vortex_admin_2026") {
      navigate('/admin');
    }
  };

  useEffect(() => {
    // REMOVED LIMIT - This fetches everything in the collection
    const q = query(collection(db, 'matches'), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const matchesData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(m => m.id !== 'template_id');
      
      matchesData.forEach(match => {
        const currentTotal = (match.homeScore || 0) + (match.awayScore || 0);
        if (prevScores.current[match.id] !== undefined && currentTotal > prevScores.current[match.id]) {
          if (['1H', '2H', 'HT', 'LIVE'].includes(match.status?.toUpperCase())) playGoalAlert();
        }
        prevScores.current[match.id] = currentTotal;
      });

      // Sort: Live matches first, then by kickoff time
      matchesData.sort((a, b) => {
        const getPriority = (s) => {
          const status = s?.toUpperCase();
          if (['1H', '2H', 'HT', 'LIVE'].includes(status)) return 1;
          if (status === 'FT') return 3;
          return 2;
        };
        if (getPriority(a.status) !== getPriority(b.status)) return getPriority(a.status) - getPriority(b.status);
        return parseTime(a.time || a.kickOffTime).totalMinutes - parseTime(b.time || b.kickOffTime).totalMinutes;
      });

      setMatches(matchesData);
      setIsLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [playGoalAlert]);

  const groupMatches = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const filtered = matches.filter(m => 
      `${m.homeTeam?.name} ${m.awayTeam?.name} ${m.league}`.toLowerCase().includes(term)
    );
    return {
      live: filtered.filter(m => ['1H', '2H', 'HT', 'LIVE'].includes(m.status?.toUpperCase())),
      upcoming: filtered.filter(m => !['1H', '2H', 'HT', 'LIVE', 'FT'].includes(m.status?.toUpperCase())),
      finished: filtered.filter(m => m.status?.toUpperCase() === 'FT')
    };
  }, [matches, searchTerm]);

  return (
    <div className="flex flex-col w-full min-h-screen">
      {deferredPrompt && (
        <div className="flex items-center justify-between p-4 mx-2 mb-6 shadow-xl bg-gradient-to-r from-red-600 to-indigo-700 rounded-3xl animate-bounce">
          <div className="flex items-center gap-3">
            <Download size={20} className="text-white" />
            <p className="text-[10px] font-black uppercase tracking-tight text-white">Install App for HD</p>
          </div>
          <button onClick={handleInstall} className="bg-white text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase">Install</button>
        </div>
      )}

      <div className="flex flex-col items-start justify-between gap-4 mb-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl italic font-black tracking-tighter text-white uppercase md:text-3xl">VORTEX <span className="text-red-600">LIVE</span></h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{viewers.toLocaleString()} Fans Connected</span>
          </div>
        </div>
        <button onClick={() => setSoundEnabled(!soundEnabled)}
          className={`w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 border rounded-2xl text-[10px] font-black uppercase transition-all ${soundEnabled ? 'bg-green-600/10 border-green-600/30 text-green-500' : 'bg-white/5 border-white/10 text-white/30'}`}>
          <Volume2 size={14} /> {soundEnabled ? 'Alerts: ON' : 'Muted'}
        </button>
      </div>

      <div className="mb-8">
        <SearchBar value={searchTerm} onChange={setSearchTerm} />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center flex-1 py-20 text-center">
          <RefreshCw className="w-8 h-8 mb-4 text-red-600 animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Syncing...</p>
        </div>
      ) : (
        <div className="flex-1 space-y-10">
          {groupMatches.live.length > 0 && (
            <section>
              <h2 className="flex items-center gap-3 mb-5 text-lg italic font-black tracking-tighter text-white uppercase">
                <span className="w-1 h-5 bg-red-600 rounded-full"></span> LIVE
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {groupMatches.live.map(m => <MatchCard key={m.id} match={m} />)}
              </div>
            </section>
          )}

          <section className="pb-20">
            <h2 className="flex items-center gap-3 mb-5 text-lg italic font-black tracking-tighter text-white uppercase">
              <span className="w-1 h-5 rounded-full bg-zinc-700"></span> UPCOMING
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {groupMatches.upcoming.map(m => <MatchCard key={m.id} match={m} />)}
            </div>
          </section>

          {groupMatches.live.length === 0 && groupMatches.upcoming.length === 0 && (
            <EmptyState searchTerm={searchTerm} onClearSearch={() => setSearchTerm('')} />
          )}
        </div>
      )}

      <footer className="flex flex-col items-center justify-center py-10 mt-auto transition-opacity border-t border-white/5 opacity-20 hover:opacity-100">
        <button 
          onClick={handleAdminGate}
          className="flex items-center gap-2 text-[8px] font-black text-zinc-500 uppercase tracking-[0.4em] hover:text-red-600 transition-colors"
        >
          <Shield size={10} /> Secure Portal Access
        </button>
        <p className="text-[7px] text-zinc-700 mt-2 uppercase font-bold">Vortex Broadcast Group © 2026</p>
      </footer>
    </div>
  );
};

export default Home;