import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import OneSignal from 'react-onesignal';
import { db } from './lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

// Pages & Components
import Home from './pages/Home';
import Admin from './pages/Admin';
import MatchDetails from './pages/MatchDetails';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Trophy, Zap, ShieldAlert, X } from 'lucide-react';

function App() {
  const [isBanned, setIsBanned] = useState(false);
  const [showMobileAd, setShowMobileAd] = useState(true);
  const [isLandscapeMode, setIsLandscapeMode] = useState(false);
  
  const defaultPartners = [
    { name: "1XBET", offer: "200% DEPOSIT BONUS", link: "https://reffpa.com/L?tag=d_5098529m_97c_&site=5098529&ad=97", highlight: true },
    { name: "STAKE", offer: "$50 FREE BET", link: "#", highlight: false },
    { name: "BET9JA", offer: "100K WELCOME BONUS", link: "#", highlight: false }
  ];

  const SMART_LINK = "https://www.effectivegatecpm.com/m0hhxyhsj?key=2dc5d50b0220cf3243f77241e3c3114d";

  useEffect(() => {
    const checkMode = () => {
      const landscape = window.innerWidth > window.innerHeight;
      const mobileWidth = window.innerWidth < 1024;
      setIsLandscapeMode(landscape && mobileWidth);
    };
    checkMode();
    window.addEventListener('resize', checkMode);
    return () => window.removeEventListener('resize', checkMode);
  }, []);

  useEffect(() => {
    let userToken = localStorage.getItem('vortex_utk') || 'vx_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('vortex_utk', userToken);
    const unsub = onSnapshot(doc(db, "blacklist", userToken), (doc) => {
      if (doc.exists()) setIsBanned(true);
    });
    return () => unsub();
  }, []);

  if (isBanned) return (
    <div className="flex items-center justify-center min-h-screen p-6 text-white bg-black">
      <div className="bg-red-600/10 p-10 rounded-[2.5rem] border border-red-600/20 text-center">
        <ShieldAlert size={48} className="mx-auto mb-4 text-red-600 animate-pulse" />
        <h1 className="text-2xl italic font-black uppercase">Access Denied</h1>
      </div>
    </div>
  );

  return (
    <Router>
      {/* Main Wrapper: 
          - Changed bg to #050505 for a deeper professional black
          - Removed px-4 and max-w-7xl limits 
      */}
      <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-red-600 overflow-x-hidden">
        
        {!isLandscapeMode && <Navbar partners={defaultPartners} />}

        {/* LAYOUT CONTAINER: 
            - Removed max-w-[1400px] 
            - Changed to w-full to allow grid expansion 
        */}
        <div className={`flex w-full flex-1 ${isLandscapeMode ? 'p-0' : 'p-2 md:p-4 lg:p-6'}`}>
          
          {/* Main Content: 
              - Removed max-w-3xl (This was killing your grid)
              - Added w-full
          */}
          <main className="w-full h-full">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/match/:id" element={<MatchDetails />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>

        </div>

        {!isLandscapeMode && <Footer />}
      </div>
    </Router>
  );
}

export default App;