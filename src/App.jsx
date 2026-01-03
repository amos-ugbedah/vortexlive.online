import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ContactUs from './pages/ContactUs';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdManager from './components/AdManager'; // ADD THIS IMPORT
import { Trophy, Gift, Zap, MessageCircle } from 'lucide-react';

function App() {
  const partners = [
    { name: "1XBET", offer: "CODE: 9236312", link: "https://reffpa.com/L?tag=d_5098529m_97c_&site=5098529&ad=97", highlight: true },
    { name: "STAKE", offer: "BEST ODDS + CRYPTO", link: "https://stake.com/?c=eEPcMjrA", highlight: false },
    { name: "FAST STREAM", offer: "AD-FREE BACKUP", link: "https://otieu.com/4/10407921", highlight: false }
  ];

  return (
    <Router>
      <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-red-500 flex flex-col font-sans relative">
        {/* ADD ADMANAGER HERE - At the top level */}
        <AdManager />
        
        <Navbar partners={partners} />

        <div className="flex justify-center items-start gap-6 px-4 py-8 max-w-[1600px] mx-auto w-full flex-1">
          
          <aside className="hidden xl:block w-[180px] sticky top-32 shrink-0">
            <a 
              href="https://reffpa.com/L?tag=d_5098529m_97c_&site=5098529&ad=97" 
              target="_blank" 
              rel="noreferrer"
              onClick={(e) => {
                // Prevent AdManager from intercepting affiliate clicks
                e.stopPropagation();
                console.log('🎰 1XBET affiliate link clicked');
              }}
              className="group relative flex flex-col items-center bg-[#003566] border-2 border-yellow-400 rounded-[2.5rem] h-[600px] overflow-hidden shadow-[0_0_30px_rgba(0,53,102,0.4)] transition-transform hover:scale-[1.02]"
            >
              <div className="bg-yellow-400 w-full py-2 text-center text-[#003566] font-black text-[10px] uppercase tracking-widest">Official Partner</div>
              <div className="flex flex-col items-center justify-center flex-1 p-6 text-center">
                <Trophy className="mb-6 text-yellow-400 animate-bounce" size={40} />
                <h2 className="mb-2 text-2xl italic font-black leading-none text-white">1XBET</h2>
                <div className="p-4 my-6 text-blue-900 bg-white border-2 border-blue-400 rounded-2xl">
                  <p className="text-[9px] font-black uppercase mb-1">Promo Code</p>
                  <p className="text-xl font-black tracking-tighter">9236312</p>
                </div>
                <span className="px-6 py-3 mt-auto text-xs font-black text-blue-900 transition-colors bg-yellow-400 rounded-xl group-hover:bg-white">BET NOW</span>
              </div>
            </a>
          </aside>

          <main className="flex-1 w-full max-w-5xl overflow-hidden min-h-[70vh]">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/contact" element={<ContactUs />} />
            </Routes>
          </main>

          <aside className="hidden xl:block w-[180px] sticky top-32 shrink-0 space-y-4">
            <a 
              href="https://stake.com/?c=eEPcMjrA" 
              target="_blank" 
              rel="noreferrer"
              onClick={(e) => {
                // Prevent AdManager from intercepting affiliate clicks
                e.stopPropagation();
                console.log('🎰 Stake affiliate link clicked');
              }}
              className="group relative flex flex-col items-center bg-black border-2 border-red-600 rounded-[2rem] h-[350px] overflow-hidden transition-transform hover:scale-[1.02]"
            >
              <div className="bg-red-600 w-full py-2 text-center text-white font-black text-[9px] uppercase tracking-widest">Stake VIP</div>
              <div className="flex flex-col items-center justify-center flex-1 p-4 text-center">
                <Gift className="mb-4 text-red-600" size={32} />
                <h2 className="mb-1 text-xl italic font-black text-white uppercase">STAKE</h2>
                <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-black text-[10px] mt-4">CLAIM BONUS</span>
              </div>
            </a>

            <a 
              href="https://otieu.com/4/10407921" 
              target="_blank" 
              rel="noreferrer"
              onClick={(e) => {
                // Prevent AdManager from intercepting affiliate clicks
                e.stopPropagation();
                console.log('⚡ Fast Server affiliate link clicked');
              }}
              className="group block bg-gradient-to-br from-green-600 to-green-900 rounded-[2rem] p-4 text-center border-2 border-white/10 hover:border-green-400 transition-all"
            >
              <Zap className="mx-auto mb-2 text-yellow-400 animate-pulse" size={24} />
              <p className="text-[10px] font-black uppercase tracking-tighter leading-tight">Fast Server<br/>No Buffering</p>
              <p className="text-[8px] mt-2 opacity-60 uppercase font-bold">Switch Now ➔</p>
            </a>
          </aside>

        </div>

        <Footer />

        <a 
          href="https://t.me/+ZAygoaZr9VA2NGE0" 
          target="_blank" 
          rel="noreferrer"
          onClick={(e) => {
            // Prevent AdManager from intercepting Telegram link
            e.stopPropagation();
            console.log('📱 Telegram link clicked');
          }}
          className="fixed bottom-6 right-6 z-[200] bg-[#229ED9] text-white p-4 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all group flex items-center gap-3"
        >
          <MessageCircle size={28} fill="currentColor" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out font-black text-[10px] uppercase tracking-[0.2em] whitespace-nowrap">
            Join Telegram
          </span>
        </a>
      </div>
    </Router>
  );
}

export default App;