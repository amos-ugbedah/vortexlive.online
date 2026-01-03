import React from 'react';
import { Clock, Server, PlayCircle } from 'lucide-react';

const MatchCard = ({ match, displayData, handleStreamClick }) => {
  // 1. Safety Guards for props
  const m = match || {};
  const d = displayData || {
    isLive: false,
    scoreDisplay: 'VS',
    statusBadge: { text: 'UPCOMING', color: 'bg-blue-600/30' },
    liveMinute: '--'
  };

  // 2. Stream Availability Check
  const primaryUrl = m.streamUrl1 || m.streamUrl || (m.links && m.links[0]?.url) || '#';
  const secondaryUrl = m.streamUrl2 || (m.links && m.links[1]?.url) || null;
  const hasStream = primaryUrl !== '#';

  return (
    <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-6 flex flex-col justify-between hover:border-red-600/40 transition-all hover:-translate-y-1 group">
      
      {/* Header: League & Status */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest truncate max-w-[60%]">
          {m.league || 'Global Match'}
        </span>
        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter ${d.statusBadge.color} ${d.isLive ? 'animate-pulse text-white' : 'text-white/60'}`}>
          {d.statusBadge.text}
        </div>
      </div>

      {/* Main Scoreboard Area */}
      <div className="mb-6 space-y-3 text-center">
        <h2 className="text-lg font-black tracking-tighter text-white uppercase truncate">
          {m.home || 'TBD'}
        </h2>
        
        <div className="relative inline-block">
          <div className={`text-4xl font-black italic tracking-tighter ${d.isLive ? 'text-red-600' : 'text-white/90'}`}>
            {d.scoreDisplay}
          </div>
        </div>

        <h2 className="text-lg font-black tracking-tighter text-white uppercase truncate">
          {m.away || 'TBD'}
        </h2>

        {/* Live Timer / Kickoff Time */}
        <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase italic text-white/30 tracking-widest">
          <Clock size={12} className={d.isLive ? 'text-red-600' : ''} />
          {d.liveMinute}
        </div>
      </div>

      {/* Footer: Server Selection & Massive Watch Button */}
      <div className="space-y-3">
        {/* Server Select */}
        <div className="relative group/select">
          <Server size={12} className="absolute transition-colors -translate-y-1/2 left-3 top-1/2 text-white/20 group-focus-within/select:text-red-600" />
          <select 
            id={`server-${m.id}`}
            className="w-full bg-black/60 border border-white/5 py-3 pl-9 pr-4 rounded-xl text-[9px] font-black uppercase text-white/70 outline-none appearance-none cursor-pointer hover:border-white/10 transition-colors"
          >
            <option value={primaryUrl}>Server 01 (HD)</option>
            {secondaryUrl && <option value={secondaryUrl}>Server 02 (Fast)</option>}
            {!hasStream && <option value="#">Offline</option>}
          </select>
        </div>

        {/* Big Watch Button - The "Revenue Generator" */}
        <button 
          onClick={(e) => handleStreamClick(m, e)}
          disabled={!hasStream}
          className={`w-full py-4 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3
            ${!hasStream 
              ? 'bg-zinc-800 text-white/10 cursor-not-allowed' 
              : 'bg-red-600 text-white hover:bg-white hover:text-black shadow-[0_10px_20px_rgba(220,38,38,0.3)]'
            }`}
        >
          {d.isLive ? (
            <>
              <div className="relative flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full bg-white rounded-full opacity-75 animate-ping"></span>
                <span className="relative inline-flex w-2 h-2 bg-white rounded-full"></span>
              </div>
              WATCH LIVE NOW
            </>
          ) : (
            <>
              <PlayCircle size={16} />
              WATCH STREAM
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default MatchCard;