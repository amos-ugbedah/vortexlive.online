import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DollarSign, Zap, Crown, Award, ExternalLink, MessageSquare } from 'lucide-react';

const Navbar = ({ partners = [] }) => {
  const navigate = useNavigate();
  
  // Safety check to prevent crash if partners prop is missing
  const safePartners = Array.isArray(partners) ? partners : [];
  const rollingPartners = [...safePartners, ...safePartners, ...safePartners];

  const handleAdminClick = () => {
    // Check if user is already authenticated in this session
    const auth = sessionStorage.getItem('vx_admin_auth');
    if (auth === btoa('authenticated_2026')) {
      navigate('/admin');
    } else {
      // Navigate to the login screen instead of using a prompt
      navigate('/admin'); 
    }
  };

  return (
    <nav className="sticky top-0 z-[120] bg-[#0a0a0c] border-b border-white/5">
      <div className="px-6 py-4 flex justify-between items-center max-w-[1600px] mx-auto">
        {/* LOGO SECTION */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-black italic text-xl shadow-[0_0_20px_rgba(220,38,38,0.3)] text-white">V</div>
          <div className="flex flex-col">
            <span className="text-2xl italic font-black leading-none tracking-tighter text-white uppercase">VORTEX<span className="text-red-600">LIVE</span></span>
            <span className="text-[8px] font-bold tracking-[0.4em] text-gray-600 uppercase">Premium Network</span>
          </div>
        </Link>
        
        <div className="flex items-center gap-3">
            {/* TELEGRAM COMMUNITY BUTTON */}
            <a 
              href="https://t.me/+ZAygoaZr9VA2NGE0" 
              target="_blank" 
              rel="noreferrer"
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#229ED9]/10 border border-[#229ED9]/20 rounded-xl text-[#229ED9] hover:bg-[#229ED9] hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
            >
              <MessageSquare size={14} fill="currentColor" />
              Join Community
            </a>

            {/* ADMIN ACCESS BUTTON */}
            <button 
              onClick={handleAdminClick}
              className="p-2 transition-all border rounded-lg bg-white/5 hover:bg-red-600 hover:text-white border-white/10 text-white/40"
              title="Admin Portal"
            >
              <DollarSign size={20}/>
            </button>
        </div>
      </div>

      {/* TICKER SECTION */}
      <div className="relative flex items-center h-12 overflow-hidden bg-red-600 border-y border-white/10">
        <div className="absolute left-0 top-0 bottom-0 bg-black z-20 px-4 flex items-center border-r border-white/10 shadow-[5px_0_15px_rgba(0,0,0,0.5)]">
            <span className="text-[9px] font-black italic uppercase tracking-widest text-white">Live Offers</span>
        </div>

        <div className="flex h-full whitespace-nowrap animate-marquee-fast">
          {rollingPartners.map((p, i) => (
            <a 
              key={i} 
              href={p.link} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center h-full px-10 transition-all border-r group border-white/10"
            >
              {p.highlight ? (
                <div className="flex items-center gap-3 bg-white text-black px-4 py-1.5 rounded-lg border-2 border-yellow-400 group-hover:bg-yellow-400 transition-colors">
                    <Award size={16} className="text-blue-700" />
                    <div className="flex flex-col leading-none">
                        <span className="text-[9px] font-black uppercase">{p.name} OFFICIAL</span>
                        <span className="text-[11px] font-black text-blue-800">{p.offer}</span>
                    </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-white transition-transform group-hover:scale-105">
                    {p.name === "STAKE" ? <Crown size={14} /> : <Zap size={14} />}
                    <span className="text-[11px] font-black uppercase tracking-tighter">
                        {p.name} <span className="mx-2 opacity-40">|</span> 
                        <span className="text-white/90">{p.offer}</span>
                    </span>
                    <ExternalLink size={10} className="transition-opacity opacity-0 group-hover:opacity-100" />
                </div>
              )}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;