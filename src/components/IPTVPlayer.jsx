/* eslint-disable */
import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { AlertTriangle, Loader2 } from 'lucide-react';
import UltraPlayer from './UltraPlayer';

const IPTVPlayer = ({ url }) => {
  const videoRef = useRef(null);
  const [playerType, setPlayerType] = useState('loading'); 

  useEffect(() => {
    if (!url) return;

    const isStreamFile = url.toLowerCase().includes('.m3u8') || 
                         url.toLowerCase().includes('.mp4') || 
                         url.toLowerCase().includes('.ts');

    if (!isStreamFile) {
      setPlayerType('iframe');
      return;
    }

    setPlayerType('hls');
    const video = videoRef.current;
    if (!video) return;

    let hls;
    if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) setPlayerType('error');
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
    }

    return () => { if (hls) hls.destroy(); };
  }, [url]);

  if (playerType === 'error') {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-4 text-red-500 bg-zinc-950">
        <AlertTriangle size={48} />
        <p className="text-xs font-black tracking-widest uppercase">Stream Source Offline</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-black rounded-2xl">
      {playerType === 'hls' && (
        <video
          ref={videoRef}
          controls
          autoPlay
          playsInline
          className="w-full h-full"
        />
      )}

      {playerType === 'iframe' && <UltraPlayer url={url} />}

      {playerType === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
          <Loader2 className="text-red-600 animate-spin" size={32} />
        </div>
      )}
    </div>
  );
};

export default IPTVPlayer;