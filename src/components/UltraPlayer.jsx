/* eslint-disable */
import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Loader2, AlertTriangle } from 'lucide-react';

const UltraPlayer = ({ url }) => {
  const videoRef = useRef(null);
  const [playerState, setPlayerState] = useState('loading');

  useEffect(() => {
    if (!url) {
      setPlayerState('waiting');
      return;
    }

    const isDirectStream = url.toLowerCase().includes('.m3u8') || 
                           url.toLowerCase().includes('.mp4') || 
                           url.toLowerCase().includes('.ts');

    if (!isDirectStream) {
      setPlayerState('iframe');
      return;
    }

    setPlayerState('hls');
    const video = videoRef.current;
    if (!video) return;

    let hls;
    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
        xhrSetup: (xhr) => { xhr.withCredentials = false; }
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) setPlayerState('error');
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
    }

    return () => { if (hls) hls.destroy(); };
  }, [url]);

  if (playerState === 'waiting') {
    return <div className="flex items-center justify-center w-full h-full text-sm italic bg-zinc-950 text-zinc-500">Waiting for Uplink...</div>;
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {playerState === 'hls' && (
        <video ref={videoRef} className="object-contain w-full h-full" controls autoPlay playsInline />
      )}

      {playerState === 'iframe' && (
        <iframe
          src={url}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          referrerPolicy="no-referrer"
          title="Vortex Ultra Stream"
        />
      )}

      {(playerState === 'loading') && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
          <Loader2 className="text-red-600 animate-spin" size={32} />
        </div>
      )}

      {playerState === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-red-500 bg-zinc-950">
          <AlertTriangle size={32} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Uplink Lost</span>
        </div>
      )}

      <div className="absolute z-10 pointer-events-none top-3 left-3">
        <div className="flex items-center gap-2 bg-zinc-900/90 px-3 py-1.5 rounded-full border border-white/10 shadow-lg backdrop-blur-md">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_#dc2626]" />
          <span className="text-[10px] font-bold text-white tracking-widest uppercase">
            {playerState === 'hls' ? 'Uplink: Direct 4K' : 'Server 3: Ultra HD'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default UltraPlayer;