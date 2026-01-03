export const checkAdStatus = () => {
  console.group('🔍 AD SYSTEM DIAGNOSTICS');
  
  // Check PropellerAds
  const propScripts = document.querySelectorAll('script[src*="profitablecpmrate.com"]');
  console.log(`PropellerAds scripts found: ${propScripts.length}`);
  
  // Check if in iframe (ad blocker might be blocking)
  console.log(`Is in iframe: ${window.top !== window.self}`);
  
  // Check for common ad blockers
  const adBlockTests = {
    blockedByAdBlock: false,
    blockedByPrivacyBadger: false,
    blockedByGhostery: false
  };
  
  // Test ad blocker
  const ad = document.createElement('div');
  ad.innerHTML = '&nbsp;';
  ad.className = 'adsbox';
  ad.style.position = 'absolute';
  ad.style.left = '-9999px';
  document.body.appendChild(ad);
  
  setTimeout(() => {
    const isBlocked = ad.offsetHeight === 0;
    console.log(`Ad blocker detected: ${isBlocked}`);
    document.body.removeChild(ad);
  }, 100);
  
  console.groupEnd();
  
  return {
    scriptsLoaded: propScripts.length > 0,
    isIframed: window.top !== window.self
  };
};

// Run on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(checkAdStatus, 3000);
  });
}