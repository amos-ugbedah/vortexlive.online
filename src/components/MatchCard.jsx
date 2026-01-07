import React from 'react';
import { useNavigate } from 'react-router-dom'; // New Import
import { Clock, PlayCircle, Zap } from 'lucide-react';
import MatchTimer from './MatchTimer';

const MatchCard = ({ match }) => {
  const m = match || {};
  const navigate = useNavigate();
  
  const isLive = m.status === 'LIVE' || m.status === '1H' || m.status === '2H' || m.status === 'HT';
  // Check if at least one link exists
  const hasStream = (m.streamUrl1?.length > 5 || m.streamUrl2?.length > 5 || m.streamUrl3?.length > 5);

  return (
    <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-6 flex flex-col justify-between hover:border-red-600/40 transition-all hover:-translate-y-1 group relative overflow-hidden">
      
      <div className="flex items-center justify-between mb-6">
        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest truncate max-w-[60%]">
          {m.league || 'Vortex Premium'}
        </span>
        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${isLive ? 'bg-red-600 animate-pulse text-white' : 'bg-white/10 text-white/60'}`}>
          {isLive ? 'LIVE' : m.status || 'UPCOMING'}
        </div>
      </div>

      <div className="mb-6 space-y-3 text-center">
        <div className="flex items-center justify-between px-2">
          <div className="flex flex-col items-center flex-1 gap-2">
             <img src={m.homeTeam?.logo} className="object-contain w-10 h-10" alt="" />
             <h2 className="text-[10px] font-black text-white uppercase truncate w-full text-center">{m.homeTeam?.name}</h2>
          </div>

          <div className="flex flex-col items-center justify-center flex-1">
             {isLive || m.status === 'FT' ? (
               <div className="flex items-center gap-1 text-3xl italic font-black tracking-tighter text-white">
                 <span>{m.homeScore ?? 0}</span>
                 <span className="text-xl text-red-600">-</span>
                 <span>{m.awayScore ?? 0}</span>
               </div>
             ) : (
               <div className="text-xl italic font-black text-white/20">VS</div>
             )}
          </div>

          <div className="flex flex-col items-center flex-1 gap-2">
             <img src={m.awayTeam?.logo} className="object-contain w-10 h-10" alt="" />
             <h2 className="text-[10px] font-black text-white uppercase truncate w-full text-center">{m.awayTeam?.name}</h2>
          </div>
        </div>

        {isLive && m.lastEvent && (
          <div className="flex items-center justify-center gap-2 px-3 py-1.5 mx-auto border bg-red-600/5 border-red-600/10 rounded-lg">
            <Zap size={8} className="text-red-600 fill-red-600" />
            <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">{m.lastEvent}</span>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-[9px] font-bold uppercase italic text-white/30 tracking-widest">
          <Clock size={10} className={isLive ? 'text-red-600' : ''} />
          <MatchTimer match={m} />
        </div>
      </div>

      <button 
        onClick={() => navigate(`/match/${m.id}`)}
        className={`w-full py-4 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all flex items-center justify-center gap-3
          ${!hasStream && !isLive ? 'bg-zinc-800 text-white/10' : 'bg-red-600 text-white hover:bg-white hover:text-black shadow-[0_0_20px_rgba(220,38,38,0.2)]'}`}
      >
        <PlayCircle size={16} /> {isLive ? 'WATCH LIVE' : 'MATCH DETAILS'}
      </button>
    </div>
  );
};

export default MatchCard;