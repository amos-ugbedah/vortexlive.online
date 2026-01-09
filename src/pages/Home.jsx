/* eslint-disable */
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore'; 
import { Volume2, Shield, ExternalLink, BrainCircuit, Trophy, RefreshCw, Radio, LayoutGrid, Trees } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import MatchCard from '../components/MatchCard';
import TelegramTicker from '../components/TelegramTicker';

const Home = () => {
  const [matches, setMatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [viewers] = useState(Math.floor(Math.random() * (4800 - 3200 + 1) + 3200));
  const [soundEnabled, setSoundEnabled] = useState(false);
  
  const navigate = useNavigate();
  const prevScores = useRef({});
  const goalSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2042/2042-preview.mp3'); 

  const liveStatuses = ['1H', '2H', 'HT', 'LIVE', 'ET', 'BT', 'P', 'IN_PLAY'];

  const playGoalAlert = useCallback(() => {
    if (soundEnabled) goalSound.play().catch(() => {});
  }, [soundEnabled]);

  const handleAdminGate = () => {
    const pass = prompt("Access Level 4 Required:");
    if (pass === "vortex_admin_2026") navigate('/admin');
  };

  useEffect(() => {
    const q = query(collection(db, 'matches'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.forEach(match => {
        const currentTotal = (match.home?.score || 0) + (match.away?.score || 0);
        if (prevScores.current[match.id] !== undefined && currentTotal > prevScores.current[match.id]) {
          if (liveStatuses.includes(match.status?.toUpperCase())) playGoalAlert();
        }
        prevScores.current[match.id] = currentTotal;
      });
      setMatches(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [playGoalAlert]);

  const categorized = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const filtered = matches.filter(m => 
      `${m.home?.name} ${m.away?.name} ${m.league}`.toLowerCase().includes(term)
    );

    return {
      live: filtered.filter(m => liveStatuses.includes(m.status?.toUpperCase())),
      upcoming: filtered.filter(m => ['NS', 'TBD', 'SCHEDULED'].includes(m.status?.toUpperCase())),
      finished: filtered.filter(m => ['FT', 'AET', 'PEN'].includes(m.status?.toUpperCase()))
    };
  }, [matches, searchTerm]);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505]">
      <div className="w-16 h-16 mb-8 border-[3px] border-red-600 rounded-full border-t-transparent animate-spin" />
      <p className="text-xs font-black uppercase tracking-[0.6em] text-white/10 animate-pulse">Initializing Streams</p>
    </div>
  );

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#050505] text-white overflow-x-hidden">
      
      {/* HEADER: EDGE-TO-EDGE */}
      <header className="sticky top-0 z-[60] w-full px-6 py-5 border-b bg-black/95 backdrop-blur-2xl border-white/5">
        <div className="flex flex-col items-start justify-between w-full gap-6 lg:flex-row lg:items-center">
          <div className="flex items-center gap-6">
            <div className="relative">
               <div className="p-3 bg-red-600 rounded-2xl shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                 <Radio size={24} className="text-white animate-pulse" />
               </div>
            </div>
            <div>
               <h1 className="text-3xl italic font-black leading-none tracking-tighter uppercase md:text-4xl">
                 VORTEX<span className="text-red-600">PRO</span>
               </h1>
               <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-1">
                 {viewers.toLocaleString()} Live Streamers
               </p>
            </div>
          </div>
          
          <div className="flex items-center w-full gap-4 lg:w-auto">
            <div className="flex-1 lg:w-[600px]"><SearchBar value={searchTerm} onChange={setSearchTerm} /></div>
            <button onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-4 rounded-2xl transition-all border ${soundEnabled ? 'bg-red-600 border-red-500 shadow-lg shadow-red-600/30' : 'bg-white/5 border-white/10 text-white/20 hover:border-white/20'}`}>
                <Volume2 size={24} className={soundEnabled ? 'animate-bounce' : ''} />
            </button>
          </div>
        </div>
      </header>

      {/* TICKER */}
      <div className="w-full px-6 mt-4">
         <TelegramTicker />
      </div>

      <main className="flex flex-col w-full gap-6 p-4 md:p-6 lg:flex-row">
        
        {/* LEFT: AI PREDICTOR */}
        <aside className="hidden xl:block w-[300px] flex-shrink-0">
          <div className="sticky space-y-6 top-32">
            <div className="relative overflow-hidden p-6 border bg-emerald-600/[0.02] border-emerald-500/10 rounded-[2rem]">
              <div className="absolute p-4 -top-4 -right-4 opacity-5 rotate-12 text-emerald-500"><BrainCircuit size={80} /></div>
              <h2 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 VORTEX INTELLIGENCE
              </h2>
              <div className="space-y-4">
                {categorized.live.length > 0 ? categorized.live.slice(0, 4).map((m, i) => (
                  <div key={i} className="group">
                    <p className="text-[9px] font-bold text-zinc-600 uppercase mb-1 truncate">{m.home.name} vs {m.away.name}</p>
                    <div className="flex items-center justify-between p-3 transition-all border bg-white/5 rounded-xl border-white/5 group-hover:border-emerald-500/30">
                      <span className="text-[10px] font-black text-white uppercase">{m.aiPick || 'OVER 1.5'}</span>
                      <span className="text-[10px] font-black text-emerald-500">PRO</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-[10px] text-zinc-600 italic uppercase">Awaiting Live Signals</p>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER: 3-2-1 GRID */}
        <div className="flex-1">
          {matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="relative mb-10 group">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-emerald-500/20 blur-[120px] animate-pulse" />
                 <Trees size={150} className="relative z-10 text-emerald-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.8)] animate-bounce duration-[4000ms]" />
              </div>
              <h2 className="mb-4 text-4xl italic font-black tracking-tighter uppercase md:text-6xl">
                Pitch is <span className="underline text-emerald-400 decoration-red-600 underline-offset-8">Empty</span> Chief!
              </h2>
              <p className="max-w-md mx-auto text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-500 mb-10 leading-loose">
                Orbital satellites are currently synchronizing with Elite European and African data streams. The pitch is undergoing maintenance to ensure 0.0ms latency for the next kickoff. Please remain on standby, Chief.
              </p>
              <button onClick={() => window.location.reload()} className="flex items-center gap-4 px-10 py-5 text-black transition-all bg-white rounded-2xl hover:bg-emerald-500 hover:text-white group">
                <RefreshCw size={18} className="font-bold transition-transform duration-700 group-hover:rotate-180" />
                <span className="text-xs font-black tracking-widest uppercase">Re-Sync Arena</span>
              </button>
            </div>
          ) : (
            <div className="space-y-16">
              <section>
                <div className="flex items-center gap-4 mb-10">
                  <h2 className="text-3xl italic font-black tracking-tighter uppercase whitespace-nowrap"><span className="text-red-600">Live</span> Arena</h2>
                  <div className="h-[1px] flex-1 bg-white/10" />
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {categorized.live.map(m => <MatchCard key={m.id} match={m} />)}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-4 mb-10">
                  <h2 className="text-3xl italic font-black tracking-tighter uppercase whitespace-nowrap opacity-40">Upcoming Feeds</h2>
                  <div className="h-[1px] flex-1 bg-white/5" />
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {categorized.upcoming.map(m => <MatchCard key={m.id} match={m} />)}
                </div>
              </section>
            </div>
          )}
        </div>

        {/* RIGHT: PROMO */}
        <aside className="w-full lg:w-[320px] xl:w-[380px] flex-shrink-0">
          <div className="sticky pb-10 space-y-6 top-32">
            <div className="relative overflow-hidden p-8 bg-gradient-to-br from-emerald-600/30 to-zinc-950 border border-emerald-500/20 rounded-[3rem] shadow-2xl">
              <Trophy className="mb-6 text-emerald-400 animate-pulse" size={50}/>
              <h3 className="mb-4 text-5xl italic font-black leading-[0.9] tracking-tighter uppercase">500%<br/><span className="text-emerald-500">BOOSTER</span></h3>
              <div className="p-6 mb-8 text-center border bg-black/40 rounded-3xl border-white/5">
                <p className="text-[9px] font-black text-zinc-600 uppercase mb-1 tracking-widest">Bonus Code</p>
                <p className="text-3xl font-black text-white">VORTEX</p>
              </div>
              <a href="https://1win.ng/?p=a6lf" target="_blank" rel="noreferrer" 
                 className="flex items-center justify-center w-full gap-4 py-6 text-sm font-black text-white uppercase transition-all bg-emerald-600 rounded-2xl hover:bg-emerald-500">
                ACTIVATE NOW <ExternalLink size={20} />
              </a>
            </div>
          </div>
        </aside>
      </main>

      <footer className="w-full flex flex-col items-center justify-center py-20 border-t border-white/5 bg-[#030303] mt-auto">
        <button onClick={handleAdminGate} className="group flex items-center gap-4 text-[11px] font-black text-zinc-800 uppercase tracking-[0.8em] hover:text-red-600 transition-all">
          <Shield size={16} /> VORTEX_SECURE_ACCESS
        </button>
      </footer>
    </div>
  );
};

export default Home;