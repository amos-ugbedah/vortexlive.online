/* eslint-disable */
import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'; 
import { Volume2, Radio, Trees, Sparkles, Zap, Clock, Trophy, Target, TrendingUp, Award, Shield, Users, BarChart, Crown, Star } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import MatchCard from '../components/MatchCard';
import { normalizeMatch, isMatchLive, isMatchUpcoming, isMatchFinished } from '../lib/matchUtils';

const Home = memo(() => {
  const [matches, setMatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  
  // UPDATED: Closed by default. Logic in useEffect will open it for Desktop users only.
  const [showSidebar, setShowSidebar] = useState(false);
  
  const prevScores = useRef({});
  const goalSound = useRef(null);

  // Initialize audio and Responsive Sidebar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      goalSound.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2042/2042-preview.mp3');
      goalSound.current.volume = 0.3;

      // AUTO-DETECT SCREEN SIZE: If desktop (width > 1024), open sidebar automatically
      if (window.innerWidth >= 1024) {
        setShowSidebar(true);
      }
    }
  }, []);

  const playGoalAlert = useCallback(() => {
    if (soundEnabled && goalSound.current) {
      goalSound.current.currentTime = 0;
      goalSound.current.play().catch(e => console.log('Audio blocked'));
    }
  }, [soundEnabled]);

  // Fetch matches
  useEffect(() => {
    if (!db) return;

    const q = query(
      collection(db, 'matches'), 
      orderBy('kickoff', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const processedMatches = snapshot.docs.map(doc => {
        const data = normalizeMatch(doc.data(), doc.id);
        if (!data) return null;

        const matchKey = data.id;
        const homeScore = Number(data.home?.score || 0);
        const awayScore = Number(data.away?.score || 0);
        const currentScore = homeScore + awayScore;
        
        if (prevScores.current[matchKey] !== undefined && 
            currentScore > prevScores.current[matchKey] && 
            isMatchLive(data)) {
          playGoalAlert();
        }
        prevScores.current[matchKey] = currentScore;
        
        return data;
      }).filter(Boolean);

      setMatches(processedMatches);
      setIsLoading(false);
    }, (err) => {
      console.error("Home Snapshot Error:", err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [playGoalAlert]);

  // Categorize and filter matches
  const { categorized, filteredMatches, aiPicks } = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    
    const searchFiltered = matches.filter(m => {
      if (!m) return false;
      const searchString = `${m.home?.name || ''} ${m.away?.name || ''} ${m.league || ''}`.toLowerCase();
      return searchString.includes(term);
    });

    let filtered = searchFiltered;
    if (activeFilter === 'live') {
      filtered = searchFiltered.filter(m => isMatchLive(m));
    } else if (activeFilter === 'upcoming') {
      filtered = searchFiltered.filter(m => isMatchUpcoming(m));
    } else if (activeFilter === 'finished') {
      filtered = searchFiltered.filter(m => isMatchFinished(m));
    }

    const aiPicks = matches
      .filter(m => m.aiPick && m.aiPick.trim() !== '')
      .slice(0, 5);

    const categorized = {
      eliteLive: filtered.filter(m => m.isElite && isMatchLive(m)),
      regularLive: filtered.filter(m => !m.isElite && isMatchLive(m)),
      upcoming: filtered.filter(m => isMatchUpcoming(m)),
      finished: filtered.filter(m => isMatchFinished(m))
    };

    return { categorized, filteredMatches: filtered, aiPicks };
  }, [matches, searchTerm, activeFilter]);

  const totalMatches = filteredMatches.length;

  // Generate league standings data
  const leagueStandings = useMemo(() => {
    const leagues = {};
    matches.forEach(match => {
      const league = match.league || 'Unknown';
      if (!leagues[league]) {
        leagues[league] = {
          name: league,
          matches: [],
          topTeams: []
        };
      }
      leagues[league].matches.push(match);
    });

    Object.values(leagues).forEach(league => {
      const teams = {};
      
      league.matches.forEach(match => {
        if (!match.home?.name || !match.away?.name) return;
        
        if (!teams[match.home.name]) {
          teams[match.home.name] = { name: match.home.name, played: 0, won: 0, drawn: 0, lost: 0, points: 0, gf: 0, ga: 0, gd: 0 };
        }
        if (!teams[match.away.name]) {
          teams[match.away.name] = { name: match.away.name, played: 0, won: 0, drawn: 0, lost: 0, points: 0, gf: 0, ga: 0, gd: 0 };
        }

        if (match.status === 'FT') {
          teams[match.home.name].played++;
          teams[match.away.name].played++;
          teams[match.home.name].gf += match.home.score;
          teams[match.home.name].ga += match.away.score;
          teams[match.away.name].gf += match.away.score;
          teams[match.away.name].ga += match.home.score;
          
          if (match.home.score > match.away.score) {
            teams[match.home.name].won++;
            teams[match.away.name].lost++;
            teams[match.home.name].points += 3;
          } else if (match.home.score < match.away.score) {
            teams[match.away.name].won++;
            teams[match.home.name].lost++;
            teams[match.away.name].points += 3;
          } else {
            teams[match.home.name].drawn++;
            teams[match.away.name].drawn++;
            teams[match.home.name].points += 1;
            teams[match.away.name].points += 1;
          }
        }
      });

      Object.values(teams).forEach(team => {
        team.gd = team.gf - team.ga;
      });

      league.topTeams = Object.values(teams)
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.gd !== a.gd) return b.gd - a.gd;
          return b.gf - a.gf;
        })
        .slice(0, 5); 
    });

    return Object.values(leagues).slice(0, 3);
  }, [matches]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#050505] to-black">
        <div className="relative">
          <div className="w-24 h-24 border-[3px] border-red-600/30 border-t-red-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Radio className="text-red-600 animate-pulse" size={32} />
          </div>
        </div>
        <p className="mt-8 text-white/20 font-black uppercase text-xs tracking-[0.4em]">VORTEX ENGINE INITIALIZING</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen bg-gradient-to-br from-[#050505] via-black to-[#0a0a0a] text-white">
      {/* MOBILE HEADER */}
      <div className="sticky top-0 z-50 w-full px-4 py-3 border-b lg:hidden bg-black/95 backdrop-blur-2xl border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-600 to-red-700 rounded-xl">
              <Radio size={20} className="text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight uppercase">VORTEX<span className="text-red-600">PRO</span></h1>
            </div>
          </div>
          <button 
            onClick={() => setShowSidebar(!showSidebar)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              showSidebar ? 'bg-red-600 text-white' : 'bg-white/5 text-white/60'
            }`}
          >
            {showSidebar ? 'Close Stats' : 'Show Stats'}
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 lg:pr-[380px]">
        {/* DESKTOP HEADER */}
        <header className="sticky top-0 z-40 hidden w-full px-6 py-5 border-b lg:block bg-black/95 backdrop-blur-2xl border-white/5">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="p-3 shadow-lg bg-gradient-to-br from-red-600 to-red-700 rounded-2xl shadow-red-600/30">
                <Radio size={24} className="text-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-3xl italic font-black leading-none uppercase">VORTEX<span className="text-red-600">ULTRA</span></h1>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-1">Professional Sports Intelligence</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <SearchBar value={searchTerm} onChange={setSearchTerm} />
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-4 rounded-2xl border transition-all shadow-lg ${
                  soundEnabled ? 'bg-gradient-to-r from-red-600 to-red-700 border-red-500 shadow-red-600/20' : 'bg-gradient-to-r from-white/5 to-white/10 border-white/10 text-white/20'
                }`}
              >
                <Volume2 size={22} />
              </button>
            </div>
          </div>
        </header>

        {/* QUICK FILTERS */}
        <div className="px-4 py-4 border-b lg:px-6 border-white/5 bg-gradient-to-r from-black/50 to-transparent">
          <div className="max-w-[1400px] mx-auto flex flex-wrap items-center gap-2 lg:gap-3">
            <button onClick={() => setActiveFilter('all')} className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${activeFilter === 'all' ? 'bg-red-600 text-white shadow-lg' : 'bg-white/5 text-white/40'}`}>All ({matches.length})</button>
            <button onClick={() => setActiveFilter('live')} className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${activeFilter === 'live' ? 'bg-red-600 text-white shadow-lg' : 'bg-white/5 text-white/40'}`}><Zap size={14} /> Live ({categorized.eliteLive.length + categorized.regularLive.length})</button>
            <button onClick={() => setActiveFilter('upcoming')} className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${activeFilter === 'upcoming' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-white/40'}`}><Clock size={14} /> Upcoming ({categorized.upcoming.length})</button>
          </div>
        </div>

        {/* MAIN MATCHES GRID */}
        <main className="p-4 lg:p-6">
          {totalMatches === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 opacity-40">
              <Trees size={80} className="text-white/20" />
              <h2 className="mt-8 text-2xl font-black tracking-tighter uppercase">No Matches Found</h2>
            </div>
          ) : (
            <div className="max-w-[1400px] mx-auto space-y-8 lg:space-y-12">
              {/* Render categories based on your existing logic */}
              {categorized.eliteLive.length > 0 && (
                <section>
                  <h2 className="flex items-center gap-2 mb-6 text-xl italic font-black uppercase">
                    <Crown size={20} className="text-yellow-500" /> Elite Live
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                    {categorized.eliteLive.map(m => <MatchCard key={m.id} match={m} />)}
                  </div>
                </section>
              )}
              {categorized.regularLive.length > 0 && (
                <section>
                  <h2 className="mb-6 text-xl italic font-black uppercase">Live Now</h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                    {categorized.regularLive.map(m => <MatchCard key={m.id} match={m} />)}
                  </div>
                </section>
              )}
              {categorized.upcoming.length > 0 && (
                <section>
                  <h2 className="mb-6 text-xl italic font-black uppercase">Upcoming</h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                    {categorized.upcoming.map(m => <MatchCard key={m.id} match={m} />)}
                  </div>
                </section>
              )}
              {categorized.finished.length > 0 && (
                <section>
                  <h2 className="mb-6 text-xl italic font-black uppercase">Results</h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 opacity-80">
                    {categorized.finished.map(m => <MatchCard key={m.id} match={m} />)}
                  </div>
                </section>
              )}
            </div>
          )}
        </main>
      </div>

      {/* RIGHT SIDEBAR */}
      <div className={`${showSidebar ? 'block' : 'hidden'} lg:block fixed right-0 top-0 h-full w-full lg:w-[380px] bg-black border-l border-white/5 z-30 overflow-y-auto`}>
        <div className="p-5 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-black tracking-tight uppercase">Stats & Tables</h3>
            <button onClick={() => setShowSidebar(false)} className="p-2 lg:hidden text-white/40 hover:text-white">✕</button>
          </div>

          {/* BONUS CODE */}
          <div className="p-5 text-center border rounded-2xl bg-gradient-to-br from-yellow-900/40 to-black border-yellow-600/30">
            <h4 className="mb-4 text-2xl font-black">500% <span className="text-yellow-400">BONUS</span></h4>
            <div className="p-4 mb-4 border-2 bg-black/40 border-yellow-600/30 rounded-xl">
              <p className="text-3xl font-black tracking-widest text-yellow-400">VORTEX</p>
            </div>
            <button className="w-full py-3.5 bg-yellow-600 text-white font-black rounded-xl shadow-lg shadow-yellow-600/30">DEPOSIT NOW</button>
          </div>

          {/* LEAGUE TABLES */}
          {leagueStandings.map((league, idx) => (
            <div key={idx} className="p-4 border bg-white/5 border-white/5 rounded-xl">
              <h5 className="mb-3 text-xs font-bold">{league.name}</h5>
              {league.topTeams.map((team, index) => (
                <div key={index} className="flex items-center justify-between p-2 mb-1 rounded bg-black/20">
                  <span className="text-xs">{index + 1}. {team.name}</span>
                  <span className="text-xs font-bold">{team.points} PTS</span>
                </div>
              ))}
            </div>
          ))}

          {/* AI PREDICTIONS */}
          <div className="space-y-4">
            <h4 className="text-sm font-black uppercase text-white/80">AI Predictions</h4>
            {aiPicks.map((match) => (
              <div key={match.id} className="p-4 border bg-white/5 border-white/5 rounded-xl">
                <p className="text-xs italic text-white/70">"{match.aiPick}"</p>
                <div className="flex justify-between mt-2 text-[10px] font-bold text-red-500 uppercase">
                  <span>{match.home.name} vs {match.away.name}</span>
                </div>
              </div>
            ))}
          </div>

          {/* QUICK STATS */}
          <div className="p-5 border bg-blue-900/20 border-blue-600/20 rounded-2xl">
            <h4 className="mb-4 text-xs font-black uppercase">Vortex Engine Data</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span>Live Matches</span><span className="text-green-400">{categorized.eliteLive.length + categorized.regularLive.length}</span></div>
              <div className="flex justify-between"><span>Accuracy</span><span className="text-purple-400">87.4%</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

Home.displayName = 'Home';
export default Home;