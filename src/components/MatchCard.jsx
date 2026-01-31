/* eslint-disable */
import React, { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, BrainCircuit, Play, Clock, Trophy, Tv 
} from 'lucide-react';
import * as utils from '../lib/matchUtils';

const MatchCard = memo(({ match: m }) => {
  const navigate = useNavigate();

  const matchData = useMemo(() => {
    if (!m) return null;

    const isFinished = utils.isMatchFinished(m);
    const isLive = utils.isMatchLive(m);
    const isUpcoming = utils.isMatchUpcoming(m);
    const statusText = utils.getMatchStatusText(m);

    // FIX: Ensure we detect streams even if they are empty strings or null
    const hasStream1 = m.streamUrl1 && m.streamUrl1.length > 5;
    const hasStream2 = m.streamUrl2 && m.streamUrl2.length > 5;
    const hasStream3 = m.streamUrl3 && m.streamUrl3.length > 5;

    return {
      isLive,
      isFinished,
      isUpcoming,
      isElite: utils.isEliteMatch(m),
      streamCount: (hasStream1 ? 1 : 0) + (hasStream2 ? 1 : 0) + (hasStream3 ? 1 : 0),
      // IMPORTANT: Use the document ID if the internal ID is missing
      safeId: String(m.id || ''),
      statusText
    };
  }, [m]);

  if (!matchData) return <div className="h-64 border rounded-2xl bg-gray-900/50 animate-pulse border-white/5" />;

  const { isLive, isFinished, isElite, streamCount, safeId, statusText } = matchData;

  const getStatusStyle = () => {
    if (isLive) return 'bg-red-600 text-white shadow-lg shadow-red-900/40 animate-pulse';
    if (isFinished) return 'bg-gray-800 text-gray-400';
    return 'bg-blue-600/20 text-blue-400 border border-blue-500/30';
  };

  return (
    <div 
      onClick={() => safeId && navigate(`/match/${safeId}`)}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer active:scale-[0.98] h-full
        ${isElite ? 'border-yellow-500/30 bg-gradient-to-br from-yellow-950/20 to-black' : 'border-white/5 bg-gray-900/40'}
        ${isLive ? 'border-red-500/30' : ''} 
        hover:border-red-500/40 hover:shadow-xl hover:shadow-red-500/5`}
    >
      <div className="absolute z-10 flex items-start justify-between top-3 inset-x-3">
        <div className="flex gap-1.5">
          {isLive && (
            <div className="flex items-center gap-1 px-2 py-1 bg-red-600 rounded-full text-[8px] font-black text-white">
              <span className="w-1 h-1 bg-white rounded-full animate-ping" /> <span>LIVE</span>
            </div>
          )}
          {/* UPDATED: Only show badge if streams actually exist */}
          {streamCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-[8px] font-black text-white">
              <Tv size={10} /> <span>{streamCount} STREAMS</span>
            </div>
          )}
        </div>
        {isElite && (
          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-600 rounded-full text-[8px] font-black text-white shadow-lg">
            <Trophy size={10} /> <span>ELITE</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between p-5 pb-0 mt-6">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex-shrink-0 w-5 h-5 rounded bg-white/5 flex items-center justify-center p-0.5">
            {m.leagueLogo ? <img src={m.leagueLogo} className="object-contain w-full h-full" alt="league" /> : <ShieldCheck size={12} className="text-white/20" />}
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-white/40 truncate">{m.league || 'Vortex Pro'}</span>
        </div>
        <div className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black tracking-tighter transition-colors ${getStatusStyle()}`}>
          {statusText}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-8">
        <div className="w-[32%] flex flex-col items-center gap-2">
          <div className="flex items-center justify-center w-12 h-12">
            <img src={m.home?.logo} className="object-contain max-w-full max-h-full transition-transform group-hover:scale-110" alt={m.home?.name} />
          </div>
          <span className="text-[10px] font-black text-white uppercase text-center line-clamp-2 h-7 leading-tight">{m.home?.name}</span>
        </div>

        <div className="w-[36%] flex flex-col items-center justify-center">
          <div className="flex items-center justify-center gap-3">
            <span className="font-mono text-4xl font-black text-white tabular-nums">{m.home?.score ?? 0}</span>
            <span className={`text-xl font-bold ${isLive ? 'text-red-500' : 'text-white/10'}`}>:</span>
            <span className="font-mono text-4xl font-black text-white tabular-nums">{m.away?.score ?? 0}</span>
          </div>
        </div>

        <div className="w-[32%] flex flex-col items-center gap-2">
          <div className="flex items-center justify-center w-12 h-12">
            <img src={m.away?.logo} className="object-contain max-w-full max-h-full transition-transform group-hover:scale-110" alt={m.away?.name} />
          </div>
          <span className="text-[10px] font-black text-white uppercase text-center line-clamp-2 h-7 leading-tight">{m.away?.name}</span>
        </div>
      </div>

      <div className="mx-4 mb-4 p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
        <BrainCircuit size={12} className={isLive ? "text-red-500" : "text-white/30"} />
        {/* FIXED: Improved readability for AI Pick */}
        <p className="text-[9px] font-bold text-white/60 line-clamp-1 italic">{m.aiPick && m.aiPick.length > 5 ? m.aiPick : "Vortex AI: Analyzing match patterns..."}</p>
      </div>

      <div className="px-4 pb-5 mt-auto">
        <button className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black tracking-[0.15em] transition-all
          ${isLive ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/30' : 'bg-white/5 hover:bg-white/10 text-white/60'}`}>
          {isLive ? <Play size={12} fill="currentColor" /> : <Clock size={12} />}
          {isLive ? 'WATCH LIVE' : (isFinished ? 'MATCH ENDED' : 'PREVIEW')}
        </button>
      </div>
    </div>
  );
});

export default MatchCard;