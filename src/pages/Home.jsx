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

  // AI "Bot" Predictions (Simulated Expert Bot)
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
    <div className="flex flex-col w-full min-h-screen bg-[#050505] pb-24 lg:pb-0">
      {/* PWA INSTALL PROMPT */}
      {deferredPrompt && (
        <div className="flex items-center justify-between p-4 mx-2 mt-4 mb-6 shadow-xl bg-gradient-to-r from-red-600 to-indigo-700 rounded-3xl animate-bounce">
          <div className="flex items-center gap-3">
            <Download size={20} className="text-white" />
            <p className="text-[10px] font-black uppercase tracking-tight text-white">Install App for HD</p>
          </div>
          <button onClick={handleInstall} className="bg-white text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase">Install</button>
        </div>
      )}

      {/* HEADER SECTION */}
      <header className="px-4 pt-6 mb-6">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
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
      </header>

      {/* MAIN LAYOUT WITH SIDEBAR */}
      <main className="flex flex-col gap-6 px-4 lg:flex-row">
        
        {/* LEFT CONTENT: Matches & AI Picks */}
        <div className="flex-1">
          <div className="mb-8">
            <SearchBar value={searchTerm} onChange={setSearchTerm} />
          </div>

          {/* VORTEX AI EXPERT PICKS (The Bot Section) */}
          <section className="mb-10 p-5 border bg-indigo-600/5 border-indigo-500/20 rounded-[2.5rem]">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <BrainCircuit className="text-indigo-500" size={22} />
                <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">Vortex AI Predictions</h2>
              </div>
              <span className="text-[8px] font-black bg-indigo-600 px-2 py-1 rounded text-white uppercase animate-pulse">Live Analysis</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {aiPicks.map((pick, i) => (
                <div key={i} className="p-4 border bg-black/40 rounded-3xl border-white/5">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase truncate mb-1">{pick.match}</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[10px] font-black text-white uppercase">{pick.tip}</p>
                      <p className="text-[9px] font-bold text-indigo-500">Odds: {pick.odds}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[7px] text-zinc-600 font-black uppercase tracking-tighter">Prob.</p>
                      <p className="text-xs font-black leading-none text-emerald-500">{pick.conf}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <RefreshCw className="w-8 h-8 mb-4 text-red-600 animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Syncing Feed...</p>
            </div>
          ) : (
            <div className="space-y-10">
              {groupMatches.live.length > 0 && (
                <section>
                  <h2 className="flex items-center gap-3 mb-5 text-lg italic font-black tracking-tighter text-white uppercase">
                    <span className="w-1 h-5 bg-red-600 rounded-full"></span> LIVE NOW
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {groupMatches.live.map(m => <MatchCard key={m.id} match={m} />)}
                  </div>
                </section>
              )}

              <section className="pb-10">
                <h2 className="flex items-center gap-3 mb-5 text-lg italic font-black tracking-tighter text-white uppercase">
                  <span className="w-1 h-5 rounded-full bg-zinc-700"></span> SCHEDULE
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {groupMatches.upcoming.map(m => <MatchCard key={m.id} match={m} />)}
                </div>
              </section>

              {groupMatches.live.length === 0 && groupMatches.upcoming.length === 0 && (
                <EmptyState searchTerm={searchTerm} onClearSearch={() => setSearchTerm('')} />
              )}
            </div>
          )}
        </div>

        {/* RIGHT CONTENT: LONG PROFESSIONAL SIDEBAR */}
        <aside className="w-full lg:w-[320px] flex flex-col gap-4 mb-20 lg:mb-0">
          
          {/* 1WIN MAIN PROMO */}
          <div className="relative overflow-hidden border p-6 bg-emerald-600/10 border-emerald-500/20 rounded-[2.5rem] group min-h-[300px] flex flex-col justify-between">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Gift className="text-emerald-500" size={20}/>
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">Partner Offer</span>
              </div>
              <h3 className="mb-2 text-xl italic font-black leading-tight text-white uppercase">Unlock 500%<br/>Deposit Bonus</h3>
              <p className="text-[10px] text-zinc-400 font-medium">Use the official Vortex promo code to activate your bonus today on 1win.</p>
            </div>
            
            <div className="relative z-10 mt-6">
              <div className="p-4 mb-4 text-center border bg-black/40 rounded-2xl border-white/5">
                <p className="text-[8px] font-black text-zinc-500 uppercase mb-1">PROMO CODE</p>
                <p className="text-xl font-black tracking-widest text-white uppercase">VORTEXLIVE</p>
              </div>
              <a href="https://1win.ng/?p=a6lf" target="_blank" rel="noreferrer" 
                 className="flex items-center justify-center w-full gap-2 py-4 transition-all bg-emerald-600 rounded-2xl group-hover:bg-emerald-500">
                <span className="text-[10px] font-black text-white uppercase">Register & Play</span>
                <ExternalLink size={14} className="text-white" />
              </a>
            </div>
            {/* Design Element */}
            <div className="absolute w-32 h-32 rounded-full -bottom-10 -right-10 bg-emerald-500/10 blur-3xl"></div>
          </div>

          {/* 1XBET SUB PROMO */}
          <a href="https://1xbet.ng/en?tag=d_5098529m_97c_" target="_blank" rel="noreferrer" 
             className="flex items-center justify-between p-5 transition-all border bg-blue-600/5 border-blue-500/10 rounded-3xl hover:border-blue-500/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-xl"><Zap size={16} className="text-white"/></div>
              <div>
                <p className="text-[10px] font-black text-white uppercase">1XBET PROMO</p>
                <p className="text-[8px] text-zinc-500 font-bold uppercase">Click to Claim Bonus</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-blue-500" />
          </a>

          {/* STAKE SUB PROMO */}
          <a href="https://stake.com/?c=vortexlive" target="_blank" rel="noreferrer" 
             className="flex items-center justify-between p-5 transition-all border bg-zinc-900 border-white/5 rounded-3xl hover:border-zinc-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-800 rounded-xl"><Shield size={16} className="text-zinc-400"/></div>
              <div>
                <p className="text-[10px] font-black text-white uppercase">STAKE CASINO</p>
                <p className="text-[8px] text-zinc-500 font-bold uppercase">Code: VORTEXLIVE</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-zinc-600" />
          </a>
        </aside>
      </main>

      {/* FOOTER */}
      <footer className="flex flex-col items-center justify-center py-10 mt-auto border-t border-white/5 opacity-20 hover:opacity-100">
        <button onClick={handleAdminGate} className="flex items-center gap-2 text-[8px] font-black text-zinc-500 uppercase tracking-[0.4em] hover:text-red-600">
          <Shield size={10} /> Secure Portal Access
        </button>
        <p className="text-[7px] text-zinc-700 mt-2 uppercase font-bold">Vortex Broadcast Group © 2026</p>
      </footer>

      {/* STICKY IN-APP BANNER (The Real Estate) */}
      {showStickyAd && (
        <div className="fixed bottom-4 left-4 right-4 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-500 lg:hidden">
          <div className="relative overflow-hidden bg-gradient-to-r from-red-600 to-red-800 p-4 rounded-[2rem] shadow-2xl shadow-red-900/40 border border-white/10">
            <button onClick={() => setShowStickyAd(false)} className="absolute top-2 right-4 text-white/50 hover:text-white">
              <X size={16}/>
            </button>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-2xl">
                  <Trophy className="text-white" size={20} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-white uppercase italic">1WIN 500% BONUS</h4>
                  <p className="text-[8px] text-red-100 font-bold uppercase tracking-widest">Code: <span className="px-1 text-red-700 bg-white rounded">VORTEXLIVE</span></p>
                </div>
              </div>
              <a href="https://1win.ng/?p=a6lf" target="_blank" rel="noreferrer" 
                 className="bg-white text-red-700 px-4 py-2 rounded-xl text-[9px] font-black uppercase shadow-lg active:scale-95 transition-transform">
                Claim Now
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;