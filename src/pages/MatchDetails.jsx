import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { ChevronLeft, Trophy, Lock, ShieldCheck, Maximize, Volume2, Info } from 'lucide-react';

const MatchDetails = () => {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [standings, setStandings] = useState([]);
  const [activeServer, setActiveServer] = useState(1);

  const decodeLink = (str) => {
    if (!str || str.length < 10) return "";
    try { return atob(str); } catch (e) { return str; }
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'matches', id), (doc) => {
      if (doc.exists()) setMatch(doc.data());
    });
    return () => unsub();
  }, [id]);

  useEffect(() => {
    if (match?.leagueId) fetchStandings(match.leagueId);
  }, [match?.leagueId]);

  const fetchStandings = async (leagueId) => {
    try {
      const res = await fetch(`https://v3.football.api-sports.io/standings?league=${leagueId}&season=2025`, {
        headers: { 'x-apisports-key': '0131b99f8e87a724c92f8b455cc6781d' }
      });
      const data = await res.json();
      setStandings(data.response[0]?.league?.standings[0] || []);
    } catch (e) {}
  };

  const currentStream = decodeLink(
    activeServer === 1 ? match?.streamUrl1 : 
    activeServer === 2 ? match?.streamUrl2 : 
    match?.streamUrl3
  );

  const isM3U8 = currentStream.includes('.m3u8');

  return (
    <div className="min-h-screen bg-[#070708] text-white p-3 md:p-8 overflow-y-auto pb-24">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <Link to="/" className="flex items-center gap-1 text-white/40 uppercase text-[9px] font-black tracking-widest hover:text-white transition-colors">
          <ChevronLeft size={14} /> Back to Schedule
        </Link>
        <div className="flex items-center gap-2 px-3 py-1 border rounded-full bg-emerald-500/5 border-emerald-500/20">
          <ShieldCheck size={12} className="text-emerald-500" />
          <span className="text-[8px] md:text-[10px] font-black text-emerald-500 uppercase">Secure Tunnel Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          
          {/* PLAYER CONTAINER (Z-INDEX FIX) */}
          <div className="relative z-20 aspect-video bg-black rounded-2xl md:rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl shadow-red-600/5 group">
            {currentStream ? (
              <iframe 
                src={isM3U8 ? `https://p.m3u8play.com/player.php?url=${currentStream}` : currentStream} 
                className="w-full h-full" 
                // PERMISSIONS ENABLED: Play, Unmute, and Maximize will now work
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                allowFullScreen={true}
                webkitallowfullscreen="true"
                mozallowfullscreen="true"
                // Referrer hack to bypass "Pirate Logo" blocking
                referrerPolicy="no-referrer"
                scrolling="no" 
                frameBorder="0" 
                title="Vortex Player"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <Lock size={32} className="mb-4 text-white/10" />
                <h2 className="text-sm italic font-black uppercase">Handshake Failed</h2>
                <p className="text-white/30 text-[8px] mt-2 font-bold uppercase">Try another server below</p>
              </div>
            )}
          </div>

          {/* SERVER SELECTION */}
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {[1, 2, 3].map((num) => (
              <button key={num} onClick={() => setActiveServer(num)}
                className={`py-4 rounded-2xl text-[9px] font-black uppercase transition-all border ${
                  activeServer === num 
                  ? 'bg-red-600 border-red-500 text-white shadow-lg' 
                  : 'bg-zinc-900 border-white/5 text-white/30 hover:border-white/20'
                }`}
              >
                Server {num}
              </button>
            ))}
          </div>

          {/* SCOREBOARD */}
          <div className="bg-zinc-900/40 border border-white/5 rounded-[2rem] p-6 md:p-10">
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center flex-1 gap-3">
                <img src={match?.homeTeam?.logo} className="object-contain w-10 h-10 md:w-16 md:h-16" alt="" />
                <span className="text-[10px] font-black uppercase">{match?.homeTeam?.name}</span>
              </div>
              <div className="flex-1 text-center">
                <div className="text-4xl italic font-black md:text-6xl">{match?.homeScore} : {match?.awayScore}</div>
                <div className="text-[10px] font-black text-red-600 uppercase mt-2">{match?.status || 'Live'}</div>
              </div>
              <div className="flex flex-col items-center flex-1 gap-3">
                <img src={match?.awayTeam?.logo} className="object-contain w-10 h-10 md:w-16 md:h-16" alt="" />
                <span className="text-[10px] font-black uppercase">{match?.awayTeam?.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* STANDINGS PANEL */}
        <aside className="bg-zinc-900/40 border border-white/5 rounded-[2rem] p-6">
          <h3 className="flex items-center gap-2 text-[10px] font-black uppercase text-red-600 mb-6"><Trophy size={14} /> Standings</h3>
          <div className="space-y-2">
            {standings.length > 0 ? standings.slice(0, 10).map((t, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 text-[10px] font-bold uppercase">
                <div className="flex items-center gap-3"><img src={t.team.logo} className="w-4 h-4" /><span>{t.team.name}</span></div>
                <span className="text-emerald-500">{t.points} PTS</span>
              </div>
            )) : <div className="text-center py-4 text-[9px] opacity-20 uppercase font-black">Syncing...</div>}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default MatchDetails;