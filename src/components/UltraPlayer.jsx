/* eslint-disable */
import React from 'react';

const UltraPlayer = ({ url }) => {
  // CORS FIX: Wrap the target URL in a proxy if it's not a direct stream
  const getProxiedUrl = (target) => {
    if (!target) return "";
    // If the URL is already a sportsonline embed, ensure it's formatted
    let cleanUrl = target.includes('sportsonline.so') && !target.includes('/embed/') 
      ? target.replace('.so/', '.so/embed/') 
      : target;

    // Use a proxy service to bypass X-Frame-Options/CORS blocks
    return `https://cors.io/?url=${encodeURIComponent(cleanUrl)}`;
  };

  return (
    <div className="relative w-full h-full bg-black">
      <iframe
        src={getProxiedUrl(url)}
        className="w-full h-full border-0"
        allow="autoplay; fullscreen; encrypted-media"
        sandbox="allow-forms allow-modals allow-scripts allow-same-origin allow-popups"
        loading="lazy"
      ></iframe>
    </div>
  );
};

export default UltraPlayer;