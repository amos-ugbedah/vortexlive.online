import React, { useEffect, useCallback, useState, useRef } from 'react';
import { X, Play, ShieldCheck, Server, RefreshCw } from 'lucide-react';

const AdManager = () => {
  const [activeStream, setActiveStream] = useState(null);
  const [backupStream, setBackupStream] = useState(null);
  const [currentServer, setCurrentServer] = useState(1);
  const [showRealStream, setShowRealStream] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const midRollTimer = useRef(null);

  const SMART_LINK = "https://www.effectivegatecpm.com/m0hhxyhsj?key=2dc5d50b0220cf3243f77241e3c3114d";
  const AD_INTERVAL = 15 * 60 * 1000; 

  const startAdSequence = useCallback((streamUrl, backupUrl = null) => {
    setActiveStream(streamUrl);
    setBackupStream(backupUrl);
    setShowRealStream(false);
    setCountdown(10);
    setCurrentServer(1);
    
    // Prevent background scrolling when player is open
    document.body.style.overflow = 'hidden';
    
    if (midRollTimer.current) clearTimeout(midRollTimer.current);
  }, []);

  const closePlayer = () => {
    setActiveStream(null);
    // Restore scrolling when player is closed
    document.body.style.overflow = 'auto';
  };

  const triggerTrapRedirect = (e) => {
    if (showRealStream || e.target.closest('#close-player')) return;
    if (e.target.id === 'skip-btn') return;
    window.open(SMART_LINK, '_blank');
  };

  const handleSkipAd = (e) => {
    e.stopPropagation();
    setShowRealStream(true);
    
    midRollTimer.current = setTimeout(() => {
      setShowRealStream(false);
      setCountdown(10);
    }, AD_INTERVAL);
  };

  useEffect(() => {
    let interval;
    if (activeStream && !showRealStream && countdown > 0) {
      interval = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [activeStream, showRealStream, countdown]);

  useEffect(() => {
    const handleGlobalClick = (e) => {
      const btn = e.target.closest('button');
      if (!btn || btn.innerText.toUpperCase().indexOf('WATCH') === -1) return;
      if (['close-player', 'skip-btn'].includes(btn.id)) return;

      e.preventDefault();
      const card = btn.closest('div');
      const select = card?.querySelector('select');
      const mainLink = select?.value || btn.getAttribute('data-url');
      const backupLink = btn.getAttribute('data-backup');
      
      if (mainLink && mainLink !== '#') startAdSequence(mainLink, backupLink);
    };
    document.addEventListener('click', handleGlobalClick, true);
    return () => document.removeEventListener('click', handleGlobalClick, true);
  }, [startAdSequence]);

  return (
    <>
      {activeStream && (
        <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-sm flex flex-col overflow-y-auto">
          
          {/* HEADER: Sticky at top */}
          <div className="sticky top-0 w-full bg-[#111] p-3 flex justify-between items-center border-b border-white/10 shrink-0 z-50">
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black text-red-600 uppercase">Vortex Live HD</span>
               {showRealStream && (
                 <div className="flex bg-black rounded-md p-0.5 border border-white/5 ml-2">
                   <button onClick={() => setCurrentServer(1)} className={`px-2 py-1 rounded text-[8px] font-bold ${currentServer === 1 ? 'bg-red-600 text-white' : 'text-gray-500'}`}>S1</button>
                   {backupStream && <button onClick={() => setCurrentServer(2)} className={`px-2 py-1 rounded text-[8px] font-bold ${currentServer === 2 ? 'bg-red-600 text-white' : 'text-gray-500'}`}>S2</button>}
                 </div>
               )}
            </div>
            <button id="close-player" onClick={closePlayer} className="p-2 text-gray-400 transition-all rounded-full bg-white/5 hover:bg-red-600 hover:text-white"><X size={18}/></button>
          </div>

          {/* MAIN PLAYER AREA */}
          <div className="relative flex flex-col items-center flex-1 w-full max-w-5xl min-h-screen mx-auto lg:min-h-0">
            
            <div 
              onClick={triggerTrapRedirect} 
              className="relative w-full bg-black shadow-2xl cursor-pointer aspect-video border-x border-white/5"
            >
              {!showRealStream && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80">
                  <iframe src={SMART_LINK} className="absolute inset-0 w-full h-full pointer-events-none opacity-20" title="ad-bg"></iframe>
                  
                  <div className="z-20 w-full max-w-xs px-6">
                      <div className="bg-[#111]/95 backdrop-blur-md border border-white/10 p-6 rounded-2xl text-center shadow-2xl">
                          <RefreshCw className="mx-auto mb-3 text-red-600 animate-spin" size={24}/>
                          <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Verifying Server</h3>
                          
                          <div className="my-4">
                            {countdown > 0 ? (
                                <div className="py-2 font-mono text-xs font-bold text-red-500 border rounded border-red-900/30">CONTINUE IN {countdown}s</div>
                            ) : (
                                <button 
                                  id="skip-btn" 
                                  onClick={handleSkipAd} 
                                  className="w-full bg-red-600 text-white py-4 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-red-600/30 animate-pulse"
                                >
                                  Skip Ad & Watch HD
                                </button>
                            )}
                          </div>
                          <p className="text-[7px] text-gray-600 uppercase font-bold">Clicks outside the box verify connection</p>
                      </div>
                  </div>
                </div>
              )}

              {showRealStream && (
                <iframe 
                  src={currentServer === 1 ? activeStream : backupStream} 
                  className="w-full h-full border-none" 
                  allowFullScreen 
                  scrolling="yes"
                  frameBorder="0"
                  allow="autoplay; encrypted-media"
                ></iframe>
              )}
            </div>

            {/* BELOW PLAYER SPACE: Allows scrolling if the stream source (like SportsBay) has its own navigation or content */}
            <div className="w-full bg-zinc-900/50 p-4 text-center border-t border-white/5 min-h-[200px]">
               <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mb-4">Vortex Premium Streaming Engine</p>
               <div className="flex justify-center gap-4 opacity-30">
                  <ShieldCheck size={20} />
                  <Server size={20} />
                  <Play size={20} />
               </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdManager;