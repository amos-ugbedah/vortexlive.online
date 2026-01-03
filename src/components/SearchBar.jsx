import React from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({ value, onChange, placeholder = "SEARCH TEAMS, LEAGUES..." }) => {
  return (
    <div className="relative max-w-3xl mx-auto mb-12 group">
      {/* Search Icon */}
      <Search 
        className="absolute transition-colors duration-300 -translate-y-1/2 left-6 top-1/2 text-white/20 group-focus-within:text-red-600" 
        size={20} 
      />
      
      <input 
        type="text" 
        placeholder={placeholder} 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full py-5 pl-16 text-sm font-bold tracking-widest text-white transition-all border rounded-full outline-none bg-zinc-900/50 border-white/5 pr-14 focus:border-red-600/40 focus:bg-zinc-900 placeholder:text-white/10"
      />

      {/* Quick Clear Button */}
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-5 top-1/2 -translate-y-1/2 p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all"
        >
          <X size={14} strokeWidth={3} />
        </button>
      )}

      {/* Subtle Bottom Glow Effect */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-red-600/20 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
    </div>
  );
};

export default SearchBar;