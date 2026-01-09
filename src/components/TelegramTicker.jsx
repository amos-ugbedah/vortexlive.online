import React, { useState, useEffect } from 'react';
import { Send } from 'lucide-react';

const TelegramTicker = ({ messages = [], loading = false }) => {
  const [index, setIndex] = useState(0);

  // Fallback messages if Firebase is empty
  const defaultMessages = [
    { user: "Vortex", text: "Welcome to the Pro Lobby. Stay tuned for live updates." },
    { user: "System", text: "Join our Telegram for the fastest goal alerts!" }
  ];

  const activeMessages = messages.length > 0 ? messages : defaultMessages;

  useEffect(() => {
    if (activeMessages.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % activeMessages.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [activeMessages]);

  if (loading) return (
    <div className="w-full h-12 border bg-white/5 animate-pulse rounded-2xl border-white/5" />
  );

  return (
    <div className="relative w-full overflow-hidden bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 pr-4 border-r shrink-0 border-white/10">
          <div className="relative flex w-2 h-2">
            <span className="absolute inline-flex w-full h-full bg-red-400 rounded-full opacity-75 animate-ping"></span>
            <span className="relative inline-flex w-2 h-2 bg-red-600 rounded-full"></span>
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-red-600 italic">Feed</span>
        </div>

        <div className="flex items-center flex-1 min-w-0 gap-3">
          <span className="text-[8px] font-black text-white/30 uppercase whitespace-nowrap">
            @{activeMessages[index]?.user || 'Admin'}:
          </span>
          <p key={index} className="text-[10px] font-bold text-white/80 uppercase tracking-wide truncate animate-in fade-in slide-in-from-bottom-2 duration-500">
            {activeMessages[index]?.text}
          </p>
        </div>

        <a href="https://t.me/your_channel" target="_blank" rel="noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 transition-all rounded-full bg-white/5 border border-white/5 hover:bg-red-600 group shrink-0">
          <Send size={10} className="text-white/40 group-hover:text-white" />
        </a>
      </div>
    </div>
  );
};

export default TelegramTicker;