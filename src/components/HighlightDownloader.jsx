/* eslint-disable */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Download, Video, Clock, Shield, Zap, Play, Film, Timer, AlertCircle, Share2, Target } from 'lucide-react';

const VideoHighlightGenerator = ({ match }) => {
  const [selectedLength, setSelectedLength] = useState(12);
  const [isProcessing, setIsProcessing] = useState(false);
  const [highlightMode, setHighlightMode] = useState('goal');
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState(null);
  const [currentTimestamp, setCurrentTimestamp] = useState('00:00:00');

  const CLOUD_FUNCTION_URL = 'https://us-central1-votexlive-3a8cb.cloudfunctions.net/generateHighlight';

  const durationOptions = useMemo(() => [
    { value: 8, label: '8s' },
    { value: 12, label: '12s' },
    { value: 20, label: '20s' },
    { value: 30, label: '30s' }
  ], []);

  const HIGHLIGHT_MODES = useMemo(() => [
    { value: 'goal', label: 'GOAL', icon: <Target className="text-green-500" size={14} /> },
    { value: 'save', label: 'SAVE', icon: <Shield className="text-blue-500" size={14} /> },
    { value: 'chance', label: 'CHANCE', icon: <Zap className="text-orange-500" size={14} /> },
    { value: 'custom', label: 'CUSTOM', icon: <Timer className="text-purple-500" size={14} /> }
  ], []);

  useEffect(() => {
    if (match?.minute && !isProcessing) {
      const mins = parseInt(match.minute) || 0;
      const h = Math.floor(mins / 60).toString().padStart(2, '0');
      const m = (mins % 60).toString().padStart(2, '0');
      setCurrentTimestamp(`${h}:${m}:00`);
    }
  }, [match?.minute, isProcessing]);

  const generateVideoHighlight = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setError(null);
    setGeneratedVideoUrl(null);
    setProgress(5);

    // Simulated progress logic
    const interval = setInterval(() => {
      setProgress(p => (p < 90 ? p + Math.random() * 5 : p));
    }, 1000);

    try {
      const res = await fetch(CLOUD_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.id,
          eventType: highlightMode,
          timestamp: currentTimestamp,
          duration: selectedLength
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setProgress(100);
      setGeneratedVideoUrl(data.videoUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      clearInterval(interval);
      setIsProcessing(false);
    }
  };

  const handleShare = (platform) => {
    const text = `Check out this highlight: ${match.home.name} vs ${match.away.name}`;
    const url = encodeURIComponent(generatedVideoUrl);
    const links = {
      whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + generatedVideoUrl)}`,
      telegram: `https://t.me/share/url?url=${url}&text=${encodeURIComponent(text)}`
    };
    window.open(links[platform], '_blank');
  };

  if (!match) return null;

  return (
    <div className="p-6 mt-8 overflow-hidden border bg-zinc-900 border-white/10 rounded-3xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-600 rounded-lg"><Film size={20} /></div>
          <h3 className="text-sm font-bold tracking-tight uppercase">AI Highlight Studio</h3>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 border rounded-full bg-white/5 border-white/10">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold">READY</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-5">
          <div>
            <label className="text-[10px] font-bold text-white/40 uppercase mb-2 block">Event Type</label>
            <div className="grid grid-cols-4 gap-2">
              {HIGHLIGHT_MODES.map(m => (
                <button 
                  key={m.value}
                  onClick={() => setHighlightMode(m.value)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${highlightMode === m.value ? 'bg-red-600 border-red-400' : 'bg-white/5 border-white/10'}`}
                >
                  {m.icon}
                  <span className="text-[9px] font-black">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-white/40 uppercase mb-2 block">Clip Duration</label>
              <div className="flex gap-2">
                {durationOptions.map(o => (
                  <button 
                    key={o.value}
                    onClick={() => setSelectedLength(o.value)}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold border ${selectedLength === o.value ? 'bg-white text-black' : 'bg-white/5 border-white/10'}`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {highlightMode === 'custom' && (
            <div className="p-4 border bg-black/40 rounded-xl border-white/5">
              <label className="text-[10px] font-bold text-white/40 uppercase mb-2 block">Start Time (HH:MM:SS)</label>
              <input 
                type="text" 
                value={currentTimestamp}
                onChange={(e) => setCurrentTimestamp(e.target.value)}
                className="w-full font-mono text-xl bg-transparent border-b outline-none border-white/20 focus:border-red-500"
              />
            </div>
          )}
        </div>

        <div className="relative flex flex-col items-center justify-center overflow-hidden bg-black border aspect-video rounded-2xl border-white/10">
          {generatedVideoUrl ? (
            <video src={generatedVideoUrl} controls className="object-contain w-full h-full" autoPlay />
          ) : (
            <div className="p-6 text-center">
              {isProcessing ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 rounded-full border-red-600/20 border-t-red-600 animate-spin" />
                  <span className="text-xs font-black animate-pulse">GENERATING {Math.round(progress)}%</span>
                </div>
              ) : (
                <Play className="mx-auto mb-2 text-white/10" size={40} />
              )}
              <p className="text-[10px] text-white/40 mt-2 italic">Select event and duration to clip the live stream</p>
            </div>
          )}
        </div>
      </div>

      {error && <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold rounded-lg">{error}</div>}

      <div className="flex items-center justify-between pt-6 mt-6 border-t border-white/5">
        <div className="flex gap-4">
            {generatedVideoUrl && (
                <>
                <button onClick={() => handleShare('whatsapp')} className="p-2 text-green-500 rounded-lg bg-green-500/10 hover:bg-green-500/20"><Share2 size={18}/></button>
                <a href={generatedVideoUrl} download className="p-2 text-blue-500 rounded-lg bg-blue-500/10 hover:bg-blue-500/20"><Download size={18}/></a>
                </>
            )}
        </div>
        <button 
          onClick={generateVideoHighlight}
          disabled={isProcessing}
          className={`px-8 py-3 rounded-xl font-black text-xs uppercase transition-all ${isProcessing ? 'bg-zinc-800 text-white/20' : 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/20 active:scale-95'}`}
        >
          {isProcessing ? 'Processing...' : 'Generate Clip'}
        </button>
      </div>
    </div>
  );
};

export default VideoHighlightGenerator;