import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { ExternalLink, Zap } from 'lucide-react';

// Import your modular components
import SearchBar from '../components/SearchBar';
import MatchCard from '../components/MatchCard';
import EmptyState from '../components/EmptyState';
import AdManager from '../components/AdManager';

// Helper function to convert time string to minutes for sorting
const parseTime = (timeStr) => {
  if (!timeStr || 
      timeStr === 'TBD' || 
      timeStr === '--' || 
      timeStr === 'NS' || 
      timeStr === 'LIVE' ||
      timeStr === 'HT' ||
      timeStr === 'FT') {
    return {
      totalMinutes: 9999,
      sortableTime: '99:99'
    };
  }
  
  try {
    let time = timeStr.toString().toUpperCase().trim();
    
    // Handle various formats
    time = time.replace(/\./g, ':');
    
    // Remove spaces and normalize
    let isPM = false;
    if (time.includes('PM')) {
      isPM = true;
      time = time.replace('PM', '').trim();
    } else if (time.includes('AM')) {
      time = time.replace('AM', '').trim();
    }
    
    // Ensure we have HH:MM format
    const parts = time.split(':');
    let hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    
    // Adjust for 12-hour format
    if (isPM && hours < 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    
    // Handle 24-hour format overflow
    if (hours >= 24) hours = hours % 24;
    
    // Create sortable time string (HH:MM)
    const sortableTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    return {
      totalMinutes: hours * 60 + minutes,
      sortableTime
    };
  } catch (error) {
    console.warn('Error parsing time:', timeStr, error);
    return {
      totalMinutes: 9999,
      sortableTime: '99:99'
    };
  }
};

// Helper function to get match priority for sorting
const getMatchPriority = (status, timeStr) => {
  const statusUpper = (status || '').toUpperCase();
  const timeData = parseTime(timeStr);
  
  // Priority order (lower number = higher priority):
  // 1. Live matches (1H, 2H)
  // 2. Half Time (HT)
  // 3. Upcoming matches sorted by time
  // 4. Finished matches (FT)
  
  if (statusUpper === '1H' || statusUpper === '2H') {
    return {
      priority: 1, // Highest priority
      sortValue: 0
    };
  }
  
  if (statusUpper === 'HT') {
    return {
      priority: 2,
      sortValue: 0
    };
  }
  
  if (statusUpper === 'FT') {
    return {
      priority: 4, // Lowest priority
      sortValue: 999999
    };
  }
  
  // Upcoming matches (NS, or any other status)
  return {
    priority: 3,
    sortValue: timeData.totalMinutes
  };
};

const Home = () => {
  const [matches, setMatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [adError, setAdError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Firebase Data Sync
  useEffect(() => {
    console.log('Home: Initializing Firebase listener...');
    setIsLoading(true);
    
    try {
      const unsub = onSnapshot(collection(db, 'fixtures'), (snapshot) => {
        console.log('Home: Firebase data received');
        
        const matchesData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            // Ensure all required fields for MatchCard exist
            home: data.home || 'TBD',
            away: data.away || 'TBD',
            league: data.league || 'Global Match',
            homeScore: data.homeScore || 0,
            awayScore: data.awayScore || 0,
            streamUrl1: data.streamUrl1 || data.streamUrl || data.links?.[0]?.url || '#',
            streamUrl2: data.streamUrl2 || data.links?.[1]?.url || null,
            streamUrl: data.streamUrl || data.links?.[0]?.url || '#',
            status: data.status || 'NS',
            time: data.time || '--',
            // For MatchTimer if used
            lastUpdate: data.lastUpdate || null,
            baseMinute: data.baseMinute || 0,
            // Keep all other data
            ...data
          };
        });
        
        console.log(`Home: Loaded ${matchesData.length} matches`);
        
        // ENHANCED SORTING LOGIC: Sort by time and status
        matchesData.sort((a, b) => {
          const statusA = (a.status || '').toUpperCase();
          const statusB = (b.status || '').toUpperCase();
          
          // Get priority and sort value for each match
          const priorityA = getMatchPriority(statusA, a.time);
          const priorityB = getMatchPriority(statusB, b.time);
          
          // First, sort by priority (Live > HT > Upcoming > FT)
          if (priorityA.priority !== priorityB.priority) {
            return priorityA.priority - priorityB.priority;
          }
          
          // If same priority, sort by time (earliest first)
          if (priorityA.sortValue !== priorityB.sortValue) {
            return priorityA.sortValue - priorityB.sortValue;
          }
          
          // If same time, sort by league name
          const leagueA = a.league || '';
          const leagueB = b.league || '';
          return leagueA.localeCompare(leagueB);
        });
        
        setMatches(matchesData);
        setIsLoading(false);
        setAdError(''); // Clear any previous errors
      }, (error) => {
        console.error("Home: Firebase Sync Error:", error);
        setAdError('Syncing Failed - Check Connection');
        setIsLoading(false);
      });

      return () => {
        console.log('Home: Cleaning up Firebase listener');
        unsub();
      };
    } catch (err) {
      console.error('Home: Setup error:', err);
      setAdError('Failed to initialize');
      setIsLoading(false);
    }
  }, []);

  // Optimized Search Logic
  const filteredMatches = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return matches;
    
    return matches.filter(m => {
      const home = m.home?.toLowerCase() || '';
      const away = m.away?.toLowerCase() || '';
      const league = m.league?.toLowerCase() || '';
      return home.includes(term) || away.includes(term) || league.includes(term);
    });
  }, [matches, searchTerm]);

  // Match Display Data Helper for MatchCard
  const getMatchDisplayData = (match) => {
    const status = (match.status || 'NS').toUpperCase();
    const isLive = ['1H', '2H', 'HT'].includes(status);
    const isFinished = status === 'FT';
    const isHalfTime = status === 'HT';
    
    // Determine badge color
    let badgeColor = "bg-white/10";
    if (isLive) badgeColor = "bg-red-600";
    if (isFinished) badgeColor = "bg-zinc-800";
    if (isHalfTime) badgeColor = "bg-yellow-600/80";

    // Determine badge text
    let badgeText = status;
    if (status === 'NS') badgeText = match.time || 'UPCOMING';
    if (status === 'FT') badgeText = 'FT';

    // Live minute display
    let liveMinute = match.time || 'TBD';
    if (status === '1H' || status === '2H') liveMinute = 'LIVE';
    if (status === 'HT') liveMinute = 'HT';
    if (status === 'FT') liveMinute = 'FT';

    return {
      isLive,
      isFinished,
      isHalfTime,
      scoreDisplay: `${match.homeScore || 0} - ${match.awayScore || 0}`,
      statusBadge: {
        text: badgeText,
        color: badgeColor
      },
      liveMinute
    };
  };

  // Handle stream click - This will be intercepted by AdManager
  const handleStreamClick = (match, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('Home: Stream button clicked for:', match.home, 'vs', match.away);
    
    // Get the stream URL from the select element
    const select = document.getElementById(`server-${match.id}`);
    const url = select ? select.value : match.streamUrl1 || match.streamUrl;
    
    if (url && url !== '#') {
      console.log('Home: Opening URL:', url);
      window.open(url, '_blank');
    } else {
      console.log('Home: No stream URL found');
      setAdError('No stream available for this match');
      setTimeout(() => setAdError(''), 3000);
    }
  };

  // Group matches by date if you have date field
  const groupMatchesByStatus = useMemo(() => {
    const liveMatches = matches.filter(m => 
      ['1H', '2H', 'HT'].includes((m.status || '').toUpperCase())
    );
    
    const upcomingMatches = matches.filter(m => {
      const status = (m.status || '').toUpperCase();
      return !['1H', '2H', 'HT', 'FT'].includes(status);
    }).sort((a, b) => {
      // Sort upcoming by time
      const timeA = parseTime(a.time).totalMinutes;
      const timeB = parseTime(b.time).totalMinutes;
      return timeA - timeB;
    });
    
    const finishedMatches = matches.filter(m => 
      (m.status || '').toUpperCase() === 'FT'
    );
    
    return { liveMatches, upcomingMatches, finishedMatches };
  }, [matches]);

  return (
    <div className="min-h-screen p-4 mx-auto font-sans text-white bg-black md:p-8 max-w-7xl">
      
      {/* GLOBAL AD ENGINE */}
      <AdManager />

      {/* ERROR TOAST */}
      {adError && (
        <div className="fixed top-6 right-6 bg-red-600 px-6 py-3 rounded-2xl z-[100] font-black uppercase text-[10px] shadow-2xl animate-bounce">
          {adError}
        </div>
      )}

      {/* DEBUG INFO - Remove in production */}
      <div className="fixed z-50 p-3 text-xs text-white border rounded-lg bottom-4 left-4 bg-black/90 border-white/10">
        <div>Matches: {matches.length}</div>
        <div>Filtered: {filteredMatches.length}</div>
        <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
        <div>Live: {groupMatchesByStatus.liveMatches.length}</div>
        <div>Upcoming: {groupMatchesByStatus.upcomingMatches.length}</div>
      </div>

      {/* MODULAR SEARCH */}
      <SearchBar 
        value={searchTerm} 
        onChange={setSearchTerm}
        placeholder="SEARCH TEAMS, LEAGUES..."
      />

      {/* AFFILIATE BANNER */}
      <a 
        href="https://otieu.com/4/10407921" 
        target="_blank" 
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="relative block w-full p-1 mb-8 overflow-hidden transition-all border group rounded-3xl border-green-500/30 bg-gradient-to-r from-green-600/10 to-transparent hover:from-green-600/20"
      >
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
          <ExternalLink size={18} className="transition-colors text-white/20 group-hover:text-green-500" />
        </div>
      </a>

      {/* LIVE MATCHES SECTION (Optional) */}
      {groupMatchesByStatus.liveMatches.length > 0 && (
        <div className="mb-8">
          <h2 className="flex items-center gap-2 mb-6 text-xl italic font-black tracking-tighter text-white uppercase">
            <span className="w-2 h-6 bg-red-600 rounded-full"></span>
            LIVE MATCHES ({groupMatchesByStatus.liveMatches.length})
            <span className="ml-2 text-sm text-red-500 animate-pulse">⚡</span>
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {groupMatchesByStatus.liveMatches.map((match) => (
              <MatchCard 
                key={match.id} 
                match={match} 
                displayData={getMatchDisplayData(match)}
                handleStreamClick={handleStreamClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* UPCOMING MATCHES SECTION */}
      {groupMatchesByStatus.upcomingMatches.length > 0 && (
        <div className="mb-8">
          <h2 className="flex items-center gap-2 mb-6 text-xl italic font-black tracking-tighter text-white uppercase">
            <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
            UPCOMING MATCHES ({groupMatchesByStatus.upcomingMatches.length})
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {groupMatchesByStatus.upcomingMatches.map((match) => (
              <MatchCard 
                key={match.id} 
                match={match} 
                displayData={getMatchDisplayData(match)}
                handleStreamClick={handleStreamClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* FINISHED MATCHES SECTION (Optional) */}
      {groupMatchesByStatus.finishedMatches.length > 0 && (
        <div className="mb-8">
          <h2 className="flex items-center gap-2 mb-6 text-xl italic font-black tracking-tighter uppercase text-white/50">
            <span className="w-2 h-6 rounded-full bg-zinc-700"></span>
            RECENT RESULTS ({groupMatchesByStatus.finishedMatches.length})
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 opacity-70">
            {groupMatchesByStatus.finishedMatches.map((match) => (
              <MatchCard 
                key={match.id} 
                match={match} 
                displayData={getMatchDisplayData(match)}
                handleStreamClick={handleStreamClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {isLoading ? (
        <div className="py-32 text-center">
          <div className="inline-block w-8 h-8 border-2 rounded-full border-white/20 border-t-red-500 animate-spin"></div>
          <p className="mt-4 text-sm font-bold tracking-widest uppercase text-white/60">LOADING MATCHES...</p>
        </div>
      ) : filteredMatches.length === 0 && !isLoading ? (
        <EmptyState 
          searchTerm={searchTerm} 
          onClearSearch={() => setSearchTerm('')}
        />
      ) : null}

      {/* AD SLOT */}
      <div className="mt-12 w-full min-h-[250px] bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col items-center justify-center">
        <div className="text-[8px] text-white/10 uppercase tracking-[0.3em] mb-2 font-bold">Advertisement</div>
        <div id="container-adsterra-native" className="flex justify-center w-full" />
      </div>

      {/* FOOTER DECORATION */}
      <footer className="py-10 mt-12 text-center border-t border-white/5">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/10">
          Vortex Streaming System &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
};

export default Home;