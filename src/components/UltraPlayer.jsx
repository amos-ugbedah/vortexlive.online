/* eslint-disable */
import React from 'react';

/**
 * ULTRA PLAYER (Vortex Premium)
 * Designed to bypass domain-blocking from providers like Sportsbay and FootyHunter.
 */
const UltraPlayer = ({ url }) => {
  if (!url) {
    return (
      <div className="flex items-center justify-center w-full h-full text-sm italic bg-zinc-950 text-zinc-500">
        Waiting for Uplink...
      </div>
    );
  }

  // Ensure we are using the direct embed link if possible
  const getProcessedUrl = (target) => {
    // If the URL is from sportsbay or footyhunter, we ensure it's clean
    if (target.includes('sportsbay') || target.includes('footyhunter')) {
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
        
        /* VORTEX STEALTH MODE:
          'no-referrer' is the most important part. It tells the browser 
          NOT to tell the provider (Sportsbay) that this request is 
          coming from vortexlive.online.
        */
        referrerPolicy="no-referrer"
        
        /* SANDBOX:
          We MUST allow 'same-origin' so the player can load its internal data,
          and 'scripts' so the video controls work.
        */
        sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-pointer-lock"
        
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