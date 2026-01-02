import React from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Zap, Crown, Award, ExternalLink, MessageSquare } from 'lucide-react';

const Navbar = ({ partners }) => {
  const rollingPartners = [...partners, ...partners, ...partners];

  return (
    <nav className="sticky top-0 z-[120] bg-[#0a0a0c] border-b border-white/5">
      <div className="px-6 py-4 flex justify-between items-center max-w-[1600px] mx-auto">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-black italic text-xl shadow-[0_0_20px_rgba(220,38,38,0.3)] text-white">V</div>
          <div className="flex flex-col">
            <span className="font-black tracking-tighter text-2xl italic uppercase leading-none text-white">VORTEX<span className="text-red-600">LIVE</span></span>
            <span className="text-[8px] font-bold tracking-[0.4em] text-gray-600 uppercase">Premium Network</span>
          </div>
        </Link>
        
        <div className="flex items-center gap-3">
            {/* NEW TELEGRAM NAV BUTTON */}
            <a 
              href="https://t.me/+ZAygoaZr9VA2NGE0" 
              target="_blank" 
              rel="noreferrer"
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#229ED9]/10 border border-[#229ED9]/20 rounded-xl text-[#229ED9] hover:bg-[#229ED9] hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
            >
              <MessageSquare size={14} fill="currentColor" />
              Join Community
            </a>

            <Link to="/admin" className="p-2 bg-white/5 hover:bg-red-600 hover:text-white rounded-lg transition-all border border-white/10 text-white/40">
              <DollarSign size={20}/>
            </Link>
        </div>
      </div>

      {/* THE TICKER */}
      <div className="bg-red-600 border-y border-white/10 h-12 flex items-center overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 bg-black z-20 px-4 flex items-center border-r border-white/10 shadow-[5px_0_15px_rgba(0,0,0,0.5)]">
            <span className="text-[9px] font-black italic uppercase tracking-widest text-white">Live Offers</span>
        </div>

        <div className="flex whitespace-nowrap animate-marquee-fast h-full">
          {rollingPartners.map((p, i) => (
            <a 
              key={i} 
              href={p.link} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center px-10 group transition-all h-full border-r border-white/10"
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
                <div className="flex items-center gap-3 group-hover:scale-105 transition-transform text-white">
                    {p.name === "STAKE" ? <Crown size={14} /> : <Zap size={14} />}
                    <span className="text-[11px] font-black uppercase tracking-tighter">
                        {p.name} <span className="mx-2 opacity-40">|</span> 
                        <span className="text-white/90">{p.offer}</span>
                    </span>
                    <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
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