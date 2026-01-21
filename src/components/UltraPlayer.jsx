/* eslint-disable */

import React from 'react';

const UltraPlayer = ({ url }) => {
  if (!url) {
    return (
      <div className="flex items-center justify-center w-full h-full text-sm italic bg-zinc-950 text-zinc-500">
        No Signal Detected...
      </div>
    );
  }

  // Logic to ensure the URL is embed-ready
  const getProcessedUrl = (target) => {
    // If it's a footyhunter link, we ensure it's loaded as a clean frame
    if (target.includes('footyhunterhd.shop')) {
      return target;
    }
    return target;
  };

  return (
    <div className="relative w-full h-full bg-black">
      <iframe
        src={getProcessedUrl(url)}
        className="w-full h-full border-0"
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        
        /* VORTEX BYPASS:
           'no-referrer' hides your website URL from footyhunter.
           This stops them from blocking the stream because of "Cross-Origin".
        */
        referrerPolicy="no-referrer"
        
        /* SANDBOX:
           'allow-same-origin' is REQUIRED for footyhunter's PHP player to load its own scripts.
        */
        sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
        loading="lazy"
        title="Vortex Ultra Stream"
      ></iframe>
    </div>
  );
};

export default UltraPlayer;