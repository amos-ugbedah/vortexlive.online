/* eslint-disable */
import React, { useState, useEffect } from 'react';

const MatchTimer = ({ match }) => {
  const [displayTime, setDisplayTime] = useState('--');
  const [isAddedTime, setIsAddedTime] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      if (!match) return;
      const status = String(match.status || '').toUpperCase();
      
      const staticStates = { 
        'HT': 'HALF TIME', 'FT': 'FULL TIME', 'AET': 'END AET', 
        'PEN': 'PENALTIES', 'NS': 'UPCOMING', 'PST': 'POSTPONED' 
      };

      if (staticStates[status]) {
        setDisplayTime(staticStates[status]);
        setIsAddedTime(false);
        return;
      }

      if (['1H', '2H', 'ET', 'LIVE', 'IN_PLAY'].includes(status)) {
        const baseMin = Number(match.minute) || 0;
        // API updates are every 1 min, so we show the base min recorded
        const currentMin = baseMin;

        if (status === '1H' && currentMin > 45) {
          setDisplayTime(`45+${currentMin - 45}'`);
          setIsAddedTime(true);
        } else if (status === '2H' && currentMin > 90) {
          setDisplayTime(`90+${currentMin - 90}'`);
          setIsAddedTime(true);
        } else {
          setDisplayTime(`${Math.max(1, currentMin)}'`);
          setIsAddedTime(false);
        }
      } else {
        setDisplayTime(status || 'LIVE');
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 10000);
    return () => clearInterval(interval);
  }, [match]);

  return (
    <div className="flex items-center gap-2 px-4 py-2 border rounded-full bg-red-600/10 border-red-600/20">
      <span className="relative flex w-2 h-2">
        <span className="absolute inline-flex w-full h-full bg-red-400 rounded-full opacity-75 animate-ping"></span>
        <span className="relative inline-flex w-2 h-2 bg-red-600 rounded-full"></span>
      </span>
      <span className={`text-[10px] font-black uppercase tracking-widest ${isAddedTime ? 'text-amber-400' : 'text-red-600'}`}>
        {displayTime}
      </span>
    </div>
  );
};

export default MatchTimer;