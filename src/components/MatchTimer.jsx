/* eslint-disable */
import React, { useState, useEffect, memo } from 'react';

const STATUS_DISPLAY = {
  'NS': 'UPCOMING',
  'FT': 'FULL TIME',
  'TBD': 'TBD',
  'FINISHED': 'FT',
  'AET': 'AET',
  'PEN': 'PEN',
  'P': 'PENALTIES',
  'SUSP': 'SUSPENDED',
  'CANC': 'CANCELLED'
};

const MatchTimer = memo(({ match }) => {
  const [displayTime, setDisplayTime] = useState('--');
  const [isAddedTime, setIsAddedTime] = useState(false);
  const [timeSinceUpdate, setTimeSinceUpdate] = useState(0);

  // 1. Safer Firestore Timestamp conversion
  const getSafeDate = (timestamp) => {
    if (!timestamp) return new Date();
    if (typeof timestamp.toDate === 'function') return timestamp.toDate();
    return new Date(timestamp);
  };

  const status = String(match?.status || 'NS').toUpperCase();
  const minute = Number(match?.minute || 0);
  const lastUpdated = getSafeDate(match?.lastUpdated);

  useEffect(() => {
    const calculateTime = () => {
      try {
        if (['NS', 'FT', 'TBD', 'FINISHED', 'AET', 'PEN', 'P', 'SUSP', 'CANC'].includes(status)) {
          setDisplayTime(STATUS_DISPLAY[status] || status);
          setIsAddedTime(false);
          return;
        }

        const isLiveMatch = ['1H', '2H', 'HT', 'ET', 'LIVE'].includes(status);
        
        if (isLiveMatch) {
          let isAdded = false;
          let display = '';

          switch(status) {
            case 'HT':
              display = 'HT';
              break;
            case '1H':
              if (minute > 45) {
                display = `45+${minute - 45}'`;
                isAdded = true;
              } else {
                display = `${Math.max(1, minute)}'`;
              }
              break;
            case '2H':
              if (minute > 90) {
                display = `90+${minute - 90}'`;
                isAdded = true;
              } else {
                // Fix: 2nd half should always show 46-90
                const secondHalfMin = (minute > 0 && minute <= 45) ? minute + 45 : minute;
                display = `${secondHalfMin}'`;
              }
              break;
            case 'ET':
              display = minute > 120 ? `120+${minute - 120}'` : `${minute}'`;
              isAdded = minute > 120;
              break;
            default:
              display = minute > 0 ? `${minute}'` : 'LIVE';
          }

          setDisplayTime(display);
          setIsAddedTime(isAdded);
          
          const diffMs = new Date() - lastUpdated;
          setTimeSinceUpdate(Math.floor(diffMs / 1000 / 60));
        }
      } catch (error) {
        setDisplayTime('--');
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 30000); 
    return () => clearInterval(interval);
  }, [status, minute, match?.lastUpdated]);

  // Dynamic Styling Helpers
  const isLive = ['1H', '2H', 'HT', 'ET', 'LIVE', 'P'].includes(status);
  
  const getBgColor = () => {
    if (!isLive) return 'bg-white/5 border-white/10';
    if (timeSinceUpdate >= 5) return 'bg-amber-500/10 border-amber-500/30';
    return 'bg-red-500/10 border-red-500/30';
  };

  const getTextColor = () => {
    if (!isLive) return 'text-white/40';
    if (timeSinceUpdate >= 5) return 'text-amber-500';
    return 'text-red-500';
  };

  const staleMessage = timeSinceUpdate >= 5 
    ? `⚠️ Delayed by ${timeSinceUpdate}m` 
    : `Updated: ${lastUpdated.toLocaleTimeString()}`;

  return (
    <div 
      className={`group relative flex items-center gap-2 px-3 py-1.5 border rounded-full transition-all duration-300 ${getBgColor()}`}
      title={staleMessage}
    >
      {isLive && (
        <span className="flex w-2 h-2 items-center justify-center">
          {timeSinceUpdate < 5 ? (
            <>
              <span className="absolute inline-flex w-2.5 h-2.5 bg-red-400 rounded-full opacity-75 animate-ping"></span>
              <span className="relative inline-flex w-2 h-2 bg-red-600 rounded-full"></span>
            </>
          ) : (
            <span className="relative inline-flex w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
          )}
        </span>
      )}
      
      <span className={`text-[11px] font-black tracking-tighter ${getTextColor()} whitespace-nowrap uppercase`}>
        {displayTime}
        {isLive && !['HT', 'P'].includes(status) && (
          <span className="ml-1 opacity-50 text-[8px] group-hover:opacity-100 transition-opacity italic">
            {isAddedTime ? 'ADD' : 'LIVE'}
          </span>
        )}
      </span>
    </div>
  );
});

export default MatchTimer;