import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { ChevronLeft, Trophy, Lock, ShieldCheck, Info } from 'lucide-react';
import IPTVPlayer from '../components/IPTVPlayer'; // Make sure this path is correct

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

  const isM3U8 = currentStream.toLowerCase().includes('.m3u8');

  return (
    <div className="min-h-screen bg-[#070708] text-white p-3 md:p-8 overflow-y-auto pb-24">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <Link to="/" className="flex items-center gap-1 text-white/40 uppercase text-[9px] font-black tracking-widest hover:text-white transition-colors">
          <ChevronLeft size={14} /> Back
        </Link>
        <div className="flex items-center gap-2 px-3 py-1 border rounded-full bg-emerald-500/5 border-emerald-500/20">
          <ShieldCheck size={12} className="text-emerald-500" />
          <span className="text-[8px] md:text-[10px] font-black text-emerald-500 uppercase tracking-widest">Secure Broadcast</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          
          <div className="relative z-20 aspect-video bg-black rounded-2xl md:rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl group">
            {currentStream ? (
              isM3U8 ? (
                /* NATIVE IPTV PLAYER */
                <IPTVPlayer url={currentStream} />
              ) : (
                /* STANDARD IFRAME PLAYER */
                <iframe 
                  src={currentStream} 
                  className="w-full h-full" 
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                  allowFullScreen={true}
                  webkitallowfullscreen="true"
                  mozallowfullscreen="true"
                  referrerPolicy="no-referrer"
                  scrolling="no" 
                  frameBorder="0" 
                  title="Vortex Player"
                />
              )
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <Lock size={32} className="mb-4 text-white/10" />
                <h2 className="text-sm italic font-black tracking-tighter uppercase">Server Handshake Failed</h2>
                <p className="text-white/30 text-[8px] mt-2 font-bold uppercase tracking-widest">Please select Server 2 or 3 below</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {[1, 2, 3].map((num) => (
              <button key={num} onClick={() => setActiveServer(num)}
                className={`py-4 rounded-2xl text-[9px] font-black uppercase transition-all border ${
                  activeServer === num 
                  ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/20' 
                  : 'bg-zinc-900 border-white/5 text-white/30 hover:border-white/20'
                }`}
              >
                Server {num}
              </button>
            ))}
          </div>

          <div className="bg-zinc-900/40 border border-white/5 rounded-[2rem] p-6 md:p-10 relative overflow-hidden">
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex flex-col items-center flex-1 gap-3">
                <img src={match?.homeTeam?.logo} className="object-contain w-12 h-12 md:w-20 md:h-20" alt="" />
                <span className="text-[10px] font-black uppercase text-center">{match?.homeTeam?.name}</span>
              </div>

              <div className="flex-1 text-center">
                <div className="text-4xl italic font-black tracking-tighter text-white md:text-6xl">
                  {match?.homeScore} <span className="text-red-600">:</span> {match?.awayScore}
                </div>
                {/* Penalty Score Logic */}
                {match?.penaltyScore && (
                   <div className="text-[10px] font-bold text-zinc-500 mt-1 uppercase">PENS: {match.penaltyScore}</div>
                )}
                <div className="inline-block px-4 py-1 bg-red-600/10 border border-red-600/20 text-[10px] font-black text-red-600 uppercase mt-4 rounded-full animate-pulse">
                  {match?.status === 'ET' ? 'Extra Time' : match?.status === 'P' ? 'Penalties' : match?.status || 'Live'}
                </div>
              </div>

              <div className="flex flex-col items-center flex-1 gap-3">
                <img src={match?.awayTeam?.logo} className="object-contain w-12 h-12 md:w-20 md:h-20" alt="" />
                <span className="text-[10px] font-black uppercase text-center">{match?.awayTeam?.name}</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 border bg-blue-600/5 border-blue-500/10 rounded-2xl">
            <Info size={18} className="text-blue-500 shrink-0" />
            <p className="text-[9px] text-zinc-400 font-bold uppercase leading-relaxed">
              Vortex Engine: Currently using {isM3U8 ? 'Native HLS Decoder' : 'Encrypted Iframe Proxy'}. If the stream freezes, toggle between servers to re-establish connection.
            </p>
          </div>
        </div>

        <aside className="space-y-4">
           <div className="bg-zinc-900/40 border border-white/5 rounded-[2rem] p-6">
              <h3 className="flex items-center gap-2 text-[10px] font-black uppercase text-red-600 mb-6 tracking-widest">
                <Trophy size={14} /> League Standings
              </h3>
              <div className="space-y-2">
                {standings.length > 0 ? standings.slice(0, 10).map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 transition-colors rounded-xl bg-white/5 hover:bg-white/10">
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black text-white/20 w-3">{idx + 1}</span>
                      <img src={t.team.logo} className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase">{t.team.name}</span>
                    </div>
                    <span className="text-[10px] font-black text-emerald-500">{t.points} PTS</span>
                  </div>
                )) : (
                  <div className="py-10 text-center">
                    <div className="w-4 h-4 mx-auto border-2 border-red-600 rounded-full border-t-transparent animate-spin" />
                  </div>
                )}
              </div>
           </div>
        </aside>
      </div>
    </div>
  );
};

export default MatchDetails;