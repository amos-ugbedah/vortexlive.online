/* eslint-disable */
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { 
  ChevronLeft, RefreshCcw, BarChart3, Radio, Share2, 
  CheckCircle2, Shield, BrainCircuit, Tv, Wifi, Zap,
  Download, Video, Clock, Globe, Sparkles, AlertCircle
} from 'lucide-react';
import IPTVPlayer from '../components/IPTVPlayer';
import UltraPlayer from '../components/UltraPlayer';
import { 
  normalizeMatch, isMatchLive, isMatchUpcoming, 
  isMatchFinished, getMatchStatusText, formatAIPick,
  getDecodedStreamUrl, isAutoDetected, calculateEstimatedMinute, FALLBACK_LOGO
} from '../lib/matchUtils';

const MatchDetails = () => {
  const { id } = useParams(); 
  const [match, setMatch] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); 
  const [copied, setCopied] = useState(false);
  const [activeServer, setActiveServer] = useState(1);

  useEffect(() => {
    const matchDocId = String(id || '');
    if (!matchDocId) return;
    
    const docRef = doc(db, 'matches', matchDocId);
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const cleanData = normalizeMatch(docSnap.data(), docSnap.id);
        setMatch(cleanData);
      }
    }, (err) => console.error("Vortex Signal Error:", err));
    
    return () => unsub();
  }, [id]);

  const stream = useMemo(() => {
    if (!match) return null;
    const rawUrl = match[`streamUrl${activeServer}`] || match.streamUrl1;
    return getDecodedStreamUrl(rawUrl);
  }, [match, activeServer]);

  const autoLive = isAutoDetected(match);
  const isLive = isMatchLive(match) || autoLive;
  const isFinished = isMatchFinished(match);
  const isUpcoming = !isLive && !isFinished;
  const isM3U8 = stream?.toLowerCase().includes('m3u8') || stream?.toLowerCase().includes('.ts');
  const estMinute = calculateEstimatedMinute(match);

  // SAFE ACTIONS (Bypass Smartlink)
  const safeRefresh = (e) => { e.stopPropagation(); setRefreshKey(k => k + 1); };
  const safeServerChange = (e, srv) => { e.stopPropagation(); setActiveServer(srv); };

  const handleShare = useCallback((e) => {
    e.stopPropagation();
    if (!match) return;
    const shareText = `Watching ${match.home.name} vs ${match.away.name} LIVE on Vortex! \nLink: ${window.location.href}`;
    if (navigator.share) {
      navigator.share({ title: 'Vortex Live', text: shareText, url: window.location.href });
    } else {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }, [match]);

  if (!match) return <LoadingScreen id={id} />;

  return (
    <div className="min-h-screen bg-[#020202] text-white selection:bg-red-600/30 pb-24 font-sans">
      <style>{`
        @keyframes ticker-scroll { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
        .animate-ticker { display: inline-block; white-space: nowrap; animation: ticker-scroll 25s linear infinite; }
      `}</style>

      <div className="max-w-[1500px] mx-auto p-4 md:p-8">
        <header className="flex flex-col items-start justify-between gap-4 mb-8 md:flex-row md:items-center">
          <Link to="/" onClick={(e) => e.stopPropagation()} className="flex items-center gap-4 group">
            <div className="p-3 transition-all border bg-white/5 border-white/10 rounded-2xl group-hover:bg-red-600">
              <ChevronLeft size={20} />
            </div>
            <div>
              <h1 className="text-2xl italic font-black tracking-tighter text-red-600 uppercase">Vortex Live</h1>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Direct Satellite Link</span>
            </div>
          </Link>

          <div className="flex w-full gap-3 md:w-auto">
            <button onClick={safeRefresh} className="flex items-center justify-center flex-1 gap-2 px-6 py-3 border md:flex-none bg-zinc-900 border-white/10 rounded-xl hover:bg-zinc-800">
              <RefreshCcw size={18} className="text-red-600" />
              <span className="text-[10px] font-black uppercase">Refresh</span>
            </button>
            <button onClick={handleShare} className="flex items-center justify-center flex-1 gap-2 px-6 py-3 bg-red-600 md:flex-none rounded-xl hover:bg-red-700">
              {copied ? <CheckCircle2 size={18} /> : <Share2 size={18} />}
              <span className="text-[10px] font-black uppercase">{copied ? 'Link Copied' : 'Share'}</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <div className="relative overflow-hidden bg-black border shadow-2xl aspect-video rounded-2xl border-white/10">
              {stream && !isFinished ? (
                <div key={`${refreshKey}-${activeServer}`} className="w-full h-full">
                  {isM3U8 ? <IPTVPlayer url={stream} /> : <UltraPlayer url={stream} />}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-zinc-900/50">
                  <Radio size={64} className="mb-4 text-red-600 animate-pulse" />
                  <h2 className="text-xl font-black tracking-widest uppercase">
                    {isFinished ? 'Broadcast Finished' : 'Signal Lost'}
                  </h2>
                  <p className="max-w-md mt-2 text-sm text-center text-white/40">
                    {isFinished ? 'The live event has concluded.' : 'No active uplink detected for this match yet.'}
                  </p>
                </div>
              )}
            </div>

            {stream && !isFinished && (
              <div className="flex flex-wrap gap-3">
                {[1, 2, 3].map((srv) => match[`streamUrl${srv}`] && (
                  <button 
                    key={srv}
                    onClick={(e) => safeServerChange(e, srv)}
                    className={`px-6 py-3 rounded-xl flex items-center gap-3 border transition-all ${activeServer === srv ? 'bg-red-600 border-red-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  >
                    <Tv size={16} />
                    <span className="text-[10px] font-black uppercase">Server {srv}</span>
                  </button>
                ))}
              </div>
            )}
            
            {/* HIGHLIGHT DOWNLOADER COMPONENT - ADDED HERE */}
            <HighlightDownloader match={match} />
            
            <div className="bg-zinc-900/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5">
                <div className="flex items-center gap-3 mb-8">
                    <BarChart3 className="text-red-600" />
                    <h3 className="text-sm font-black tracking-widest uppercase">Vortex Engine Analytics</h3>
                </div>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <StatBar label="Win Probability" home={50} away={50} suffix="%" />
                    <StatBar label="Possession" home={50} away={50} suffix="%" />
                </div>
            </div>
          </div>

          <aside className="space-y-6 lg:col-span-4">
            <div className="bg-zinc-900/40 p-8 rounded-[2.5rem] border border-white/5 text-center">
              <div className="flex items-center justify-center gap-2 mb-6 opacity-40">
                <Shield size={14} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] truncate">{match.league}</span>
              </div>

              <div className="flex items-center justify-between px-4 mb-8">
                <TeamUI logo={match.home.logo} name={match.home.name} />
                <div className="flex flex-col items-center">
                  <div className="mb-2 text-5xl italic font-black tracking-tighter">
                    {match.home.score}:{match.away.score}
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-2 ${isLive ? 'bg-red-600 shadow-lg' : 'bg-zinc-800'}`}>
                    {autoLive && <Wifi size={12} className="animate-pulse" />}
                    {getMatchStatusText(match)} {isLive && !['HT','FT'].includes(match.status) && `• ${match.minute || estMinute || 0}'`}
                  </div>
                </div>
                <TeamUI logo={match.away.logo} name={match.away.name} />
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-red-600/20 to-transparent border border-red-600/20 rounded-[2rem] relative overflow-hidden">
               <Zap className="absolute w-24 h-24 -right-4 -top-4 text-red-600/10 rotate-12" />
               <div className="flex items-center gap-3 mb-3">
                <BrainCircuit size={20} className="text-red-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Tactical Edge</span>
              </div>
              <p className="text-sm italic font-medium leading-relaxed text-white/90">
                "{formatAIPick(match.aiPick)}"
              </p>
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full h-14 bg-red-600 flex items-center overflow-hidden z-[9999]">
        <div className="z-10 flex items-center h-full px-8 bg-black border-r border-white/10">
          <span className="text-[11px] font-black uppercase tracking-widest">Vortex<span className="text-red-500">Live</span></span>
        </div>
        <div className="relative flex-1 overflow-hidden">
          <div className="animate-ticker">
            <span className="mx-8 text-[12px] font-black uppercase italic tracking-wider">
              🛰️ STATUS: {isLive ? 'BROADCAST ACTIVE' : isUpcoming ? 'PRE-MATCH UPLINK' : 'FEED TERMINATED'} ... {match.home.name} vs {match.away.name} ... RESOLUTION: 4K ULTRA HD ...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// HIGHLIGHT DOWNLOADER COMPONENT
const HighlightDownloader = ({ match }) => {
  const [selectedLength, setSelectedLength] = useState(60); // seconds
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadLink, setDownloadLink] = useState(null);
  const [highlightMode, setHighlightMode] = useState('auto');
  const [availableMoments, setAvailableMoments] = useState([]);
  const [error, setError] = useState(null);
  
  // Highlight duration options (in seconds)
  const durationOptions = [
    { label: '1 min', value: 60 },
    { label: '2 mins', value: 120 },
    { label: '3 mins', value: 180 },
    { label: '5 mins', value: 300 }
  ];
  
  useEffect(() => {
    if (match?.status === 'LIVE' || match?.status === '1H' || match?.status === '2H') {
      const currentMinute = match.minute || 0;
      const moments = [];
      
      // Generate fake highlight moments (in real app, get from API)
      for (let i = 10; i <= currentMinute; i += 15) {
        if (i > 0) {
          moments.push({
            minute: i,
            type: i % 30 === 0 ? 'GOAL' : i % 20 === 0 ? 'SAVE' : 'CHANCE',
            description: i % 30 === 0 ? `Goal at ${i}'` : `Key moment at ${i}'`
          });
        }
      }
      setAvailableMoments(moments);
    }
  }, [match]);

  const generateWatermarkedHighlight = async () => {
    if (!match || !match.id) {
      setError('Match data not available');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Call the actual Firebase Function
      const response = await fetch(
        'https://us-central1-votexlive-3a8cb.cloudfunctions.net/generateHighlight',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            matchId: match.id,
            duration: selectedLength,
            streamSource: 'streamUrl1' // Using primary stream
          })
        }
      );
      
      const result = await response.json();
      
      if (result.success) {
        // Create a simple HTML file as highlight (not trying to access non-existent storage)
        const highlightContent = createHighlightHTML(match, selectedLength, availableMoments);
        const blob = new Blob([highlightContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        setDownloadLink({
          url: url,
          filename: `Vortex_Highlight_${match.home.name}_vs_${match.away.name}_${Date.now()}.html`,
          size: '10-20 KB',
          blobUrl: url
        });
        
        // Also show the stream URL if available from API
        if (result.data?.watchUrl) {
          console.log('Stream available at:', result.data.watchUrl);
        }
      } else {
        setError(result.message || 'Failed to generate highlight');
      }
    } catch (error) {
      console.error('Error generating highlight:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const createHighlightHTML = (matchData, duration, moments) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${matchData.home.name} vs ${matchData.away.name} - Vortex Highlights</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #0a0a0a; color: white; }
        .header { text-align: center; margin-bottom: 30px; }
        .match-title { font-size: 24px; font-weight: bold; color: #dc2626; }
        .score { font-size: 48px; font-weight: bold; margin: 20px 0; }
        .info { display: flex; justify-content: center; gap: 20px; margin: 20px 0; }
        .info-item { background: rgba(255,255,255,0.1); padding: 10px 20px; border-radius: 10px; }
        .moments { margin: 30px 0; }
        .moment { background: rgba(220,38,38,0.2); padding: 10px; margin: 5px 0; border-left: 3px solid #dc2626; }
        .watermark { position: fixed; bottom: 20px; right: 20px; background: #dc2626; color: white; padding: 10px 15px; border-radius: 5px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="match-title">${matchData.home.name} vs ${matchData.away.name}</h1>
        <div class="score">${matchData.home.score} - ${matchData.away.score}</div>
        <div class="info">
            <div class="info-item">${matchData.league}</div>
            <div class="info-item">${duration} seconds</div>
            <div class="info-item">${new Date().toLocaleDateString()}</div>
        </div>
    </div>
    
    <div class="moments">
        <h3>Key Moments:</h3>
        ${moments.length > 0 ? moments.map(m => `<div class="moment">${m.minute}' - ${m.description}</div>`).join('') : '<p>No moments recorded</p>'}
    </div>
    
    <p>For the full match experience, visit: <a href="https://vortexlive.online" style="color: #dc2626;">vortexlive.online</a></p>
    
    <div class="watermark">
        vortexlive.online
    </div>
</body>
</html>`;
  };

  const handleDownload = () => {
    if (downloadLink) {
      const link = document.createElement('a');
      link.href = downloadLink.url;
      link.download = downloadLink.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL after download
      if (downloadLink.blobUrl) {
        setTimeout(() => URL.revokeObjectURL(downloadLink.blobUrl), 100);
      }
      
      // Reset download link after a delay
      setTimeout(() => setDownloadLink(null), 3000);
    }
  };

  // Only show for live and finished matches
  if (!match || (match.status !== 'LIVE' && match.status !== '1H' && match.status !== '2H' && match.status !== 'FT')) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-zinc-900/50 to-zinc-800/30 border border-white/10 rounded-[2rem] p-6 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-6">
        <Video className="text-red-500" size={24} />
        <h3 className="text-sm font-black tracking-widest uppercase">Vortex Highlights</h3>
        <span className="px-2 py-1 text-[10px] font-black uppercase bg-red-600/20 border border-red-600/30 rounded-full">
          BETA
        </span>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="p-4 mb-6 border border-red-600/30 rounded-xl bg-red-600/10">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-red-400 mt-0.5" size={16} />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
        {/* Mode Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-red-500" />
            <span className="text-[11px] font-black uppercase tracking-wider">Highlight Mode</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {['auto', 'manual', 'best_moments'].map((mode) => (
              <button
                key={mode}
                onClick={() => setHighlightMode(mode)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${
                  highlightMode === mode 
                    ? 'bg-red-600 border-red-500' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                {mode.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        
        {/* Duration Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-red-500" />
            <span className="text-[11px] font-black uppercase tracking-wider">Duration</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {durationOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedLength(option.value)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${
                  selectedLength === option.value 
                    ? 'bg-red-600 border-red-500' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Watermark Preview */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-red-500" />
            <span className="text-[11px] font-black uppercase tracking-wider">Watermark</span>
          </div>
          <div className="p-3 border border-white/10 rounded-xl bg-black/30">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-700">
                <span className="text-xs font-black">V</span>
              </div>
              <div>
                <div className="text-[10px] font-black uppercase">vortexlive.online</div>
                <div className="text-[8px] opacity-50">© {new Date().getFullYear()} Vortex Live</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Available Moments (for live matches) */}
      {availableMoments.length > 0 && highlightMode === 'manual' && (
        <div className="mb-6">
          <div className="text-[11px] font-black uppercase tracking-wider mb-3">Select Key Moments</div>
          <div className="flex flex-wrap gap-2">
            {availableMoments.map((moment, idx) => (
              <button
                key={idx}
                className="px-3 py-2 border border-white/10 rounded-xl text-[10px] font-black uppercase bg-white/5 hover:bg-white/10 transition-all"
              >
                {moment.description}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Generate/Download Button */}
      <div className="flex items-center justify-between pt-6 border-t border-white/10">
        <div className="text-[11px] font-black uppercase tracking-wider flex items-center gap-2">
          <Globe size={14} className="text-red-500" />
          <span>Generate highlight with Vortex watermark</span>
        </div>
        
        {!downloadLink ? (
          <button
            onClick={generateWatermarkedHighlight}
            disabled={isProcessing}
            className="flex items-center gap-3 px-8 py-3 transition-all bg-gradient-to-r from-red-600 to-red-700 rounded-xl hover:from-red-700 hover:to-red-800 disabled:opacity-50 group"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 rounded-full border-white/30 border-t-white animate-spin" />
                <span className="text-[11px] font-black uppercase tracking-wider">Processing...</span>
              </>
            ) : (
              <>
                <Download size={18} />
                <span className="text-[11px] font-black uppercase tracking-wider">Generate Highlight</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleDownload}
            className="flex items-center gap-3 px-8 py-3 transition-all bg-gradient-to-r from-green-600 to-green-700 rounded-xl hover:from-green-700 hover:to-green-800 group"
          >
            <Download size={18} />
            <div className="text-left">
              <div className="text-[11px] font-black uppercase tracking-wider">Download Ready</div>
              <div className="text-[9px] opacity-80">{downloadLink.size} • HTML</div>
            </div>
          </button>
        )}
      </div>
      
      {/* Info Note */}
      <div className="p-4 mt-6 border border-white/5 rounded-xl bg-black/20">
        <p className="text-[10px] text-white/60 leading-relaxed">
          💡 <strong>Note:</strong> This generates an HTML file with match highlights. The file includes a link to the live stream. 
          No actual video files are stored - this is a lightweight highlight summary.
        </p>
      </div>
    </div>
  );
};

const LoadingScreen = ({ id }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-[#020202]">
    <div className="w-16 h-16 mb-6 border-4 border-red-600 rounded-full border-t-transparent animate-spin" />
    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Syncing {id}...</p>
  </div>
);

const TeamUI = ({ logo, name }) => {
  const handleImgError = (e) => { e.target.src = FALLBACK_LOGO; };
  return (
    <div className="flex flex-col items-center w-24 gap-3">
      <div className="flex items-center justify-center w-20 h-20 p-4 border bg-white/5 rounded-3xl border-white/5">
        <img src={logo} alt={name} onError={handleImgError} className="object-contain max-w-full max-h-full" />
      </div>
      <span className="text-[10px] font-black uppercase text-center leading-tight tracking-tighter">{name}</span>
    </div>
  );
};

const StatBar = ({ label, home, away, suffix = "" }) => (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
        <span className="text-red-500">{home}{suffix}</span>
        <span className="opacity-30">{label}</span>
        <span>{away}{suffix}</span>
      </div>
      <div className="flex h-1 overflow-hidden rounded-full bg-white/5">
        <div style={{ width: `${home}%` }} className="h-full transition-all duration-1000 bg-red-600" />
      </div>
    </div>
);

export default MatchDetails;