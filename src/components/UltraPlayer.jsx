/* eslint-disable */
import React from 'react';

/**
 * ULTRA PLAYER (Vortex Premium)
 * Version 2.0 - Enhanced Stealth & Permission Bypass
 * Designed to bypass domain-blocking and sandbox restrictions from providers.
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
           Prevents the provider from seeing 'vortexlive.online' as the source.
        */
        referrerPolicy="no-referrer"
        
        /* ENHANCED SANDBOX:
           Added: 
           - allow-top-navigation: Allows the player to handle internal redirects.
           - allow-popups: Required for many players to initialize the video session.
           - allow-modals: Prevents the player from crashing if it tries to show an alert.
        */
        sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-pointer-lock allow-top-navigation allow-popups allow-modals"
        
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