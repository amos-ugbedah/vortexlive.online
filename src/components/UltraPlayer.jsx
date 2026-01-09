/* eslint-disable */
import React from 'react';

/**
 * UltraPlayer: The "Pro" version that removes the unstable cors.io proxy.
 * Uses no-referrer policy to bypass domain blocks used by stream providers.
 */
const UltraPlayer = ({ url }) => {
  if (!url) {
    return (
      <div className="flex items-center justify-center w-full h-full text-sm italic bg-zinc-950 text-zinc-500">
        No Signal Detected...
      </div>
    );
  }

  // Pro Logic: Format sportsonline links or return clean URL
  const getCleanUrl = (target) => {
    if (target.includes('sportsonline.so') && !target.includes('/embed/')) {
      return target.replace('.so/', '.so/embed/');
    }
    return target;
  };

  return (
    <div className="relative w-full h-full bg-black">
      <iframe
        src={getCleanUrl(url)}
        className="w-full h-full border-0 shadow-2xl"
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        // THE SECRET SAUCE: Prevents the server from seeing your domain, 
        // which stops them from sending the "JSON error" or blocking the frame.
        referrerPolicy="no-referrer"
        // Sandbox allows the video to play but prevents the stream from 
        // trying to redirect your whole website to an ad page.
        sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
        loading="lazy"
        title="Vortex Ultra Stream"
      ></iframe>
    </div>
  );
};

export default UltraPlayer;