import React from 'react';
import { Clock, Server, PlayCircle, Star } from 'lucide-react';
import MatchTimer from './MatchTimer';

const MatchCard = ({ match, handleStreamClick }) => {
  const m = match || {};
  
  // Identify available streams from our new structure
  const servers = [
    { id: 1, name: "Server 1 (Auto)", url: m.streamUrl1 },
    { id: 2, name: "Server 2 (Backup)", url: m.streamUrl2 },
    { id: 3, name: "Server 3 (Premium HQ)", url: m.streamUrl3, isGold: true }
  ].filter(s => s.url && s.url.length > 5); // Only show if link exists

  const hasStream = servers.length > 0;
  const isLive = m.status === 'LIVE' || m.status === '1H' || m.status === '2H' || m.status === 'HT';

  return (
    <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-6 flex flex-col justify-between hover:border-red-600/40 transition-all hover:-translate-y-1 group">
      
      <div className="flex items-center justify-between mb-6">
        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest truncate max-w-[60%]">
          {m.league || 'Vortex Premium'}
        </span>
        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${isLive ? 'bg-red-600 animate-pulse text-white' : 'bg-white/10 text-white/60'}`}>
          {isLive ? 'LIVE' : m.status || 'UPCOMING'}
        </div>
      </div>

      <div className="mb-6 space-y-3 text-center">
        <div className="flex items-center justify-center gap-4">
          <img src={m.homeTeam?.logo} className="object-contain w-10 h-10" alt="" />
          <h2 className="text-lg font-black tracking-tighter text-white uppercase">{m.homeTeam?.name}</h2>
        </div>
        
        <div className="text-4xl italic font-black tracking-tighter text-white">
          {m.score || 'VS'}
        </div>

        <div className="flex items-center justify-center gap-4">
          <h2 className="text-lg font-black tracking-tighter text-white uppercase">{m.awayTeam?.name}</h2>
          <img src={m.awayTeam?.logo} className="object-contain w-10 h-10" alt="" />
        </div>

        <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase italic text-white/30 tracking-widest">
          <Clock size={12} className={isLive ? 'text-red-600' : ''} />
          <MatchTimer match={m} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Server size={12} className="absolute -translate-y-1/2 left-3 top-1/2 text-white/20" />
          <select 
            id={`select-${m.fixtureId}`}
            className="w-full bg-black/60 border border-white/5 py-3 pl-9 pr-4 rounded-xl text-[9px] font-black uppercase text-white/70 outline-none appearance-none cursor-pointer"
          >
            {servers.map(s => (
              <option key={s.id} value={s.url}>
                {s.isGold ? '⭐ ' : ''}{s.name}
              </option>
            ))}
            {!hasStream && <option>Offline</option>}
          </select>
        </div>

        <button 
          onClick={(e) => {
            const url = document.getElementById(`select-${m.fixtureId}`).value;
            handleStreamClick(url, e);
          }}
          disabled={!hasStream}
          className={`w-full py-4 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all flex items-center justify-center gap-3
            ${!hasStream ? 'bg-zinc-800 text-white/10' : 'bg-red-600 text-white hover:bg-white hover:text-black'}`}
        >
          <PlayCircle size={16} /> {isLive ? 'WATCH LIVE' : 'PREVIEW STREAM'}
        </button>
      </div>
    </div>
  );
};

export default MatchCard;