import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { ExternalLink, Zap } from 'lucide-react';
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

const Home = () => {
  const [matches, setMatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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
          // Normalizing stream URL for AdManager to handle
          streamUrl: data.streamUrl || data.streamUrl1 || data.links?.[0]?.url || '#',
          ...data
        };
      });

      // Sorting: LIVE > UPCOMING > FINISHED
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
    <div className="min-h-screen p-4 mx-auto font-sans text-white bg-black md:p-8 max-w-7xl">
      <AdManager />

      <SearchBar 
        value={searchTerm} 
        onChange={setSearchTerm} 
        placeholder="SEARCH TEAMS, LEAGUES..." 
      />

      {/* FAST SERVER PROMO */}
      <a href="https://otieu.com/4/10407921" target="_blank" rel="noreferrer" 
         className="relative block w-full p-1 mb-8 overflow-hidden transition-all border group rounded-3xl border-green-500/30 bg-gradient-to-r from-green-600/10 to-transparent hover:from-green-600/20">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-green-500 rounded-xl animate-pulse">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm italic font-black tracking-tighter text-white uppercase">VIP High-Speed Server</h3>
              <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">No Buffering • Ultra HD</p>
            </div>
          </div>
          <ExternalLink size={18} className="text-white/20 group-hover:text-green-500" />
        </div>
      </a>

      {isLoading ? (
        <div className="py-32 text-center animate-pulse">
          <div className="w-8 h-8 mx-auto mb-4 border-2 border-red-500 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-xs font-black tracking-widest uppercase text-white/40">Vortex Loading...</p>
        </div>
      ) : (
        <>
          {/* LIVE SECTION */}
          {groupMatches.live.length > 0 && (
            <section className="mb-12">
              <h2 className="flex items-center gap-2 mb-6 text-xl italic font-black text-white uppercase">
                <span className="w-2 h-6 bg-red-600 rounded-full"></span> 
                LIVE ({groupMatches.live.length})
              </h2>
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
                    handleStreamClick={() => {}} 
                  />
                ))}
              </div>
            </section>
          )}

          {/* UPCOMING SECTION */}
          {groupMatches.upcoming.length > 0 && (
            <section className="mb-12">
              <h2 className="flex items-center gap-2 mb-6 text-xl italic font-black text-white uppercase">
                <span className="w-2 h-6 bg-blue-600 rounded-full"></span> 
                UPCOMING
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {groupMatches.upcoming.map(m => (
                  <MatchCard 
                    key={m.id} 
                    match={m} 
                    displayData={{
                      isLive: false, 
                      scoreDisplay: 'VS', 
                      statusBadge: {text: m.time, color: 'bg-white/10'}, 
                      liveMinute: m.time
                    }} 
                    handleStreamClick={() => {}} 
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

      {/* Adsterra Slot */}
      <div id="container-adsterra-native" className="mt-12 w-full min-h-[250px] bg-white/5 rounded-2xl flex items-center justify-center border border-white/5">
        <span className="text-[8px] text-white/10 uppercase tracking-widest">Partner Advertisement</span>
      </div>
    </div>
  );
};

export default Home;