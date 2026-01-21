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

  const getProcessedUrl = (target) => {
    if (target.includes('thestreameast.life')) {
      return target;
    }
    return target;
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-black" style={{ transform: 'translateZ(0)', willChange: 'transform' }}>
      <iframe
        src={getProcessedUrl(url)}
        className="w-full h-full border-0"
        /* VORTEX MAXIMIZE: Essential permissions for the internal player buttons to work */
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        allowFullScreen={true}
        webkitallowfullscreen="true"
        mozallowfullscreen="true"
        
        referrerPolicy="no-referrer"
        
        /* Hardware acceleration to stop blinking/color shifts */
        style={{ transform: 'translateZ(0)', width: '100%', height: '100%' }}
        
        loading="eager"
        title="Vortex Ultra Stream"
      ></iframe>

      {/* Aesthetic Overlay - Simplified to prevent z-index blinking */}
      <div className="absolute z-10 pointer-events-none top-3 left-3">
        <div className="flex items-center gap-2 bg-zinc-900/80 px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-white tracking-widest uppercase">Server 3: Ultra HD</span>
        </div>
      </div>
    </div>
  );
};

export default UltraPlayer;