import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { ExternalLink, Zap, Bell, X, Users } from 'lucide-react';
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
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
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
      <p className="mt-4 text-[9px] text-white/20 font-bold uppercase tracking-[0.3em]">Join the Vortex Elite</p>
    </div>
  </div>
);

const Home = () => {
  const [matches, setMatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showSubModal, setShowSubModal] = useState(false);
  const [viewers, setViewers] = useState(Math.floor(Math.random() * (4800 - 3200 + 1) + 3200));
  
  // These states connect to AdManager
  const [activeStream, setActiveStream] = useState(null);

  const SMART_LINK = "https://www.effectivegatecpm.com/m0hhxyhsj?key=2dc5d50b0220cf3243f77241e3c3114d";

  useEffect(() => {
    const timer = setTimeout(() => setShowSubModal(true), 15000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'fixtures'), (snapshot) => {
      const matchesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          home: data.home || 'TBD',
          away: data.away || 'TBD',
          league: data.league || 'Global Match',
          time: data.time || '--',
          status: data.status || 'NS',
          homeScore: data.homeScore || 0,
          awayScore: data.awayScore || 0,
          ...data
        };
      });

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
        return parseTime(a.time).totalMinutes - parseTime(b.time).totalMinutes;
      });

      setMatches(matchesData);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  // NEW: Handle Server 2 selection from MatchCard
  const handleWatchMatch = useCallback((matchWithSelectedUrl, event) => {
    if (event) event.preventDefault();
    
    const selectedUrl = matchWithSelectedUrl.streamUrl;
    if (selectedUrl && selectedUrl !== '#') {
      // This sends the link to AdManager component
      setActiveStream(selectedUrl);
    }
  }, []);

  const groupMatches = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const filtered = matches.filter(m => 
      `${m.home} ${m.away} ${m.league}`.toLowerCase().includes(term)
    );

    return {
      live: filtered.filter(m => ['1H', '2H', 'HT', 'LIVE'].includes(m.status?.toUpperCase())),
      upcoming: filtered.filter(m => !['1H', '2H', 'HT', 'LIVE', 'FT'].includes(m.status?.toUpperCase())),
      finished: filtered.filter(m => m.status?.toUpperCase() === 'FT')
    };
  }, [matches, searchTerm]);

  return (
    <div className="min-h-screen p-4 mx-auto font-sans text-white bg-[#070708] md:p-8 max-w-7xl">
      {showSubModal && <SubscriptionModal onClose={() => setShowSubModal(false)} />}
      
      {/* AdManager now receives the active stream state */}
      <AdManager externalStream={activeStream} setExternalStream={setActiveStream} />

      <div className="flex flex-col justify-between gap-4 mb-8 md:flex-row md:items-center">
        <div>
           <h1 className="text-3xl italic font-black tracking-tighter text-white uppercase">VORTEX <span className="text-red-600">LIVE</span></h1>
           <div className="flex items-center gap-2 mt-1">
              <Users size={12} className="text-green-500" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{viewers.toLocaleString()} Fans Online Now</span>
           </div>
        </div>

        <div className="flex items-center gap-3">
            <button 
                onClick={() => setShowSubModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600/10 border border-red-600/30 rounded-xl text-red-500 text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all"
            >
                <Bell size={14} /> Get Goal Alerts
            </button>
        </div>
      </div>

      <SearchBar 
        value={searchTerm} 
        onChange={setSearchTerm} 
        placeholder="SEARCH TEAMS, LEAGUES, OR COMPETITIONS..." 
      />

      {/* OPTION A: PROMO BANNER UPDATED WITH SMARTLINK */}
      <a href={SMART_LINK} target="_blank" rel="noreferrer" 
         className="relative block w-full p-1 mb-8 overflow-hidden transition-all border group rounded-3xl border-white/5 bg-white/5 hover:bg-white/[0.08]">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-red-600 rounded-xl">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm italic font-black tracking-tighter text-white uppercase">Premium Ultra-HD Engine</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Global CDN • 0ms Latency • Unlock Now</p>
            </div>
          </div>
          <ExternalLink size={18} className="transition-colors text-white/20 group-hover:text-red-600" />
        </div>
      </a>

      {isLoading ? (
        <div className="py-32 text-center animate-pulse">
          <div className="w-10 h-10 mx-auto mb-6 border-4 border-red-600 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/20">Establishing Vortex Connection...</p>
        </div>
      ) : (
        <>
          {groupMatches.live.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="flex items-center gap-3 text-2xl italic font-black tracking-tighter text-white uppercase">
                  <span className="w-1.5 h-8 bg-red-600 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.5)]"></span> 
                  LIVE NOW
                </h2>
                <span className="px-3 py-1 bg-red-600/10 text-red-500 text-[10px] font-black rounded-full border border-red-600/20">{groupMatches.live.length} MATCHES</span>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {groupMatches.live.map(m => (
                  <MatchCard 
                    key={m.id} 
                    match={m} 
                    displayData={{
                      isLive: true, 
                      scoreDisplay: `${m.homeScore}-${m.awayScore}`, 
                      statusBadge: {text: m.status, color: 'bg-red-600'}, 
                      liveMinute: 'LIVE'
                    }} 
                    handleStreamClick={handleWatchMatch} 
                  />
                ))}
              </div>
            </section>
          )}

          {groupMatches.upcoming.length > 0 && (
            <section className="mb-12">
              <h2 className="flex items-center gap-3 mb-6 text-2xl italic font-black tracking-tighter text-white uppercase">
                <span className="w-1.5 h-8 bg-zinc-800 rounded-full"></span> 
                SCHEDULED
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {groupMatches.upcoming.map(m => (
                  <MatchCard 
                    key={m.id} 
                    match={m} 
                    displayData={{
                      isLive: false, 
                      scoreDisplay: 'VS', 
                      statusBadge: {text: m.time, color: 'bg-white/5'}, 
                      liveMinute: m.time
                    }} 
                    handleStreamClick={handleWatchMatch} 
                  />
                ))}
              </div>
            </section>
          )}

          {groupMatches.live.length === 0 && groupMatches.upcoming.length === 0 && (
            <EmptyState searchTerm={searchTerm} onClearSearch={() => setSearchTerm('')} />
          )}
        </>
      )}

      {/* OPTION A: FOOTER BUTTON UPDATED WITH SMARTLINK */}
      <div className="flex flex-col items-center gap-4 mt-20">
          <a 
            href={SMART_LINK} 
            target="_blank" 
            rel="noreferrer"
            className="px-6 py-2 bg-red-600 rounded-md text-[10px] font-black text-white uppercase tracking-tighter animate-pulse"
          >
            HIGH CPM WITH ADSTERRA
          </a>
          
          <div id="container-adsterra-native" className="w-full min-h-[150px] bg-white/[0.02] rounded-[2.5rem] flex flex-col items-center justify-center border border-white/5 border-dashed">
            <Users size={24} className="mb-4 text-white/5" />
            <span className="text-[9px] text-white/10 uppercase font-black tracking-[0.4em]">Official Vortex Partners</span>
          </div>
      </div>
    </div>
  );
};

export default Home;