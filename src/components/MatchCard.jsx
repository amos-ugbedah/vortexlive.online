import React from 'react';
import { Clock, Server, ExternalLink } from 'lucide-react';

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
  const hasStream = (m.streamUrl1 && m.streamUrl1 !== '#') || 
                    (m.streamUrl2 && m.streamUrl2 !== '#') || 
                    (m.streamUrl && m.streamUrl !== '#');

  return (
    <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-6 flex flex-col justify-between hover:border-red-600/30 transition-all hover:-translate-y-1 group">
      
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
      <div className="mb-8 space-y-3 text-center">
        <h2 className="text-lg font-black tracking-tighter text-white uppercase truncate">
          {m.home || 'TBD'}
        </h2>
        
        <div className="relative inline-block">
          <div className={`text-3xl font-black italic tracking-tighter ${d.isLive ? 'text-red-600' : 'text-white/90'}`}>
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

      {/* Footer: Stream Controls */}
      <div className="flex items-center gap-2">
        {/* Server Select */}
        <div className="relative flex-1 group/select">
          <Server size={12} className="absolute transition-colors -translate-y-1/2 left-3 top-1/2 text-white/20 group-focus-within/select:text-red-600" />
          <select 
            id={`server-${m.id}`}
            className="w-full bg-black/60 border border-white/5 py-3 pl-9 pr-4 rounded-xl text-[9px] font-black uppercase text-white/70 outline-none appearance-none cursor-pointer hover:border-white/10 transition-colors"
            defaultValue={m.streamUrl1 || m.streamUrl || '#'}
          >
            {m.streamUrl1 && <option value={m.streamUrl1}>Server 01</option>}
            {m.streamUrl2 && <option value={m.streamUrl2}>Server 02</option>}
            {m.streamUrl && !m.streamUrl1 && <option value={m.streamUrl}>Primary Server</option>}
            {!hasStream && <option value="#">Offline</option>}
          </select>
        </div>

        {/* Watch Button */}
        <button 
          onClick={(e) => handleStreamClick(m, e)}
          disabled={!hasStream}
          className={`p-3.5 rounded-xl transition-all shadow-xl active:scale-90 flex items-center justify-center
            ${!hasStream ? 'bg-zinc-800 text-white/10 cursor-not-allowed' : 
              d.isLive ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-white text-black hover:bg-red-600 hover:text-white'}`}
        >
          <ExternalLink size={18} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};

export default MatchCard;