import React, { useState, useEffect, useRef } from 'react';
import { X, RefreshCw, ChevronDown } from 'lucide-react';

const SMART_DIRECT_LINK = "https://www.highperformanceformat.com/your-code-here"; 

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
    window.open(SMART_DIRECT_LINK, '_blank'); // Open Ads for Revenue
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
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#080808]">
            <RefreshCw className="mb-4 text-red-600 animate-spin" size={32}/>
            <h2 className="text-[10px] font-black text-white uppercase tracking-widest">Secure Connection Established</h2>
            {countdown > 0 ? (
              <div className="px-8 py-3 mt-4 font-mono text-xl text-red-600 border bg-red-600/5 rounded-xl border-red-600/20">
                {countdown}s
              </div>
            ) : (
              <button onClick={handleWatchNow} className="px-10 py-4 mt-4 font-black text-white uppercase transition-transform bg-red-600 rounded-xl hover:scale-105">
                Click to Stream Now
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