import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ContactUs from './pages/ContactUs';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function App() {
  const partners = [
    { name: "STAKE", offer: "BEST ODDS + BONUS", link: "https://stake.com/?c=eEPcMjrA" },
    { name: "1XBET", offer: "Code: VORTEX", link: "https://1xbetaffiliates.net/L?tag=YOUR_ID" },
    { name: "SPORTYBET", offer: "300% BONUS", link: "https://www.sportybet.com/ng/m/affiliate/register" }
  ];

  return (
    <Router>
      <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-red-500 flex flex-col font-sans relative">
        <Navbar partners={partners} />

        <div className="flex justify-center items-start gap-6 px-4 py-8 max-w-[1600px] mx-auto w-full flex-1">
          {/* LEFT SIDEBAR ADS */}
          <aside className="hidden xl:block w-[160px] sticky top-32 shrink-0">
            <div className="bg-white/5 border border-white/10 rounded-3xl h-[600px] flex flex-col items-center justify-center relative overflow-hidden group">
               <p className="text-[10px] text-white/10 font-black uppercase tracking-[0.4em] rotate-90 mb-8">Advertisement</p>
               <a href="https://stake.com/?c=eEPcMjrA" target="_blank" rel="noreferrer" className="opacity-20 group-hover:opacity-100 transition-opacity">
                  <span className="text-red-600 font-black italic text-xl -rotate-90 block">STAKE</span>
               </a>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 w-full max-w-6xl overflow-hidden min-h-[70vh]">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/contact" element={<ContactUs />} />
            </Routes>
          </main>

          {/* RIGHT SIDEBAR ADS */}
          <aside className="hidden xl:block w-[160px] sticky top-32 shrink-0">
            <div className="bg-white/5 border border-white/10 rounded-3xl h-[600px] flex items-center justify-center relative overflow-hidden">
               <p className="text-[10px] text-white/10 font-black uppercase tracking-[0.4em] -rotate-90">Advertisement</p>
            </div>
          </aside>
        </div>

        {/* STAKE FLOATING VIP BADGE */}
        <div className="fixed bottom-6 right-6 z-[150] animate-bounce hover:animate-none">
          <a 
            href="https://stake.com/?c=eEPcMjrA" 
            target="_blank" 
            rel="noreferrer"
            className="bg-red-600 text-white px-5 py-3 rounded-2xl font-black text-[10px] flex items-center gap-3 shadow-2xl shadow-red-600/40 border border-white/20 uppercase tracking-tighter"
          >
            <span className="bg-white text-red-600 px-1.5 py-0.5 rounded italic">VIP</span>
            Stake Bonus Active →
          </a>
        </div>

        <Footer />
      </div>
    </Router>
  );
}

export default App;