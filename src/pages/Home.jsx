/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import MatchCard from '../components/MatchCard';
import TelegramTicker from '../components/TelegramTicker';

const Home = () => {
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'matches'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMatches(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Helper to convert "12:00 PM" or "14:30" to a comparable number
  const getTimeValue = (timeStr) => {
    if (!timeStr) return 9999;
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  // Categorize and Sort
  const liveMatches = matches
    .filter(m => ['1H', '2H', 'HT', 'LIVE', 'IN_PLAY'].includes(m.status?.toUpperCase()))
    .sort((a, b) => getTimeValue(a.time) - getTimeValue(b.time));

  const upcomingMatches = matches
    .filter(m => ['NS', 'TBD', 'SCHEDULED'].includes(m.status?.toUpperCase()))
    .sort((a, b) => getTimeValue(a.time) - getTimeValue(b.time));

  const finishedMatches = matches
    .filter(m => ['FT', 'AET', 'PEN'].includes(m.status?.toUpperCase()))
    .sort((a, b) => getTimeValue(a.time) - getTimeValue(b.time));

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 mb-4 border-4 border-red-600 rounded-full border-t-transparent animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Vortex Synchronizing...</p>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto w-full space-y-16 pb-20 px-4">
      <TelegramTicker />
      
      {/* 1. LIVE ARENA */}
      {liveMatches.length > 0 && (
        <section>
          <SectionHeader title="Live" highlight="Arena" color="text-red-600" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {liveMatches.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        </section>
      )}

      {/* 2. UPCOMING FEEDS */}
      {upcomingMatches.length > 0 && (
        <section>
          <SectionHeader title="Upcoming" highlight="Feeds" color="text-white/40" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {upcomingMatches.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        </section>
      )}

      {/* 3. RECENT RESULTS (FT matches moved to bottom) */}
      {finishedMatches.length > 0 && (
        <section className="pt-10 border-t opacity-50 border-white/5">
          <SectionHeader title="Past" highlight="Results" color="text-white/20" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {finishedMatches.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        </section>
      )}
    </div>
  );
};

const SectionHeader = ({ title, highlight, color }) => (
  <div className="flex items-center gap-4 mb-10">
    <h2 className="text-3xl italic font-black tracking-tighter uppercase">{title} <span className={color}>{highlight}</span></h2>
    <div className="h-[1px] flex-1 bg-white/5" />
  </div>
);

export default Home;