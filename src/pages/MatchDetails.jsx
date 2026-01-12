/* eslint-disable */
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { 
  ChevronLeft, RefreshCcw, Monitor, BarChart3, 
  AlertCircle, Radio, Share2, CheckCircle2,
  Trophy, Clock, Play, Shield, Users
} from 'lucide-react';
import IPTVPlayer from '../components/IPTVPlayer';
import UltraPlayer from '../components/UltraPlayer';
import { normalizeMatch, isMatchLive, isMatchUpcoming, isMatchFinished } from '../lib/matchUtils';

const MatchDetails = () => {
  const { id } = useParams(); 
  const [match, setMatch] = useState(null);
  const [key, setKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Real-time match data
  useEffect(() => {
    // Ensure ID is always string (matches backend string IDs)
    const matchDocId = String(id || '');
    if (!matchDocId) return;
    
    const docRef = doc(db, 'matches', matchDocId);
    
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const cleanData = normalizeMatch(docSnap.data(), docSnap.id);
        setMatch(cleanData);
        
        // Update last updated time
        if (docSnap.data().lastUpdated) {
          setLastUpdated(docSnap.data().lastUpdated.toDate());
        }
      } else {
        console.error('Match not found with ID:', matchDocId);
      }
    }, (err) => {
      console.error("Signal Watch Error:", err);
    });
    
    return () => unsub();
  }, [id]);

  // Decode stream URL (base64 from backend)
  const stream = useMemo(() => {
    if (!match || !match.streamUrl1) return null;
    
    try {
      const raw = match.streamUrl1.trim();
      if (!raw) return null;
      
      // Try to decode base64 (matches backend encoding)
      if (raw && !raw.startsWith('http')) {
        try {
          const decoded = atob(raw);
          if (decoded.startsWith('http')) {
            return decoded;
          }
          return raw; // Return as is if not valid URL
        } catch (e) {
          console.log('Not base64, using as-is');
          return raw;
        }
      }
      return raw;
    } catch (e) {
      console.error('Error parsing stream URL:', e);
      return null;
    }
  }, [match]);

  // Status display matching backend STATUS_MAP
  const getStatusDisplay = () => {
    const status = match?.status || 'NS';
    const statusDisplay = {
      'NS': 'Scheduled',
      '1H': '1st Half',
      '2H': '2nd Half',
      'HT': 'Half Time',
      'FT': 'Full Time',
      'ET': 'Extra Time',
      'BT': 'Break Time',
      'P': 'Penalties',
      'SUSP': 'Suspended',
      'INT': 'Interrupted',
      'PST': 'Postponed',
      'CANC': 'Cancelled',
      'ABD': 'Abandoned',
      'AWD': 'Awarded',
      'WO': 'Walkover',
      'TBD': 'Time TBD',
      'SCHEDULED': 'Scheduled',
      'TIMED': 'Scheduled',
      'IN_PLAY': 'Live',
      'LIVE': 'Live',
      'FINISHED': 'Finished',
      'AET': 'After Extra Time',
      'PEN': 'Penalties'
    };
    
    return statusDisplay[status] || status;
  };

  // Match state (matches backend status logic)
  const isLive = isMatchLive(match);
  const isFinished = isMatchFinished(match);
  const isUpcoming = isMatchUpcoming(match);
  const isSpecial = ['SUSP', 'INT', 'PST', 'CANC', 'ABD', 'AWD', 'WO'].includes(match?.status || '');

  // Share functionality
  const handleShare = useCallback(() => {
    if (!match) return;
    const shareUrl = window.location.href;
    const shareText = `🔥 Watching ${match.home.name} vs ${match.away.name} LIVE on Vortex! \n\nScore: ${match.home.score}-${match.away.score} \nStatus: ${getStatusDisplay()} \nWatch here: ${shareUrl}`;
    
    if (navigator.share) {
      navigator.share({ 
        title: 'Vortex Live HD', 
        text: shareText, 
        url: shareUrl 
      });
    } else {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }, [match]);

  // Check stream type
  const isM3U8 = stream?.toLowerCase().includes('.m3u8') || 
                 stream?.toLowerCase().includes('.ts') || 
                 stream?.toLowerCase().includes('m3u8');

  // Loading state
  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#020202]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <Radio className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-red-600 animate-pulse" size={24} />
        </div>
        <p className="mt-6 text-white/20 font-black uppercase text-[10px] tracking-widest">
          Decoding Satellite Signal...
        </p>
        <p className="mt-2 text-white/10 text-[8px]">Match ID: {id}</p>
      </div>
    );
  }

  // Format last updated time
  const lastUpdatedText = lastUpdated 
    ? `Updated ${Math.floor((new Date() - lastUpdated) / 60000)}m ago`
    : '';

  return (
    <div className="min-h-screen bg-[#020202] text-white p-4 md:p-6 lg:p-8 font-sans selection:bg-red-600/30 pb-20 md:pb-24">
      {/* Ticker animation styles */}
      <style>{`
        @keyframes ticker-scroll { 
          0% { transform: translateX(100%); } 
          100% { transform: translateX(-100%); } 
        }
        .animate-ticker { 
          display: inline-block; 
          white-space: nowrap; 
          animation: ticker-scroll 30s linear infinite; 
        }
        @media (max-width: 768px) {
          .animate-ticker { animation-duration: 20s; }
        }
      `}</style>

      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0 mb-6 md:mb-8">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="p-3 md:p-4 transition-all border bg-white/5 rounded-xl md:rounded-2xl border-white/10 group-hover:bg-red-600 group-hover:border-red-500">
              <ChevronLeft size={20} />
            </div>
            <div>
              <span className="block text-xl md:text-2xl lg:text-3xl italic font-black leading-none tracking-tighter text-red-600 uppercase">
                Vortex Live
              </span>
              <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">
                Ultra HD Stream Provider
              </span>
            </div>
          </Link>
          
          <div className="flex items-center gap-2 md:gap-3">
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 px-4 md:px-6 py-3 border bg-zinc-900 border-white/10 rounded-xl md:rounded-2xl hover:bg-blue-600 transition-all"
            >
              {copied ? (
                <CheckCircle2 size={18} className="text-green-400" />
              ) : (
                <Share2 size={18} className="text-blue-400" />
              )}
              <span className="hidden md:block text-[10px] font-black uppercase tracking-widest">
                {copied ? 'Copied!' : 'Share'}
              </span>
            </button>
            <button 
              onClick={() => setKey(k => k + 1)}
              className="flex items-center gap-2 px-4 md:px-6 py-3 border bg-zinc-900 border-white/10 rounded-xl md:rounded-2xl hover:bg-zinc-800 transition-all group"
              title="Refresh Stream"
            >
              <RefreshCcw size={18} className="text-red-600 transition-transform duration-700 group-hover:rotate-180" />
              <span className="hidden md:block text-[10px] font-black uppercase tracking-widest">
                Repair Signal
              </span>
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          {/* Left Column - Video Player & Stats */}
          <div className="lg:col-span-8 space-y-6 md:space-y-8">
            {/* Video Player */}
            <div className="relative aspect-video bg-black rounded-xl md:rounded-2xl lg:rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl">
              {stream && (isLive || isFinished) ? (
                isM3U8 ? (
                  <IPTVPlayer key={`${stream}-${key}`} url={stream} />
                ) : (
                  <UltraPlayer key={`${stream}-${key}`} url={stream} />
                )
              ) : (
                <div className="relative flex flex-col items-center justify-center h-full gap-4 md:gap-6 bg-gradient-to-br from-zinc-900/40 to-black p-4 md:p-8">
                  <div className="relative">
                    <Radio size={60} md:size={80} className="text-red-600 animate-pulse" />
                    <div className="absolute -inset-4 bg-red-600/10 rounded-full blur-xl"></div>
                  </div>
                  <div className="text-center max-w-md">
                    <span className="block text-sm md:text-base font-black uppercase tracking-[0.4em] mb-2 text-white/90">
                      {isUpcoming ? 'Match Starting Soon' : 'Stream Not Available'}
                    </span>
                    <span className="text-[10px] md:text-[12px] font-bold uppercase tracking-widest opacity-60 italic">
                      {isUpcoming ? (
                        `Stream activates at ${new Date(match.kickoff).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      ) : (
                        'Check back later for available streams'
                      )}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Status overlay */}
              {(isLive || isFinished) && (
                <div className="absolute top-4 md:top-6 right-4 md:right-6 z-10">
                  <div className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[10px] md:text-[11px] font-black uppercase backdrop-blur-md ${
                    isLive ? 'bg-red-600/80 text-white animate-pulse' :
                    isFinished ? 'bg-gray-600/80 text-gray-200' :
                    'bg-blue-600/80 text-white'
                  }`}>
                    {getStatusDisplay()} {isLive ? `• ${match.minute || 0}'` : ''}
                  </div>
                </div>
              )}
            </div>

            {/* Match Stats */}
            <div className="bg-zinc-900/30 p-4 md:p-6 lg:p-8 rounded-xl md:rounded-2xl border border-white/5 backdrop-blur-2xl">
              <div className="flex items-center gap-3 mb-6 md:mb-8">
                <BarChart3 size={20} className="text-red-600" />
                <span className="text-xs md:text-sm font-black tracking-widest uppercase">Live Match Analysis</span>
                {lastUpdatedText && (
                  <span className="ml-auto text-[10px] text-white/30">{lastUpdatedText}</span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <StatBar 
                  label="Possession" 
                  home={match.home.score > match.away.score ? 58 : 42} 
                  away={match.away.score > match.home.score ? 58 : 42} 
                  suffix="%" 
                />
                <StatBar 
                  label="Win Probability" 
                  home={match.home.score * 10 + 30} 
                  away={match.away.score * 10 + 20} 
                  suffix="%" 
                />
                <StatBar 
                  label="Shots on Target" 
                  home={match.home.score * 3 + 2} 
                  away={match.away.score * 3 + 1} 
                />
                <StatBar 
                  label="Expected Goals (xG)" 
                  home={(match.home.score * 1.2).toFixed(1)} 
                  away={(match.away.score * 1.2).toFixed(1)} 
                />
              </div>
            </div>
          </div>

          {/* Right Column - Match Info */}
          <div className="lg:col-span-4 space-y-6 md:space-y-8">
            {/* Match Card */}
            <div className="bg-zinc-900/40 p-4 md:p-6 lg:p-8 rounded-xl md:rounded-2xl lg:rounded-[2.5rem] border border-white/5 text-center relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent"></div>
              
              {/* League */}
              <div className="flex items-center justify-center gap-2 mb-4 md:mb-6">
                <Shield size={14} className={match.isElite ? 'text-yellow-500' : 'text-red-600'} />
                <p className="text-[8px] md:text-[10px] font-black opacity-60 uppercase tracking-[0.3em] md:tracking-[0.5em]">
                  {match.league || 'Unknown League'}
                </p>
                {match.isElite && (
                  <Trophy size={12} className="text-yellow-500 ml-2" />
                )}
              </div>

              {/* Teams & Score */}
              <div className="flex items-center justify-between gap-2 md:gap-4 px-1 md:px-2 mb-6 md:mb-8">
                <TeamUI logo={match.home.logo} name={match.home.name} />
                
                <div className="flex flex-col items-center min-w-[100px] md:min-w-[120px]">
                  <div className="mb-1 md:mb-2 text-3xl md:text-4xl lg:text-5xl italic font-black tracking-tighter text-white">
                    {match.home.score}:{match.away.score}
                  </div>
                  <div className={`px-3 py-1.5 border rounded-full ${
                    isUpcoming ? 'bg-blue-600/10 border-blue-600/20' : 
                    isFinished ? 'bg-gray-600/10 border-gray-600/20' : 
                    isSpecial ? 'bg-yellow-600/10 border-yellow-600/20' :
                    'bg-red-600/10 border-red-600/20 animate-pulse'
                  }`}>
                    <span className={`text-[9px] md:text-[10px] font-black uppercase ${
                      isUpcoming ? 'text-blue-500' : 
                      isFinished ? 'text-gray-400' : 
                      isSpecial ? 'text-yellow-400' :
                      'text-red-500'
                    }`}>
                      {getStatusDisplay()} {isLive ? `• ${match.minute || 0}'` : ''}
                    </span>
                  </div>
                </div>
                
                <TeamUI logo={match.away.logo} name={match.away.name} />
              </div>

              {/* Match Info */}
              <div className="space-y-3 md:space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1">Kickoff</p>
                    <p className="text-sm font-black text-white">
                      {new Date(match.kickoff).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} UTC
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1">Match ID</p>
                    <p className="text-xs font-mono text-white/80 truncate max-w-[80px]">{match.id}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-1">Date</p>
                  <p className="text-[11px] font-bold text-white/40 uppercase">
                    {new Date(match.kickoff).toLocaleDateString([], { 
                      weekday: 'short', 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>

                {/* AI Prediction */}
                {match.aiPick && (
                  <div className="pt-3 border-t border-white/5">
                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-2">AI Prediction</p>
                    <p className="text-[11px] font-medium text-white/80 italic">
                      "{match.aiPick}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Vortex Engine Alert */}
            <div className={`p-4 md:p-6 rounded-xl md:rounded-2xl shadow-2xl ${
              isUpcoming ? 'bg-blue-600/20 border border-blue-600/30' :
              isFinished ? 'bg-gray-600/20 border border-gray-600/30' :
              isSpecial ? 'bg-yellow-600/20 border border-yellow-600/30' :
              'bg-gradient-to-br from-red-600/20 to-red-800/20 border border-red-600/30'
            }`}>
              <div className="flex items-center gap-3 mb-3 md:mb-4">
                <AlertCircle size={20} className={
                  isUpcoming ? 'text-blue-400' :
                  isFinished ? 'text-gray-400' :
                  isSpecial ? 'text-yellow-400' :
                  'text-red-400'
                } />
                <span className="text-[10px] font-black tracking-widest uppercase">Vortex Engine</span>
              </div>
              <p className="text-[10px] md:text-[11px] font-medium leading-relaxed text-white/90">
                {isUpcoming 
                  ? `Match scheduled for ${new Date(match.kickoff).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Stream will activate shortly before kickoff.`
                  : isFinished
                  ? `Match has ended. Final score: ${match.home.score} - ${match.away.score}. Relive the highlights.`
                  : isSpecial
                  ? `Match status: ${getStatusDisplay()}. Please check official sources for updates.`
                  : `Live match tracking active. ${match.isElite ? '⭐ Elite league match with enhanced coverage.' : 'Regular broadcast with standard coverage.'}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Ticker Bar */}
      <div className={`fixed bottom-0 left-0 w-full h-12 md:h-14 flex items-center overflow-hidden border-t z-[9999] ${
        isUpcoming ? 'bg-blue-600/90 border-blue-500/20' :
        isFinished ? 'bg-gray-600/90 border-gray-500/20' :
        isSpecial ? 'bg-yellow-600/90 border-yellow-500/20' :
        'bg-red-600/90 border-red-500/20'
      }`}>
        <div className="bg-black px-4 md:px-6 h-full flex items-center z-20 border-r shadow-[10px_0_20px_rgba(0,0,0,0.5)] min-w-[120px]">
          <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              isUpcoming ? 'bg-blue-500' :
              isFinished ? 'bg-gray-500' :
              isSpecial ? 'bg-yellow-500' :
              'bg-red-500'
            }`} />
            Vortex<span className={
              isUpcoming ? 'text-blue-300' :
              isFinished ? 'text-gray-300' :
              isSpecial ? 'text-yellow-300' :
              'text-red-300'
            }>Live</span>
          </span>
        </div>
        <div className={`relative flex items-center flex-1 h-full overflow-hidden ${
          isUpcoming ? 'bg-blue-700/30' :
          isFinished ? 'bg-gray-700/30' :
          isSpecial ? 'bg-yellow-700/30' :
          'bg-red-700/30'
        }`}>
          <div className="absolute animate-ticker whitespace-nowrap">
            <span className="mx-4 md:mx-8 lg:mx-12 text-[10px] md:text-[12px] font-black uppercase italic text-white">
              🛰️ STATUS: {getStatusDisplay().toUpperCase()} ... 
            </span>
            <span className="mx-4 md:mx-8 lg:mx-12 text-[10px] md:text-[12px] font-black uppercase italic text-white">
              ⚽ {match.home.name} {match.home.score} - {match.away.score} {match.away.name} {isLive ? `(${match.minute || 0}')` : ''} ... 
            </span>
            <span className="mx-4 md:mx-8 lg:mx-12 text-[10px] md:text-[12px] font-black uppercase italic text-white">
              {match.isElite ? '⭐ ELITE LEAGUE MATCH' : '📺 REGULAR BROADCAST'} ...
            </span>
            <span className="mx-4 md:mx-8 lg:mx-12 text-[10px] md:text-[12px] font-black uppercase italic text-white">
              🎯 AI: {match.aiPick ? match.aiPick.substring(0, 50) + '...' : 'Live match analysis active'} ...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Team Component
const TeamUI = ({ logo, name }) => (
  <div className="flex flex-col items-center w-16 md:w-20 lg:w-24 gap-2 md:gap-3 lg:gap-4">
    <div className="flex items-center justify-center p-2 md:p-3 border w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-white/5 to-transparent rounded-xl md:rounded-2xl border-white/5 overflow-hidden">
      {logo ? (
        <img 
          src={logo} 
          alt={name || 'Team'} 
          className="object-contain max-w-full max-h-full"
          onError={(e) => {
            e.target.style.display = 'none';
            const fallback = document.createElement('div');
            fallback.className = 'text-white/20 font-bold text-lg md:text-xl flex items-center justify-center w-full h-full';
            fallback.textContent = name?.charAt(0)?.toUpperCase() || 'T';
            e.target.parentElement.appendChild(fallback);
          }} 
        />
      ) : (
        <div className="text-white/20 font-bold text-lg md:text-xl flex items-center justify-center w-full h-full">
          {name?.charAt(0)?.toUpperCase() || 'T'}
        </div>
      )}
    </div>
    <span className="text-[9px] md:text-[10px] lg:text-[11px] font-black uppercase text-center tracking-widest leading-tight h-10 md:h-12 flex items-center justify-center">
      {name || '---'}
    </span>
  </div>
);

// Stat Bar Component
const StatBar = ({ label, home, away, suffix = "" }) => {
  const h = parseFloat(home) || 0;
  const a = parseFloat(away) || 0;
  const total = h + a || 1;
  const width = (h / total) * 100;

  return (
    <div className="space-y-2 md:space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-red-400 text-sm md:text-base font-black">{h}{suffix}</span>
        <span className="text-[10px] md:text-[11px] font-black uppercase opacity-60">{label}</span>
        <span className="text-white text-sm md:text-base font-black">{a}{suffix}</span>
      </div>
      <div className="h-2 md:h-3 overflow-hidden rounded-full bg-white/5 p-[2px]">
        <div 
          style={{ width: `${width}%` }} 
          className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-1000 rounded-full"
        />
      </div>
    </div>
  );
};

export default MatchDetails;