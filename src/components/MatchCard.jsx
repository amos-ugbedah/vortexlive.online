/* eslint-disable */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, BrainCircuit, Play } from 'lucide-react';

const MatchCard = ({ match: m }) => {
  const navigate = useNavigate();
  const status = m.status?.toUpperCase();
  
  // Logic for the Red vs Gray Button
  const isLive = ['1H', '2H', 'HT', 'LIVE', 'IN_PLAY', 'ET', 'BT', 'P'].includes(status);
  const isFinished = ['FT', 'AET', 'PEN'].includes(status);
  const isNotStarted = ['NS', 'TBD', 'SCHEDULED'].includes(status);

  const getAiPrediction = () => {
    if (m.aiPick && m.aiPick !== "ANALYZING...") return m.aiPick;
    const picks = ["Home Win", "Over 2.5 Goals", "Both Teams to Score", "Away Win (DNB)"];
    const index = m.id ? m.id.charCodeAt(0) % picks.length : 0;
    return picks[index];
  };

  return (
    <div className={`group relative flex flex-col justify-between overflow-hidden rounded-[2.5rem] border border-white/5 bg-[#0c0c0c] p-5 transition-all duration-500 hover:border-red-600/40 ${isFinished ? 'grayscale-[0.5]' : 'hover:-translate-y-1'}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-red-600" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white/30 truncate max-w-[80px]">
            {m.league || 'Vortex Pro'}
          </span>
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-black ${isLive ? 'bg-red-600 text-white animate-pulse' : 'bg-white/5 text-white/20'}`}>
          {isLive ? `• ${m.minute || 'LIVE'}'` : status}
        </div>
      </div>

      {/* Score / Time Area */}
      <div className="grid items-center grid-cols-3 gap-2 mb-6">
        <TeamDisplay logo={m.home?.logo} name={m.home?.name} />
        <div className="flex flex-col items-center justify-center">
          {(isLive || isFinished) ? (
            <div className="flex items-center gap-1 text-2xl italic font-black">
              <span>{m.home?.score ?? 0}</span><span className="text-red-600">:</span><span>{m.away?.score ?? 0}</span>
            </div>
          ) : (
            <span className="text-xl italic font-black text-white/80">{m.time || 'TBA'}</span>
          )}
        </div>
        <TeamDisplay logo={m.away?.logo} name={m.away?.name} />
      </div>

      {/* AI Prediction */}
      <div className="flex items-center justify-center gap-2 py-2 mb-6 border bg-white/5 rounded-xl border-white/5">
        <BrainCircuit size={12} className="text-red-600" />
        <span className="text-[9px] font-black uppercase text-white/40 tracking-tighter">
          AI BOT: <span className="text-white">{getAiPrediction()}</span>
        </span>
      </div>

      {/* Action Button: Red for Live, Gray for NS */}
      <button 
        onClick={() => navigate(`/match/${m.id}`)}
        className={`w-full py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
            isLive 
            ? 'bg-red-600 shadow-lg shadow-red-600/20 text-white hover:bg-red-500' 
            : 'bg-white/5 text-white/40 hover:bg-white/10'
        }`}
      >
        {isLive && <Play size={12} fill="currentColor" />}
        {isLive ? 'Watch Live' : 'View Details'}
      </button>
    </div>
  );
};

const TeamDisplay = ({ logo, name }) => (
  <div className="flex flex-col items-center">
    <div className="flex items-center justify-center p-3 mb-2 border w-14 h-14 bg-white/5 rounded-2xl border-white/5 group-hover:border-red-600/20 transition-all">
      {logo ? <img src={logo} className="object-contain w-full h-full" alt="" /> : <div className="w-full h-full rounded-full bg-white/5" />}
    </div>
    <p className="text-[10px] font-black text-center uppercase leading-tight line-clamp-2 h-7 text-white/70">{name || 'TBA'}</p>
  </div>
);

export default MatchCard;