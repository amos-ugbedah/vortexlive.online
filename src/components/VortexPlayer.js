import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

const VortexPlayer = ({ url }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // 1. If the browser supports HLS natively (like Safari/iPhone)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
    } 
    // 2. If it needs the Hls.js library (Chrome/Android/PC)
    else if (Hls.isSupported()) {
      const hls = new Hls({
        maxMaxBufferLength: 30, // Keeps stream smooth
        enableWorker: true
      });
      hls.loadSource(url);
      hls.attachMedia(video);

      return () => {
        hls.destroy(); // Cleanup when user leaves page
      };
    }
  }, [url]);

  return (
    <div style={{ position: 'relative', paddingTop: '56.25%', backgroundColor: '#000', borderRadius: '15px', overflow: 'hidden' }}>
      <video 
        ref={videoRef} 
        controls 
        playsInline
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        poster="https://vortexlive.online/loading-thumb.jpg" 
      />
    </div>
  );
};

export default VortexPlayer;