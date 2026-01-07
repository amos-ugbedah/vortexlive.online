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
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight && window.innerWidth < 1024);
  
  const defaultPartners = [
    { name: "1XBET", offer: "200% DEPOSIT BONUS", link: "https://reffpa.com/L?tag=d_5098529m_97c_&site=5098529&ad=97", highlight: true },
    { name: "STAKE", offer: "$50 FREE BET", link: "#", highlight: false },
    { name: "BET9JA", offer: "100K WELCOME BONUS", link: "#", highlight: false }
  ];

  const SMART_LINK = "https://www.effectivegatecpm.com/m0hhxyhsj?key=2dc5d50b0220cf3243f77241e3c3114d";

  useEffect(() => {
    const handleResize = () => {
      // We only consider it "Landscape Theater Mode" if it's a small device held sideways
      setIsLandscape(window.innerWidth > window.innerHeight && window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let userToken = localStorage.getItem('vortex_utk') || 'vx_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('vortex_utk', userToken);
    const unsub = onSnapshot(doc(db, "blacklist", userToken), (doc) => {
      if (doc.exists()) setIsBanned(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const initNotifications = async () => {
      try {
        await OneSignal.init({ 
          appId: "83500a13-673b-486c-8d52-41e1b16d01a5", 
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerPath: "OneSignalSDKWorker.js",
        });
      } catch (e) {
        console.log("OneSignal status: active");
      }
    };
    initNotifications();
  }, []);

  if (isBanned) return (
    <div className="flex items-center justify-center min-h-screen p-6 font-sans text-center bg-black">
      <div className="bg-red-600/10 p-10 rounded-[2.5rem] border border-red-600/20 w-full max-w-sm">
        <ShieldAlert size={48} className="mx-auto mb-4 text-red-600 animate-pulse" />
        <h1 className="text-2xl italic font-black text-white uppercase">Access Denied</h1>
        <p className="text-zinc-500 text-[10px] font-bold uppercase mt-4 tracking-widest">Security Protocol 403 Active</p>
      </div>
    </div>
  );

  return (
    <Router>
      <div className="min-h-screen bg-[#070708] text-white flex flex-col font-sans selection:bg-red-600">
        
        {/* Navbar is now fixed to always show on Desktop (isLandscape is false for desktop now) */}
        {!isLandscape && <Navbar partners={defaultPartners} />}

        {showMobileAd && !isLandscape && (
          <div className="lg:hidden fixed bottom-4 left-4 right-4 z-[100] animate-in fade-in slide-in-from-bottom-10 duration-700">
            <div className="flex items-center justify-between p-3 border shadow-2xl bg-gradient-to-r from-blue-900 to-indigo-900 border-white/20 rounded-2xl">
              <a href="https://reffpa.com/L?tag=d_5098529m_97c_&site=5098529&ad=97" target="_blank" rel="noreferrer" className="flex items-center gap-3">
                <div className="p-2 text-blue-900 bg-yellow-400 rounded-xl"><Trophy size={18} /></div>
                <div>
                  <p className="text-[10px] font-black uppercase leading-none text-yellow-400">1XBET Bonus</p>
                  <p className="text-[8px] font-bold uppercase text-white/60">Use Code: 9236312</p>
                </div>
              </a>
              <button onClick={() => setShowMobileAd(false)} className="p-1 rounded-lg hover:bg-white/10 text-white/40"><X size={16}/></button>
            </div>
          </div>
        )}

        <div className={`flex justify-center gap-8 mx-auto w-full flex-1 ${isLandscape ? 'p-0 max-w-full' : 'px-4 py-4 md:py-8 max-w-[1400px]'}`}>
          
          {/* Sidebars only show on Large Desktop Screens */}
          {!isLandscape && (
            <aside className="hidden xl:block w-[240px] shrink-0 sticky top-32 h-fit">
              <div className="p-6 text-center border glass-card bg-zinc-900/40 rounded-3xl border-white/5">
                <Trophy className="mx-auto mb-4 text-yellow-500" size={32} />
                <h2 className="mb-2 text-xl italic font-black tracking-tighter uppercase">1XBET</h2>
                <a href="https://reffpa.com/L?tag=d_5098529m_97c_&site=5098529&ad=97" target="_blank" rel="noreferrer" 
                   className="block w-full py-3 bg-white text-black text-[10px] font-black uppercase rounded-xl hover:bg-yellow-400 transition-colors">
                  Claim Bonus
                </a>
              </div>
            </aside>
          )}

          <main className={`${isLandscape ? 'w-screen h-screen' : 'w-full max-w-3xl'}`}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/match/:id" element={<MatchDetails />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>

          {!isLandscape && (
            <aside className="hidden xl:block w-[240px] shrink-0 sticky top-32 h-fit space-y-4">
               <div className="bg-gradient-to-br from-red-600 to-red-900 rounded-[2rem] p-6 text-center shadow-xl shadow-red-900/20">
                  <Zap className="mx-auto mb-2 text-white animate-pulse" size={24} />
                  <p className="text-[10px] font-black uppercase mb-4 tracking-widest">Ultra HD Server</p>
                  <a href={SMART_LINK} target="_blank" rel="noreferrer" className="block w-full py-3 bg-black text-white text-[10px] font-black uppercase rounded-xl">Unlock 4K</a>
               </div>
            </aside>
          )}
        </div>

        {!isLandscape && <Footer />}
      </div>
    </Router>
  );
}

export default App;