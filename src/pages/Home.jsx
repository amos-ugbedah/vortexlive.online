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
  const [showSidebar, setShowSidebar] = useState(true);
  
  const prevScores = useRef({});
  const goalSound = useRef(null);

  // Initialize audio
  useEffect(() => {
    if (typeof window !== 'undefined') {
      goalSound.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2042/2042-preview.mp3');
      goalSound.current.volume = 0.3;
    }
  }, []);

  const playGoalAlert = useCallback(() => {
    if (soundEnabled && goalSound.current) {
      goalSound.current.currentTime = 0;
      goalSound.current.play().catch(e => console.log('Audio blocked'));
    }
  }, [soundEnabled]);

  // Fetch matches - UPDATED: Simplified query
  useEffect(() => {
    if (!db) return;

    // Order by kickoff time (soonest first)
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
        
        // Check for goal alerts
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
    
    // First filter by search term
    const searchFiltered = matches.filter(m => {
      if (!m) return false;
      const searchString = `${m.home?.name || ''} ${m.away?.name || ''} ${m.league || ''}`.toLowerCase();
      return searchString.includes(term);
    });

    // Then apply active filter
    let filtered = searchFiltered;
    if (activeFilter === 'live') {
      filtered = searchFiltered.filter(m => isMatchLive(m));
    } else if (activeFilter === 'upcoming') {
      filtered = searchFiltered.filter(m => isMatchUpcoming(m));
    } else if (activeFilter === 'finished') {
      filtered = searchFiltered.filter(m => isMatchFinished(m));
    }

    // Get AI picks for sidebar (top 3 elite matches or most interesting)
    const aiPicks = matches
      .filter(m => m.aiPick && m.aiPick.trim() !== '')
      .slice(0, 5);

    // Categorize for display - FIXED: Elite matches are marked with isElite flag
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
    // Group matches by league
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

    // Calculate top teams for each league
    Object.values(leagues).forEach(league => {
      const teams = {};
      
      league.matches.forEach(match => {
        // Skip if team names are empty
        if (!match.home?.name || !match.away?.name) return;
        
        // Add home team
        if (!teams[match.home.name]) {
          teams[match.home.name] = {
            name: match.home.name,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            points: 0,
            gf: 0,
            ga: 0,
            gd: 0
          };
        }
        
        // Add away team
        if (!teams[match.away.name]) {
          teams[match.away.name] = {
            name: match.away.name,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            points: 0,
            gf: 0,
            ga: 0,
            gd: 0
          };
        }

        // Update stats only for finished matches
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

      // Calculate goal difference
      Object.values(teams).forEach(team => {
        team.gd = team.gf - team.ga;
      });

      // Sort by points, then GD, then GF
      league.topTeams = Object.values(teams)
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.gd !== a.gd) return b.gd - a.gd;
          return b.gf - a.gf;
        })
        .slice(0, 5); // Top 5 teams
    });

    return Object.values(leagues).slice(0, 3); // Top 3 leagues
  }, [matches]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#050505] to-black">
        <div className="relative">
          <div className="w-24 h-24 border-[3px] border-red-600/30 border-t-red-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Radio className="text-red-600 animate-pulse" size={32} />
          </div>
        </div>
        <p className="mt-8 text-white/20 font-black uppercase text-xs tracking-[0.4em]">
          VORTEX ENGINE INITIALIZING
        </p>
        <p className="mt-2 text-white/10 text-[10px]">Decrypting satellite signals...</p>
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
              <h1 className="text-lg font-black tracking-tight uppercase">
                VORTEX<span className="text-red-600">PRO</span>
              </h1>
              <p className="text-[8px] text-white/20 uppercase tracking-widest">LIVE SPORTS</p>
            </div>
          </div>
          <button 
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 rounded-lg bg-white/5"
          >
            <span className="text-xs font-bold">{showSidebar ? 'Hide' : 'Show'} Stats</span>
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
                <h1 className="text-3xl italic font-black leading-none uppercase">
                  VORTEX<span className="text-red-600">ULTRA</span>
                </h1>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-1">
                  Professional Sports Intelligence
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <SearchBar value={searchTerm} onChange={setSearchTerm} />
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-4 rounded-2xl border transition-all shadow-lg ${
                  soundEnabled 
                    ? 'bg-gradient-to-r from-red-600 to-red-700 border-red-500 shadow-red-600/20' 
                    : 'bg-gradient-to-r from-white/5 to-white/10 border-white/10 text-white/20'
                }`}
                title={soundEnabled ? "Goal alerts ON" : "Goal alerts OFF"}
              >
                <Volume2 size={22} />
              </button>
            </div>
          </div>
        </header>

        {/* QUICK FILTERS */}
        <div className="px-4 py-4 border-b lg:px-6 border-white/5 bg-gradient-to-r from-black/50 to-transparent">
          <div className="max-w-[1400px] mx-auto">
            <div className="flex flex-wrap items-center gap-2 lg:gap-3">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all shadow-sm ${
                  activeFilter === 'all' 
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/30' 
                    : 'bg-gradient-to-r from-white/5 to-white/10 text-white/40 hover:bg-white/10 hover:text-white/60'
                }`}
              >
                All ({matches.length})
              </button>
              <button
                onClick={() => setActiveFilter('live')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all shadow-sm flex items-center gap-2 ${
                  activeFilter === 'live'
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/30' 
                    : 'bg-gradient-to-r from-white/5 to-white/10 text-white/40 hover:bg-white/10 hover:text-white/60'
                }`}
              >
                <Zap size={14} className={activeFilter === 'live' ? 'animate-pulse' : ''} />
                Live ({categorized.eliteLive.length + categorized.regularLive.length})
              </button>
              <button
                onClick={() => setActiveFilter('upcoming')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all shadow-sm flex items-center gap-2 ${
                  activeFilter === 'upcoming'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30' 
                    : 'bg-gradient-to-r from-white/5 to-white/10 text-white/40 hover:bg-white/10 hover:text-white/60'
                }`}
              >
                <Clock size={14} />
                Upcoming ({categorized.upcoming.length})
              </button>
              <button
                onClick={() => setActiveFilter('finished')}
                className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all shadow-sm ${
                  activeFilter === 'finished'
                    ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-lg shadow-gray-600/30' 
                    : 'bg-gradient-to-r from-white/5 to-white/10 text-white/40 hover:bg-white/10 hover:text-white/60'
                }`}
              >
                Finished ({categorized.finished.length})
              </button>
            </div>
          </div>
        </div>

        {/* MAIN MATCHES GRID */}
        <main className="p-4 lg:p-6">
          {totalMatches === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 opacity-40">
              <Trees size={80} className="text-white/20" />
              <h2 className="mt-8 text-2xl font-black tracking-tighter uppercase">No Matches Found</h2>
              <p className="max-w-md mt-3 text-sm text-center text-white/40">
                {searchTerm ? `No matches found for "${searchTerm}"` : 'Check back later or run the sync function'}
              </p>
            </div>
          ) : (
            <div className="max-w-[1400px] mx-auto space-y-8 lg:space-y-12">
              {/* ELITE LIVE MATCHES */}
              {categorized.eliteLive.length > 0 && (
                <section className="animate-fadeIn">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-2 h-8 rounded-full bg-gradient-to-b from-red-600 via-yellow-500 to-orange-500" />
                    <div className="flex items-center gap-3">
                      <Crown size={20} className="text-yellow-500" />
                      <h2 className="text-xl italic font-black tracking-tight uppercase lg:text-2xl">
                        Elite Live Action <span className="ml-2 text-base text-yellow-500/70">({categorized.eliteLive.length})</span>
                      </h2>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                    {categorized.eliteLive.map(m => (
                      <MatchCard key={m.id} match={m} />
                    ))}
                  </div>
                </section>
              )}
              
              {/* REGULAR LIVE MATCHES */}
              {categorized.regularLive.length > 0 && (
                <section className="animate-fadeIn">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-2 h-8 rounded-full bg-gradient-to-b from-red-600 to-orange-500 animate-pulse" />
                    <h2 className="text-xl italic font-black tracking-tight uppercase lg:text-2xl text-white/90">
                      Live Now <span className="ml-2 text-base text-red-500/70">({categorized.regularLive.length})</span>
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                    {categorized.regularLive.map(m => (
                      <MatchCard key={m.id} match={m} />
                    ))}
                  </div>
                </section>
              )}

              {/* UPCOMING MATCHES */}
              {categorized.upcoming.length > 0 && (
                <section className="animate-fadeIn">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-2 h-8 rounded-full bg-gradient-to-b from-blue-600 to-cyan-500" />
                    <h2 className="text-xl italic font-black tracking-tight uppercase lg:text-2xl text-white/80">
                      Upcoming Schedule <span className="ml-2 text-base text-blue-500/70">({categorized.upcoming.length})</span>
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 opacity-90">
                    {categorized.upcoming.map(m => (
                      <MatchCard key={m.id} match={m} />
                    ))}
                  </div>
                </section>
              )}

              {/* FINISHED MATCHES */}
              {categorized.finished.length > 0 && (
                <section className="animate-fadeIn">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-2 h-8 rounded-full bg-gradient-to-b from-gray-600 to-gray-400" />
                    <h2 className="text-xl italic font-black tracking-tight uppercase lg:text-2xl text-white/60">
                      Recent Results <span className="ml-2 text-base text-gray-500/70">({categorized.finished.length})</span>
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 opacity-80">
                    {categorized.finished.map(m => (
                      <MatchCard key={m.id} match={m} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </main>

        {/* FOOTER STATS - REMOVED from here */}
      </div>

      {/* RIGHT SIDEBAR - STATS, TABLES & ADS */}
      <div className={`${showSidebar ? 'block' : 'hidden'} lg:block fixed right-0 top-0 h-full w-full lg:w-[380px] bg-gradient-to-b from-[#0a0a0a] via-black to-[#050505] border-l border-white/5 z-30 overflow-y-auto`}>
        <div className="p-5 space-y-6">
          {/* SIDEBAR HEADER */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl">
                <BarChart size={18} className="text-white" />
              </div>
              <h3 className="text-lg font-black tracking-tight uppercase">Stats & Tables</h3>
            </div>
            <button 
              onClick={() => setShowSidebar(false)}
              className="p-2 lg:hidden text-white/40 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* 500% BONUS BANNER */}
          <div className="relative p-5 overflow-hidden border rounded-2xl bg-gradient-to-br from-yellow-900/40 via-yellow-800/20 to-black border-yellow-600/30">
            <div className="absolute top-0 right-0 w-32 h-32 translate-x-8 -translate-y-8 rounded-full bg-yellow-600/10"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 -translate-x-6 translate-y-6 rounded-full bg-yellow-500/5"></div>
            
            <div className="relative z-10 text-center">
              <div className="mb-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-full mb-3">
                  <Sparkles size={14} className="text-white" />
                  <span className="text-xs font-black tracking-widest uppercase">500% BOOSTER</span>
                  <Sparkles size={14} className="text-white" />
                </div>
                <h4 className="mb-1 text-2xl font-black leading-tight">
                  500% <span className="text-yellow-400">BONUS</span>
                </h4>
                <p className="mb-4 text-xs text-white/60">
                  Use code below for exclusive bonus
                </p>
              </div>

              {/* BONUS CODE */}
              <div className="mb-5">
                <p className="mb-2 text-xs tracking-widest uppercase text-white/40">Bonus Code</p>
                <div className="p-4 border-2 bg-gradient-to-r from-yellow-900/30 to-yellow-800/20 border-yellow-600/30 rounded-xl">
                  <p className="text-3xl font-black tracking-widest text-yellow-400">VORTEX</p>
                  <p className="text-[10px] text-white/40 mt-1">Copy and apply during deposit</p>
                </div>
              </div>

              {/* DEPOSIT BUTTON */}
              <button className="w-full py-3.5 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white font-black text-sm uppercase tracking-wider rounded-xl hover:from-yellow-700 hover:to-yellow-800 transition-all shadow-lg shadow-yellow-600/30 hover:shadow-xl hover:shadow-yellow-600/40 mb-3">
                DEPOSIT NOW
              </button>
              
              <p className="text-[10px] text-white/30">
                18+ | Terms apply | Gamble responsibly
              </p>
            </div>
          </div>

          {/* LEAGUE TABLES */}
          {leagueStandings.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-gradient-to-br from-red-600/20 to-red-500/10 rounded-lg">
                  <Trophy size={16} className="text-red-400" />
                </div>
                <h4 className="text-sm font-black tracking-wider uppercase text-white/80">League Standings</h4>
              </div>
              
              {leagueStandings.map((league, idx) => (
                <div key={idx} className="p-4 border bg-gradient-to-br from-white/5 to-transparent border-white/5 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-xs font-bold truncate text-white/90">{league.name}</h5>
                    <span className="text-[10px] text-white/40">{league.topTeams.length} teams</span>
                  </div>
                  
                  <div className="space-y-2">
                    {league.topTeams.map((team, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-black/20">
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold ${
                            index === 0 ? 'bg-yellow-600 text-yellow-100' :
                            index === 1 ? 'bg-gray-600 text-gray-100' :
                            index === 2 ? 'bg-orange-700 text-orange-100' :
                            'bg-gray-800/50 text-gray-300'
                          }`}>
                            {index + 1}
                          </div>
                          <span className="text-xs font-medium truncate max-w-[100px]">{team.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-xs font-bold text-white">{team.points}</div>
                            <div className="text-[9px] text-white/40">PTS</div>
                          </div>
                          <div className="text-right">
                            <div className={`text-xs font-bold ${
                              team.gd > 0 ? 'text-green-400' : team.gd < 0 ? 'text-red-400' : 'text-white'
                            }`}>
                              {team.gd > 0 ? '+' : ''}{team.gd}
                            </div>
                            <div className="text-[9px] text-white/40">GD</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI PREDICTIONS */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-gradient-to-br from-blue-600/20 to-blue-500/10 rounded-lg">
                <Target size={16} className="text-blue-400" />
              </div>
              <h4 className="text-sm font-black tracking-wider uppercase text-white/80">AI Predictions</h4>
            </div>
            
            <div className="space-y-3">
              {aiPicks.length > 0 ? (
                aiPicks.map((match, index) => (
                  <div 
                    key={match.id} 
                    className="p-4 transition-colors border bg-gradient-to-br from-white/5 to-transparent border-white/5 rounded-xl hover:border-blue-500/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 overflow-hidden rounded-full bg-black/40">
                          {match.home?.logo ? (
                            <img src={match.home.logo} className="object-contain w-4 h-4" alt={match.home.name} />
                          ) : (
                            <span className="text-xs font-bold">{match.home?.name?.charAt(0) || 'H'}</span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-white/40">vs</span>
                        <div className="flex items-center justify-center w-6 h-6 overflow-hidden rounded-full bg-black/40">
                          {match.away?.logo ? (
                            <img src={match.away.logo} className="object-contain w-4 h-4" alt={match.away.name} />
                          ) : (
                            <span className="text-xs font-bold">{match.away?.name?.charAt(0) || 'A'}</span>
                          )}
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-[10px] font-bold ${
                        match.isElite 
                          ? 'bg-gradient-to-r from-yellow-600/20 to-yellow-500/10 text-yellow-400' 
                          : 'bg-gradient-to-r from-red-600/20 to-red-500/10 text-red-400'
                      }`}>
                        {match.isElite ? 'ELITE' : 'LIVE'}
                      </div>
                    </div>
                    <p className="text-xs text-white/70 line-clamp-2">
                      {match.aiPick}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[10px] text-white/40">{match.league}</span>
                      <span className="text-[10px] font-bold text-red-400">
                        {match.home?.score || 0} - {match.away?.score || 0}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-white/30">
                  <span className="text-sm">No AI predictions yet</span>
                </div>
              )}
            </div>
          </div>

          {/* 1XBET AD */}
          <div className="relative p-5 overflow-hidden border rounded-2xl bg-gradient-to-br from-green-900/40 via-green-800/20 to-black border-green-600/30">
            <div className="absolute bottom-0 left-0 w-20 h-20 -translate-x-8 translate-y-8 rounded-full bg-green-500/10"></div>
            <div className="relative z-10 text-center">
              <div className="mb-4">
                <div className="inline-flex items-center px-4 py-2 mb-3 rounded-lg bg-gradient-to-r from-green-600 to-green-700">
                  <span className="text-xl font-black">1XBET</span>
                </div>
                <h4 className="mb-2 text-xl font-black">
                  BEST <span className="text-green-400">ODDS</span> GUARANTEED
                </h4>
                <p className="mb-4 text-xs text-white/60">
                  Up to €1,500 bonus + 150 free spins
                </p>
              </div>
              <button className="w-full py-3.5 bg-gradient-to-r from-green-600 to-green-700 text-white font-black text-sm uppercase tracking-wider rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg shadow-green-600/30 hover:shadow-xl hover:shadow-green-600/40">
                GET BEST ODDS
              </button>
              <p className="text-[10px] text-white/30 mt-3">
                Trusted partner | 24/7 support
              </p>
            </div>
          </div>

          {/* QUICK STATS */}
          <div className="p-5 border bg-gradient-to-br from-blue-900/20 via-blue-800/10 to-black border-blue-600/20 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-1.5 bg-gradient-to-br from-blue-600/20 to-blue-500/10 rounded-lg">
                <TrendingUp size={16} className="text-blue-400" />
              </div>
              <h4 className="text-sm font-black tracking-wider uppercase text-white/80">Live Match Stats</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">Total Live Matches</span>
                <span className="text-xs font-bold text-green-400">
                  {categorized.eliteLive.length + categorized.regularLive.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">Elite Matches</span>
                <span className="text-xs font-bold text-yellow-400">{categorized.eliteLive.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">Goals Today</span>
                <span className="text-xs font-bold text-red-400">
                  {matches.reduce((total, m) => total + (m.home?.score || 0) + (m.away?.score || 0), 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">AI Accuracy</span>
                <span className="text-xs font-bold text-purple-400">87%</span>
              </div>
            </div>
          </div>

          {/* FOOTER NOTE */}
          <div className="text-center text-[11px] text-white/40 pt-4 border-t border-white/5">
            <p>⚡ Vortex AI analyzes 10,000+ data points per match</p>
            <p className="mt-1">🔄 Live updates every 30 seconds</p>
            <p className="mt-1">🔒 Secure & encrypted connections</p>
          </div>
        </div>
      </div>
    </div>
  );
});

// Add display name for debugging
Home.displayName = 'Home';

export default Home;