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
    { name: "1XBET", offer: "Code: VORTEX", link: "https://1xbetaffiliates.net/L?tag=YOUR_ID" },
    { name: "SPORTYBET", offer: "300% BONUS", link: "https://www.sportybet.com/ng/m/affiliate/register" }
  ];

  return (
    <Router>
      <div className="min-h-screen bg-[#0a0a0c] text-white selection:bg-red-500 flex flex-col font-sans">
        <Navbar partners={partners} />

        <div className="flex justify-center items-start gap-6 px-4 py-8 max-w-[1600px] mx-auto w-full flex-1">
          {/* LEFT SIDEBAR ADS */}
          <aside className="hidden xl:block w-[160px] sticky top-32 shrink-0">
            <div className="bg-white/5 border border-white/10 rounded-3xl h-[600px] flex items-center justify-center relative overflow-hidden">
               <p className="text-[10px] text-white/10 font-black uppercase tracking-[0.4em] rotate-90">Advertisement</p>
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

        <Footer />
      </div>
    </Router>
  );
}

export default App;