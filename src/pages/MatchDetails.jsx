/* eslint-disable */
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { 
  ChevronLeft, RefreshCcw, BarChart3, Radio, Share2, 
  CheckCircle2, Shield, BrainCircuit, Tv, Wifi, Zap
} from 'lucide-react';
import IPTVPlayer from '../components/IPTVPlayer';
import UltraPlayer from '../components/UltraPlayer';
import { 
  normalizeMatch, isMatchLive, isMatchUpcoming, 
  isMatchFinished, getMatchStatusText, formatAIPick,
  getDecodedStreamUrl, isAutoDetected, calculateEstimatedMinute
} from '../lib/matchUtils';

const MatchDetails = () => {
  const { id } = useParams(); 
  const [match, setMatch] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); 
  const [copied, setCopied] = useState(false);
  const [activeServer, setActiveServer] = useState(1);

  useEffect(() => {
    const matchDocId = String(id || '');
    if (!matchDocId) return;
    
    const docRef = doc(db, 'matches', matchDocId);
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const cleanData = normalizeMatch(docSnap.data(), docSnap.id);
        setMatch(cleanData);
      }
    }, (err) => console.error("Vortex Signal Error:", err));
    
    return () => unsub();
  }, [id]);

  const stream = useMemo(() => {
    if (!match) return null;
    const rawUrl = match[`streamUrl${activeServer}`] || match.streamUrl1;
    return getDecodedStreamUrl(rawUrl);
  }, [match, activeServer]);

  const autoLive = isAutoDetected(match);
  const isLive = isMatchLive(match) || autoLive;
  const isFinished = isMatchFinished(match);
  const isUpcoming = !isLive && !isFinished;
  const isM3U8 = stream?.toLowerCase().includes('m3u8') || stream?.toLowerCase().includes('.ts');
  const estMinute = calculateEstimatedMinute(match);

  const handleShare = useCallback(() => {
    if (!match) return;
    const shareText = `Watching ${match.home.name} vs ${match.away.name} LIVE on Vortex! \nLink: ${window.location.href}`;
    if (navigator.share) {
      navigator.share({ title: 'Vortex Live', text: shareText, url: window.location.href });
    } else {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }, [match]);

  if (!match) return <LoadingScreen id={id} />;

  return (
    <div className="min-h-screen bg-[#020202] text-white selection:bg-red-600/30 pb-24 font-sans">
      <style>{`
        @keyframes ticker-scroll { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-ticker { display: inline-block; white-space: nowrap; animation: ticker-scroll 25s linear infinite; }
      `}</style>

      <div className="max-w-[1500px] mx-auto p-4 md:p-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl group-hover:bg-red-600 transition-all">
              <ChevronLeft size={20} />
            </div>
            <div>
              <h1 className="text-2xl italic font-black text-red-600 uppercase tracking-tighter">Vortex Live</h1>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Direct Satellite Link</span>
            </div>
          </Link>

          <div className="flex gap-3 w-full md:w-auto">
            <button onClick={() => setRefreshKey(k => k + 1)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 border border-white/10 rounded-xl hover:bg-zinc-800">
              <RefreshCcw size={18} className="text-red-600" />
              <span className="text-[10px] font-black uppercase">Refresh</span>
            </button>
            <button onClick={handleShare} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-red-600 rounded-xl hover:bg-red-700">
              {copied ? <CheckCircle2 size={18} /> : <Share2 size={18} />}
              <span className="text-[10px] font-black uppercase">{copied ? 'Link Copied' : 'Share'}</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="relative aspect-video bg-black rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
              {stream && isLive ? (
                <div key={`${refreshKey}-${activeServer}`} className="w-full h-full">
                  {isM3U8 ? <IPTVPlayer url={stream} /> : <UltraPlayer url={stream} />}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full bg-zinc-900/50 p-8 text-center">
                  <Radio size={64} className="text-red-600 animate-pulse mb-4" />
                  <h2 className="text-xl font-black uppercase tracking-widest">
                    {isUpcoming ? 'Signal Standing By' : 'Broadcast Finished'}
                  </h2>
                  <p className="text-sm text-white/40 mt-2 max-w-md text-center">
                    {isUpcoming 
                      ? `Uplink available at ${new Date(match.kickoff).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` 
                      : 'The live event has concluded.'}
                  </p>
                </div>
              )}
            </div>

            {isLive && (
              <div className="flex flex-wrap gap-3">
                {[1, 2, 3].map((srv) => match[`streamUrl${srv}`] && (
                  <button 
                    key={srv}
                    onClick={() => setActiveServer(srv)}
                    className={`px-6 py-3 rounded-xl flex items-center gap-3 border transition-all ${activeServer === srv ? 'bg-red-600 border-red-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  >
                    <Tv size={16} />
                    <span className="text-[10px] font-black uppercase">Server {srv}</span>
                  </button>
                ))}
              </div>
            )}
            
            <div className="bg-zinc-900/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5">
                <div className="flex items-center gap-3 mb-8">
                    <BarChart3 className="text-red-600" />
                    <h3 className="text-sm font-black uppercase tracking-widest">Vortex Engine Analytics</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <StatBar label="Win Probability" home={50} away={50} suffix="%" />
                    <StatBar label="Possession" home={50} away={50} suffix="%" />
                </div>
            </div>
          </div>

          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-zinc-900/40 p-8 rounded-[2.5rem] border border-white/5 text-center">
              <div className="flex items-center justify-center gap-2 mb-6 opacity-40">
                <Shield size={14} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] truncate">{match.league}</span>
              </div>

              <div className="flex items-center justify-between mb-8 px-4">
                <TeamUI logo={match.home.logo} name={match.home.name} />
                <div className="flex flex-col items-center">
                  <div className="text-5xl font-black italic tracking-tighter mb-2">
                    {match.home.score}:{match.away.score}
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-2 ${isLive ? 'bg-red-600 shadow-lg' : 'bg-zinc-800'}`}>
                    {autoLive && <Wifi size={12} className="animate-pulse" />}
                    {getMatchStatusText(match)} {isLive && !['HT','FT'].includes(match.status) && `• ${match.minute || estMinute || 0}'`}
                  </div>
                </div>
                <TeamUI logo={match.away.logo} name={match.away.name} />
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-red-600/20 to-transparent border border-red-600/20 rounded-[2rem] relative overflow-hidden">
               <Zap className="absolute -right-4 -top-4 text-red-600/10 w-24 h-24 rotate-12" />
               <div className="flex items-center gap-3 mb-3">
                <BrainCircuit size={20} className="text-red-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Tactical Edge</span>
              </div>
              <p className="text-sm font-medium italic text-white/90 leading-relaxed">
                "{formatAIPick(match.aiPick)}"
              </p>
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full h-14 bg-red-600 flex items-center overflow-hidden z-[9999]">
        <div className="bg-black px-8 h-full flex items-center z-10 border-r border-white/10">
          <span className="text-[11px] font-black uppercase tracking-widest">Vortex<span className="text-red-500">Live</span></span>
        </div>
        <div className="relative flex-1 overflow-hidden">
          <div className="animate-ticker">
            <span className="mx-8 text-[12px] font-black uppercase italic tracking-wider">
              🛰️ STATUS: {isLive ? 'BROADCAST ACTIVE' : 'STANDING BY'} ... {match.home.name} vs {match.away.name} ... RESOLUTION: 4K ULTRA HD ...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoadingScreen = ({ id }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-[#020202]">
    <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-6" />
    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Syncing {id}...</p>
  </div>
);

const TeamUI = ({ logo, name }) => (
  <div className="flex flex-col items-center gap-3 w-24">
    <div className="w-20 h-20 p-4 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-center">
      <img src={logo} alt={name} className="max-w-full max-h-full object-contain" />
    </div>
    <span className="text-[10px] font-black uppercase text-center leading-tight tracking-tighter">{name}</span>
  </div>
);

const StatBar = ({ label, home, away, suffix = "" }) => (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
        <span className="text-red-500">{home}{suffix}</span>
        <span className="opacity-30">{label}</span>
        <span>{away}{suffix}</span>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden flex">
        <div style={{ width: `${home}%` }} className="h-full bg-red-600 transition-all duration-1000" />
      </div>
    </div>
);

export default MatchDetails;