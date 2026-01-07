import React from 'react';
import { Search, X, Command } from 'lucide-react';

const SearchBar = ({ value, onChange, placeholder = "SEARCH TEAMS, LEAGUES, OR AFCON..." }) => {
  return (
    <div className="relative max-w-3xl px-4 mx-auto mb-12 group">
      {/* Search Icon */}
      <Search 
        className="absolute z-10 transition-colors duration-300 -translate-y-1/2 left-10 top-1/2 text-white/20 group-focus-within:text-red-600" 
        size={20} 
      />
      
      <input 
        type="text" 
        placeholder={placeholder} 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full py-6 pl-20 text-sm font-bold tracking-widest text-white transition-all border rounded-full shadow-2xl outline-none bg-zinc-900/50 border-white/5 pr-14 focus:border-red-600/40 focus:bg-zinc-900 placeholder:text-zinc-600"
      />

      {/* Clear Button or Keyboard Shortcut Hint */}
      <div className="absolute flex items-center gap-2 -translate-y-1/2 right-8 top-1/2">
        {value ? (
          <button
            onClick={() => onChange('')}
            className="p-2 text-red-600 transition-all duration-300 rounded-full bg-red-600/10 hover:bg-red-600 hover:text-white"
          >
            <X size={16} strokeWidth={3} />
          </button>
        ) : (
          <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] text-white/20 font-black">
            <Command size={10} />
            <span>K</span>
          </div>
        )}
      </div>

      {/* Subtle Glow & Status Line */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-0 group-focus-within:opacity-100 transition-all duration-500 blur-[1px]" />
      
      {value && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black text-red-600 uppercase tracking-widest animate-pulse">
          Filtering Live Database...
        </div>
      )}
    </div>
  );
};

export default SearchBar;