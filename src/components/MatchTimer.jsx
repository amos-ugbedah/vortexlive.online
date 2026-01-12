/* eslint-disable */
import React, { useState, useEffect, memo } from 'react';

// Status mapping from your backend STATUS_MAP
const STATUS_DISPLAY = {
  // Live statuses
  '1H': '1st Half',
  '2H': '2nd Half', 
  'HT': 'Half Time',
  'ET': 'Extra Time',
  'BT': 'Break Time',
  'P': 'Penalties',
  'IN_PLAY': 'Live',
  'LIVE': 'Live',
  
  // Static statuses
  'NS': 'Upcoming',
  'TBD': 'Time TBD',
  'SCHEDULED': 'Scheduled',
  'TIMED': 'Scheduled',
  
  // Finished statuses
  'FT': 'Full Time',
  'AET': 'After ET',
  'PEN': 'Penalties',
  'FINISHED': 'Finished',
  
  // Special statuses
  'SUSP': 'Suspended',
  'INT': 'Interrupted',
  'PST': 'Postponed',
  'CANC': 'Cancelled',
  'ABD': 'Abandoned',
  'AWD': 'Awarded',
  'WO': 'Walkover'
};

const MatchTimer = memo(({ match }) => {
  const [displayTime, setDisplayTime] = useState('--');
  const [isAddedTime, setIsAddedTime] = useState(false);
  const [timeSinceUpdate, setTimeSinceUpdate] = useState(0);

  // Validate match data
  if (!match || typeof match !== 'object') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 border rounded-full bg-gray-600/10 border-gray-600/20">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          --
        </span>
      </div>
    );
  }

  // Safe data extraction
  const status = String(match?.status || 'NS').toUpperCase();
  const minute = Number(match?.minute || 0);
  const lastUpdated = match?.lastUpdated?.toDate ? match.lastUpdated.toDate() : new Date();

  useEffect(() => {
    const calculateTime = () => {
      try {
        // Handle static statuses (non-live)
        if (STATUS_DISPLAY[status]) {
          const staticDisplay = STATUS_DISPLAY[status];
          
          // For static statuses, just show the status
          setDisplayTime(staticDisplay);
          setIsAddedTime(false);
          return;
        }

        // Handle live match timing
        const isLiveMatch = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'IN_PLAY', 'LIVE'].includes(status);
        
        if (isLiveMatch) {
          let currentMin = minute;
          let isAdded = false;
          let display = '';

          // Calculate added/injury time
          if (status === 'HT') {
            display = 'HT';
          } else if (status === '1H') {
            if (currentMin > 45) {
              display = `45+${currentMin - 45}'`;
              isAdded = true;
            } else {
              display = `${Math.max(1, currentMin)}'`;
            }
          } else if (status === '2H') {
            if (currentMin > 90) {
              display = `90+${currentMin - 90}'`;
              isAdded = true;
            } else {
              // Add 45 minutes for second half display
              const displayMin = 45 + Math.max(1, currentMin);
              display = `${displayMin}'`;
            }
          } else if (status === 'ET') {
            if (currentMin > 120) {
              display = `120+${currentMin - 120}'`;
              isAdded = true;
            } else {
              // Add 90 minutes for extra time display
              const displayMin = 90 + Math.max(1, currentMin);
              display = `${displayMin}'`;
            }
          } else if (status === 'P') {
            display = 'PEN';
          } else {
            // Fallback for other live statuses
            display = `${Math.max(1, currentMin)}'`;
          }

          // Add "LIVE" indicator for active play
          if (status !== 'HT' && status !== 'BT' && status !== 'P') {
            display += ' • LIVE';
          }

          setDisplayTime(display);
          setIsAddedTime(isAdded);
          
          // Update time since last update for freshness indicator
          const now = new Date();
          const diffMs = now - lastUpdated;
          setTimeSinceUpdate(Math.floor(diffMs / 1000 / 60)); // in minutes
        } else {
          // For unknown statuses, show the status code
          setDisplayTime(status);
          setIsAddedTime(false);
        }
      } catch (error) {
        console.error('Error calculating match time:', error);
        setDisplayTime('--');
        setIsAddedTime(false);
      }
    };

    calculateTime();
    
    // Set up interval for live matches only
    const isLive = ['1H', '2H', 'ET', 'BT', 'P', 'IN_PLAY', 'LIVE'].includes(status);
    const intervalTime = isLive ? 30000 : 60000; // 30s for live, 1min for others
    
    const interval = setInterval(calculateTime, intervalTime);
    return () => clearInterval(interval);
  }, [match, status, minute, lastUpdated]);

  // Determine match state for styling
  const isLive = ['1H', '2H', 'ET', 'BT', 'P', 'IN_PLAY', 'LIVE'].includes(status);
  const isUpcoming = ['NS', 'TBD', 'SCHEDULED', 'TIMED'].includes(status);
  const isFinished = ['FT', 'AET', 'PEN', 'FINISHED'].includes(status);
  const isSpecial = ['SUSP', 'INT', 'PST', 'CANC', 'ABD', 'AWD', 'WO'].includes(status);

  // Get background color based on status
  const getBgColor = () => {
    if (isLive) return 'bg-red-600/10 border-red-600/20';
    if (isUpcoming) return 'bg-blue-600/10 border-blue-600/20';
    if (isFinished) return 'bg-gray-600/10 border-gray-600/20';
    if (isSpecial) return 'bg-yellow-600/10 border-yellow-600/20';
    return 'bg-white/5 border-white/10';
  };

  // Get text color based on status
  const getTextColor = () => {
    if (isLive) return isAddedTime ? 'text-amber-400' : 'text-red-600';
    if (isUpcoming) return 'text-blue-400';
    if (isFinished) return 'text-gray-400';
    if (isSpecial) return 'text-yellow-400';
    return 'text-white/60';
  };

  // Determine if we should show pulse animation
  const showPulse = isLive && !isAddedTime && timeSinceUpdate < 5; // Only if updated <5 mins ago

  // Determine if we should show stale indicator
  const showStale = isLive && timeSinceUpdate >= 5;

  return (
    <div 
      className={`relative flex items-center gap-2 px-4 py-2 border rounded-full transition-all duration-300 ${getBgColor()} ${
        showStale ? 'opacity-70' : ''
      }`}
      title={`Status: ${STATUS_DISPLAY[status] || status} • Minute: ${minute} • Updated: ${lastUpdated.toLocaleTimeString()}`}
    >
      {/* Live pulse indicator */}
      {showPulse && (
        <span className="relative flex w-2 h-2" aria-label="Live match">
          <span className="absolute inline-flex w-full h-full bg-red-400 rounded-full opacity-75 animate-ping"></span>
          <span className="relative inline-flex w-2 h-2 bg-red-600 rounded-full"></span>
        </span>
      )}
      
      {/* Stale indicator */}
      {showStale && (
        <span className="relative flex w-2 h-2" aria-label="Data may be stale">
          <span className="relative inline-flex w-2 h-2 bg-yellow-500 rounded-full"></span>
        </span>
      )}

      {/* Time display */}
      <span className={`text-[10px] font-black uppercase tracking-widest ${getTextColor()} whitespace-nowrap`}>
        {displayTime}
      </span>

      {/* Optional: Show update age for debugging */}
      {process.env.NODE_ENV === 'development' && isLive && (
        <span className="text-[8px] text-white/30 ml-1">
          {timeSinceUpdate}m
        </span>
      )}
    </div>
  );
});

// Add display name for debugging
MatchTimer.displayName = 'MatchTimer';

export default MatchTimer;