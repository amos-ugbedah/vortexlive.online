import React, { useEffect, useCallback } from 'react';

const AdManager = () => {
  const showAdOverlay = useCallback((streamUrl) => {
    const overlay = document.createElement('div');
    overlay.id = 'vortex-ad-overlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.98); z-index: 99999; display: flex;
      align-items: center; justify-center: center; backdrop-filter: blur(10px);
    `;
    
    overlay.innerHTML = `
      <div style="text-align: center; width: 100%; max-width: 400px; margin: auto; padding: 40px; background: #0a0a0a; border-radius: 30px; border: 1px solid #dc2626;">
        <div style="font-size: 50px; margin-bottom: 20px;">⚡</div>
        <h2 style="color: white; font-weight: 900; font-style: italic; margin-bottom: 10px;">CONNECTING TO SERVER...</h2>
        <div style="height: 4px; background: #1a1a1a; border-radius: 2px; margin-bottom: 20px; overflow: hidden;">
          <div id="ad-bar" style="width: 0%; height: 100%; background: #dc2626; transition: width 1s linear;"></div>
        </div>
        <p style="color: #666; font-size: 10px; font-weight: bold; letter-spacing: 2px;">ADS SUPPORT OUR FREE HD STREAMS</p>
      </div>
    `;

    document.body.appendChild(overlay);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      const bar = document.getElementById('ad-bar');
      if (bar) bar.style.width = progress + '%';

      if (progress >= 100) {
        clearInterval(interval);
        window.open(streamUrl, '_blank');
        overlay.remove();
        // Trigger Popunder
        if (window.pp?.openAd) window.pp.openAd();
      }
    }, 1000);
  }, []);

  useEffect(() => {
    const handleGlobalClick = (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      // Check if it's a "WATCH" button
      if (btn.textContent.toUpperCase().includes('WATCH')) {
        const card = btn.closest('div'); 
        const select = card?.querySelector('select');
        const url = select?.value || btn.getAttribute('data-url');

        if (url && url !== '#') {
          e.preventDefault();
          e.stopPropagation();
          showAdOverlay(url);
        }
      }
    };

    document.addEventListener('click', handleGlobalClick, true);
    return () => document.removeEventListener('click', handleGlobalClick, true);
  }, [showAdOverlay]);

  return null;
};

export default AdManager;