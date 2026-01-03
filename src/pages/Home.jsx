import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { ExternalLink, Zap } from 'lucide-react';

// Import your modular components
import SearchBar from '../components/SearchBar';
import MatchCard from '../components/MatchCard';
import EmptyState from '../components/EmptyState';
import AdManager from '../components/AdManager';

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
            streamUrl: data.streamUrl || data.links?.[0]?.url || '#', // MatchCard uses this
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
        
        // Sort Logic: Live matches (1H, 2H, HT) always sit at the top
        matchesData.sort((a, b) => {
          const priority = (s) => (['1H', '2H', 'HT'].includes(s?.toUpperCase()) ? 1 : 2);
          return priority(a.status) - priority(b.status);
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
    
    // Determine badge color
    let badgeColor = "bg-white/10";
    if (isLive) badgeColor = "bg-red-600";
    if (isFinished) badgeColor = "bg-zinc-800";
    if (status === 'HT') badgeColor = "bg-yellow-600/80";

    // Determine badge text
    let badgeText = status;
    if (status === 'NS') badgeText = match.time || 'UPCOMING';
    if (status === 'FT') badgeText = 'FT';

    return {
      isLive,
      scoreDisplay: `${match.homeScore || 0} - ${match.awayScore || 0}`,
      statusBadge: {
        text: badgeText,
        color: badgeColor
      },
      liveMinute: match.time || status
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

      {/* LOADING STATE */}
      {isLoading ? (
        <div className="py-32 text-center">
          <div className="inline-block w-8 h-8 border-2 rounded-full border-white/20 border-t-red-500 animate-spin"></div>
          <p className="mt-4 text-sm font-bold tracking-widest uppercase text-white/60">LOADING MATCHES...</p>
        </div>
      ) : filteredMatches.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filteredMatches.map((match) => (
            <MatchCard 
              key={match.id} 
              match={match} 
              displayData={getMatchDisplayData(match)}
              handleStreamClick={handleStreamClick}
            />
          ))}
        </div>
      ) : (
        <EmptyState 
          searchTerm={searchTerm} 
          onClearSearch={() => setSearchTerm('')}
        />
      )}

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