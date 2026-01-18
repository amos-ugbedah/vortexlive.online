/* eslint-disable */
import React, { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, BrainCircuit, Play, Clock, Trophy, Tv, 
  Wifi, Zap
} from 'lucide-react';
import * as utils from '../lib/matchUtils';

const MatchCard = memo(({ match: m }) => {
  const navigate = useNavigate();

  const matchData = useMemo(() => {
    if (!m) return null;

    const autoLive = utils.isAutoDetected(m);
    const estMinute = utils.calculateEstimatedMinute(m);
    const isLive = utils.isMatchLive(m) || autoLive;

    // Determine what text to show in the status bubble
    let statusText = utils.getMatchStatusText(m);
    if (autoLive) {
        statusText = estMinute === 45 ? 'HT' : `${estMinute}'`;
    } else if (utils.isMatchLive(m)) {
        statusText = m.status === 'HT' ? 'HT' : `${m.minute || estMinute}'`;
    }

    return {
      isAutoDetected: autoLive,
      isLive,
      isFinished: utils.isMatchFinished(m),
      isElite: utils.isEliteMatch(m),
      streamCount: utils.getStreamCount(m),
      safeId: String(m.id || ''),
      statusText
    };
  }, [m]);

  if (!matchData) return <div className="h-64 rounded-2xl bg-gray-900/50 animate-pulse border border-white/5" />;

  const { isAutoDetected, isLive, isFinished, isElite, streamCount, safeId, statusText } = matchData;

  const getStatusStyle = () => {
    if (isAutoDetected) return 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40';
    if (isLive) return 'bg-red-600 text-white shadow-lg shadow-red-900/40 animate-pulse';
    if (isFinished) return 'bg-gray-800 text-gray-400';
    return 'bg-blue-600/20 text-blue-400 border border-blue-500/30';
  };

  return (
    <div 
      onClick={() => safeId && navigate(`/match/${safeId}`)}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer active:scale-[0.98]
        ${isElite ? 'border-yellow-500/30 bg-gradient-to-br from-yellow-950/20 to-black' : 'border-white/5 bg-gray-900/40'}
        ${isAutoDetected ? 'border-emerald-500/40 shadow-[0_0_15px_-5px_rgba(16,185,129,0.3)]' : ''} 
        hover:border-red-500/40 hover:shadow-xl hover:shadow-red-500/5`}
    >
      {/* Badges */}
      <div className="absolute top-3 inset-x-3 flex justify-between items-start z-10">
        <div className="flex gap-1.5">
          {isAutoDetected && (
            <div className="flex items-center gap-1 px-2 py-1 bg-emerald-600 rounded-full text-[8px] font-black text-white">
              <Wifi size={10} className="animate-pulse" /> <span>AUTO-LIVE</span>
            </div>
          )}
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

      {/* Header */}
      <div className="p-5 pb-0 flex justify-between items-center mt-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center p-1">
            {m.leagueLogo ? <img src={m.leagueLogo} className="w-full h-full object-contain" /> : <ShieldCheck size={14} className="text-white/20" />}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40 truncate max-w-[120px]">{m.league || 'Vortex Pro'}</span>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-tighter transition-colors ${getStatusStyle()}`}>
          {statusText}
        </div>
      </div>

      {/* Scoreboard */}
      <div className="px-5 py-6 flex items-center justify-between">
        <div className="flex flex-col items-center flex-1 text-center gap-2">
          <img src={m.home?.logo} className="w-14 h-14 object-contain transition-transform group-hover:scale-110" alt="" />
          <span className="text-[11px] font-black text-white uppercase truncate w-full tracking-tight">{m.home?.name}</span>
        </div>

        <div className="flex flex-col items-center px-4">
          <div className="flex items-center gap-4">
            <span className="text-4xl font-black text-white font-mono tracking-tighter">{m.home?.score ?? 0}</span>
            <span className={`text-xl font-bold ${isLive ? 'text-red-500 animate-pulse' : 'text-white/20'}`}>-</span>
            <span className="text-4xl font-black text-white font-mono tracking-tighter">{m.away?.score ?? 0}</span>
          </div>
          {isLive && (
            <div className="mt-2 flex items-center gap-1 text-[9px] font-black text-red-500 uppercase tracking-widest">
              <span className="w-1 h-1 bg-red-500 rounded-full animate-ping" /> Live Play
            </div>
          )}
        </div>

        <div className="flex flex-col items-center flex-1 text-center gap-2">
          <img src={m.away?.logo} className="w-14 h-14 object-contain transition-transform group-hover:scale-110" alt="" />
          <span className="text-[11px] font-black text-white uppercase truncate w-full tracking-tight">{m.away?.name}</span>
        </div>
      </div>

      {/* AI Strip */}
      <div className="mx-5 mb-4 p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
        <BrainCircuit size={14} className={isLive ? "text-red-500" : "text-white/40"} />
        <p className="text-[10px] font-bold text-white/70 line-clamp-1 italic">{m.aiPick || "Analyzing tactical shifts..."}</p>
      </div>

      {/* Button */}
      <div className="px-5 pb-5 mt-auto">
        <button className={`w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black tracking-[0.2em] transition-all
          ${isLive ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-white/5 hover:bg-white/10 text-white/60'}`}>
          {isLive ? <Play size={12} fill="currentColor" /> : <Clock size={12} />}
          {isLive ? 'WATCH STREAM' : 'MATCH DETAILS'}
        </button>
      </div>

      {/* Auto-Detection Footer */}
      {isAutoDetected && !utils.isMatchLive(m) && (
        <div className="bg-emerald-500/10 py-2 px-5 border-t border-emerald-500/20 flex items-center justify-center gap-2">
          <Zap size={10} className="text-emerald-400" />
          <p className="text-[8px] font-black text-emerald-400 uppercase">Vortex AI detected kick-off</p>
        </div>
      )}
    </div>
  );
});

export default MatchCard;