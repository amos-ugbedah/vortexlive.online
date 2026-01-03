import React from 'react';
import { RefreshCw, SearchX } from 'lucide-react';

const EmptyState = ({ searchTerm, onClearSearch }) => {
  const isSearching = searchTerm && searchTerm.trim() !== "";

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-zinc-900/20 rounded-[4rem] border-2 border-dashed border-white/5 mt-4 relative overflow-hidden">
      {/* Visual Icon - Using emoji instead of PalmTree */}
      <div className="flex items-center justify-center w-24 h-24 mb-8 rounded-full bg-red-600/10 animate-bounce">
        {isSearching ? (
          <SearchX className="text-red-600" size={48} />
        ) : (
          <span className="text-5xl" role="img" aria-label="palm tree">🌴</span>
        )}
      </div>

      {/* Main Text */}
      <h2 className="mb-4 text-3xl italic font-black tracking-tighter uppercase">
        {isSearching ? 'No Targets Found' : 'Stadium Lights are OFF'}
      </h2>

      {/* Subtext */}
      <p className="max-w-md mb-10 text-xs font-bold leading-loose tracking-widest uppercase text-white/30">
        {isSearching 
          ? `We scoured the pitch but couldn't find "${searchTerm}". Check your spelling!` 
          : 'All football players are on vacation. Probably somewhere near the sea. Check back later for live matches!'}
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-4">
        {isSearching ? (
          <button 
            onClick={onClearSearch}
            className="px-10 py-4 text-[10px] font-black text-white uppercase transition-all bg-red-600 rounded-full hover:bg-red-700 shadow-lg shadow-red-600/20 active:scale-95"
          >
            Clear Search
          </button>
        ) : (
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-10 py-4 text-[10px] font-black text-black uppercase transition-all bg-white rounded-full hover:bg-red-600 hover:text-white shadow-lg active:scale-95"
          >
            <RefreshCw size={14} /> Refresh Page
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;