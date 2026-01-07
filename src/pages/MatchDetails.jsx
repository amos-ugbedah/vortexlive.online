import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { ChevronLeft, Trophy, Share2, Copy, Check, Lock, ShieldCheck } from 'lucide-react';

const MatchDetails = () => {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [standings, setStandings] = useState([]);
  const [activeServer, setActiveServer] = useState(1);
  const [copied, setCopied] = useState(false);

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

  const currentStream = decodeLink(activeServer === 1 ? match?.streamUrl1 : activeServer === 2 ? match?.streamUrl2 : match?.streamUrl3);

  // --- IPTV (GITHUB) DETECTION ---
  const isM3U8 = currentStream.includes('.m3u8');

  return (
    <div className="min-h-screen bg-[#070708] text-white p-3 md:p-8">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <Link to="/" className="flex items-center gap-1 text-white/40 uppercase text-[9px] font-black tracking-widest"><ChevronLeft size={14} /> Back</Link>
        <div className="flex items-center gap-2 px-3 py-1 border rounded-full bg-white/5 border-white/10">
          <div className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[8px] md:text-[10px] font-black text-emerald-500 uppercase">Secure Tunnel Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          
          <div className="relative aspect-video bg-black rounded-2xl md:rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl player-glow">
            {currentStream ? (
              isM3U8 ? (
                // IF it's an IPTV .m3u8 link, we use a basic HLS web player (via iframe provider)
                <iframe 
                  src={`https://p.m3u8play.com/player.php?url=${currentStream}`} 
                  className="w-full h-full" 
                  allowFullScreen 
                  frameBorder="0" 
                />
              ) : (
                // STANDARD AGGREGATOR / EMBED HACK
                <iframe 
                  src={currentStream} 
                  className="w-full h-full" 
                  allowFullScreen 
                  scrolling="no" 
                  frameBorder="0" 
                  referrerPolicy="no-referrer" // THE HACK: Hides your site identity
                  allow="autoplay; encrypted-media" 
                />
              )
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <Lock size={32} className="mb-4 text-white/10" />
                <h2 className="text-sm italic font-black uppercase">Channel Handshake Failed</h2>
                <p className="text-white/30 text-[8px] mt-2 font-bold uppercase">Select another server above</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {[1, 2, 3].map((num) => (
              <button key={num} onClick={() => setActiveServer(num)}
                className={`py-3 rounded-xl text-[8px] font-black uppercase transition-all border flex flex-col items-center gap-1 ${activeServer === num ? 'bg-white/10 border-white/40' : 'bg-white/5 border-white/5 text-white/30'}`}
              >
                SERVER {num}
              </button>
            ))}
          </div>

          {/* TEAM SCOREBOARD (Original Logic Kept) */}
          <div className="bg-zinc-900/40 border border-white/5 rounded-2xl md:rounded-[2.5rem] p-5 md:p-8">
            <div className="flex items-center justify-between mb-8 text-center">
              <div className="flex flex-col items-center flex-1 gap-2">
                <img src={match?.homeTeam?.logo} className="object-contain w-12 h-12 md:w-20 md:h-20" alt="" />
                <span className="text-[10px] font-black uppercase">{match?.homeTeam?.name}</span>
              </div>
              <div className="flex-1">
                <div className="text-4xl italic font-black md:text-6xl">{match?.homeScore} : {match?.awayScore}</div>
                <div className="text-[10px] font-black text-red-600 uppercase mt-2">{match?.status}</div>
              </div>
              <div className="flex flex-col items-center flex-1 gap-2">
                <img src={match?.awayTeam?.logo} className="object-contain w-12 h-12 md:w-20 md:h-20" alt="" />
                <span className="text-[10px] font-black uppercase">{match?.awayTeam?.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* STANDINGS PANEL REMAINS THE SAME */}
        <aside className="lg:block">
           <div className="bg-zinc-900/40 border border-white/5 rounded-2xl md:rounded-[2.5rem] p-5">
              <h3 className="flex items-center gap-2 text-[9px] font-black uppercase text-red-600 mb-6"><Trophy size={14} /> Standings</h3>
              {standings.length > 0 ? standings.slice(0, 10).map((t) => (
                <div key={t.team.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 text-[10px] font-bold mb-1">
                  <div className="flex items-center gap-2"><img src={t.team.logo} className="w-4 h-4" /><span>{t.team.name}</span></div>
                  <span className="text-emerald-500">{t.points}</span>
                </div>
              )) : <div className="text-center py-4 text-[9px] opacity-20 uppercase font-black">Syncing...</div>}
           </div>
        </aside>
      </div>
    </div>
  );
};

export default MatchDetails;