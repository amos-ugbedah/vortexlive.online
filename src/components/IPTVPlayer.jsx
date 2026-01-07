import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

const IPTVPlayer = ({ url }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // For Safari users
      video.src = url;
    }
  }, [url]);

  return (
    <video 
      ref={videoRef} 
      controls 
      className="w-full h-full rounded-2xl"
      poster="/vortex-loading.jpg" // Optional loading image
    />
  );
};

export default IPTVPlayer;