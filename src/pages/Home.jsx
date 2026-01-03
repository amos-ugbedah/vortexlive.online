import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Search, Clock, Trophy, Server, Zap, ExternalLink, AlertCircle } from 'lucide-react';

const Home = () => {
  const [matches, setMatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showAdOverlay, setShowAdOverlay] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const [selectedStreamUrl, setSelectedStreamUrl] = useState(null);
  const [adError, setAdError] = useState('');

  // Update current time every second for live timers
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer for ad overlay
  useEffect(() => {
    if (!showAdOverlay || adCountdown <= 0) return;

    const timer = setInterval(() => {
      setAdCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showAdOverlay, adCountdown]);

  // Open stream after countdown
  useEffect(() => {
    if (adCountdown === 0 && selectedStreamUrl) {
      try {
        console.log('🚀 Opening stream:', selectedStreamUrl);
        window.open(selectedStreamUrl, '_blank');
        
        // Try to trigger pop-under
        setTimeout(() => {
          try {
            if (typeof window.pp !== 'undefined' && window.pp.openAd) {
              window.pp.openAd();
              console.log('✅ Pop-under triggered');
            }
          } catch(e) {
            console.log('⚠️ Pop-under not available');
          }
        }, 300);
        
      } catch(error) {
        console.error('Error opening stream:', error);
        setAdError('Error opening stream. Please try again.');
        setTimeout(() => setAdError(''), 3000);
      }
      
      // Close overlay
      setTimeout(() => {
        setShowAdOverlay(false);
        setSelectedStreamUrl(null);
        setAdCountdown(5);
      }, 500);
    }
  }, [adCountdown, selectedStreamUrl]);

  // Calculate live minute for a match
  const calculateLiveMinute = useCallback((match) => {
    if (!match.status) return '--';
    
    // For non-live statuses
    if (match.status === 'HT') return 'HT';
    if (match.status === 'FT') return 'FT';
    if (match.status === 'NS' || match.status === 'upcoming') return match.time || '--';
    
    // For live matches (1H or 2H)
    if (match.status === '1H' || match.status === '2H') {
      if (!match.lastUpdate || match.baseMinute === undefined) {
        return match.status === '1H' ? '1H' : '2H';
      }
      
      try {
        // Convert lastUpdate to timestamp
        let lastUpdateMs;
        if (match.lastUpdate?.toDate) {
          // Firebase Timestamp
          lastUpdateMs = match.lastUpdate.toDate().getTime();
        } else if (typeof match.lastUpdate === 'string') {
          // ISO string
          lastUpdateMs = new Date(match.lastUpdate).getTime();
        } else if (typeof match.lastUpdate === 'number') {
          // Unix timestamp
          lastUpdateMs = match.lastUpdate;
        } else if (match.lastUpdate?.seconds) {
          // Firebase timestamp with seconds/nanoseconds
          lastUpdateMs = match.lastUpdate.seconds * 1000 + (match.lastUpdate.nanoseconds || 0) / 1000000;
        } else {
          return match.status === '1H' ? '1H' : '2H';
        }
        
        // Calculate elapsed minutes
        const elapsedMs = currentTime - lastUpdateMs;
        const elapsedMinutes = Math.floor(elapsedMs / (60 * 1000));
        const currentMinute = (match.baseMinute || 0) + elapsedMinutes;
        
        // Cap minutes for realistic display
        if (match.status === '1H') {
          if (currentMinute <= 0) return '1\'';
          if (currentMinute > 45) return '45+';
          return `${currentMinute}'`;
        } else if (match.status === '2H') {
          if (currentMinute <= 45) return '46\'';
          if (currentMinute > 90) return '90+';
          return `${currentMinute}'`;
        }
      } catch (error) {
        console.error('Error calculating minute:', error);
        return match.status;
      }
    }
    
    return match.status;
  }, [currentTime]);

  // Get match display data
  const getMatchDisplayData = useCallback((match) => {
    const liveMinute = calculateLiveMinute(match);
    const isLive = match.status === '1H' || match.status === '2H';
    const isFinished = match.status === 'FT';
    const isHalfTime = match.status === 'HT';
    const isUpcoming = match.status === 'NS' || match.status === 'upcoming' || !match.status;
    
    // Get score display
    let scoreDisplay = 'VS';
    if (match.homeScore !== undefined && match.awayScore !== undefined) {
      scoreDisplay = `${match.homeScore} - ${match.awayScore}`;
    } else if (match.score) {
      scoreDisplay = match.score;
    }
    
    // Get status badge
    let statusBadge = {
      text: isLive ? 'LIVE' : match.status || 'UPCOMING',
      color: isLive ? 'bg-red-600' : 
             isFinished ? 'bg-gray-700' : 
             isHalfTime ? 'bg-yellow-600' : 'bg-blue-600/30',
      textColor: isLive ? 'text-white' : 
                 isFinished ? 'text-white' : 
                 isHalfTime ? 'text-white' : 'text-blue-400'
    };
    
    return {
      isLive,
      isFinished,
      isHalfTime,
      isUpcoming,
      liveMinute,
      scoreDisplay,
      statusBadge
    };
  }, [calculateLiveMinute]);

  // Listen to Firebase changes
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'fixtures'), (snapshot) => {
      const matchesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Ensure we have timestamps
          lastUpdate: data.lastUpdate || null,
          baseMinute: data.baseMinute || 0,
          homeScore: data.homeScore || 0,
          awayScore: data.awayScore || 0
        };
      });
      
      // Sort matches: live first, then upcoming, then finished
      matchesData.sort((a, b) => {
        const aLive = a.status === '1H' || a.status === '2H';
        const bLive = b.status === '1H' || b.status === '2H';
        const aUpcoming = a.status === 'NS' || a.status === 'upcoming' || !a.status;
        const bUpcoming = b.status === 'NS' || b.status === 'upcoming' || !b.status;
        
        if (aLive && !bLive) return -1;
        if (!aLive && bLive) return 1;
        if (aUpcoming && !bUpcoming) return -1;
        if (!aUpcoming && bUpcoming) return 1;
        return 0;
      });
      
      setMatches(matchesData);
    });

    return () => unsub();
  }, []);

  // Filter matches based on search
  const filteredMatches = useMemo(() => {
    if (!searchTerm.trim()) return matches;
    
    const term = searchTerm.toLowerCase();
    return matches.filter(match => 
      (match.home && match.home.toLowerCase().includes(term)) ||
      (match.away && match.away.toLowerCase().includes(term)) ||
      (match.league && match.league.toLowerCase().includes(term))
    );
  }, [matches, searchTerm]);

  // DIRECT stream handler - NO AdManager dependency
  const handleStreamClick = (match, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🎯 Stream button clicked for:', match.home, 'vs', match.away);
    
    // Get the select dropdown
    const select = document.getElementById(`server-${match.id}`);
    if (!select) {
      console.log('❌ Select dropdown not found');
      setAdError('No stream available for this match.');
      setTimeout(() => setAdError(''), 3000);
      return;
    }
    
    const streamUrl = select.value;
    
    if (!streamUrl || streamUrl === '#') {
      console.log('❌ No valid stream URL');
      setAdError('No stream available for this match.');
      setTimeout(() => setAdError(''), 3000);
      return;
    }
    
    console.log('📺 Stream URL:', streamUrl);
    
    // Check if AdManager exists (for pop-under)
    const hasAdManager = typeof window !== 'undefined' && 
                        (document.querySelector('script[src*="profitablecpmrate.com"]'));
    
    if (hasAdManager) {
      console.log('🎬 Showing ad overlay...');
      // Show our own ad overlay
      setSelectedStreamUrl(streamUrl);
      setShowAdOverlay(true);
      setAdCountdown(5);
    } else {
      console.log('🚀 No AdManager, opening stream directly');
      // Open stream directly
      window.open(streamUrl, '_blank');
    }
  };

  // Ad Overlay Component
  const AdOverlay = () => {
    if (!showAdOverlay) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95">
        <div className="relative w-full max-w-lg overflow-hidden bg-gray-900 border shadow-2xl border-red-600/50 rounded-3xl">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tighter text-red-600 uppercase">WATCHING AD</h2>
                <p className="mt-1 text-sm text-white/70">Your stream will open in {adCountdown} seconds</p>
              </div>
              <button
                onClick={() => {
                  setShowAdOverlay(false);
                  setSelectedStreamUrl(null);
                  setAdCountdown(5);
                }}
                className="transition-colors text-white/50 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Ad Content */}
          <div className="p-6 bg-black/50">
            <div className="mb-6">
              <div className="p-8 text-center bg-black border-2 border-red-600/30 rounded-2xl">
                {/* Countdown Timer */}
                <div className="mb-4">
                  <div className="mb-2 font-black text-red-600 text-7xl">{adCountdown}</div>
                  <div className="text-sm tracking-widest uppercase text-white/50">SECONDS REMAINING</div>
                </div>
                
                {/* Ad Content Placeholder */}
                <div className="flex items-center justify-center h-40 mb-4 bg-gradient-to-br from-red-900/20 to-black rounded-xl">
                  <div className="text-center">
                    <div className="mb-2 text-4xl">🎥</div>
                    <div className="text-sm text-white/70">Premium Partner Advertisement</div>
                  </div>
                </div>
                
                <div className="text-xs text-white/40">
                  Ad revenue helps keep VortexLive free for everyone
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 mb-6 overflow-hidden rounded-full bg-white/10">
              <div 
                className="h-full transition-all duration-1000 bg-red-600"
                style={{ width: `${100 - (adCountdown / 5 * 100)}%` }}
              />
            </div>

            {/* Info */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2 text-sm text-white/50">
                <AlertCircle size={16} />
                Please don't close this window
              </div>
              <p className="text-xs text-white/30">
                Stream will automatically open in new tab. Pop-ups must be enabled.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Error Toast
  const ErrorToast = () => {
    if (!adError) return null;

    return (
      <div className="fixed z-50 px-4 py-3 text-white bg-red-600 shadow-lg top-4 right-4 rounded-xl animate-slide-in">
        <div className="flex items-center gap-2">
          <AlertCircle size={18} />
          <span className="font-medium">{adError}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 mx-auto md:p-8 max-w-7xl">
      {/* Ad Overlay */}
      <AdOverlay />
      <ErrorToast />

      {/* SEARCH SECTION */}
      <div className="relative mb-6 group">
        <div className="absolute inset-y-0 flex items-center pointer-events-none left-4">
          <Search className="transition-colors text-white/20 group-focus-within:text-red-500" size={20} />
        </div>
        <input 
          type="text" 
          placeholder="Search teams or leagues (e.g. Arsenal, La Liga)..." 
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-red-500/50 focus:bg-white/[0.07] transition-all text-sm font-medium text-white"
          onChange={(e) => setSearchTerm(e.target.value)}
          value={searchTerm}
        />
      </div>

      {/* AD BANNER */}
      <a 
        href="https://otieu.com/4/10407921" 
        target="_blank" 
        rel="noreferrer"
        onClick={(e) => {
          // Allow affiliate links to work normally
          e.stopPropagation();
          console.log('✅ Affiliate link clicked');
        }}
        className="relative block w-full p-1 mb-8 overflow-hidden transition-all border group rounded-3xl border-green-500/30 bg-gradient-to-r from-green-600/10 to-transparent hover:from-green-600/20"
      >
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-green-500 rounded-xl animate-pulse">
              <Zap size={20} className="text-white" fill="white" />
            </div>
            <div>
              <h3 className="text-sm italic font-black tracking-tighter text-white uppercase">VIP High-Speed Server</h3>
              <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">No Buffering • Ultra HD</p>
            </div>
          </div>
          <ExternalLink size={18} className="transition-colors text-white/20 group-hover:text-green-500" />
        </div>
      </a>

      {/* AD SLOT */}
      <div className="mb-8 w-full min-h-[60px] bg-white/5 border border-white/5 rounded-3xl overflow-hidden flex flex-col items-center justify-center">
        <div className="text-[8px] text-white/10 uppercase tracking-[0.3em] mb-1 font-bold">Advertisement</div>
        <div id="container-adsterra-native" className="flex justify-center w-full" />
      </div>

      <h2 className="flex items-center gap-2 mb-6 text-xl italic font-black text-white uppercase">
        <span className="w-2 h-6 bg-red-600 rounded-full"></span>
        {searchTerm ? `Results for "${searchTerm}"` : 'All Matches'}
        <span className="ml-2 text-sm text-red-500 animate-pulse">
          {matches.filter(m => m.status === '1H' || m.status === '2H').length > 0 ? 
            `⚡ ${matches.filter(m => m.status === '1H' || m.status === '2H').length} LIVE` : ''}
        </span>
      </h2>

      {/* MATCH GRID */}
      {filteredMatches.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filteredMatches.map((match) => {
            const display = getMatchDisplayData(match);
            
            return (
              <div key={match.id} className="flex flex-col justify-between p-5 transition-all border shadow-xl group bg-white/5 border-white/10 rounded-3xl hover:bg-white/10 hover:border-red-500/50">
                {/* HEADER */}
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1">
                      <Trophy size={10}/> {match.league || 'No League'}
                    </span>
                    <span className={`${display.statusBadge.color} ${display.statusBadge.textColor} text-[9px] px-2 py-0.5 rounded-full font-bold ${display.isLive ? 'animate-pulse' : ''}`}>
                      {display.statusBadge.text}
                    </span>
                  </div>
                </div>

                {/* TEAMS AND SCORE */}
                <div className="flex flex-col gap-1 mb-6 text-center">
                  {/* Home Team */}
                  <div className="text-lg font-bold tracking-tighter text-white truncate">
                    {match.home || 'TBD'}
                  </div>
                  
                  {/* SCORE AND TIMER SECTION */}
                  <div className="my-3 min-h-[60px] flex flex-col justify-center">
                    {display.isLive || display.isFinished || display.isHalfTime ? (
                      <>
                        {/* Score Display */}
                        <div className={`${display.isLive ? 'bg-red-600/10 border-red-600/20' : 'bg-white/5'} py-3 px-4 rounded-2xl border`}>
                          <div className="mb-1 text-3xl font-black tracking-tighter">
                            <span className={display.isLive ? 'text-red-600' : 'text-white'}>
                              {display.scoreDisplay}
                            </span>
                          </div>
                          
                          {/* Timer Display */}
                          <div className="flex items-center justify-center">
                            <span className="text-sm font-bold text-white/80">
                              {display.isLive ? 'Live' : display.isHalfTime ? 'Halftime' : 'Full Time'} • 
                            </span>
                            <span className="ml-2 text-xl italic font-black text-white">
                              {display.liveMinute}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      // Upcoming match
                      <div className="flex flex-col items-center justify-center py-3">
                        <div className="text-white/10 text-[10px] font-black italic uppercase mb-2">VS</div>
                        <div className="flex items-center justify-center gap-2 text-white/60">
                          <Clock size={12} />
                          <span className="text-sm font-bold">
                            {match.time || match.date || 'TBD'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="text-lg font-bold tracking-tighter text-white truncate">
                    {match.away || 'TBD'}
                  </div>
                  
                  {/* Additional Info */}
                  {(match.venue || match.date) && (
                    <div className="mt-2 text-[10px] text-white/40 flex items-center justify-center gap-3">
                      {match.venue && <span>📍 {match.venue}</span>}
                      {match.date && !display.isLive && <span>📅 {match.date}</span>}
                    </div>
                  )}
                </div>

                {/* STREAM CONTROLS */}
                <div className="space-y-2">
                  {/* Server Selector */}
                  <div className="flex items-center gap-2 px-3 py-2 border bg-black/40 rounded-xl border-white/5">
                    <Server size={14} className="text-white/30" />
                    <select 
                      id={`server-${match.id}`} 
                      className="bg-transparent text-[10px] font-bold outline-none w-full cursor-pointer text-white"
                      defaultValue={match.links?.[0]?.url || match.streamUrl || '#'}
                    >
                      {match.links ? (
                        match.links.map((link, i) => (
                          <option key={i} value={link.url || '#'} className="text-white bg-zinc-900">
                            {link.name || `Server ${i + 1}`}
                          </option>
                        ))
                      ) : (
                        <option value={match.streamUrl || '#'} className="text-white bg-zinc-900">
                          {match.streamUrl ? 'Main Server' : 'No Stream'}
                        </option>
                      )}
                    </select>
                  </div>

                  {/* Watch Button - WORKS 100% */}
                  <button 
                    onClick={(e) => handleStreamClick(match, e)}
                    className={`w-full py-3 text-[10px] font-black uppercase rounded-xl transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-2
                      ${display.isLive ? 
                        'bg-red-600 text-white hover:bg-red-700' : 
                        'bg-white text-black hover:bg-red-600 hover:text-white'
                      }`}
                  >
                    {display.isLive ? '🔴 WATCH LIVE STREAM' : 'WATCH STREAM'} ➔
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center border border-dashed bg-white/5 rounded-3xl border-white/10">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 bg-red-600/10 rounded-2xl">
              <Clock size={32} className="text-red-600/50" />
            </div>
            <p className="text-lg italic font-bold text-white/30">No matches found</p>
            <p className="text-sm text-white/20">Try a different search term</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;