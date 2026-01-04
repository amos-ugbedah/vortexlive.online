import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import OneSignal from 'react-onesignal';
import Home from './pages/Home';
import Admin from './pages/Admin';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ContactUs from './pages/ContactUs';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdManager from './components/AdManager';
import { Trophy, Gift, Zap, MessageCircle, ExternalLink } from 'lucide-react';

function App() {
  const SMART_LINK = "https://www.effectivegatecpm.com/m0hhxyhsj?key=2dc5d50b0220cf3243f77241e3c3114d";

  useEffect(() => {
    // OneSignal Init
    OneSignal.init({
      appId: "83500a13-673b-486c-8d52-41e1b16d01a5",
      allowLocalhostAsSecureOrigin: true,
    });

    // Native Adsterra Banner Injector
    const s = document.createElement('script');
    s.src = "//www.profitablecpmrate.com/f0/21/e4/f021e4835824982348924343.js";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  const partners = [
    { name: "1XBET", offer: "CODE: 9236312", link: "https://reffpa.com/L?tag=d_5098529m_97c_&site=5098529&ad=97", highlight: true },
    { name: "STAKE", offer: "BONUS ACTIVE", link: "https://stake.com/?c=eEPcMjrA", highlight: false }
  ];

  return (
    <Router>
      <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col font-sans relative">
        <AdManager />
        <Navbar partners={partners} />

        <div className="flex justify-center items-start gap-6 px-4 py-8 max-w-[1600px] mx-auto w-full flex-1">
          
          {/* LEFT SIDEBAR: 1XBET Tracking */}
          <aside className="hidden xl:block w-[200px] sticky top-32 shrink-0">
            <a href="https://reffpa.com/L?tag=d_5098529m_97c_&site=5098529&ad=97" target="_blank" rel="noreferrer" 
               className="group block bg-[#003566] border-2 border-yellow-400 rounded-3xl overflow-hidden hover:scale-105 transition-transform shadow-2xl">
              <div className="bg-yellow-400 py-2 text-center text-blue-900 font-black text-[10px] uppercase">Official Sponsor</div>
              <div className="p-6 text-center">
                <Trophy className="mx-auto mb-4 text-yellow-400" size={40} />
                <h2 className="text-2xl italic font-black">1XBET</h2>
                <div className="p-3 my-4 text-blue-900 bg-white rounded-xl">
                  <p className="text-[8px] font-bold uppercase">Code</p>
                  <p className="text-lg font-black tracking-tighter">9236312</p>
                </div>
                <span className="text-[10px] font-black bg-yellow-400 text-blue-900 px-4 py-2 rounded-lg">BET NOW</span>
              </div>
            </a>
          </aside>

          {/* MAIN CONTENT */}
          <main className="flex-1 w-full max-w-4xl">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/contact" element={<ContactUs />} />
            </Routes>
          </main>

          {/* RIGHT SIDEBAR: Stake + Adsterra SmartLink */}
          <aside className="hidden xl:block w-[200px] sticky top-32 shrink-0 space-y-4">
            {/* Stake Promo */}
            <a href="https://stake.com/?c=eEPcMjrA" target="_blank" rel="noreferrer" 
               className="block p-6 text-center transition-all border-2 border-red-600 group bg-neutral-900 rounded-3xl hover:scale-105">
              <Gift className="mx-auto mb-3 text-red-600" size={32} />
              <h3 className="italic font-black">STAKE</h3>
              <p className="text-[10px] mt-2 text-gray-400 uppercase">Best Crypto Odds</p>
            </a>

            {/* 🔥 Adsterra SmartLink (New ID: 5510920) */}
            <a href={SMART_LINK} target="_blank" rel="noreferrer"
               className="block p-6 text-center transition-all shadow-lg bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl hover:brightness-110">
              <Zap className="mx-auto mb-2 text-yellow-400 animate-bounce" size={24} />
              <p className="text-[10px] font-black uppercase tracking-widest">Premium<br/>HD Server</p>
              <p className="text-[8px] mt-3 opacity-80 flex items-center justify-center gap-1 uppercase">Unlock Player <ExternalLink size={10}/></p>
            </a>
            
            {/* Adsterra Banner Referral */}
            <div className="flex justify-center pt-4">
               <a href="https://publishers.adsterra.com/referral/vN5p4P4q1w" rel="nofollow">
                  <img alt="Adsterra Banner" src="https://landings-cdn.adsterratech.com/referralBanners/png/80%20x%2030%20px.png" className="transition-opacity rounded opacity-50 hover:opacity-100" />
               </a>
            </div>
          </aside>

        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;