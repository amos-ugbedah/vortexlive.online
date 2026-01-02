import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Search, Clock, Trophy, Server, Zap, ExternalLink, Play, Pause, Square } from 'lucide-react';

const Home = () => {
  const [matches, setMatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Function to calculate live minute
  const getLiveMinute = (match) => {
    // Handle different statuses
    if (match.status === 'HT') return 'HT';
    if (match.status === 'FT') return 'FT';
    if (match.status === 'upcoming' || match.status === 'NS') return match.time || 'TBD';

    // If match is 1H or 2H
    if (match.status === '1H' || match.status === '2H') {
      if (!match.lastUpdate) return 'Live';
      
      try {
        // Convert Firebase timestamp to JS Date
        let lastUpdate;
        if (match.lastUpdate?.toDate) {
          lastUpdate = match.lastUpdate.toDate();
        } else if (match.lastUpdate) {
          lastUpdate = new Date(match.lastUpdate);
        } else {
          return 'Live';
        }
        
        const now = new Date();
        const diffInSeconds = Math.floor((now - lastUpdate) / 1000);
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        const baseMinute = match.baseMinute || 0;
        const currentMinute = baseMinute + diffInMinutes;

        // Cap the minutes for realistic display
        if (match.status === '1H') {
          if (currentMinute < 1) return 'Live';
          if (currentMinute > 45) return "45+'";
          return `${currentMinute}'`;
        } else if (match.status === '2H') {
          if (currentMinute < 46) return '46\'';
          if (currentMinute > 90) return "90+'";
          return `${currentMinute}'`;
        }
      } catch (error) {
        console.error('Error calculating live minute:', error);
        return 'Live';
      }
    }
    
    return match.status || 'TBD';
  };

  // Function to determine match status badge
  const getStatusBadge = (match) => {
    if (match.status === '1H' || match.status === '2H') {
      return {
        text: 'LIVE',
        bgColor: 'bg-red-600',
        textColor: 'text-white',
        pulse: true
      };
    } else if (match.status === 'HT') {
      return {
        text: 'HALFTIME',
        bgColor: 'bg-yellow-600',
        textColor: 'text-white',
        pulse: false
      };
    } else if (match.status === 'FT') {
      return {
        text: 'FULL TIME',
        bgColor: 'bg-gray-700',
        textColor: 'text-white',
        pulse: false
      };
    } else if (match.status === 'upcoming' || match.status === 'NS') {
      return {
        text: 'UPCOMING',
        bgColor: 'bg-blue-600/30',
        textColor: 'text-blue-400',
        pulse: false
      };
    } else {
      return {
        text: match.status || 'TBD',
        bgColor: 'bg-white/10',
        textColor: 'text-white/60',
        pulse: false
      };
    }
  };

  // Function to format score display
  const getScoreDisplay = (match) => {
    if (match.status === '1H' || match.status === '2H' || match.status === 'HT' || match.status === 'FT') {
      if (match.homeScore !== undefined && match.awayScore !== undefined) {
        return `${match.homeScore || 0} - ${match.awayScore || 0}`;
      } else if (match.score) {
        return match.score;
      }
      return '0 - 0';
    }
    return null; // No score for upcoming matches
  };

  // Update matches every second for live timer
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'fixtures'), (snapshot) => {
      const matchesData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        // Add current timestamp for live calculation
        currentTime: new Date().toISOString()
      }));
      setMatches(matchesData);
    });

    // Set up interval to update live matches every second
    const interval = setInterval(() => {
      setMatches(prevMatches => 
        prevMatches.map(match => ({
          ...match,
          currentTime: new Date().toISOString() // Update timestamp for live calculation
        }))
      );
    }, 1000);

    // SOCIAL BAR SCRIPT
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '//pl25482485.profitablecpmrate.com/60/76/8a/60768a49c9584323c2a688a209867c42.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      clearInterval(interval);
      unsub();
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const filteredMatches = matches.filter(match => 
    match.home?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    match.away?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    match.league?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLaunch = (matchId) => {
    const select = document.getElementById(`server-${matchId}`);
    if (select) {
      const streamUrl = select.value;
      window.open(streamUrl, '_blank');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      
      {/* SEARCH SECTION */}
      <div className="relative mb-6 group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="text-white/20 group-focus-within:text-red-500 transition-colors" size={20} />
        </div>
        <input 
          type="text" 
          placeholder="Search teams or leagues (e.g. Arsenal, La Liga)..." 
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-red-500/50 focus:bg-white/[0.07] transition-all text-sm font-medium text-white"
          onChange={(e) => setSearchTerm(e.target.value)}
          value={searchTerm}
        />
      </div>

      {/* PROPELLER ADS: VIP FAST SERVER BANNER */}
      <a 
        href="https://otieu.com/4/10407921" 
        target="_blank" 
        rel="noreferrer"
        className="mb-8 block w-full group relative overflow-hidden rounded-3xl border border-green-500/30 bg-gradient-to-r from-green-600/10 to-transparent hover:from-green-600/20 transition-all p-1"
      >
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="bg-green-500 p-2 rounded-xl animate-pulse">
              <Zap size={20} className="text-white" fill="white" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase italic tracking-tighter text-white">Lagging? Try VIP High-Speed Server</h3>
              <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">No Buffering • Ultra HD • Ad-Free backup</p>
            </div>
          </div>
          <ExternalLink size={18} className="text-white/20 group-hover:text-green-500 transition-colors" />
        </div>
        <div className="absolute -inset-x-full top-0 bottom-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 animate-marquee-fast group-hover:duration-75"></div>
      </a>

      {/* NATIVE BANNER AD SLOT */}
      <div className="mb-8 w-full min-h-[60px] bg-white/5 border border-white/5 rounded-3xl overflow-hidden flex flex-col items-center justify-center">
        <div className="text-[8px] text-white/10 uppercase tracking-[0.3em] mb-1 font-bold">Suggested for you</div>
        <div id="container-adsterra-native" className="w-full flex justify-center" />
        <div className="text-white/5 text-[9px] italic mb-2">Premium Partner Advertisement</div>
      </div>

      <h2 className="text-xl font-black italic uppercase mb-6 flex items-center gap-2 text-white">
        <span className="w-2 h-6 bg-red-600 rounded-full"></span>
        {searchTerm ? `Results for "${searchTerm}"` : 'Top Live Matches'}
        <span className="text-sm text-red-500 animate-pulse">
          {matches.filter(m => m.status === '1H' || m.status === '2H').length > 0 && '⚡ LIVE NOW'}
        </span>
      </h2>

      {/* MATCH GRID */}
      {filteredMatches.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredMatches.map((match) => {
            const statusBadge = getStatusBadge(match);
            const liveMinute = getLiveMinute(match);
            const scoreDisplay = getScoreDisplay(match);
            const isLive = match.status === '1H' || match.status === '2H';
            
            return (
              <div key={match.id} className="group bg-white/5 border border-white/10 rounded-3xl p-5 hover:bg-white/10 hover:border-red-500/50 transition-all flex flex-col justify-between shadow-2xl">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1">
                      <Trophy size={10}/> {match.league || 'No League'}
                    </span>
                    {statusBadge && (
                      <span className={`${statusBadge.bgColor} ${statusBadge.textColor} text-[9px] px-2 py-0.5 rounded-full font-bold ${statusBadge.pulse ? 'animate-pulse shadow-lg shadow-red-600/40' : ''}`}>
                        {statusBadge.text}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 mb-6 text-center">
                    <div className="font-bold text-lg tracking-tighter truncate text-white">
                      {match.home || 'TBD'}
                    </div>
                    
                    {/* SCORE AND TIMER SECTION */}
                    <div className="my-3">
                      {isLive ? (
                        <div className="flex flex-col items-center justify-center gap-2">
                          {/* Score Display for Live/Finished Matches */}
                          {scoreDisplay && (
                            <div className="flex items-center justify-center gap-3 bg-red-600/10 py-3 px-6 rounded-2xl border border-red-600/20 w-full">
                              <span className="text-3xl font-black text-red-600 tracking-tighter">
                                {scoreDisplay}
                              </span>
                            </div>
                          )}
                          
                          {/* Live Timer Display */}
                          <div className="flex items-center justify-center gap-2 mt-2">
                            <div className="flex flex-col items-center">
                              <span className="text-xs text-white/60 font-bold uppercase tracking-widest">
                {match.status === '1H' ? 'First Half' : match.status === '2H' ? 'Second Half' : ''}
                              </span>
                              <span className="text-2xl font-black italic text-white mt-1">
                                {liveMinute}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // For upcoming or non-live matches
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="text-white/10 text-[10px] font-black italic uppercase my-2">VS</div>
                          {scoreDisplay ? (
                            <div className="text-xl font-bold text-white/70">
                              {scoreDisplay}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1 text-[10px] text-white/40 font-bold uppercase tracking-widest">
                              <Clock size={10} /> {match.time || match.date || 'TBD'}
                            </div>
                          )}
                          {match.status === 'HT' || match.status === 'FT' ? (
                            <div className="text-xs font-bold text-white/60">
                              {match.status === 'HT' ? 'Halftime' : 'Full Time'}
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>

                    <div className="font-bold text-lg tracking-tighter truncate text-white">
                      {match.away || 'TBD'}
                    </div>
                    
                    {/* Additional match info */}
                    <div className="mt-3 text-[10px] text-white/40 flex items-center justify-center gap-3">
                      {match.venue && (
                        <span className="font-medium">📍 {match.venue}</span>
                      )}
                      {match.date && !isLive && (
                        <span className="font-bold">📅 {match.date}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-black/40 rounded-xl px-3 py-2 border border-white/5">
                    <Server size={14} className="text-white/30" />
                    <select 
                      id={`server-${match.id}`} 
                      className="bg-transparent text-[10px] font-bold outline-none w-full cursor-pointer text-white"
                    >
                      {match.links ? match.links.map((link, i) => (
                        <option key={i} value={link.url} className="bg-zinc-900 text-white">
                          {link.name || `Server ${i + 1}`}
                        </option>
                      )) : match.streamUrl ? (
                        <option value={match.streamUrl} className="bg-zinc-900 text-white">Main Server</option>
                      ) : (
                        <option value="#" className="bg-zinc-900 text-white">No Stream Available</option>
                      )}
                    </select>
                  </div>

                  <button 
                    onClick={() => handleLaunch(match.id)}
                    className="w-full py-3 bg-white text-black text-[10px] font-black uppercase rounded-xl group-hover:bg-red-600 group-hover:text-white transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!match.streamUrl && (!match.links || match.links.length === 0)}
                  >
                    {isLive ? (
                      <>
                        <Play size={12} /> Watch Live Stream ➔
                      </>
                    ) : (
                      'Watch Stream ➔'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center">
              <Play size={32} className="text-red-600/50" />
            </div>
            <p className="text-white/30 font-bold italic text-lg">No matches found for your search.</p>
            <p className="text-white/20 text-sm">Try a different search term or check back later.</p>
          </div>
        </div>
      )}

      {/* Style for the marquee animation */}
      <style jsx>{`
        @keyframes marquee-fast {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(100%) skewX(-12deg); }
        }
        .animate-marquee-fast {
          animation: marquee-fast 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Home;