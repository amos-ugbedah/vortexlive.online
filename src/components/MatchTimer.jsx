import React, { useState, useEffect } from 'react';

const MatchTimer = ({ match }) => {
  const [displayTime, setDisplayTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      if (match.status === 'upcoming') {
        setDisplayTime(match.time || 'Upcoming');
        return;
      }
      
      if (match.status === 'HT') {
        setDisplayTime('HT');
        return;
      }

      if (match.status === 'FT') {
        setDisplayTime('FT');
        return;
      }

      // If match is Live (1H or 2H)
      if (match.status === '1H' || match.status === '2H') {
        const lastUpdate = match.lastUpdate?.seconds 
          ? match.lastUpdate.seconds * 1000 
          : Date.now();
        
        const diffInMs = Date.now() - lastUpdate;
        const diffInMins = Math.floor(diffInMs / 60000);
        const currentMin = (match.baseMinute || 0) + diffInMins;

        // Handle Stoppage Time logic
        if (match.status === '1H' && currentMin > 45) {
          setDisplayTime(`45+${currentMin - 45}'`);
        } else if (match.status === '2H' && currentMin > 90) {
          setDisplayTime(`90+${currentMin - 90}'`);
        } else {
          setDisplayTime(`${currentMin}'`);
        }
      }
    };

    updateClock();
    const interval = setInterval(updateClock, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [match]);

  return <span className="timer-badge">{displayTime}</span>;
};

export default MatchTimer;