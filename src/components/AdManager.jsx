import React, { useEffect, useCallback, useState, useRef } from 'react';
import { X, Play, ShieldCheck, Server, RefreshCw, ChevronDown, DollarSign } from 'lucide-react';

const AdManager = () => {
  const [activeStream, setActiveStream] = useState(null);
  const [backupStream, setBackupStream] = useState(null);
  const [currentServer, setCurrentServer] = useState(1);
  const [showRealStream, setShowRealStream] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const midRollTimer = useRef(null);
  const scrollContainerRef = useRef(null);
  const adContainerRef = useRef(null);

  // --- CONFIGURATION ---
  const SMART_LINK = "https://www.effectivegatecpm.com/m0hhxyhsj?key=2dc5d50b0220cf3243f77241e3c3114d";
  const AD_INTERVAL = 15 * 60 * 1000; // 15 Minutes
  const ADSTERRA_BANNER_KEY = "PASTE_YOUR_ADSTERRA_BANNER_KEY_HERE"; // <--- GET THIS FROM ADSTERRA
  // ---------------------

  const startAdSequence = useCallback((streamUrl, backupUrl = null) => {
    setActiveStream(streamUrl);
    setBackupStream(backupUrl);
    setShowRealStream(false);
    setCountdown(10);
    setCurrentServer(1);
    document.body.style.overflow = 'hidden';
    if (midRollTimer.current) clearTimeout(midRollTimer.current);
  }, []);

  const closePlayer = () => {
    setActiveStream(null);
    document.body.style.overflow = 'auto';
  };

  const handleSkipAd = (e) => {
    e.stopPropagation();
    setShowRealStream(true);
    
    // 1. Auto-scroll to hide header
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 140, behavior: 'smooth' });
      }
    }, 500);

    // 2. SET THE 15-MINUTE TRAP
    midRollTimer.current = setTimeout(() => {
      setShowRealStream(false);
      setCountdown(10);
    }, AD_INTERVAL);
  };

  // AD INJECTION LOGIC
  useEffect(() => {
    if (showRealStream && adContainerRef.current && ADSTERRA_BANNER_KEY !== "PASTE_YOUR_ADSTERRA_BANNER_KEY_HERE") {
      const conf = document.createElement('script');
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = `//www.profitabledisplaynetwork.com/${ADSTERRA_BANNER_KEY}/invoke.js`;
      conf.innerHTML = `atOptions = { 'key' : '${ADSTERRA_BANNER_KEY}', 'format' : 'iframe', 'height' : 250, 'width' : 300, 'params' : {} };`;
      
      adContainerRef.current.innerHTML = ''; // Clear placeholder
      adContainerRef.current.appendChild(conf);
      adContainerRef.current.appendChild(script);
    }
  }, [showRealStream]);

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
    <>
      {activeStream && (
        <div ref={scrollContainerRef} className="fixed inset-0 z-[1000] bg-black flex flex-col overflow-y-auto scroll-smooth">
          
          {/* STICKY HEADER */}
          <div className="sticky top-0 w-full bg-[#0a0a0a] p-3 flex justify-between items-center border-b border-white/10 z-[1050]">
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black text-red-600 uppercase">Vortex Live HD</span>
               {showRealStream && (
                 <div className="flex bg-zinc-900 rounded p-0.5 ml-2 border border-white/5">
                   <button onClick={() => setCurrentServer(1)} className={`px-2 py-1 rounded text-[8px] font-bold ${currentServer === 1 ? 'bg-red-600 text-white' : 'text-gray-500'}`}>S1</button>
                   {backupStream && <button onClick={() => setCurrentServer(2)} className={`px-2 py-1 rounded text-[8px] font-bold ${currentServer === 2 ? 'bg-red-600 text-white' : 'text-gray-500'}`}>S2</button>}
                 </div>
               )}
            </div>
            <button id="close-player" onClick={closePlayer} className="p-2 text-white bg-red-600 rounded-lg"><X size={18}/></button>
          </div>

          <div className="flex flex-col items-center w-full">
            <div className="w-full h-[100px] flex items-center justify-center text-white/5 text-[8px] font-bold uppercase tracking-widest">Buffer Optimized</div>

            {/* PLAYER AREA */}
            <div className="relative w-full max-w-5xl overflow-hidden bg-black shadow-2xl aspect-video border-y border-white/5"
                 onClick={() => !showRealStream && window.open(SMART_LINK, '_blank')}>
              {!showRealStream && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center bg-black/90">
                    <RefreshCw className="mb-4 text-red-600 animate-spin" size={32}/>
                    <h2 className="mb-4 text-sm font-black text-white uppercase">Syncing HD Feed...</h2>
                    {countdown > 0 ? (
                      <div className="px-6 py-3 font-mono text-xs text-red-600 border border-red-600/30 rounded-xl">READY IN {countdown}s</div>
                    ) : (
                      <button id="skip-btn" onClick={handleSkipAd} className="px-10 py-5 text-xs font-black text-white uppercase bg-red-600 rounded-2xl animate-pulse">WATCH NOW</button>
                    )}
                </div>
              )}
              {showRealStream && (
                <iframe src={currentServer === 1 ? activeStream : backupStream} className="w-full h-full border-none" allowFullScreen scrolling="yes" frameBorder="0" allow="autoplay; encrypted-media"></iframe>
              )}
            </div>

            {/* MONETIZATION FOOTER */}
            <div className="w-full bg-[#0a0a0a] p-8 flex flex-col items-center gap-6 min-h-[800px]">
                {showRealStream && (
                   <>
                    <div className="flex flex-col items-center gap-2 py-2 text-red-500 animate-bounce">
                        <ChevronDown size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Scroll for Unmute</span>
                    </div>

                    {/* THE AD BOX - Where the money is made */}
                    <div className="w-full max-w-[320px] min-h-[250px] bg-zinc-900 rounded-3xl border border-white/5 overflow-hidden flex flex-col items-center justify-center">
                        <div ref={adContainerRef} className="w-full h-full">
                           <p className="text-[9px] text-white/10 font-bold uppercase p-10 text-center">Loading Premium Content...</p>
                        </div>
                    </div>
                   </>
                )}
                
                <div className="flex gap-10 mt-10 opacity-20">
                    <ShieldCheck size={24} className="text-white"/><Server size={24} className="text-white"/><Play size={24} className="text-white"/>
                </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdManager;