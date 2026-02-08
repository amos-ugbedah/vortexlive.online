/* eslint-disable */
import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Loader2, AlertTriangle } from 'lucide-react';

const UltraPlayer = ({ url }) => {
  const videoRef = useRef(null);
  const [playerState, setPlayerState] = useState('loading'); // loading, hls, iframe, error

  useEffect(() => {
    if (!url) {
      setPlayerState('waiting');
      return;
    }

    // VORTEX SMART DETECTION: Detect if it's a raw video stream or a website
    const isDirectStream = url.toLowerCase().includes('.m3u8') || 
                           url.toLowerCase().includes('.mp4') || 
                           url.toLowerCase().includes('.ts');

    if (!isDirectStream) {
      setPlayerState('iframe');
      return;
    }

    // HLS INITIALIZATION: For direct stream files
    setPlayerState('hls');
    const video = videoRef.current;
    if (!video) return;

    let hls;
    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
        // Bypass some basic CORS restrictions where possible
        xhrSetup: (xhr) => { xhr.withCredentials = false; }
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error("Vortex HLS Error:", data);
          setPlayerState('error');
        }
      });
    } 
    // Native support for Safari/iOS
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [url]);

  // Handle Empty State
  if (playerState === 'waiting') {
    return (
      <div className="flex items-center justify-center w-full h-full text-sm italic bg-zinc-950 text-zinc-500">
        Waiting for Uplink...
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-black" style={{ transform: 'translateZ(0)', billChange: 'transform' }}>
      
      {/* MODE 1: Direct Video Stream (.m3u8) */}
      {playerState === 'hls' && (
        <video
          ref={videoRef}
          className="object-contain w-full h-full"
          controls
          autoPlay
          playsInline
        />
      )}

      {/* MODE 2: Original Iframe Player */}
      {playerState === 'iframe' && (
        <iframe
          src={url}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen={true}
          webkitallowfullscreen="true"
          mozallowfullscreen="true"
          referrerPolicy="no-referrer"
          style={{ transform: 'translateZ(0)', width: '100%', height: '100%' }}
          loading="eager"
          title="Vortex Ultra Stream"
        />
      )}

      {/* LOADING STATE */}
      {playerState === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
          <Loader2 className="text-red-600 animate-spin" size={32} />
        </div>
      )}

      {/* ERROR STATE */}
      {playerState === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-red-500 bg-zinc-950">
          <AlertTriangle size={32} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Uplink Lost: Token Expired or Server Offline</span>
        </div>
      )}

      {/* VORTEX AESTHETIC OVERLAY */}
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