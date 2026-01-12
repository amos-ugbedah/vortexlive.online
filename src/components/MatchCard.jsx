/* eslint-disable */
import React, { memo, useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, BrainCircuit, Play, Clock, Trophy, Tv, Zap, 
  MapPin, UserCheck, Calendar, Award, Star, Radio, AlertCircle,
  Wifi, WifiOff, TrendingUp, Timer, CheckCircle, RefreshCw
} from 'lucide-react';
import { 
  formatMatchTime, 
  isMatchLive, 
  isMatchFinished, 
  isMatchUpcoming,
  getStreamCount,
  getLeagueDisplay,
  isEliteMatch,
  getVenueDisplay,
  getRefereeDisplay,
  formatAIPick,
  getLastUpdateTime,
  calculateEstimatedMinute,
  calculateEstimatedStatus,
  isAutoDetected,
  getMatchStatusText,
  shouldShowWatchLive,
  getDecodedStreamUrl,
  getMatchPhase
} from '../lib/matchUtils';

const MatchCard = memo(({ match: m }) => {
  const navigate = useNavigate();
  const [isAutoDetectedState, setIsAutoDetected] = useState(false);
  const [estimatedMinute, setEstimatedMinute] = useState(0);
  const [estimatedStatus, setEstimatedStatus] = useState('NS');
  const [shouldShowLiveButton, setShouldShowLiveButton] = useState(false);
  const [matchPhase, setMatchPhase] = useState('unknown');
  
  // Update auto-detection state
  useEffect(() => {
    if (m) {
      const autoDetected = isAutoDetected(m);
      setIsAutoDetected(autoDetected);
      
      // Calculate estimated values
      const calcMinute = calculateEstimatedMinute(m);
      const calcStatus = calculateEstimatedStatus(m);
      setEstimatedMinute(calcMinute);
      setEstimatedStatus(calcStatus);
      
      // Check if should show live button
      const showLive = shouldShowWatchLive(m);
      setShouldShowLiveButton(showLive);
      
      // Set match phase
      const phase = getMatchPhase(m);
      setMatchPhase(phase);
    }
  }, [m]);

  // Early return for invalid match
  if (!m || typeof m !== 'object') {
    return (
      <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-gray-900/50 to-black p-5 animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-14 h-6 bg-gray-800 rounded"></div>
          </div>
          <div className="w-16 h-6 bg-gray-800 rounded"></div>
        </div>
        <div className="h-32 flex items-center justify-center">
          <span className="text-gray-600 text-sm">Loading match...</span>
        </div>
      </div>
    );
  }

  // CRITICAL: Ensure ID is always a string
  const safeId = String(m.id || '');
  
  // Use utility functions for status checking
  const isLive = isMatchLive(m);
  const isFinished = isMatchFinished(m);
  const isUpcoming = isMatchUpcoming(m);
  const isElite = isEliteMatch(m);
  
  // Use calculated values for display
  const displayMinute = m?.minute || estimatedMinute;
  const displayStatus = m?.status || estimatedStatus;
  
  // Get status display with auto-detection support
  const getStatusDisplay = () => {
    // If match is auto-detected but API says NS, use estimated status
    const effectiveStatus = isAutoDetectedState && m?.status === 'NS' ? estimatedStatus : m?.status;
    const effectiveMinute = isAutoDetectedState && (!m?.minute || m?.minute === 0) ? estimatedMinute : displayMinute;
    
    if (isLive || effectiveStatus === '1H' || effectiveStatus === '2H' || effectiveStatus === 'ET') {
      const minute = Number(effectiveMinute) || 0;
      if (effectiveStatus === 'HT') return 'HT';
      return `${minute}'`;
    }
    
    if (isFinished) return 'FT';
    
    if (isUpcoming) {
      const timeDisplay = formatMatchTime(m?.kickoff);
      return timeDisplay === 'TBD' ? 'SOON' : timeDisplay;
    }
    
    // Special statuses
    const status = String(effectiveStatus || '').toUpperCase();
    const specialStatuses = {
      'ET': 'ET',
      'P': 'PEN',
      'SUSP': 'SUSP',
      'INT': 'SUSP',
      'PST': 'POST',
      'CANC': 'CANC',
      'ABD': 'ABD',
      'AWD': 'AWD'
    };
    
    return specialStatuses[status] || '--';
  };

  // Handle card click
  const handleCardClick = useCallback(() => {
    if (safeId && safeId !== 'undefined' && safeId !== 'null') {
      navigate(`/match/${encodeURIComponent(safeId)}`);
    }
  }, [safeId, navigate]);

  // Get button text based on auto-detection
  const getButtonText = () => {
    if (shouldShowLiveButton) return 'WATCH LIVE';
    if (isLive) return 'WATCH LIVE';
    if (isUpcoming) return 'VIEW DETAILS';
    if (isFinished) return 'MATCH ENDED';
    
    // Auto-detected but not marked live by API
    if (isAutoDetectedState) return 'WATCH LIVE';
    
    return 'VIEW MATCH';
  };

  // Get button icon
  const getButtonIcon = () => {
    if (shouldShowLiveButton || isLive) return <Play size={12} fill="currentColor" className="animate-pulse" />;
    if (isAutoDetectedState) return <Wifi size={12} className="animate-pulse" />;
    if (isUpcoming) return <Clock size={12} />;
    return null;
  };

  // Get status background color with auto-detection indicator
  const getStatusBgColor = () => {
    if (isAutoDetectedState) {
      return 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-600/30';
    }
    
    if (isLive) return 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/30';
    if (isFinished) return 'bg-gradient-to-r from-gray-700 to-gray-800 text-gray-300';
    if (isUpcoming) return 'bg-gradient-to-r from-blue-600 to-blue-700 text-blue-100';
    
    const status = String(m?.status || '').toUpperCase();
    if (['SUSP', 'PST', 'CANC'].includes(status)) return 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-yellow-100';
    return 'bg-gradient-to-r from-gray-800 to-gray-900 text-gray-400';
  };

  // Get button background color
  const getButtonBgColor = () => {
    if (isAutoDetectedState) {
      return 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 shadow-lg shadow-purple-600/20';
    }
    
    if (shouldShowLiveButton || isLive) return 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-600/20';
    if (isUpcoming) return 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800';
    if (isFinished) return 'bg-gradient-to-r from-gray-700 to-gray-800 text-gray-300 hover:from-gray-800 hover:to-gray-900';
    return 'bg-gradient-to-r from-gray-800 to-gray-900 text-gray-400 hover:from-gray-900 hover:to-black';
  };

  // Scores
  const homeScore = Number(m?.home?.score) || 0;
  const awayScore = Number(m?.away?.score) || 0;
  
  // Stream info
  const streamCount = getStreamCount(m);
  
  // New backend features
  const leagueDisplay = getLeagueDisplay(m);
  const venueDisplay = getVenueDisplay(m);
  const refereeDisplay = getRefereeDisplay(m);
  const aiPickDisplay = formatAIPick(m?.aiPick);
  const lastUpdateTime = getLastUpdateTime(m);
  const isManualMatch = m?.addedManually || false;
  const streamsManuallyUpdated = m?.streamsManuallyUpdated || false;

  // Truncate team names intelligently
  const truncateTeamName = (name, maxLength = 14) => {
    if (!name || name.trim() === '') return 'TBD';
    if (name.length <= maxLength) return name;
    
    const words = name.split(' ');
    if (words.length === 1) {
      // Single long word, truncate with ellipsis
      return name.substring(0, maxLength - 1) + '…';
    }
    
    // Try to keep first word and abbreviation
    if (words[0].length <= 3 && words.length > 1) {
      return `${words[0]} ${words[1].charAt(0)}.`;
    }
    
    // Return first word with abbreviation
    return `${words[0]} ${words[1] ? words[1].charAt(0) + '.' : ''}`;
  };

  // Get league logo or fallback
  const getLeagueLogo = () => {
    if (m?.leagueLogo) return m.leagueLogo;
    if (m?.league?.logo) return m.league.logo;
    return null;
  };

  // Get team initials for fallback
  const getTeamInitial = (name) => {
    if (!name || name.trim() === '') return '?';
    return name.charAt(0).toUpperCase();
  };

  // Get match status text for tooltips
  const getMatchStatusTooltip = () => {
    const statusText = getMatchStatusText(m);
    if (isAutoDetectedState) {
      return `Auto-detected: ${statusText} (API hasn't updated yet)`;
    }
    return statusText;
  };

  // Get stream quality indicator
  const getStreamQualityIndicator = () => {
    if (streamCount === 0) return null;
    
    const qualities = [];
    if (m.streamQuality1 && m.streamQuality1 !== 'Unknown') qualities.push(m.streamQuality1);
    if (m.streamQuality2 && m.streamQuality2 !== 'Unknown') qualities.push(m.streamQuality2);
    if (m.streamQuality3 && m.streamQuality3 !== 'Unknown') qualities.push(m.streamQuality3);
    
    const uniqueQualities = [...new Set(qualities)];
    return uniqueQualities.join(', ') || 'HD';
  };

  return (
    <div 
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-gray-900/50 to-black p-5 transition-all duration-300 hover:border-red-500/30 hover:shadow-2xl hover:shadow-red-500/10 ${
        isFinished ? 'opacity-80' : 'hover:-translate-y-1'
      } ${isElite ? 'border-yellow-500/20 bg-gradient-to-br from-yellow-900/10 to-black' : ''}
      ${isManualMatch ? 'border-purple-500/20' : ''}
      ${isAutoDetectedState ? 'border-green-500/20 bg-gradient-to-br from-green-900/10 to-black' : ''}`}
      role="article"
      aria-label={`${m?.home?.name || 'Home'} vs ${m?.away?.name || 'Away'} match`}
    >
      {/* Elite Badge */}
      {isElite && (
        <div className="absolute top-3 right-3 z-10">
          <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-full shadow-lg shadow-yellow-600/30">
            <Trophy size={10} className="text-white" />
            <span className="text-[8px] font-black uppercase text-white tracking-widest">ELITE</span>
          </div>
        </div>
      )}
      
      {/* Auto-Detected Badge */}
      {isAutoDetectedState && (
        <div className="absolute top-3 left-3 z-10">
          <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-green-600 to-green-700 rounded-full shadow-lg shadow-green-600/30 animate-pulse">
            <Wifi size={10} className="text-white" />
            <span className="text-[8px] font-black uppercase text-white tracking-widest">AUTO</span>
          </div>
        </div>
      )}
      
      {/* Stream Badge */}
      {streamCount > 0 && !isAutoDetectedState && (
        <div className={`absolute top-3 ${isAutoDetectedState ? 'top-12' : 'left-3'} z-10`}>
          <div className={`flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-green-600 to-green-700 rounded-full shadow-lg shadow-green-600/30 ${
            streamsManuallyUpdated ? 'from-purple-600 to-purple-700 shadow-purple-600/30' : ''
          }`}>
            <Tv size={10} className="text-white" />
            <span className="text-[8px] font-black uppercase text-white tracking-widest">
              {streamCount} STREAM{streamCount > 1 ? 'S' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Manual Match Badge */}
      {isManualMatch && (
        <div className={`absolute ${isAutoDetectedState ? 'top-12' : 'top-3'} ${streamCount > 0 ? 'top-12' : 'top-3'} right-3 z-10`}>
          <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full shadow-lg shadow-purple-600/30">
            <Star size={10} className="text-white" />
            <span className="text-[8px] font-black uppercase text-white tracking-widest">MANUAL</span>
          </div>
        </div>
      )}

      {/* Header - League and Status */}
      <div className="flex items-center justify-between mb-6 relative z-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* League Logo */}
          <div className={`p-1.5 rounded-lg ${isElite ? 'bg-yellow-600/20' : isAutoDetectedState ? 'bg-green-600/20' : 'bg-red-600/20'}`}>
            {getLeagueLogo() ? (
              <img 
                src={getLeagueLogo()} 
                className="w-4 h-4 object-contain"
                alt={`${leagueDisplay || 'League'} logo`}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `
                    <ShieldCheck size={14} class="${isElite ? 'text-yellow-400' : isAutoDetectedState ? 'text-green-400' : 'text-red-400'}" />
                  `;
                }}
              />
            ) : (
              <ShieldCheck size={14} className={isElite ? 'text-yellow-400' : isAutoDetectedState ? 'text-green-400' : 'text-red-400'} />
            )}
          </div>
          
          {/* League Name */}
          <div className="flex flex-col min-w-0">
            <span 
              className="text-xs font-black uppercase tracking-[0.15em] text-white/60 truncate max-w-[120px]"
              title={leagueDisplay}
            >
              {leagueDisplay || 'VORTEX PRO'}
            </span>
            
            {/* Match Info Badges */}
            <div className="flex items-center gap-1.5 mt-1">
              {/* Auto-detected indicator */}
              {isAutoDetectedState && (
                <div className="flex items-center gap-0.5" title="Auto-detected by system">
                  <TrendingUp size={8} className="text-green-400 animate-pulse" />
                  <span className="text-[9px] text-green-400 font-bold">AUTO</span>
                </div>
              )}
              
              {/* Venue */}
              {venueDisplay && venueDisplay !== 'Venue TBD' && venueDisplay !== 'TBD' && (
                <div className="flex items-center gap-0.5">
                  <MapPin size={8} className="text-white/40" />
                  <span className="text-[9px] text-white/40 truncate max-w-[80px]" title={venueDisplay}>
                    {venueDisplay.split(' ')[0]}
                  </span>
                </div>
              )}
              
              {/* Referee */}
              {refereeDisplay && refereeDisplay !== 'Referee TBD' && refereeDisplay !== 'TBD' && (
                <div className="flex items-center gap-0.5">
                  <UserCheck size={8} className="text-white/40" />
                  <span className="text-[9px] text-white/40 truncate max-w-[60px]" title={refereeDisplay}>
                    REF
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Status Badge - With auto-detection indicator */}
        <div 
          className={`px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider whitespace-nowrap ${getStatusBgColor()} relative group/status`}
          aria-live="polite"
          title={getMatchStatusTooltip()}
        >
          {getStatusDisplay()}
          {isAutoDetectedState && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white animate-pulse"></div>
          )}
        </div>
      </div>

      {/* Teams & Score Section */}
      <div className="flex items-center justify-between mb-6 px-1">
        {/* Home Team */}
        <div className="flex flex-col items-center flex-1 min-w-0">
          <div className="relative mb-2">
            <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-gray-800 to-black rounded-xl border border-white/10 p-2 group-hover:border-red-500/30 transition-colors">
              {m?.home?.logo ? (
                <img 
                  src={m.home.logo} 
                  className="object-contain w-full h-full" 
                  alt={m.home.name}
                  loading="lazy"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `<div class="text-white/30 font-bold text-xl">${getTeamInitial(m.home.name)}</div>`;
                  }}
                />
              ) : (
                <div className="text-white/30 font-bold text-xl">
                  {getTeamInitial(m?.home?.name)}
                </div>
              )}
            </div>
            {homeScore > awayScore && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-600 to-red-700 rounded-full border border-white/20 flex items-center justify-center shadow-lg shadow-red-600/50">
                <Zap size={8} className="text-white animate-pulse" />
              </div>
            )}
          </div>
          <div className="text-center min-w-0">
            <p 
              className="text-sm font-black uppercase text-white truncate max-w-full mb-0.5 tracking-tight"
              title={m?.home?.name || 'Home'}
            >
              {truncateTeamName(m?.home?.name)}
            </p>
            <div className="text-xs font-bold text-white/50">
              {homeScore > 0 && (
                <span className="font-mono bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                  {homeScore}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Score Divider */}
        <div className="flex flex-col items-center justify-center mx-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-black text-white font-mono">{homeScore}</span>
            <span className="text-lg font-black text-red-500 mx-1">-</span>
            <span className="text-2xl font-black text-white font-mono">{awayScore}</span>
          </div>
          
          {/* Live indicator with auto-detection */}
          {(shouldShowLiveButton || isLive) && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
              isAutoDetectedState 
                ? 'bg-green-600/20 border border-green-500/20' 
                : 'bg-red-600/20 border border-red-500/20'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                isAutoDetectedState ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className={`text-[9px] font-black uppercase tracking-widest ${
                isAutoDetectedState ? 'text-green-400' : 'text-red-400'
              }`}>
                {isAutoDetectedState ? 'AUTO • ' : 'LIVE • '}
                {displayMinute || 0}'
              </span>
            </div>
          )}
          
          {/* Upcoming indicator */}
          {isUpcoming && !shouldShowLiveButton && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-600/20 rounded-full border border-blue-500/20">
              <Clock size={8} className="text-blue-400" />
              <span className="text-[9px] font-black uppercase text-blue-400 tracking-widest">
                {formatMatchTime(m?.kickoff)}
              </span>
            </div>
          )}
          
          {!shouldShowLiveButton && !isLive && !isFinished && !isUpcoming && (
            <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">
              VS
            </span>
          )}
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center flex-1 min-w-0">
          <div className="relative mb-2">
            <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-gray-800 to-black rounded-xl border border-white/10 p-2 group-hover:border-red-500/30 transition-colors">
              {m?.away?.logo ? (
                <img 
                  src={m.away.logo} 
                  className="object-contain w-full h-full" 
                  alt={m.away.name}
                  loading="lazy"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `<div class="text-white/30 font-bold text-xl">${getTeamInitial(m.away.name)}</div>`;
                  }}
                />
              ) : (
                <div className="text-white/30 font-bold text-xl">
                  {getTeamInitial(m?.away?.name)}
                </div>
              )}
            </div>
            {awayScore > homeScore && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-600 to-red-700 rounded-full border border-white/20 flex items-center justify-center shadow-lg shadow-red-600/50">
                <Zap size={8} className="text-white animate-pulse" />
              </div>
            )}
          </div>
          <div className="text-center min-w-0">
            <p 
              className="text-sm font-black uppercase text-white truncate max-w-full mb-0.5 tracking-tight"
              title={m?.away?.name || 'Away'}
            >
              {truncateTeamName(m?.away?.name)}
            </p>
            <div className="text-xs font-bold text-white/50">
              {awayScore > 0 && (
                <span className="font-mono bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                  {awayScore}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Match Info */}
      <div className="mb-4 space-y-2">
        {/* AI Prediction */}
        <div className="flex items-center justify-start gap-2 px-4 py-3 bg-gradient-to-r from-gray-800/50 to-black/50 rounded-xl border border-white/5">
          <BrainCircuit size={14} className={isElite ? 'text-yellow-400' : isAutoDetectedState ? 'text-green-400' : 'text-red-400'} />
          <span className="text-xs font-bold text-white/70 truncate max-w-full" title={aiPickDisplay}>
            {aiPickDisplay || 'AI analysis in progress...'}
          </span>
        </div>
        
        {/* Additional Info Bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-black/30 rounded-lg border border-white/5">
          {/* Stream Quality Indicator */}
          {streamCount > 0 && (
            <div className="flex items-center gap-1.5" title={`${streamCount} stream(s) available: ${getStreamQualityIndicator()}`}>
              <Radio size={10} className="text-green-400" />
              <div className="flex gap-1">
                {[1, 2, 3].slice(0, streamCount).map((num) => (
                  <div 
                    key={num} 
                    className={`w-1.5 h-1.5 rounded-full ${
                      num === 1 ? 'bg-green-500' : 
                      num === 2 ? 'bg-blue-500' : 
                      'bg-purple-500'
                    }`}
                  ></div>
                ))}
              </div>
              <span className="text-[10px] text-white/60">x{streamCount}</span>
            </div>
          )}
          
          {/* Match Phase Indicator */}
          <div className="flex items-center gap-1" title={`Match phase: ${matchPhase}`}>
            {matchPhase === 'live' && <Zap size={10} className="text-red-400" />}
            {matchPhase === 'upcoming' && <Clock size={10} className="text-blue-400" />}
            {matchPhase === 'finished' && <CheckCircle size={10} className="text-gray-400" />}
            <span className="text-[10px] text-white/40">{matchPhase.toUpperCase()}</span>
          </div>
          
          {/* Last Updated */}
          {lastUpdateTime && (
            <div className="flex items-center gap-1" title={`Last updated: ${lastUpdateTime}`}>
              <Calendar size={10} className="text-white/40" />
              <span className="text-[10px] text-white/40">
                {lastUpdateTime}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <button 
        onClick={handleCardClick}
        disabled={!safeId || safeId === 'undefined' || safeId === 'null'}
        className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
          getButtonBgColor()
        } group/button`}
        aria-label={`${getButtonText()} - ${m?.home?.name || 'Home'} vs ${m?.away?.name || 'Away'}`}
      >
        {getButtonIcon()}
        <span>{getButtonText()}</span>
        
        {/* Auto-detection indicator on button */}
        {isAutoDetectedState && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white/90 animate-pulse">
            <div className="w-full h-full flex items-center justify-center">
              <Timer size={8} className="text-white" />
            </div>
          </div>
        )}
        
        {/* Stream Quality Badge */}
        {streamCount > 0 && (
          <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
            shouldShowLiveButton || isLive ? 'bg-white/20 group-hover/button:bg-white/30' : 
            isAutoDetectedState ? 'bg-white/20 group-hover/button:bg-white/30' : 
            'bg-black/20 group-hover/button:bg-black/30'
          }`}>
            {streamCount}x {getStreamQualityIndicator()}
          </span>
        )}
      </button>
      
      {/* Auto-detection explanation tooltip */}
      {isAutoDetectedState && (
        <div className="mt-3 px-3 py-2 bg-gradient-to-r from-green-900/30 to-green-900/10 rounded-lg border border-green-500/20">
          <div className="flex items-center gap-2">
            <AlertCircle size={10} className="text-green-400" />
            <span className="text-[10px] text-green-300 font-bold">
              Auto-detected: Match started but API hasn't updated yet
            </span>
          </div>
        </div>
      )}
      
      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 pt-2 border-t border-white/5">
          <div className="text-[8px] text-white/20 font-mono truncate">
            ID: {safeId} | Phase: {matchPhase} | API: {m?.status} | Est: {estimatedStatus} | 
            API min: {m?.minute} | Est min: {estimatedMinute} | Auto: {isAutoDetectedState ? 'YES' : 'NO'}
          </div>
        </div>
      )}
    </div>
  );
});

// Add display name for debugging
MatchCard.displayName = 'MatchCard';

export default MatchCard;