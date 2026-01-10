/* eslint-disable */
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { 
  ChevronLeft, RefreshCcw, Monitor, BarChart3, 
  Activity, AlertCircle, Radio, Share2, CheckCircle2
} from 'lucide-react';
import IPTVPlayer from '../components/IPTVPlayer';
import UltraPlayer from '../components/UltraPlayer';

const MatchDetails = () => {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [activeServer, setActiveServer] = useState(1);
  const [key, setKey] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'matches', id), (doc) => {
      if (doc.exists()) setMatch(doc.data());
    });
    return () => unsub();
  }, [id]);

  /** * ROBUST STREAM DECODING LOGIC
   * 1. Handles Direct HTTP links
   * 2. Automatically decodes Base64 if needed
   * 3. Prevents crashes from malformed strings
   */
  const stream = useMemo(() => {
    const raw = activeServer === 1 ? match?.streamUrl1 : 
                activeServer === 2 ? match?.streamUrl2 : match?.streamUrl3;
    
    if (!raw || raw.trim().length < 5) return null;
    
    const cleanRaw = raw.trim();

    // If it's already a direct link, use it
    if (cleanRaw.startsWith('http')) return cleanRaw;
    
    try {
      // Attempt Base64 Decode
      const decoded = atob(cleanRaw);
      
      // Validation: If decoded string doesn't start with http, it might be raw text
      if (!decoded.startsWith('http')) return cleanRaw;
      
      // Clean up any stray HTML/Script tags that might break the player
      if (decoded.includes('<script') || decoded.includes('<html')) return null;
      
      return decoded;
    } catch (e) {
      // If atob fails, the string wasn't base64, so we treat it as a raw URL fallback
      console.warn("Signal processing fallback active");
      return cleanRaw;
    }
  }, [match, activeServer]);

  const handleShare = () => {
    const shareUrl = window.location.href;
    const shareText = `🔥 Watching ${match?.home?.name} vs ${match?.away?.name} LIVE in Ultra HD on Vortex Live! \n\nJoin the action here: \n${shareUrl}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Vortex Live HD',
        text: shareText,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const isM3U8 = stream?.toLowerCase().includes('.m3u8') || stream?.toLowerCase().includes('.ts');
  const isGoogleFallback = stream?.includes('google.com/search');

  return (
    <div className="min-h-screen bg-[#020202] text-white p-4 md:p-8 font-sans selection:bg-red-600/30 pb-24">
      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-ticker {
          display: inline-block;
          white-space: nowrap;
          animation: ticker-scroll 25s linear infinite;
        }
      `}</style>

      <div className="max-w-[1400px] mx-auto">
        {/* TOP NAV BAR */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-4 group">
             <div className="p-3 md:p-4 transition-all border bg-white/5 rounded-2xl border-white/10 group-hover:bg-red-600 group-hover:border-red-500 group-hover:shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                <ChevronLeft size={20} />
             </div>
             <div>
                <span className="block text-xl md:text-2xl italic font-black leading-none tracking-tighter text-red-600 uppercase">Vortex Live</span>
                <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Ultra HD Stream Link Provider</span>
             </div>
          </Link>
          
          <div className="flex items-center gap-2 md:gap-3">
             <button 
               onClick={handleShare}
               className="flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 transition-all border bg-zinc-900 border-white/10 rounded-2xl hover:bg-blue-600 hover:border-blue-500 group"
             >
               {copied ? <CheckCircle2 size={18} className="text-green-400" /> : <Share2 size={18} className="text-blue-400" />}
               <span className="hidden md:block text-[10px] font-black uppercase tracking-widest">{copied ? 'Copied!' : 'Share Match'}</span>
             </button>

             <button 
               onClick={() => setKey(k => k+1)} 
               className="flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 transition-all border bg-zinc-900 border-white/10 rounded-2xl hover:bg-zinc-800 hover:border-red-500/50 group"
             >
               <RefreshCcw size={18} className="text-red-600 transition-transform duration-700 group-hover:rotate-180" />
               <span className="hidden md:block text-[10px] font-black uppercase tracking-widest">Repair Signal</span>
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
          {/* MAIN BROADCAST SECTION */}
          <div className="space-y-6 xl:col-span-8">
            <div className="relative aspect-video bg-black rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl shadow-red-900/5 group">
              
              <div className="absolute z-30 flex items-center gap-2 transition-opacity duration-500 opacity-0 top-4 right-4 md:top-6 md:right-6 group-hover:opacity-100">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    onClick={() => setActiveServer(num)}
                    className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[9px] md:text-[10px] font-bold border backdrop-blur-md transition-all ${
                      activeServer === num ? 'bg-red-600 border-red-500 text-white' : 'bg-black/40 border-white/10 text-white/60 hover:bg-black/60'
                    }`}
                  >
                    SRV 0{num}
                  </button>
                ))}
              </div>

              {stream ? (
                isGoogleFallback ? (
                  <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center bg-zinc-900">
                    <Radio size={60} className="text-red-600 animate-pulse" />
                    <div>
                      <h3 className="mb-2 text-lg font-black tracking-widest uppercase">Anti-Block Signal Found</h3>
                      <p className="max-w-md mx-auto mb-6 text-xs font-bold leading-relaxed uppercase opacity-60">
                        The direct satellite link is encrypted. Use the Vortex bypass button below to access the live stream.
                      </p>
                      <a 
                        href={stream} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-block bg-red-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-105 transition-transform"
                      >
                        Launch Direct Signal Bypass
                      </a>
                    </div>
                  </div>
                ) : (
                  isM3U8 ? 
                    <IPTVPlayer key={`${stream}-${key}`} url={stream} /> : 
                    <UltraPlayer key={`${stream}-${key}`} url={stream} />
                )
              ) : (
                <div 
                  className="relative flex flex-col items-center justify-center h-full gap-6 overflow-hidden cursor-pointer bg-zinc-900/40"
                  onClick={() => setKey(k => k+1)}
                >
                  <div className="absolute inset-0 opacity-50 bg-gradient-to-t from-red-600/10 to-transparent" />
                  <div className="relative">
                    <Radio size={80} className="text-red-600 transition-transform animate-pulse" />
                    <div className="absolute inset-0 bg-red-600 blur-[60px] opacity-20" />
                  </div>
                  <div className="z-10 text-center px-4">
                    <span className="block text-sm font-black uppercase tracking-[0.4em] mb-2 text-white/90">Searching for Live Signal</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 italic">
                      Checking Satellite Servers...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* SERVER GRID */}
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              {[match?.streamUrl1, match?.streamUrl2, match?.streamUrl3].map((raw, idx) => {
                const n = idx + 1;
                if (!raw || raw.length < 5) return null;

                return (
                  <button
                    key={n}
                    onClick={() => setActiveServer(n)}
                    className={`relative p-4 md:p-6 rounded-2xl md:rounded-[2rem] border transition-all duration-300 group overflow-hidden ${
                      activeServer === n 
                        ? 'bg-red-600 border-red-400 shadow-lg shadow-red-600/20' 
                        : 'bg-zinc-900/40 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="relative z-10 flex flex-col items-center">
                      <Monitor size={18} className={`mb-2 ${activeServer === n ? 'text-white' : 'text-red-600'}`} />
                      <span className="text-[9px] md:text-[11px] font-black uppercase tracking-widest">Server 0{n}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* STATS SECTION */}
            <div className="bg-zinc-900/30 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-white/5 backdrop-blur-2xl">
               <div className="flex items-center gap-3 mb-8 md:mb-10">
                  <BarChart3 size={20} className="text-red-600" />
                  <span className="text-xs font-black tracking-widest uppercase">Match Analysis</span>
               </div>
               <div className="grid gap-8 md:gap-10">
                  <StatBar label="Ball Control" home={match?.home?.score > match?.away?.score ? 55 : 45} away={match?.away?.score > match?.home?.score ? 55 : 45} suffix="%" />
                  <StatBar label="Pressure" home={match?.home?.score || 0} away={match?.away?.score || 0} />
               </div>
            </div>
          </div>

          {/* SCOREBOARD SECTION */}
          <div className="space-y-6 xl:col-span-4">
            <div className="bg-zinc-900/40 p-6 md:p-10 rounded-[2rem] md:rounded-[3.5rem] border border-white/5 text-center relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent" />
               <p className="text-[8px] md:text-[10px] font-black opacity-30 uppercase tracking-[0.5em] mb-8 md:mb-12">{match?.league || 'Vortex Stadium'}</p>
               
               <div className="flex items-center justify-between gap-4 px-2 md:px-4 mb-8 md:mb-12">
                  <TeamUI logo={match?.home?.logo} name={match?.home?.name} />
                  <div className="flex flex-col items-center">
                    <div className="mb-2 text-4xl md:text-6xl italic font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                      {match?.home?.score || 0}:{match?.away?.score || 0}
                    </div>
                    <div className="px-3 py-1 border rounded-full bg-red-600/10 border-red-600/20">
                       <span className="text-[8px] md:text-[10px] font-black text-red-500 uppercase">
                          {match?.status === 'NS' ? 'Upcoming' : `${match?.minute || 0}' LIVE`}
                       </span>
                    </div>
                  </div>
                  <TeamUI logo={match?.away?.logo} name={match?.away?.name} />
               </div>
            </div>

            <div className="bg-gradient-to-br from-red-600 to-red-800 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl shadow-red-900/30">
               <div className="flex items-center gap-3 mb-4 text-white">
                  <AlertCircle size={20} />
                  <span className="text-[10px] font-black tracking-widest uppercase">Network Tip</span>
               </div>
               <p className="text-[10px] md:text-[11px] font-bold leading-relaxed text-white/90 uppercase">
                  Experiencing lag? Switch to Server 02 or use the Quick Server tabs above the player for a seamless experience.
               </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- PRO BROADCAST TICKER --- */}
      <div className="fixed bottom-0 left-0 w-full bg-red-600 h-12 flex items-center overflow-hidden border-t border-white/20 z-[9999]">
        <div className="bg-black px-4 md:px-6 h-full flex items-center z-20 border-r border-red-500 shadow-[10px_0_20px_rgba(0,0,0,0.5)]">
          <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
            Vortex<span className="text-red-600">Live</span>
          </span>
        </div>
        <div className="relative flex items-center flex-1 h-full overflow-hidden bg-red-700/30">
          <div className="absolute animate-ticker whitespace-nowrap">
            <span className="mx-8 md:mx-12 text-[10px] md:text-[12px] font-black uppercase italic text-white drop-shadow-md">
              🛰️ SIGNAL STATUS: SERVER {activeServer} ACTIVE & STABLE ... 
            </span>
            <span className="mx-8 md:mx-12 text-[10px] md:text-[12px] font-black uppercase italic text-white drop-shadow-md">
              ⚽ {match?.home?.name} {match?.home?.score} - {match?.away?.score} {match?.away?.name} ({match?.minute || 0}') ... 
            </span>
            <span className="mx-8 md:mx-12 text-[10px] md:text-[12px] font-black uppercase italic text-white drop-shadow-md">
              📺 BROADCASTING IN ULTRA HD 4K ... NO BUFFERING PROTOCOL ENABLED ... 
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const TeamUI = ({ logo, name }) => (
  <div className="flex flex-col items-center w-20 md:w-24 gap-3 md:gap-4">
    <div className="flex items-center justify-center w-16 h-16 md:w-24 md:h-24 p-3 md:p-5 border rounded-full shadow-inner bg-white/5 border-white/5">
      {logo ? <img src={logo} alt="" className="object-contain max-w-full max-h-full drop-shadow-2xl" /> : <Activity size={24} className="text-red-600 opacity-10" />}
    </div>
    <span className="text-[9px] md:text-[11px] font-black uppercase text-center tracking-widest leading-tight h-8 flex items-center">{name || '---'}</span>
  </div>
);

const StatBar = ({ label, home, away, suffix = "" }) => {
  const h = parseFloat(home) || 0;
  const a = parseFloat(away) || 0;
  const total = h + a || 1;
  const width = (h / total) * 100;
  return (
    <div className="space-y-4">
      <div className="flex justify-between text-[10px] md:text-[11px] font-black uppercase tracking-tighter">
        <span className="text-red-500">{h}{suffix}</span>
        <span className="opacity-40">{label}</span>
        <span>{a}{suffix}</span>
      </div>
      <div className="h-2 md:h-3 overflow-hidden rounded-full bg-white/5 p-[2px]">
        <div style={{ width: `${width}%` }} className="h-full bg-red-600 transition-all duration-1000 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
      </div>
    </div>
  );
};

export default MatchDetails;