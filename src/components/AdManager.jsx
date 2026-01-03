import React, { useEffect, useState, useCallback } from 'react';

const AdManager = () => {
  const [adStatus, setAdStatus] = useState({
    popunderLoaded: false,
    nativeAdLoaded: false,
    directLinkReady: true
  });

  const isLocalhost = useCallback(() => {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1';
  }, []);

  // 1. Script Loader Utility
  const loadScript = useCallback((src, type) => {
    if (isLocalhost()) return;
    
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => {
      console.log(`✅ ${type} loaded`);
      setAdStatus(prev => ({ ...prev, [`${type}Loaded`]: true }));
    };
    script.onerror = () => console.log(`⚠️ ${type} failed (AdBlocker?)`);
    document.head.appendChild(script);
  }, [isLocalhost]);

  // 2. The Ad Overlay Logic (Optimized CSS-in-JS)
  const showAdOverlay = useCallback((streamUrl) => {
    const overlay = document.createElement('div');
    overlay.id = 'vortex-ad-overlay';
    overlay.className = "fixed inset-0 z-[10000] bg-black/98 backdrop-blur-md flex items-center justify-center p-6";
    
    // Injecting the UI directly with optimized Vortex styling
    overlay.innerHTML = `
      <div style="text-align: center; padding: 40px; max-width: 400px; background: #09090b; border-radius: 40px; border: 1px solid rgba(220, 38, 38, 0.3); shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
        <div style="font-size: 40px; margin-bottom: 20px;">⚡</div>
        <h2 style="color: white; font-size: 24px; margin-bottom: 8px; font-weight: 900; letter-spacing: -0.05em; font-style: italic;">PREPARING STREAM</h2>
        <p style="margin-bottom: 30px; color: #555; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em;">HD Servers Connecting...</p>
        
        <div style="position: relative; width: 100px; height: 100px; margin: 0 auto 30px;">
          <svg style="transform: rotate(-90deg); width: 100px; height: 100px;">
            <circle cx="50" cy="50" r="45" stroke="#111" stroke-width="8" fill="transparent" />
            <circle id="ad-progress" cx="50" cy="50" r="45" stroke="#dc2626" stroke-width="8" fill="transparent" 
              stroke-dasharray="282.7" stroke-dashoffset="282.7" style="transition: stroke-dashoffset 1s linear;" />
          </svg>
          <div id="ad-countdown" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 32px; font-weight: 900; color: white;">5</div>
        </div>

        <p style="color: #444; font-size: 9px; font-weight: bold; text-transform: uppercase;">Ad supports free streaming</p>
      </div>
    `;

    document.body.appendChild(overlay);

    let timeLeft = 5;
    const progressCircle = overlay.querySelector('#ad-progress');
    const countdownText = overlay.querySelector('#ad-countdown');

    const timer = setInterval(() => {
      timeLeft--;
      if (countdownText) countdownText.textContent = timeLeft;
      if (progressCircle) {
        const offset = 282.7 - (282.7 * (5 - timeLeft)) / 5;
        progressCircle.style.strokeDashoffset = offset;
      }

      if (timeLeft <= 0) {
        clearInterval(timer);
        window.open(streamUrl, '_blank');
        // Trigger Popunder if available
        if (window.pp?.openAd) window.pp.openAd();
        overlay.remove();
      }
    }, 1000);
  }, []);

  // 3. Global Click Interceptor (The High-Performance way)
  useEffect(() => {
    const handleGlobalClick = (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const text = btn.textContent?.toUpperCase() || "";
      if (text.includes('WATCH') || text.includes('STREAM')) {
        // Find the URL in the nearest select
        const card = btn.closest('div');
        const select = card?.querySelector('select');
        const url = select?.value;

        if (url && url !== '#') {
          e.preventDefault();
          e.stopPropagation();
          showAdOverlay(url);
        }
      }
    };

    document.addEventListener('click', handleGlobalClick, true);
    
    // Load Ads
    loadScript('https://pl25482485.profitablecpmrate.com/60/76/8a/60768a49c9584323c2a688a209867c42.js', 'popunder');
    loadScript('https://pl25482361.profitablecpmrate.com/f0/21/e4/f021e4835824982348924343.js', 'native');

    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
      const overlay = document.getElementById('vortex-ad-overlay');
      if (overlay) overlay.remove();
    };
  }, [loadScript, showAdOverlay]);

  // 4. Compact Debug Panel
  if (!isLocalhost()) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[10000] bg-black/90 border border-white/10 p-4 rounded-2xl backdrop-blur-md text-[10px] font-mono leading-tight">
      <div className="flex items-center gap-2 mb-2 font-black text-red-600">
        <div className="w-2 h-2 bg-red-600 rounded-full animate-ping" />
        AD_MANAGER_DEBUG
      </div>
      <div className="space-y-1 text-white/50">
        <p>POP: {adStatus.popunderLoaded ? '✅ READY' : '❌ BLOCKED'}</p>
        <p>NAT: {adStatus.nativeAdLoaded ? '✅ READY' : '❌ BLOCKED'}</p>
        <p>SYS: ✅ LISTENING</p>
      </div>
    </div>
  );
};

export default AdManager;