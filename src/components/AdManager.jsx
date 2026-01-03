import React, { useEffect, useState } from 'react';

const AdManager = () => {
  const [adStatus, setAdStatus] = useState({
    popunderLoaded: false,
    nativeAdLoaded: false,
    directLinkReady: false
  });

  // Initialize ads
  useEffect(() => {
    initializeAds();
    return () => cleanupAds();
  }, []);

  const initializeAds = () => {
    console.log('🎬 AdManager: Initializing ad system...');
    
    // Load ads (only in production)
    if (!isLocalhost()) {
      loadPopUnder();
      loadNativeAds();
    }
    
    // Setup stream click handlers - BUT ONLY FOR STREAM BUTTONS
    setupStreamButtonListeners();
  };

  const isLocalhost = () => {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1';
  };

  const loadPopUnder = () => {
    try {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://pl25482485.profitablecpmrate.com/60/76/8a/60768a49c9584323c2a688a209867c42.js';
      script.async = true;
      script.onload = () => {
        console.log('✅ Pop-under ad loaded');
        setAdStatus(prev => ({ ...prev, popunderLoaded: true }));
      };
      script.onerror = () => {
        console.log('⚠️ Pop-under failed to load (might be ad blocker)');
      };
      document.body.appendChild(script);
    } catch (error) {
      console.log('⚠️ Pop-under script error:', error);
    }
  };

  const loadNativeAds = () => {
    try {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://pl25482361.profitablecpmrate.com/f0/21/e4/f021e4835824982348924343.js';
      script.async = true;
      script.onload = () => {
        console.log('✅ Native ads loaded');
        setAdStatus(prev => ({ ...prev, nativeAdLoaded: true }));
      };
      script.onerror = () => {
        console.log('⚠️ Native ads failed to load (might be ad blocker)');
      };
      document.body.appendChild(script);
    } catch (error) {
      console.log('⚠️ Native ads script error:', error);
    }
  };

  const setupStreamButtonListeners = () => {
    console.log('🎯 Setting up stream button listeners...');
    
    // Wait for React to render buttons
    setTimeout(() => {
      // Find ALL stream buttons
      const streamButtons = document.querySelectorAll('button');
      
      streamButtons.forEach(button => {
        const buttonText = button.textContent || '';
        const isStreamButton = 
          buttonText.includes('WATCH STREAM') ||
          buttonText.includes('WATCH LIVE') ||
          (buttonText.includes('WATCH') && buttonText.includes('STREAM')) ||
          (buttonText.includes('🔴') && buttonText.includes('WATCH'));
        
        if (isStreamButton) {
          console.log('🎯 Found stream button:', buttonText.trim());
          
          // Remove any existing click handlers
          const newButton = button.cloneNode(true);
          button.parentNode.replaceChild(newButton, button);
          
          // Add our ad overlay handler
          newButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('🎬 Stream button clicked!');
            
            // Get stream URL from select dropdown
            const matchCard = this.closest('[class*="bg-"]');
            if (matchCard) {
              const select = matchCard.querySelector('select');
              if (select && select.value && select.value !== '#') {
                showAdOverlay(select.value);
              } else {
                // If no URL found, let original handler work
                console.log('⚠️ No stream URL found, skipping ad');
                return true;
              }
            }
          });
        }
      });
      
      console.log(`✅ Found and hooked ${streamButtons.length} stream buttons`);
      setAdStatus(prev => ({ ...prev, directLinkReady: true }));
    }, 2000); // Wait 2 seconds for page to load
  };

  const showAdOverlay = (streamUrl) => {
    console.log('🎥 Showing ad overlay for:', streamUrl);
    
    return new Promise((resolve) => {
      // Remove any existing overlay
      const existingOverlay = document.getElementById('vortex-ad-overlay');
      if (existingOverlay) existingOverlay.remove();
      
      // Create ad overlay
      const overlay = document.createElement('div');
      overlay.id = 'vortex-ad-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.98);
        z-index: 99999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      `;
      
      overlay.innerHTML = `
        <div style="text-align: center; padding: 30px; max-width: 500px; background: #111; border-radius: 20px; border: 3px solid #dc2626;">
          <h2 style="color: #dc2626; font-size: 28px; margin-bottom: 15px; font-weight: 900;">
            ⚡ LOADING STREAM
          </h2>
          <p style="margin-bottom: 25px; color: #ccc; font-size: 14px;">
            Your HD stream will open in 
            <span id="countdown" style="color: #dc2626; font-size: 36px; font-weight: bold; margin: 0 5px;">5</span> 
            seconds
          </p>
          
          <!-- Ad Container -->
          <div style="width: 100%; height: 200px; background: #000; border-radius: 12px; overflow: hidden; margin-bottom: 25px; border: 2px solid #dc2626;">
            <div style="display: flex; align-items: center; justify-content: center; height: 100%;">
              <div style="text-align: center;">
                <div style="font-size: 48px; margin-bottom: 10px;">🎥</div>
                <div style="font-size: 32px; font-weight: 900; color: #dc2626;" id="ad-countdown">5</div>
                <div style="color: #888; margin-top: 10px; font-size: 13px;">Seconds Remaining</div>
              </div>
            </div>
          </div>
          
          <div style="color: #666; font-size: 12px; margin-top: 10px;">
            ⚡ Ad supports free HD streams ⚡
          </div>
          
          <button id="skip-ad-btn" style="
            margin-top: 20px;
            background: #333;
            color: white;
            border: none;
            padding: 8px 20px;
            border-radius: 20px;
            font-size: 11px;
            cursor: pointer;
            opacity: 0.7;
          ">
            ⏩ Skip Ad (Debug)
          </button>
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      // Countdown timer
      let seconds = 5;
      const countdownElement = document.getElementById('ad-countdown');
      const skipBtn = document.getElementById('skip-ad-btn');
      
      const timer = setInterval(() => {
        seconds--;
        if (countdownElement) countdownElement.textContent = seconds;
        
        if (seconds <= 0) {
          clearInterval(timer);
          openStream(streamUrl);
          overlay.remove();
          resolve();
        }
      }, 1000);
      
      // Skip button for debugging
      if (skipBtn) {
        skipBtn.addEventListener('click', () => {
          clearInterval(timer);
          console.log('⏩ Skipping ad (debug mode)');
          openStream(streamUrl);
          overlay.remove();
          resolve();
        });
      }
    });
  };

  const openStream = (streamUrl) => {
    console.log('🚀 Opening stream:', streamUrl);
    
    try {
      // Open stream in new tab
      window.open(streamUrl, '_blank');
      
      // Try to trigger pop-under after a delay
      setTimeout(() => {
        try {
          if (typeof window.pp !== 'undefined' && window.pp.openAd) {
            window.pp.openAd();
            console.log('✅ Pop-under triggered');
          }
        } catch(e) {
          console.log('⚠️ Pop-under not available');
        }
      }, 300);
      
    } catch(e) {
      console.error('❌ Error opening stream:', e);
      // Fallback
      window.location.href = streamUrl;
    }
  };

  const cleanupAds = () => {
    // Cleanup overlay if exists
    const overlay = document.getElementById('vortex-ad-overlay');
    if (overlay) {
      overlay.remove();
    }
  };

  // Debug panel - ONLY in development
  const DebugPanel = () => {
    const isDev = window.location.hostname === 'localhost' || 
                  window.location.hostname.includes('127.0.0.1');
    
    if (!isDev) return null;
    
    return (
      <div style={{
        position: 'fixed',
        bottom: '10px',
        left: '10px', // Moved to left side
        background: 'rgba(0,0,0,0.85)',
        color: 'white',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '12px',
        zIndex: 10000,
        maxWidth: '200px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
        fontFamily: 'monospace'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#dc2626' }}>
          🎬 AdManager Debug
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', marginRight: '8px', 
            backgroundColor: adStatus.popunderLoaded ? '#10B981' : '#EF4444' }} />
          <span>Pop-under: {adStatus.popunderLoaded ? '✅' : '❌'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', marginRight: '8px', 
            backgroundColor: adStatus.nativeAdLoaded ? '#10B981' : '#EF4444' }} />
          <span>Native Ads: {adStatus.nativeAdLoaded ? '✅' : '❌'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', marginRight: '8px', 
            backgroundColor: adStatus.directLinkReady ? '#10B981' : '#EF4444' }} />
          <span>Stream Links: {adStatus.directLinkReady ? '✅' : '❌'}</span>
        </div>
      </div>
    );
  };

  return <DebugPanel />;
};

export default AdManager;