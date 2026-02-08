/* eslint-disable */
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs 
} from 'firebase/firestore';
import { 
  ChevronLeft, Download, Shield, Target, Award, 
  AlertTriangle, CheckCircle, Zap, Sparkles, Globe, 
  Film, Loader, Share2, Maximize2, RefreshCcw
} from 'lucide-react';

const VideoHighlightPage = () => {
  const { id } = useParams();
  
  // State Management
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingVideo, setGeneratingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [error, setError] = useState(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState(null);

  // Configuration State
  const [selectedEventType, setSelectedEventType] = useState('goal');
  const [selectedDuration, setSelectedDuration] = useState(15);
  const [selectedQuality, setSelectedQuality] = useState('hd');

  // Constants
  const EVENT_TYPES = [
    { value: 'goal', label: 'GOAL', icon: <Target size={14} className="text-green-500" /> },
    { value: 'save', label: 'SAVE', icon: <Shield size={14} className="text-blue-500" /> },
    { value: 'foul', label: 'FOUL', icon: <AlertTriangle size={14} className="text-yellow-500" /> },
    { value: 'card', label: 'CARD', icon: <Award size={14} className="text-orange-500" /> },
    { value: 'chance', label: 'CHANCE', icon: <Zap size={14} className="text-purple-500" /> }
  ];

  const DURATION_OPTIONS = [
    { value: 8, label: '8 SEC' },
    { value: 15, label: '15 SEC' },
    { value: 30, label: '30 SEC' },
    { value: 45, label: '45 SEC' }
  ];

  const QUALITY_OPTIONS = [
    { value: 'sd', label: 'SD', description: '480p' },
    { value: 'hd', label: 'HD', description: '720p' },
    { value: 'fhd', label: 'FHD', description: '1080p' }
  ];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const matchDoc = await getDoc(doc(db, 'matches', id));
      if (!matchDoc.exists()) {
        setError('Match data not found in Vortex Database');
        return;
      }
      
      const match = matchDoc.data();
      setMatchData(match);
      
      // Fetch latest generated highlight if it exists
      const highlightsRef = collection(db, "videoHighlights");
      const q = query(
        highlightsRef, 
        where("matchId", "==", id), 
        orderBy("generatedAt", "desc"), 
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        setGeneratedVideoUrl(data.videoUrl);
      }
    } catch (err) {
      console.error('Vortex Fetch Error:', err);
      setError('System synchronization failed');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generateVideoHighlight = async () => {
    const status = matchData?.status || 'NS';
    const isAvailable = ['LIVE', '1H', '2H', 'HT', 'ET', 'FT'].includes(status);

    if (!isAvailable) {
      setError('Highlights unavailable: Match has not started');
      return;
    }
    
    setGeneratingVideo(true);
    setError(null);
    setVideoProgress(5); // Initial kick-off
    
    try {
      // Fake progress increment for UX
      const progressInterval = setInterval(() => {
        setVideoProgress(prev => (prev >= 85 ? 85 : prev + 5));
      }, 800);
      
      // Calculate Timestamp based on match minute
      const minute = matchData.minute || 0;
      const hours = Math.floor(minute / 60);
      const mins = minute % 60;
      const formattedTimestamp = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
      
      const response = await fetch(
        `https://us-central1-votexlive-3a8cb.cloudfunctions.net/generateVideoHighlight`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            matchId: id,
            eventType: selectedEventType,
            timestamp: formattedTimestamp,
            duration: selectedDuration,
            quality: selectedQuality,
            vortexEngine: "v3-flash"
          })
        }
      );
      
      clearInterval(progressInterval);
      
      if (!response.ok) throw new Error('Vortex Cloud Engine is currently throttled');
      const result = await response.json();
      
      if (result.success) {
        setVideoProgress(100);
        // Short delay to let the user see 100% completion
        setTimeout(() => {
          setGeneratedVideoUrl(result.videoUrl || result.data?.videoUrl);
          setGeneratingVideo(false);
          new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3').play().catch(() => {});
        }, 1000);
      } else {
        throw new Error(result.message || 'Processing Interrupted');
      }
    } catch (err) {
      setError(err.message);
      setGeneratingVideo(false);
      setVideoProgress(0);
    }
  };

  const shareContent = (platform) => {
    const text = `Check out this ${selectedEventType.toUpperCase()} from ${matchData?.home?.name} vs ${matchData?.away?.name}!`;
    const url = platform === 'wa' 
      ? `https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + generatedVideoUrl)}`
      : `https://t.me/share/url?url=${encodeURIComponent(generatedVideoUrl)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#020202]">
      <div className="relative">
        <Loader className="text-red-600 animate-spin" size={48} />
        <div className="absolute inset-0 bg-red-600 blur-2xl opacity-20 animate-pulse"></div>
      </div>
      <p className="mt-6 text-[10px] font-black tracking-[0.5em] text-white/40 uppercase">Vortex Engine Syncing</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020202] text-white pb-20 selection:bg-red-600">
      <div className="max-w-6xl px-4 py-8 mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col items-start justify-between gap-6 mb-12 md:flex-row md:items-center">
          <div>
            <Link to={`/match/${id}`} className="inline-flex items-center gap-2 mb-6 transition-all text-white/40 hover:text-red-500">
              <ChevronLeft size={18} />
              <span className="text-xs font-black tracking-widest uppercase">Return to Arena</span>
            </Link>
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-red-600 rounded-2xl">
                <Film size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tighter uppercase md:text-5xl">Vortex Replay</h1>
                <p className="text-xs font-bold tracking-[0.2em] text-white/30 uppercase mt-1">
                  {matchData?.league || 'Elite Division'} • Live Clipping
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button onClick={fetchData} className="p-4 transition-colors border rounded-2xl bg-white/5 border-white/10 hover:bg-white/10">
                <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
             </button>
             {generatedVideoUrl && (
                <a href={generatedVideoUrl} download className="flex items-center gap-3 px-8 py-4 font-black text-black transition-transform bg-white rounded-2xl hover:scale-105 active:scale-95">
                  <Download size={18} /> SAVE CLIP
                </a>
             )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid gap-8 lg:grid-cols-12">
          
          {/* Left: Video Player / Generation Panel */}
          <div className="lg:col-span-8">
            {generatedVideoUrl && !generatingVideo ? (
              <div className="overflow-hidden border bg-zinc-900/40 rounded-[2.5rem] border-white/10">
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                    <span className="text-[10px] font-black tracking-widest text-white/60">VORTEX_STREAM_READY // {selectedQuality.toUpperCase()}</span>
                  </div>
                  <button onClick={() => document.getElementById('v-player').requestFullscreen()} className="text-white/40 hover:text-white">
                    <Maximize2 size={16} />
                  </button>
                </div>
                <video id="v-player" src={generatedVideoUrl} controls autoPlay className="w-full bg-black aspect-video" />
                <div className="flex gap-3 p-6">
                    <button onClick={() => shareContent('wa')} className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#25D366] text-black font-black rounded-xl text-xs uppercase tracking-widest">
                      <Share2 size={16}/> WhatsApp
                    </button>
                    <button onClick={() => shareContent('tg')} className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#0088cc] text-white font-black rounded-xl text-xs uppercase tracking-widest">
                      <Share2 size={16}/> Telegram
                    </button>
                </div>
              </div>
            ) : (
              <div className="p-8 border bg-zinc-900/20 rounded-[2.5rem] border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-4 mb-10">
                  <Sparkles className="text-red-500" size={24} />
                  <h2 className="text-2xl italic font-black tracking-tighter uppercase">Vortex Clip Studio</h2>
                </div>

                {videoProgress > 0 && (
                   <div className="p-6 mb-10 border rounded-2xl bg-red-600/5 border-red-600/20">
                      <div className="flex justify-between mb-4">
                        <span className="text-[10px] font-black tracking-widest text-red-500">ENCODING FRAME DATA</span>
                        <span className="text-xs font-black">{videoProgress}%</span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full bg-red-600 transition-all duration-500 shadow-[0_0_15px_rgba(220,38,38,0.5)]" style={{ width: `${videoProgress}%` }} />
                      </div>
                   </div>
                )}

                <div className="grid gap-8 md:grid-cols-3">
                  <section>
                    <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">01. Event</label>
                    <div className="grid grid-cols-2 gap-2">
                      {EVENT_TYPES.map(e => (
                        <button key={e.value} onClick={() => setSelectedEventType(e.value)} 
                          className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${selectedEventType === e.value ? 'bg-red-600 border-transparent scale-105' : 'bg-white/5 border-white/10 hover:border-white/30'}`}>
                          {e.icon}
                          <span className="text-[10px] font-black">{e.label}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">02. Length</label>
                    <div className="grid grid-cols-2 gap-2">
                      {DURATION_OPTIONS.map(d => (
                        <button key={d.value} onClick={() => setSelectedDuration(d.value)} 
                          className={`p-4 rounded-xl border font-black transition-all ${selectedDuration === d.value ? 'bg-red-600 border-transparent scale-105' : 'bg-white/5 border-white/10'}`}>
                          <span className="text-[10px]">{d.label}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <label className="block text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">03. Quality</label>
                    <div className="space-y-2">
                      {QUALITY_OPTIONS.map(q => (
                        <button key={q.value} onClick={() => setSelectedQuality(q.value)} 
                          className={`w-full p-4 rounded-xl border flex justify-between items-center transition-all ${selectedQuality === q.value ? 'bg-red-600 border-transparent' : 'bg-white/5 border-white/10'}`}>
                          <div className="text-left">
                            <p className="text-[10px] font-black">{q.label}</p>
                            <p className="text-[8px] opacity-40 uppercase">{q.description}</p>
                          </div>
                          {selectedQuality === q.value && <CheckCircle size={14}/>}
                        </button>
                      ))}
                    </div>
                  </section>
                </div>

                <button 
                  disabled={generatingVideo || !matchData}
                  onClick={generateVideoHighlight}
                  className="w-full py-6 mt-12 font-black tracking-[0.3em] text-black uppercase transition-all bg-white rounded-2xl hover:bg-red-600 hover:text-white disabled:opacity-20 disabled:grayscale group relative overflow-hidden"
                >
                  <span className="relative z-10">{generatingVideo ? 'Processing Cloud Render...' : 'Generate AI Highlight'}</span>
                </button>
                
                {error && (
                  <div className="flex items-center gap-3 p-4 mt-6 border border-red-500/20 bg-red-500/10 rounded-xl">
                    <AlertTriangle size={18} className="text-red-500" />
                    <p className="text-xs font-bold tracking-tighter text-red-500 uppercase">{error}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Sidebar Info */}
          <div className="space-y-6 lg:col-span-4">
            <div className="p-8 border bg-white/5 rounded-[2.5rem] border-white/10">
              <h3 className="mb-6 text-xs font-black tracking-widest uppercase text-white/40">Arena Context</h3>
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <span className="text-[10px] font-black text-white/20 uppercase">Match Score</span>
                  <span className="text-2xl italic font-black">{matchData?.home?.score || 0} — {matchData?.away?.score || 0}</span>
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-[10px] font-black text-white/20 uppercase">Current Clock</span>
                  <span className="text-2xl italic font-black text-red-500">{matchData?.minute}'</span>
                </div>
                <div className="pt-4 border-t border-white/5">
                   <div className="flex items-center gap-2 text-green-500">
                      <Globe size={14}/>
                      <span className="text-[10px] font-black uppercase tracking-widest">Global CDN Active</span>
                   </div>
                </div>
              </div>
            </div>

            <div className="p-8 border bg-gradient-to-br from-red-600/20 to-transparent rounded-[2.5rem] border-white/10">
              <Zap size={24} className="mb-4 text-red-500" />
              <h3 className="mb-2 text-xs font-black tracking-widest uppercase">Pro Features</h3>
              <ul className="space-y-3 text-[10px] font-bold text-white/50 uppercase">
                <li className="flex items-center gap-2"><CheckCircle size={12} className="text-red-500"/> Instant AI Slow-Mo</li>
                <li className="flex items-center gap-2"><CheckCircle size={12} className="text-red-500"/> Live Score Overlays</li>
                <li className="flex items-center gap-2"><CheckCircle size={12} className="text-red-500"/> 4K Cloud Export</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoHighlightPage;