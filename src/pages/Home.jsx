import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'; 
import { Zap, Users, RefreshCw, Volume2, Download, Shield, ExternalLink, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import MatchCard from '../components/MatchCard';
import EmptyState from '../components/EmptyState';

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

  const liveStatuses = ['1H', '2H', 'HT', 'LIVE', 'ET', 'BT', 'P'];

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
    const q = query(collection(db, 'matches'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const matchesData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(m => m.id !== 'template_id');
      
      matchesData.forEach(match => {
        const currentTotal = (match.homeScore || 0) + (match.awayScore || 0);
        const status = match.status?.toUpperCase();
        if (prevScores.current[match.id] !== undefined && currentTotal > prevScores.current[match.id]) {
          if (liveStatuses.includes(status)) playGoalAlert();
        }
        prevScores.current[match.id] = currentTotal;
      });

      matchesData.sort((a, b) => {
        const getPriority = (s) => {
          const status = s?.toUpperCase();
          if (liveStatuses.includes(status)) return 1;
          if (status === 'FT' || status === 'AET' || status === 'PEN') return 3;
          return 2;
        };
        if (getPriority(a.status) !== getPriority(b.status)) return getPriority(a.status) - getPriority(b.status);
        return 0;
      });

      setMatches(matchesData);
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
      live: filtered.filter(m => liveStatuses.includes(m.status?.toUpperCase())),
      upcoming: filtered.filter(m => !liveStatuses.includes(m.status?.toUpperCase()) && !['FT', 'AET', 'PEN'].includes(m.status?.toUpperCase()))
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

      {/* 1WIN PARTNER BANNER */}
      <a href="https://1win.ng/?p=a6lf" target="_blank" rel="noreferrer" className="block p-4 mx-2 mb-8 border bg-emerald-600/10 border-emerald-500/20 rounded-3xl group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500 rounded-2xl"><Gift className="text-white" size={24}/></div>
            <div>
              <h3 className="text-xs italic font-black text-white uppercase">500% Deposit Bonus</h3>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Code: <span className="px-2 text-white rounded bg-emerald-600">VORTEXLIVE</span></p>
            </div>
          </div>
          <ExternalLink className="transition-transform text-emerald-500 group-hover:translate-x-1" size={20} />
        </div>
      </a>

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
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <RefreshCw className="w-8 h-8 mb-4 text-red-600 animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Syncing...</p>
        </div>
      ) : (
        <div className="flex-1 space-y-10">
          {groupMatches.live.length > 0 && (
            <section>
              <h2 className="flex items-center gap-3 mb-5 text-lg italic font-black tracking-tighter text-white uppercase">
                <span className="w-1 h-5 bg-red-600 rounded-full"></span> LIVE NOW
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {groupMatches.live.map(m => <MatchCard key={m.id} match={m} />)}
              </div>
            </section>
          )}

          <section className="pb-20">
            <h2 className="flex items-center gap-3 mb-5 text-lg italic font-black tracking-tighter text-white uppercase">
              <span className="w-1 h-5 rounded-full bg-zinc-700"></span> SCHEDULE
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {groupMatches.upcoming.map(m => <MatchCard key={m.id} match={m} />)}
            </div>
          </section>
        </div>
      )}

      <footer className="flex flex-col items-center justify-center py-10 mt-auto border-t border-white/5 opacity-20 hover:opacity-100">
        <button onClick={handleAdminGate} className="flex items-center gap-2 text-[8px] font-black text-zinc-500 uppercase tracking-[0.4em] hover:text-red-600">
          <Shield size={10} /> Secure Portal Access
        </button>
        <p className="text-[7px] text-zinc-700 mt-2 uppercase font-bold">Vortex Broadcast Group © 2026</p>
      </footer>
    </div>
  );
};

export default Home;