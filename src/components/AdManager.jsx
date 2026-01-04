import React, { useEffect, useCallback } from 'react';

const AdManager = () => {
  const showAdOverlay = useCallback((url) => {
    // Remove existing if any
    const existing = document.getElementById('vortex-ad-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'vortex-ad-overlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.95); z-index: 999999; display: flex;
      align-items: center; justify-content: center; backdrop-filter: blur(8px);
    `;
    
    overlay.innerHTML = `
      <div style="text-align: center; width: 90%; max-width: 400px; padding: 40px; background: #0a0a0a; border-radius: 30px; border: 1px solid #dc2626;">
        <div style="font-size: 50px; margin-bottom: 20px;">⚡</div>
        <h2 id="ad-status" style="color: white; font-weight: 900; margin-bottom: 10px; font-family: sans-serif; text-transform: uppercase;">Encrypting Stream...</h2>
        <div style="height: 6px; background: #1a1a1a; border-radius: 3px; margin: 20px 0; overflow: hidden;">
          <div id="ad-bar" style="width: 0%; height: 100%; background: #dc2626; transition: width 0.1s linear;"></div>
        </div>
        <div id="ad-btn-container">
            <p style="color: #666; font-size: 10px; font-weight: bold; letter-spacing: 2px;">SECURE CONNECTION ESTABLISHED</p>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    let progress = 0;
    const bar = document.getElementById('ad-bar');
    const status = document.getElementById('ad-status');
    const container = document.getElementById('ad-btn-container');

    const interval = setInterval(() => {
      progress += 5; 
      if (bar) bar.style.width = progress + '%';

      if (progress >= 100) {
        clearInterval(interval);
        if (status) status.innerText = "STREAM READY!";
        if (container) {
          container.innerHTML = `
            <button id="go-btn" style="width: 100%; background: #dc2626; color: white; border: none; padding: 18px; border-radius: 15px; font-weight: 900; cursor: pointer; margin-top: 10px; text-transform: uppercase;">
              Start Player HD
            </button>
          `;
          
          document.getElementById('go-btn').onclick = () => {
            // 1. Open the SmartLink Ad in a new background tab
            window.open("https://www.effectivegatecpm.com/m0hhxyhsj?key=2dc5d50b0220cf3243f77241e3c3114d", '_blank');
            
            // 2. Visual feedback on the button
            const goBtn = document.getElementById('go-btn');
            goBtn.innerText = "OPENING PLAYER...";
            goBtn.style.background = "#1a1a1a";
            goBtn.disabled = true;

            // 3. Small delay ensures the pop-under is triggered before the main window redirects
            setTimeout(() => {
              window.location.href = url; 
              overlay.remove();
            }, 800);
          };
        }
      }
    }, 100); 
  }, []);

  useEffect(() => {
    // Inject Native Banner Script (Adsterra)
    const script = document.createElement('script');
    script.src = "//www.profitablecpmrate.com/f0/21/e4/f021e4835824982348924343.js";
    script.async = true;
    document.body.appendChild(script);

    const handleGlobalClick = (e) => {
      const btn = e.target.closest('button');
      if (!btn || btn.id === 'go-btn') return;

      // Detect any click on a "WATCH" button
      if (btn.innerText.toUpperCase().includes('WATCH')) {
        e.preventDefault();
        e.stopPropagation();

        const card = btn.closest('div');
        const select = card?.querySelector('select');
        // Get URL from select dropdown or data attribute
        const streamUrl = select?.value || btn.getAttribute('data-url');

        if (streamUrl && streamUrl !== '#') {
          showAdOverlay(streamUrl);
        }
      }
    };

    document.addEventListener('click', handleGlobalClick, true);
    return () => document.removeEventListener('click', handleGlobalClick, true);
  }, [showAdOverlay]);

  return (
    <div className="flex flex-col items-center justify-center w-full py-4 border-b bg-black/40 border-white/5">
        <p className="text-[8px] text-gray-600 font-bold uppercase tracking-[0.3em] mb-2">Advertisement</p>
        {/* Banner container for Adsterra Native Ads */}
        <div id="container-f021e4835824982348924343"></div>
    </div>
  );
};

export default AdManager;