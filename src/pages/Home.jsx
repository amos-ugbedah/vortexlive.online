import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Search, Clock, Trophy, Server } from 'lucide-react';

const Home = () => {
  const [matches, setMatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch matches from Firebase
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'fixtures'), (snapshot) => {
      setMatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // SOCIAL BAR SCRIPT INJECTION (Mobile Focused)
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '//pl25482485.profitablecpmrate.com/60/76/8a/60768a49c9584323c2a688a209867c42.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      unsub();
      // Clean up script if needed when component unmounts
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
      <div className="relative mb-8 group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="text-white/20 group-focus-within:text-red-500 transition-colors" size={20} />
        </div>
        <input 
          type="text" 
          placeholder="Search teams or leagues (e.g. Arsenal, La Liga)..." 
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-red-500/50 focus:bg-white/[0.07] transition-all text-sm font-medium"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* NATIVE BANNER AD SLOT (Highest Click-Through Rate) */}
      <div className="mb-8 w-full min-h-[100px] bg-white/5 border border-white/5 rounded-3xl overflow-hidden flex flex-col items-center justify-center">
        <div className="text-[8px] text-white/10 uppercase tracking-[0.3em] mb-2 font-bold">Suggested for you</div>
        {/* Replace the div below with your Adsterra Native Banner Code */}
        <div 
          id="container-adsterra-native" 
          className="w-full flex justify-center"
          dangerouslySetInnerHTML={{ __html: `` }}
        />
        {/* Placeholder if script is empty */}
        <div className="text-white/5 text-[10px] italic">Premium Content Advertisement</div>
      </div>

      <h2 className="text-xl font-black italic uppercase mb-6 flex items-center gap-2">
        <span className="w-2 h-6 bg-red-600 rounded-full"></span>
        {searchTerm ? `Results for "${searchTerm}"` : 'Top Live Matches'}
      </h2>

      {/* MATCH GRID */}
      {filteredMatches.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredMatches.map((match) => (
            <div key={match.id} className="group bg-white/5 border border-white/10 rounded-3xl p-5 hover:bg-white/10 hover:border-red-500/50 transition-all flex flex-col justify-between shadow-2xl">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1">
                    <Trophy size={10}/> {match.league}
                  </span>
                  {match.status?.toLowerCase() === 'live' && (
                    <span className="bg-red-600 text-[9px] px-2 py-0.5 rounded-full font-black animate-pulse shadow-lg shadow-red-600/40">LIVE</span>
                  )}
                </div>

                <div className="flex flex-col gap-1 mb-6 text-center">
                  <div className="font-bold text-lg tracking-tighter truncate">{match.home}</div>
                  <div className="text-white/10 text-[10px] font-black italic uppercase">VS</div>
                  <div className="font-bold text-lg tracking-tighter truncate">{match.away}</div>
                  <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-white/40 font-bold uppercase tracking-widest">
                    <Clock size={10} /> {match.time}
                  </div>
                </div>
              </div>

              {/* Server Selection & Button */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-black/40 rounded-xl px-3 py-2 border border-white/5">
                  <Server size={14} className="text-white/30" />
                  <select 
                    id={`server-${match.id}`} 
                    className="bg-transparent text-[10px] font-bold outline-none w-full cursor-pointer text-white"
                  >
                    {match.links ? match.links.map((link, i) => (
                      <option key={i} value={link.url} className="bg-zinc-900 text-white">
                        {link.name}
                      </option>
                    )) : (
                      <option value={match.streamUrl} className="bg-zinc-900 text-white">Main Server</option>
                    )}
                  </select>
                </div>

                <button 
                  onClick={() => handleLaunch(match.id)}
                  className="w-full py-3 bg-white text-black text-[10px] font-black uppercase rounded-xl group-hover:bg-red-600 group-hover:text-white transition-all transform active:scale-95"
                >
                  Watch Stream ➔
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
          <p className="text-white/30 font-bold italic">No matches found for your search.</p>
        </div>
      )}
    </div>
  );
};

export default Home;