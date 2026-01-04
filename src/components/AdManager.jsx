import React, { useEffect, useCallback, useState, useRef } from 'react';
import { X, RefreshCw, ChevronDown } from 'lucide-react';

// --- CONFIGURATION ---
// Paste your Adsterra or Monetag "Direct Link" / "Smart Link" here
const SMART_DIRECT_LINK = "https://www.highperformanceformat.com/your-code-here"; 
// ---------------------

const AdManager = () => {
  const [activeStream, setActiveStream] = useState(null);
  const [backupStream, setBackupStream] = useState(null);
  const [currentServer, setCurrentServer] = useState(1);
  const [showRealStream, setShowRealStream] = useState(false);
  const [countdown, setCountdown] = useState(10);
  
  const midRollTimer = useRef(null);
  const playerRef = useRef(null);

  const AD_INTERVAL = 15 * 60 * 1000; 

  const startAdSequence = useCallback((streamUrl, backupUrl = null) => {
    setActiveStream(streamUrl);
    setBackupStream(backupUrl);
    setShowRealStream(false);
    setCountdown(10);
    setCurrentServer(1);

    setTimeout(() => {
      playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    if (midRollTimer.current) clearTimeout(midRollTimer.current);
  }, []);

  const closePlayer = () => {
    setActiveStream(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSkipAd = (e) => {
    e.stopPropagation();
    
    // 1. REVENUE TRIGGER: Opens your Direct Link in a new tab
    // This is what will make your "Clicks" and "Revenue" go up in the dashboard
    window.open(SMART_DIRECT_LINK, '_blank');

    // 2. SHOW CONTENT: Reveals the iframe immediately
    setShowRealStream(true);
    
    // 3. UX IMPROVEMENT: Auto-center the player for the user
    setTimeout(() => {
      playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 600);

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
      if (!btn || !btn.innerText || btn.innerText.toUpperCase().indexOf('WATCH') === -1) return;
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
    <div className="w-full">
      {activeStream && (
        <div ref={playerRef} className="flex flex-col w-full duration-500 bg-black border-b border-red-600/30 animate-in fade-in">
          
          {/* PLAYER HEADER */}
          <div className="w-full bg-[#0a0a0a] p-3 flex justify-between items-center border-b border-white/5">
            <div className="flex items-center gap-2">
               <div className="bg-red-600 px-1.5 py-0.5 rounded text-[8px] font-black italic text-white uppercase animate-pulse">Live</div>
               <span className="text-[10px] font-bold tracking-widest text-white/90 uppercase">Vortex Arena Feed</span>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/10">
                    <button 
                        onClick={() => {
                            setCurrentServer(1);
                            // Optional: Open ad again when switching servers
                            window.open(SMART_DIRECT_LINK, '_blank');
                        }} 
                        className={`px-3 py-1 text-[8px] font-bold rounded ${currentServer === 1 ? 'bg-red-600 text-white' : 'text-white/40'}`}
                    >
                        S1
                    </button>
                    {backupStream && backupStream !== "#" && (
                        <button 
                            onClick={() => {
                                setCurrentServer(2);
                                window.open(SMART_DIRECT_LINK, '_blank');
                            }} 
                            className={`px-3 py-1 text-[8px] font-bold rounded ${currentServer === 2 ? 'bg-red-600 text-white' : 'text-white/40'}`}
                        >
                            S2
                        </button>
                    )}
                </div>
                <button id="close-player" onClick={closePlayer} className="p-1 transition-colors text-white/50 hover:text-white"><X size={20}/></button>
            </div>
          </div>

          {/* PLAYER CONTENT */}
          <div className="relative w-full h-[55vh] md:h-[80vh] bg-black">
            {!showRealStream && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-8 text-center bg-[#080808]">
                  <RefreshCw className="mb-4 text-red-600 animate-spin" size={32}/>
                  <h2 className="mb-1 text-[10px] font-black tracking-widest text-white uppercase">Loading Premium Link</h2>
                  
                  {countdown > 0 ? (
                    <div className="px-8 py-3 mt-4 font-mono text-lg font-bold text-red-600 border border-red-600/20 rounded-xl bg-red-600/5">
                      {countdown}s
                    </div>
                  ) : (
                    <button 
                      id="skip-btn" 
                      onClick={handleSkipAd} 
                      className="mt-4 px-12 py-5 text-[10px] font-black text-white bg-red-600 shadow-2xl rounded-xl shadow-red-600/40 uppercase tracking-tighter active:scale-95 transition-transform"
                    >
                      Click to Watch Now
                    </button>
                  )}
              </div>
            )}
            
            {showRealStream && (
              <div className="relative w-full h-full">
                <iframe 
                  src={currentServer === 1 ? activeStream : backupStream} 
                  className="w-full h-full border-none" 
                  allowFullScreen 
                  allow="autoplay; encrypted-media; picture-in-picture"
                ></iframe>
              </div>
            )}
          </div>

          {/* MAXIMIZE INSTRUCTION */}
          {showRealStream && (
            <div className="w-full py-3 bg-[#0a0a0a] flex flex-col items-center gap-1 opacity-60">
                <ChevronDown size={14} className="text-red-600 animate-bounce" />
                <span className="text-[8px] font-bold text-white uppercase tracking-[0.2em]">Scroll down to maximize fullscreen view</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdManager;