/* eslint-disable */
import React, { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, BrainCircuit, Play, Clock, Trophy, Tv, Zap, 
  MapPin, UserCheck, Calendar, Award, Star, Radio
} from 'lucide-react';
import { 
  formatMatchTime, 
  isMatchLive, 
  isMatchFinished, 
  isMatchUpcoming,
  getStreamCount,
  getStreamDisplay,
  getStreamQualityColor,
  getLeagueDisplay,
  isEliteMatch,
  getVenueDisplay,
  getRefereeDisplay,
  formatAIPick,
  getLastUpdateTime
} from '../lib/matchUtils';

const MatchCard = memo(({ match: m }) => {
  const navigate = useNavigate();
  
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
  
  // Get status display
  const getStatusDisplay = () => {
    if (isLive) {
      const minute = Number(m?.minute) || 0;
      if (m?.status === 'HT') return 'HALF TIME';
      return `${minute}'`;
    }
    
    if (isFinished) return 'FINAL';
    
    if (isUpcoming) {
      try {
        return formatMatchTime(m?.kickoff);
      } catch {
        return 'SOON';
      }
    }
    
    const statusMap = {
      'ET': 'EXTRA TIME',
      'P': 'PENALTIES',
      'SUSP': 'SUSPENDED',
      'PST': 'POSTPONED',
      'CANC': 'CANCELLED',
      'ABD': 'ABANDONED',
      'AWD': 'AWARDED'
    };
    
    return statusMap[m?.status] || '--';
  };

  // Handle card click
  const handleCardClick = useCallback(() => {
    if (safeId && safeId !== 'undefined' && safeId !== 'null') {
      navigate(`/match/${encodeURIComponent(safeId)}`);
    }
  }, [safeId, navigate]);

  // Get button text
  const getButtonText = () => {
    if (isLive) return 'WATCH LIVE';
    if (isUpcoming) return 'VIEW DETAILS';
    if (isFinished) return 'MATCH ENDED';
    return 'VIEW MATCH';
  };

  // Get button icon
  const getButtonIcon = () => {
    if (isLive) return <Play size={12} fill="currentColor" className="animate-pulse" />;
    if (isUpcoming) return <Clock size={12} />;
    return null;
  };

  // Get status background color
  const getStatusBgColor = () => {
    if (isLive) return 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/30';
    if (isFinished) return 'bg-gradient-to-r from-gray-700 to-gray-800 text-gray-300';
    if (isUpcoming) return 'bg-gradient-to-r from-blue-600 to-blue-700 text-blue-100';
    
    const status = String(m?.status || '').toUpperCase();
    if (['SUSP', 'PST', 'CANC'].includes(status)) return 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-yellow-100';
    return 'bg-gradient-to-r from-gray-800 to-gray-900 text-gray-400';
  };

  // Get button background color
  const getButtonBgColor = () => {
    if (isLive) return 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-600/20';
    if (isUpcoming) return 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800';
    if (isFinished) return 'bg-gradient-to-r from-gray-700 to-gray-800 text-gray-300 hover:from-gray-800 hover:to-gray-900';
    return 'bg-gradient-to-r from-gray-800 to-gray-900 text-gray-400 hover:from-gray-900 hover:to-black';
  };

  // Scores
  const homeScore = Number(m?.home?.score) || 0;
  const awayScore = Number(m?.away?.score) || 0;
  
  // Stream info
  const streamCount = getStreamCount(m);
  const streamDisplay = getStreamDisplay(m);
  
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
    if (!name) return 'TBA';
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

  return (
    <div 
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-gray-900/50 to-black p-5 transition-all duration-300 hover:border-red-500/30 hover:shadow-2xl hover:shadow-red-500/10 ${
        isFinished ? 'opacity-80' : 'hover:-translate-y-1'
      } ${isElite ? 'border-yellow-500/20 bg-gradient-to-br from-yellow-900/10 to-black' : ''}
      ${isManualMatch ? 'border-purple-500/20' : ''}`}
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
      
      {/* Stream Badge */}
      {streamCount > 0 && (
        <div className="absolute top-3 left-3 z-10">
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
        <div className="absolute top-12 left-3 z-10">
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
          <div className={`p-1.5 rounded-lg ${isElite ? 'bg-yellow-600/20' : 'bg-red-600/20'}`}>
            {getLeagueLogo() ? (
              <img 
                src={getLeagueLogo()} 
                className="w-4 h-4 object-contain"
                alt={`${m?.league || 'League'} logo`}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `
                    <ShieldCheck size={14} class="${isElite ? 'text-yellow-400' : 'text-red-400'}" />
                  `;
                }}
              />
            ) : (
              <ShieldCheck size={14} className={isElite ? 'text-yellow-400' : 'text-red-400'} />
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
              {/* Venue */}
              {venueDisplay !== 'Venue TBD' && (
                <div className="flex items-center gap-0.5">
                  <MapPin size={8} className="text-white/40" />
                  <span className="text-[9px] text-white/40 truncate max-w-[80px]" title={venueDisplay}>
                    {venueDisplay.split(' ')[0]}
                  </span>
                </div>
              )}
              
              {/* Referee */}
              {refereeDisplay !== 'Referee TBD' && (
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
        
        {/* Status Badge */}
        <div 
          className={`px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider whitespace-nowrap ${getStatusBgColor()}`}
          aria-live="polite"
        >
          {getStatusDisplay()}
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
                    e.target.parentElement.innerHTML = `<div class="text-white/30 font-bold text-xl">${m.home.name.charAt(0)}</div>`;
                  }}
                />
              ) : (
                <div className="text-white/30 font-bold text-xl">
                  {m?.home?.name?.charAt(0) || 'H'}
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
                <span className="font-mono">{homeScore}</span>
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
          {isLive && m?.minute > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-red-600/20 rounded-full">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-[9px] font-black uppercase text-red-400 tracking-widest">
                LIVE • {m?.minute || 0}'
              </span>
            </div>
          )}
          {!isLive && !isFinished && (
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
                    e.target.parentElement.innerHTML = `<div class="text-white/30 font-bold text-xl">${m.away.name.charAt(0)}</div>`;
                  }}
                />
              ) : (
                <div className="text-white/30 font-bold text-xl">
                  {m?.away?.name?.charAt(0) || 'A'}
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
                <span className="font-mono">{awayScore}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Match Info */}
      <div className="mb-4 space-y-2">
        {/* AI Prediction */}
        <div className="flex items-center justify-start gap-2 px-4 py-3 bg-gradient-to-r from-gray-800/50 to-black/50 rounded-xl border border-white/5">
          <BrainCircuit size={14} className={isElite ? 'text-yellow-400' : 'text-red-400'} />
          <span className="text-xs font-bold text-white/70 truncate max-w-full" title={aiPickDisplay}>
            {aiPickDisplay || 'AI analysis in progress...'}
          </span>
        </div>
        
        {/* Additional Info Bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-black/30 rounded-lg border border-white/5">
          {/* Stream Quality Indicator */}
          {streamCount > 0 && (
            <div className="flex items-center gap-1.5">
              <Radio size={10} className="text-green-400" />
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].slice(0, streamCount).map((num) => (
                  <div key={num} className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                ))}
              </div>
              <span className="text-[10px] text-white/60">x{streamCount}</span>
            </div>
          )}
          
          {/* Last Updated */}
          {lastUpdateTime && (
            <div className="flex items-center gap-1">
              <Calendar size={10} className="text-white/40" />
              <span className="text-[10px] text-white/40" title={`Last updated: ${lastUpdateTime}`}>
                {lastUpdateTime}
              </span>
            </div>
          )}
          
          {/* Manual Stream Update Indicator */}
          {streamsManuallyUpdated && (
            <div className="flex items-center gap-1" title="Streams manually updated">
              <Award size={10} className="text-purple-400" />
              <span className="text-[10px] text-purple-400">UPDATED</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <button 
        onClick={handleCardClick}
        disabled={!safeId || safeId === 'undefined' || safeId === 'null'}
        className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${getButtonBgColor()}`}
        aria-label={`${getButtonText()} - ${m?.home?.name || 'Home'} vs ${m?.away?.name || 'Away'}`}
      >
        {getButtonIcon()}
        {getButtonText()}
        
        {/* Stream Quality Badge */}
        {streamCount > 0 && (
          <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
            isLive ? 'bg-white/20' : 'bg-black/20'
          }`}>
            {streamCount}x {isLive ? 'LIVE' : 'HD'}
          </span>
        )}
      </button>
      
      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 pt-2 border-t border-white/5">
          <div className="text-[8px] text-white/20 font-mono truncate">
            ID: {safeId} | League ID: {m?.leagueId || 'N/A'} | Elite: {isElite ? 'YES' : 'NO'}
          </div>
        </div>
      )}
    </div>
  );
});

// Add display name for debugging
MatchCard.displayName = 'MatchCard';

export default MatchCard;