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
        <h2 id="ad-status" style="color: white; font-weight: 900; margin-bottom: 10px; font-family: sans-serif;">ENCRYPTING CONNECTION...</h2>
        <div style="height: 6px; background: #1a1a1a; border-radius: 3px; margin: 20px 0; overflow: hidden;">
          <div id="ad-bar" style="width: 0%; height: 100%; background: #dc2626; transition: width 0.1s linear;"></div>
        </div>
        <div id="ad-btn-container">
           <p style="color: #666; font-size: 10px; font-weight: bold; letter-spacing: 2px;">SECURE STREAM LOADING</p>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    let progress = 0;
    const bar = document.getElementById('ad-bar');
    const status = document.getElementById('ad-status');
    const container = document.getElementById('ad-btn-container');

    const interval = setInterval(() => {
      progress += 2; // Smoother increments
      if (bar) bar.style.width = progress + '%';

      if (progress >= 100) {
        clearInterval(interval);
        if (status) status.innerText = "READY TO WATCH!";
        if (container) {
          container.innerHTML = `
            <button id="go-btn" style="width: 100%; background: #dc2626; color: white; border: none; padding: 18px; border-radius: 15px; font-weight: 900; cursor: pointer; margin-top: 10px;">
              CLICK TO START STREAM
            </button>
          `;
          document.getElementById('go-btn').onclick = () => {
            window.open(url, '_blank');
            overlay.remove();
          };
        }
      }
    }, 100); // 5 seconds total (50 steps of 100ms)
  }, []);

  useEffect(() => {
    const handleGlobalClick = (e) => {
      const btn = e.target.closest('button');
      if (!btn || btn.id === 'go-btn') return;

      // Force detection of any button containing "WATCH"
      if (btn.innerText.toUpperCase().includes('WATCH')) {
        e.preventDefault();
        e.stopPropagation();

        const card = btn.closest('div');
        // Check select first, then fallback to button data attributes
        const select = card?.querySelector('select');
        const streamUrl = select?.value || btn.getAttribute('data-url');

        if (streamUrl && streamUrl !== '#') {
          showAdOverlay(streamUrl);
        }
      }
    };

    document.addEventListener('click', handleGlobalClick, true);
    return () => document.removeEventListener('click', handleGlobalClick, true);
  }, [showAdOverlay]);

  return null;
};

export default AdManager;