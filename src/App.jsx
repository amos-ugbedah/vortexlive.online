import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { db } from './lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import Home from './pages/Home';
import Admin from './pages/Admin';
import MatchDetails from './pages/MatchDetails';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { ShieldAlert } from 'lucide-react';

function App() {
  const [isBanned, setIsBanned] = useState(false);
  const [isLandscapeMode, setIsLandscapeMode] = useState(false);
  
  const defaultPartners = [
    { name: "1XBET", offer: "200% BONUS", link: "https://reffpa.com/L?tag=d_5098529m_97c_&site=5098529&ad=97", highlight: true },
    { name: "VORTEX", offer: "PRO ACCESS", link: "#", highlight: false }
  ];

  useEffect(() => {
    const checkMode = () => {
      setIsLandscapeMode(window.innerWidth > window.innerHeight && window.innerWidth < 1024);
    };
    checkMode();
    window.addEventListener('resize', checkMode);
    return () => window.removeEventListener('resize', checkMode);
  }, []);

  useEffect(() => {
    let userToken = localStorage.getItem('vortex_utk') || 'vx_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('vortex_utk', userToken);
    return onSnapshot(doc(db, "blacklist", userToken), (doc) => {
      if (doc.exists()) setIsBanned(true);
    });
  }, []);

  if (isBanned) return (
    <div className="flex items-center justify-center min-h-screen text-white bg-black">
      <div className="text-center p-10 border border-red-600/20 bg-red-600/10 rounded-[2.5rem]">
        <ShieldAlert size={48} className="mx-auto mb-4 text-red-600" />
        <h1 className="text-2xl font-black uppercase">Access Denied</h1>
      </div>
    </div>
  );

  return (
    <Router>
      <div className="min-h-screen bg-[#050505] text-white flex flex-col selection:bg-red-600">
        {!isLandscapeMode && <Navbar partners={defaultPartners} />}
        
        {/* ULTRA PRO: Edge-to-edge container */}
        <div className="flex-1 w-full">
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