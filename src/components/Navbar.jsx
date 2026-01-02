import React from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ExternalLink } from 'lucide-react';

const Navbar = ({ partners }) => {
  return (
    <nav className="sticky top-0 z-[120] bg-[#0a0a0c]/95 backdrop-blur-md border-b border-white/5">
      <div className="px-4 py-3 flex justify-between items-center max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2 scale-90 origin-left">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center font-black italic text-lg shadow-lg shadow-red-600/20">V</div>
          <span className="font-black tracking-tighter text-lg italic uppercase">VORTEX<span className="text-red-600">LIVE</span></span>
        </Link>
        
        {/* CENTER STAKE BANNER (Desktop Only) */}
        <a href="https://stake.com/?c=eEPcMjrA" target="_blank" rel="noreferrer" 
           className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full hover:bg-white/10 transition-all group">
          <span className="text-[10px] font-black italic text-gray-400 group-hover:text-red-500 transition-colors">OFFICIAL PARTNER:</span>
          <span className="text-[10px] font-black text-white uppercase tracking-widest">STAKE.COM</span>
          <ExternalLink size={10} className="text-gray-600" />
        </a>

        <div className="flex items-center gap-3">
           <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 rounded-full border border-green-500/20">
             <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
             <span className="text-[9px] font-bold text-green-500 uppercase tracking-widest">Live</span>
           </div>
           <Link to="/admin" className="p-1.5 text-white/20 hover:text-red-500 transition-colors">
             <DollarSign size={20}/>
           </Link>
        </div>
      </div>

      {/* CLICKABLE MICRO-TICKER */}
      <div className="bg-red-600 text-white py-2 overflow-hidden border-t border-white/5 shadow-inner relative z-[110]">
        <div className="animate-marquee flex gap-12 items-center whitespace-nowrap group">
          {[...partners, ...partners, ...partners].map((p, i) => (
            <a 
              key={i} 
              href={p.link} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[10px] font-black uppercase flex items-center gap-2 tracking-tighter hover:text-black transition-colors cursor-pointer"
            >
              <span className="bg-white text-red-600 px-1.5 py-0.5 rounded-[2px] text-[8px] font-black uppercase">PROMO</span> 
              {p.name}: {p.offer}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;