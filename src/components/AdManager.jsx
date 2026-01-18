/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import { X, RefreshCw, ChevronDown, Trophy } from 'lucide-react';

const AFFILIATE_LINK = "https://1win.ng/?p=a6lf"; 

const AdManager = ({ activeStream, onClose }) => {
  const [showRealStream, setShowRealStream] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const playerRef = useRef(null);

  useEffect(() => {
    if (activeStream) {
      setShowRealStream(false);
      setCountdown(10);
      playerRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeStream]);

  useEffect(() => {
    let timer;
    if (activeStream && !showRealStream && countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [activeStream, showRealStream, countdown]);

  const handleWatchNow = () => {
    window.open(AFFILIATE_LINK, '_blank'); // Opens your 1win affiliate link
    setShowRealStream(true);
  };

  if (!activeStream) return null;

  return (
    <div ref={playerRef} className="w-full bg-black border-b border-red-600/30">
      <div className="p-3 flex justify-between items-center border-b border-white/5 bg-[#0a0a0a]">
        <div className="flex items-center gap-2">
           <div className="bg-red-600 px-1.5 py-0.5 rounded text-[8px] font-black italic text-white animate-pulse uppercase">Live</div>
           <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest">Vortex Arena Player</span>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white"><X size={20}/></button>
      </div>

      <div className="relative w-full h-[50vh] md:h-[75vh] bg-black">
        {!showRealStream ? (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#080808] p-6 text-center">
            <Trophy className="mb-4 text-yellow-500 animate-bounce" size={48}/>
            <h2 className="text-xl italic font-black text-white uppercase">Ready to Stream</h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase mt-2">Get 500% Bonus on 1win with code: <span className="text-white">VORTEXLIVE</span></p>
            
            {countdown > 0 ? (
              <div className="px-8 py-3 mt-6 font-mono text-xl text-red-600 border bg-red-600/5 rounded-xl border-red-600/20">
                {countdown}s
              </div>
            ) : (
              <button onClick={handleWatchNow} className="flex flex-col items-center gap-1 px-10 py-5 mt-6 font-black text-white uppercase transition-transform shadow-xl bg-emerald-600 rounded-2xl hover:scale-105 shadow-emerald-600/20">
                <span>Unlock HD Stream</span>
                <span className="text-[8px] opacity-70">(& Claim 1win Bonus)</span>
              </button>
            )}
          </div>
        ) : (
          <iframe 
            src={activeStream} 
            className="w-full h-full" 
            allowFullScreen 
            allow="autoplay; encrypted-media"
          ></iframe>
        )}
      </div>
      
      {showRealStream && (
        <div className="flex justify-center py-2 bg-black opacity-40">
          <ChevronDown size={14} className="text-red-600 animate-bounce" />
        </div>
      )}
    </div>
  );
};

export default AdManager;