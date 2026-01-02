import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ContactUs from './pages/ContactUs';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { ExternalLink, Trophy, Gift, Zap } from 'lucide-react';

function App() {
  const partners = [
    { 
      name: "1XBET", 
      offer: "PROMO CODE: 9236312", 
      link: "https://reffpa.com/L?tag=d_5098529m_97c_&site=5098529&ad=97",
      highlight: true 
    },
    { 
      name: "STAKE", 
      offer: "BEST ODDS + CRYPTO", 
      link: "https://stake.com/?c=eEPcMjrA",
      highlight: false
    }
  ];

  return (
    <Router>
      <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-red-500 flex flex-col font-sans relative">
        <Navbar partners={partners} />

        <div className="flex justify-center items-start gap-6 px-4 py-8 max-w-[1600px] mx-auto w-full flex-1">
          
          {/* LEFT SIDEBAR: 1XBET SPECIAL */}
          <aside className="hidden xl:block w-[180px] sticky top-32 shrink-0">
            <a href="https://reffpa.com/L?tag=d_5098529m_97c_&site=5098529&ad=97" target="_blank" rel="noreferrer" 
               className="group relative flex flex-col items-center bg-[#003566] border-2 border-yellow-400 rounded-[2.5rem] h-[600px] overflow-hidden shadow-[0_0_30px_rgba(0,53,102,0.4)] transition-transform hover:scale-[1.02]">
               <div className="bg-yellow-400 w-full py-2 text-center text-[#003566] font-black text-[10px] uppercase tracking-widest">Official Partner</div>
               
               <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <Trophy className="text-yellow-400 mb-6 animate-bounce" size={40} />
                  <h2 className="text-white font-black text-2xl italic leading-none mb-2">1XBET</h2>
                  <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest mb-8 text-pretty">World's #1 Betting Site</p>
                  
                  <div className="bg-white text-blue-900 p-4 rounded-2xl border-2 border-blue-400 mb-8">
                    <p className="text-[9px] font-black uppercase mb-1">Use Promo Code</p>
                    <p className="text-xl font-black tracking-tighter">9236312</p>
                  </div>

                  <span className="mt-auto bg-yellow-400 text-blue-900 px-6 py-3 rounded-xl font-black text-xs group-hover:bg-white transition-colors">CLAIM BONUS</span>
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

          {/* RIGHT SIDEBAR: STAKE SPECIAL */}
          <aside className="hidden xl:block w-[180px] sticky top-32 shrink-0">
            <a href="https://stake.com/?c=eEPcMjrA" target="_blank" rel="noreferrer"
               className="group relative flex flex-col items-center bg-black border-2 border-red-600 rounded-[2.5rem] h-[600px] overflow-hidden shadow-[0_0_30px_rgba(220,38,38,0.2)] transition-transform hover:scale-[1.02]">
               <div className="bg-red-600 w-full py-2 text-center text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1">
                 <Zap size={10} fill="currentColor" /> VIP OFFER
               </div>

               <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mb-8 rotate-12 group-hover:rotate-0 transition-transform">
                    <Gift className="text-white" size={32} />
                  </div>
                  
                  <h2 className="text-white font-black text-3xl italic leading-none mb-2 tracking-tighter uppercase">STAKE</h2>
                  <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mb-12">Crypto Casino & Sports</p>
                  
                  <div className="space-y-4 mb-8">
                    <p className="text-gray-400 text-[10px] font-bold italic leading-relaxed uppercase">• Instant Payouts</p>
                    <p className="text-gray-400 text-[10px] font-bold italic leading-relaxed uppercase">• 24/7 Live Odds</p>
                    <p className="text-gray-400 text-[10px] font-bold italic leading-relaxed uppercase">• $1000+ Reloads</p>
                  </div>

                  <span className="mt-auto border-2 border-red-600 text-red-600 px-6 py-3 rounded-xl font-black text-xs group-hover:bg-red-600 group-hover:text-white transition-all">BET NOW</span>
               </div>
            </a>
          </aside>

        </div>

        <Footer />
      </div>
    </Router>
  );
}

export default App;