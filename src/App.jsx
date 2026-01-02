import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ContactUs from './pages/ContactUs';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { ExternalLink, Trophy, Gift, Zap, TrendingUp } from 'lucide-react';

function App() {
  const partners = [
    { 
      name: "1XBET", 
      offer: "CODE: 9236312", 
      link: "https://reffpa.com/L?tag=d_5098529m_97c_&site=5098529&ad=97",
      highlight: true 
    },
    { 
      name: "STAKE", 
      offer: "BEST ODDS + CRYPTO", 
      link: "https://stake.com/?c=eEPcMjrA",
      highlight: false
    },
    {
      name: "FAST STREAM",
      offer: "AD-FREE BACKUP",
      link: "https://otieu.com/4/10407921", // PropellerAds Direct Link
      highlight: false
    }
  ];

  return (
    <Router>
      <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-red-500 flex flex-col font-sans relative">
        <Navbar partners={partners} />

        <div className="flex justify-center items-start gap-6 px-4 py-8 max-w-[1600px] mx-auto w-full flex-1">
          
          {/* LEFT SIDEBAR: 1XBET */}
          <aside className="hidden xl:block w-[180px] sticky top-32 shrink-0">
            <a href="https://reffpa.com/L?tag=d_5098529m_97c_&site=5098529&ad=97" target="_blank" rel="noreferrer" 
               className="group relative flex flex-col items-center bg-[#003566] border-2 border-yellow-400 rounded-[2.5rem] h-[600px] overflow-hidden shadow-[0_0_30px_rgba(0,53,102,0.4)] transition-transform hover:scale-[1.02]">
               <div className="bg-yellow-400 w-full py-2 text-center text-[#003566] font-black text-[10px] uppercase tracking-widest uppercase">Official Partner</div>
               <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <Trophy className="text-yellow-400 mb-6 animate-bounce" size={40} />
                  <h2 className="text-white font-black text-2xl italic leading-none mb-2">1XBET</h2>
                  <div className="bg-white text-blue-900 p-4 rounded-2xl border-2 border-blue-400 my-6">
                    <p className="text-[9px] font-black uppercase mb-1">Promo Code</p>
                    <p className="text-xl font-black tracking-tighter">9236312</p>
                  </div>
                  <span className="mt-auto bg-yellow-400 text-blue-900 px-6 py-3 rounded-xl font-black text-xs group-hover:bg-white transition-colors">BET NOW</span>
               </div>
            </a>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 w-full max-w-5xl overflow-hidden min-h-[70vh]">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/contact" element={<ContactUs />} />
            </Routes>
          </main>

          {/* RIGHT SIDEBAR: STAKE + PROPELLER ADS */}
          <aside className="hidden xl:block w-[180px] sticky top-32 shrink-0 space-y-4">
            <a href="https://stake.com/?c=eEPcMjrA" target="_blank" rel="noreferrer"
               className="group relative flex flex-col items-center bg-black border-2 border-red-600 rounded-[2rem] h-[350px] overflow-hidden transition-transform hover:scale-[1.02]">
               <div className="bg-red-600 w-full py-2 text-center text-white font-black text-[9px] uppercase tracking-widest">Stake VIP</div>
               <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                  <Gift className="text-red-600 mb-4" size={32} />
                  <h2 className="text-white font-black text-xl italic mb-1 uppercase">STAKE</h2>
                  <p className="text-gray-500 text-[9px] font-black uppercase mb-4">Crypto Betting</p>
                  <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-black text-[10px]">CLAIM BONUS</span>
               </div>
            </a>

            {/* PROPELLER ADS DIRECT LINK SLOT */}
            <a href="https://otieu.com/4/10407921" target="_blank" rel="noreferrer"
               className="group block bg-gradient-to-br from-green-600 to-green-900 rounded-[2rem] p-4 text-center border-2 border-white/10 hover:border-green-400 transition-all">
               <Zap className="mx-auto text-yellow-400 mb-2 animate-pulse" size={24} />
               <p className="text-[10px] font-black uppercase tracking-tighter leading-tight">Fast Server<br/>No Buffering</p>
               <p className="text-[8px] mt-2 opacity-60 uppercase font-bold">Switch Now ➔</p>
            </a>
          </aside>

        </div>

        <Footer />
      </div>
    </Router>
  );
}

export default App;