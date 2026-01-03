import React, { useState, useEffect } from 'react';

const MatchTimer = ({ match }) => {
  const [displayTime, setDisplayTime] = useState('--');

  useEffect(() => {
    const updateClock = () => {
      if (!match) return;

      const status = String(match.status || '').toUpperCase();

      // 1. Static Statuses
      if (status === 'HT') {
        setDisplayTime('HT');
        return;
      }
      if (status === 'FT') {
        setDisplayTime('FT');
        return;
      }
      if (status === 'NS' || status === 'UPCOMING') {
        setDisplayTime(match.time || 'Upcoming');
        return;
      }

      // 2. Live Match Logic (1H or 2H)
      if (status === '1H' || status === '2H') {
        try {
          // Convert Firebase timestamp or String to Milliseconds
          const lastUpdate = match.lastUpdate?.seconds 
            ? match.lastUpdate.seconds * 1000 
            : new Date(match.lastUpdate).getTime();

          if (isNaN(lastUpdate)) {
            setDisplayTime(status); // Fallback to '1H' or '2H' if date is invalid
            return;
          }

          const diffInMins = Math.floor((Date.now() - lastUpdate) / 60000);
          const currentMin = (Number(match.baseMinute) || 0) + diffInMins;

          // 3. Stoppage Time formatting (e.g., 45+2')
          if (status === '1H') {
            if (currentMin > 45) setDisplayTime(`45+${currentMin - 45}'`);
            else setDisplayTime(`${Math.max(1, currentMin)}'`);
          } else if (status === '2H') {
            if (currentMin > 90) setDisplayTime(`90+${currentMin - 90}'`);
            else setDisplayTime(`${Math.max(46, currentMin)}'`);
          }
        } catch (e) {
          setDisplayTime(status);
        }
      } else {
        setDisplayTime(status || 'NS');
      }
    };

    updateClock();
    // Update every 30 seconds to keep it accurate without killing performance
    const interval = setInterval(updateClock, 30000); 
    return () => clearInterval(interval);
  }, [match]);

  return (
    <span className="italic font-black tracking-tighter tabular-nums text-inherit">
      {displayTime}
    </span>
  );
};

export default MatchTimer;