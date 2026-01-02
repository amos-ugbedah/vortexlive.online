import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, ShieldCheck } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="mt-auto p-12 border-t border-white/5 text-center bg-black/40">
      <div className="flex justify-center gap-3 mb-8">
        <Link to="/privacy" className="text-[10px] font-bold uppercase text-gray-500 hover:text-red-500 flex items-center gap-2 transition-all border border-white/5 px-4 py-2 rounded-xl bg-white/5">
          <ShieldCheck size={14} /> Privacy
        </Link>
        <Link to="/contact" className="text-[10px] font-bold uppercase text-gray-500 hover:text-red-500 flex items-center gap-2 transition-all border border-white/5 px-4 py-2 rounded-xl bg-white/5">
          <Mail size={14} /> Contact
        </Link>
      </div>

      <div className="flex justify-center gap-8 grayscale opacity-10 mb-6 scale-75 font-black italic tracking-widest uppercase">
        <span className="text-red-600 opacity-50">Stake</span>
        <span>SportyBet</span>
        <span>1xBet</span>
        <span>Bet9ja</span>
      </div>
      <p className="text-[9px] text-gray-800 font-bold uppercase tracking-[0.5em]">© 2026 VORTEXLIVE • Premium Sports Network</p>
    </footer>
  );
};

export default Footer;