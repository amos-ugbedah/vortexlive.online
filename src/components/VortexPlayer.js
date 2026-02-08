/*eslint-disable */
import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

const VortexPlayer = ({ url }) => {
  const videoRef = useRef(null);
  const [isIframe, setIsIframe] = useState(false);

  useEffect(() => {
    if (!url) return;

    // Detect if link is a website/iframe instead of a video file
    const isDirectVideo = url.toLowerCase().includes('.m3u8') || url.toLowerCase().includes('.mp4');
    
    if (!isDirectVideo) {
      setIsIframe(true);
      return;
    }

    setIsIframe(false);
    const video = videoRef.current;
    if (!video) return;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
    } else if (Hls.isSupported()) {
      const hls = new Hls({ maxMaxBufferLength: 30, enableWorker: true });
      hls.loadSource(url);
      hls.attachMedia(video);
      return () => hls.destroy();
    }
  }, [url]);

  return (
    <div style={{ position: 'relative', paddingTop: '56.25%', backgroundColor: '#000', borderRadius: '15px', overflow: 'hidden' }}>
      {isIframe ? (
        <iframe 
          src={url} 
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} 
          allowFullScreen 
          allow="autoplay; fullscreen"
        />
      ) : (
        <video 
          ref={videoRef} 
          controls 
          playsInline 
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          poster="https://vortexlive.online/loading-thumb.jpg" 
        />
      )}
    </div>
  );
};

export default VortexPlayer;