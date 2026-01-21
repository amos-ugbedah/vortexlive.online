/* eslint-disable */
import React from 'react';

const UltraPlayer = ({ url }) => {
  if (!url) {
    return (
      <div className="flex items-center justify-center w-full h-full text-sm italic bg-zinc-950 text-zinc-500">
        Waiting for Uplink...
      </div>
    );
  }

  // Vortex Stream Processor
  const getProcessedUrl = (target) => {
    // If it's StreamEast or similar, they usually need the 'direct' embed path
    if (target.includes('thestreameast.life')) {
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
        
        /* VORTEX BYPASS 3.0: 
          We are removing the 'sandbox' attribute temporarily. 
          Some providers check for the existence of the word 'sandbox' and block if found.
          'no-referrer' still protects your domain identity.
        */
        referrerPolicy="no-referrer"
        
        /* Removing sandbox allows the provider's scripts to run natively.
           This is why StreamEast works well—it doesn't fight the browser.
        */
        
        loading="eager"
        title="Vortex Ultra Stream"
      ></iframe>

      {/* Aesthetic Overlay */}
      <div className="absolute pointer-events-none top-3 left-3">
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-white tracking-widest uppercase">Server 3: Ultra HD</span>
        </div>
      </div>
    </div>
  );
};

export default UltraPlayer;