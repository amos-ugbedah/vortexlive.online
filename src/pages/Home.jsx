import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'; 
import { Zap, Users, RefreshCw, Volume2, Download, Shield, ExternalLink, Gift, BrainCircuit, Trophy, X, ChevronRight } from 'lucide-react';
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
  const [showStickyAd, setShowStickyAd] = useState(true);
  
  const navigate = useNavigate();
  const prevScores = useRef({});
  const goalSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2042/2042-preview.mp3'); 

  const liveStatuses = ['1H', '2H', 'HT', 'LIVE', 'ET', 'BT', 'P'];

  const aiPicks = [
    { match: "Man City vs Brighton", tip: "Home Win", odds: "1.25", conf: "98%" },
    { match: "Parma vs Inter Milan", tip: "Away Win", odds: "1.62", conf: "94%" },
    { match: "Napoli vs Verona", tip: "Over 1.5", odds: "1.30", conf: "88%" }
  ];

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const playGoalAlert = useCallback(() => {
    if (soundEnabled) goalSound.play().catch(() => {});
  }, [soundEnabled]);

  const handleAdminGate = () => {
    const pass = prompt("Enter Access Key:");
    if (pass === "vortex_admin_2026") navigate('/admin');
  };

  // Helper to format timestamp to 24h time (HH:mm)
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  useEffect(() => {
    // We order by timestamp ascending so earliest games come first
    const q = query(collection(db, 'matches'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const matchesData = snapshot.docs
        .map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          displayTime: formatTime(doc.data().timestamp) // Pre-formatting time for the UI
        }))
        .filter(m => m.id !== 'template_id');
      
      matchesData.forEach(match => {
        const currentTotal = (match.homeScore || 0) + (match.awayScore || 0);
        const status = match.status?.toUpperCase();
        if (prevScores.current[match.id] !== undefined && currentTotal > prevScores.current[match.id]) {
          if (liveStatuses.includes(status)) playGoalAlert();
        }
        prevScores.current[match.id] = currentTotal;
      });

      // Secondary Sort: Keep Live games at the absolute top, then sort by timestamp
      matchesData.sort((a, b) => {
        const isALive = liveStatuses.includes(a.status?.toUpperCase());
        const isBLive = liveStatuses.includes(b.status?.toUpperCase());

        if (isALive && !isBLive) return -1;
        if (!isALive && isBLive) return 1;
        
        // If both are live or both are upcoming, sort by time (earliest first)
        return (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0);
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
    <div className="flex flex-col w-full min-h-screen bg-[#050505]">
      
      {/* HEADER SECTION */}
      <header className="w-full px-6 py-6 border-b border-white/5">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl italic font-black tracking-tighter text-white uppercase md:text-4xl">
              VORTEX <span className="text-red-600">LIVE</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{viewers.toLocaleString()} Fans Online</span>
            </div>
          </div>
          
          <div className="flex items-center w-full gap-4 md:w-auto">
            <div className="flex-1 md:w-80">
                <SearchBar value={searchTerm} onChange={setSearchTerm} />
            </div>
            <button onClick={() => setSoundEnabled(!soundEnabled)}
                className={`flex items-center justify-center p-4 border rounded-2xl transition-all ${soundEnabled ? 'bg-green-600/10 border-green-600/30 text-green-500' : 'bg-white/5 border-white/10 text-white/30'}`}>
                <Volume2 size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex flex-col w-full gap-4 p-4 lg:flex-row">
        
        {/* LEFT SIDEBAR: AI BOT */}
        <aside className="w-full lg:w-[260px] order-2 lg:order-1 flex-shrink-0">
          <div className="sticky space-y-4 top-6">
            <section className="p-6 border bg-indigo-600/5 border-indigo-500/20 rounded-[2.5rem]">
              <div className="flex items-center gap-2 mb-6">
                <BrainCircuit className="text-indigo-500" size={20} />
                <h2 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Vortex AI Bot</h2>
              </div>
              <div className="space-y-4">
                {aiPicks.map((pick, i) => (
                  <div key={i} className="pb-4 border-b border-white/5 last:border-0 last:pb-0">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase mb-1">{pick.match}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-white uppercase">{pick.tip}</span>
                      <span className="text-[11px] font-black text-indigo-500">{pick.odds}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </aside>

        {/* CENTER CONTENT */}
        <div className="flex-1 order-1 w-full lg:order-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-40">
              <RefreshCw className="w-10 h-10 mb-4 text-red-600 animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Syncing Feed...</p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* LIVE SECTION */}
              {groupMatches.live.length > 0 && (
                <section>
                  <h2 className="flex items-center gap-3 px-2 mb-6 text-xl italic font-black tracking-tighter text-white uppercase">
                    <span className="w-1.5 h-6 bg-red-600 rounded-full animate-pulse"></span> LIVE NOW
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {groupMatches.live.map(m => <MatchCard key={m.id} match={m} />)}
                  </div>
                </section>
              )}

              {/* SCHEDULE SECTION (Sorted Earliest to Latest) */}
              <section className="pb-20">
                <h2 className="flex items-center gap-3 px-2 mb-6 text-xl italic font-black tracking-tighter text-white uppercase">
                  <span className="w-1.5 h-6 rounded-full bg-zinc-700"></span> UPCOMING BROADCASTS
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {groupMatches.upcoming.map(m => <MatchCard key={m.id} match={m} />)}
                </div>
                {groupMatches.live.length === 0 && groupMatches.upcoming.length === 0 && (
                  <EmptyState searchTerm={searchTerm} onClearSearch={() => setSearchTerm('')} />
                )}
              </section>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR: BANNERS */}
        <aside className="w-full lg:w-[300px] order-3 lg:order-3 flex-shrink-0">
          <div className="sticky pb-10 space-y-4 top-6">
            <div className="relative overflow-hidden border p-8 bg-emerald-600/10 border-emerald-500/20 rounded-[2.5rem] min-h-[350px] flex flex-col justify-between">
              <div className="relative z-10">
                <Trophy className="mb-4 text-emerald-500" size={24}/>
                <h3 className="mb-2 text-2xl italic font-black leading-tight text-white uppercase">500% BONUS</h3>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-relaxed">Boost your wallet instantly.</p>
              </div>
              <div className="relative z-10">
                <div className="p-4 mb-4 text-center border bg-black/60 rounded-3xl border-white/5 backdrop-blur-md">
                  <p className="text-[9px] font-black text-zinc-500 uppercase mb-1">PROMO CODE</p>
                  <p className="text-xl font-black tracking-widest text-white uppercase">VORTEXLIVE</p>
                </div>
                <a href="https://1win.ng/?p=a6lf" target="_blank" rel="noreferrer" 
                   className="flex items-center justify-center w-full gap-2 py-5 text-xs font-black text-white uppercase transition-all bg-emerald-600 rounded-2xl hover:bg-emerald-500">
                  Claim Bonus <ExternalLink size={14} />
                </a>
              </div>
            </div>

            <a href="https://1xbet.ng/en?tag=d_5098529m_97c_" target="_blank" rel="noreferrer" className="flex items-center justify-between p-6 transition-all border bg-blue-600/5 border-blue-500/10 rounded-3xl group hover:border-blue-500/40">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-2xl"><Zap size={20} className="text-white"/></div>
                <div>
                  <p className="text-xs font-black text-white uppercase">1XBET PROMO</p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Click to Claim 300%</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-blue-500 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </aside>
      </main>

      {/* FOOTER */}
      <footer className="w-full flex flex-col items-center justify-center py-20 border-t border-white/5 bg-[#080808]">
        <button onClick={handleAdminGate} className="flex items-center gap-2 text-[9px] font-black text-zinc-700 uppercase tracking-[0.6em] hover:text-red-600 transition-colors">
          <Shield size={12} /> SECURE PORTAL
        </button>
        <p className="text-[8px] text-zinc-900 mt-4 uppercase font-black tracking-widest italic opacity-50">Vortex Broadcast Group © 2026</p>
      </footer>

      {/* MOBILE STICKY PROMO */}
      {showStickyAd && (
        <div className="fixed bottom-4 left-4 right-4 z-[100] lg:hidden animate-in slide-in-from-bottom-10 duration-700">
          <div className="relative overflow-hidden bg-gradient-to-r from-red-600 to-red-800 p-5 rounded-[2.5rem] shadow-2xl border border-white/10 flex items-center justify-between">
            <button onClick={() => setShowStickyAd(false)} className="absolute top-2 right-4 text-white/30"><X size={16}/></button>
            <div className="flex items-center gap-3">
                <div className="p-3 bg-white/10 rounded-2xl"><Trophy size={20} className="text-white"/></div>
                <div>
                  <h4 className="text-[10px] font-black text-white uppercase italic">1WIN BONUS</h4>
                  <p className="text-[9px] text-red-100 font-bold uppercase">CODE: <span className="px-1 text-red-700 bg-white rounded">VORTEXLIVE</span></p>
                </div>
            </div>
            <a href="https://1win.ng/?p=a6lf" className="bg-white text-red-700 px-5 py-3 rounded-2xl text-[10px] font-black uppercase whitespace-nowrap">Claim</a>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;