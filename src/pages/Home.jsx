import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore'; 
import { ExternalLink, Zap, Bell, X, Users, RefreshCw } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import MatchCard from '../components/MatchCard';
import EmptyState from '../components/EmptyState';
import AdManager from '../components/AdManager';

const parseTime = (timeStr) => {
  if (!timeStr || ['TBD', '--', 'NS', 'LIVE', 'HT', 'FT'].includes(timeStr.toUpperCase())) {
    return { totalMinutes: 9999 };
  }
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
  } catch (e) { 
    return { totalMinutes: 9999 }; 
  }
};

const SubscriptionModal = ({ onClose }) => (
  <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
    <div className="relative w-full max-w-md p-8 overflow-hidden text-center border shadow-2xl bg-zinc-950 border-white/10 rounded-3xl">
      <button onClick={onClose} className="absolute transition-colors top-4 right-4 text-white/20 hover:text-white">
        <X size={24} />
      </button>
      <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 text-red-500 rounded-full bg-red-600/20 animate-pulse">
        <Bell size={40} />
      </div>
      <h2 className="mb-2 text-3xl italic font-black tracking-tighter text-white uppercase">VORTEX <span className="text-red-600">VIP</span></h2>
      <p className="mb-8 text-sm font-medium leading-relaxed text-gray-400">
        Don't miss a single goal! Get instant **Private Telegram Alerts** for goals, red cards, and match kick-offs.
      </p>
      <a 
        href="https://t.me/LivefootballVortex" 
        target="_blank" 
        rel="noopener noreferrer"
        onClick={onClose}
        className="block w-full py-5 font-black text-white transition-all transform bg-red-600 shadow-lg rounded-2xl hover:bg-red-700 active:scale-95 shadow-red-600/20"
      >
        ACTIVATE FREE ALERTS
      </a>
    </div>
  </div>
);

const Home = () => {
  const [matches, setMatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showSubModal, setShowSubModal] = useState(false);
  const [viewers] = useState(Math.floor(Math.random() * (4800 - 3200 + 1) + 3200));
  const [activeStream, setActiveStream] = useState(null);

  const SMART_LINK = "https://www.effectivegatecpm.com/m0hhxyhsj?key=2dc5d50b0220cf3243f77241e3c3114d";

  useEffect(() => {
    const timer = setTimeout(() => setShowSubModal(true), 15000);
    return () => clearTimeout(timer);
  }, []);

  // REAL-TIME FETCHING (Optimized with a limit of 50 matches to save quota)
  useEffect(() => {
    const q = query(
        collection(db, 'matches'), 
        orderBy('timestamp', 'desc'),
        limit(50) 
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const matchesData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(m => m.id !== 'template_id');

      // Sorting Logic
      matchesData.sort((a, b) => {
        const getPriority = (s) => {
          const status = s?.toUpperCase();
          if (['1H', '2H', 'HT', 'LIVE'].includes(status)) return 1;
          if (status === 'FT') return 3;
          return 2;
        };
        const priorityA = getPriority(a.status);
        const priorityB = getPriority(b.status);
        if (priorityA !== priorityB) return priorityA - priorityB;
        return parseTime(a.time || a.kickOffTime).totalMinutes - parseTime(b.time || b.kickOffTime).totalMinutes;
      });

      setMatches(matchesData);
      setIsLoading(false);
    }, (error) => {
      console.error("Firebase Sync Error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleWatchMatch = useCallback((url) => {
    if (url && url !== '#') {
      setActiveStream(url);
    }
  }, []);

  const groupMatches = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const filtered = matches.filter(m => 
      `${m.homeTeam?.name} ${m.awayTeam?.name} ${m.league}`.toLowerCase().includes(term)
    );

    return {
      live: filtered.filter(m => ['1H', '2H', 'HT', 'LIVE'].includes(m.status?.toUpperCase())),
      upcoming: filtered.filter(m => !['1H', '2H', 'HT', 'LIVE', 'FT'].includes(m.status?.toUpperCase())),
    };
  }, [matches, searchTerm]);

  return (
    <div className="min-h-screen p-4 mx-auto font-sans text-white bg-[#070708] md:p-8 max-w-7xl">
      {showSubModal && <SubscriptionModal onClose={() => setShowSubModal(false)} />}
      
      {/* Passing activeStream and a function to clear it */}
      <AdManager activeStream={activeStream} onClose={() => setActiveStream(null)} />

      <div className="flex flex-col justify-between gap-4 mb-8 md:flex-row md:items-center">
        <div>
           <h1 className="text-3xl italic font-black tracking-tighter text-white uppercase">VORTEX <span className="text-red-600">LIVE</span></h1>
           <div className="flex items-center gap-2 mt-1">
              <Users size={12} className="text-green-500" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{viewers.toLocaleString()} Fans Online Now</span>
           </div>
        </div>

        <button onClick={() => setShowSubModal(true)} className="flex items-center gap-2 px-4 py-2 bg-red-600/10 border border-red-600/30 rounded-xl text-red-500 text-[10px] font-black uppercase">
            <Bell size={14} /> Get Goal Alerts
        </button>
      </div>

      <SearchBar value={searchTerm} onChange={setSearchTerm} />

      <a href={SMART_LINK} target="_blank" rel="noreferrer" className="relative block w-full p-1 mb-8 overflow-hidden transition-all border group rounded-3xl border-white/5 bg-white/5 hover:bg-white/[0.08]">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-red-600 rounded-xl"><Zap size={20} className="text-white" /></div>
            <div>
              <h3 className="text-sm italic font-black text-white uppercase">Premium Ultra-HD Engine</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Global CDN • 0ms Latency</p>
            </div>
          </div>
          <ExternalLink size={18} className="text-white/20 group-hover:text-red-600" />
        </div>
      </a>

      {isLoading ? (
        <div className="py-32 text-center animate-pulse">
          <RefreshCw className="w-10 h-10 mx-auto mb-6 text-red-600 animate-spin" />
          <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/20">Syncing Vortex Servers...</p>
        </div>
      ) : (
        <>
          {groupMatches.live.length > 0 && (
            <section className="mb-12">
              <h2 className="flex items-center gap-3 mb-6 text-2xl italic font-black text-white uppercase">
                <span className="w-1.5 h-8 bg-red-600 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.5)]"></span> LIVE NOW
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {groupMatches.live.map(m => (
                  <MatchCard key={m.id} match={m} handleStreamClick={handleWatchMatch} />
                ))}
              </div>
            </section>
          )}

          <section className="mb-12">
            <h2 className="flex items-center gap-3 mb-6 text-2xl italic font-black text-white uppercase">
              <span className="w-1.5 h-8 bg-zinc-800 rounded-full"></span> UPCOMING
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {groupMatches.upcoming.map(m => (
                <MatchCard key={m.id} match={m} handleStreamClick={handleWatchMatch} />
              ))}
            </div>
          </section>

          {groupMatches.live.length === 0 && groupMatches.upcoming.length === 0 && (
            <EmptyState searchTerm={searchTerm} onClearSearch={() => setSearchTerm('')} />
          )}
        </>
      )}
    </div>
  );
};

export default Home;