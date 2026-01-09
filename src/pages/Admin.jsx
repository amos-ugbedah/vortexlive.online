/* eslint-disable */
import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase"; 
import { 
  collection, doc, updateDoc, onSnapshot, setDoc, 
  deleteDoc, query, orderBy, addDoc, serverTimestamp, limit 
} from "firebase/firestore";
import { 
  ShieldCheck, Tv, Globe, RefreshCw, 
  LogOut, Send, MessageSquare, 
  Bot, Power, Activity, Cpu, Plus, X, 
  Trophy, Clock, BarChart2, Monitor, Trash2, UserX, ShieldAlert
} from "lucide-react";
import AdminLogin from "./AdminLogin";

function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [matches, setMatches] = useState([]);
  const [tickerMessages, setTickerMessages] = useState([]);
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [tickerInput, setTickerInput] = useState("");
  const [botEnabled, setBotEnabled] = useState(false);

  // Manual Match Form State
  const [newMatch, setNewMatch] = useState({
    homeName: "", homeLogo: "", awayName: "", awayLogo: "",
    kickoff: "", league: "", stream1: ""
  });

  useEffect(() => {
    const auth = sessionStorage.getItem('vx_admin_auth');
    if (auth === btoa('authenticated_2026')) setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Stream 1: Matches
    const unsubMatches = onSnapshot(query(collection(db, "matches"), orderBy("timestamp", "desc")), (snap) => {
      setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Stream 2: Ticker Messages (Moderation)
    const unsubTicker = onSnapshot(query(collection(db, "ticker"), orderBy("timestamp", "desc"), limit(50)), (snap) => {
      setTickerMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Stream 3: Bot Settings
    const unsubBot = onSnapshot(doc(db, "settings", "bot_control"), (doc) => {
      if (doc.exists()) setBotEnabled(doc.data().enabled);
    });

    return () => { unsubMatches(); unsubTicker(); unsubBot(); };
  }, [isAuthenticated]);

  const handleUpdateStream = async (matchId, serverNum, rawUrl) => {
    if (!rawUrl) return;
    const encodedUrl = btoa(rawUrl);
    await updateDoc(doc(db, "matches", matchId), { [`streamUrl${serverNum}`]: encodedUrl });
  };

  const updateMatchField = async (matchId, field, value) => {
    const matchRef = doc(db, "matches", matchId);
    await updateDoc(matchRef, { [field]: value });
  };

  // --- MODERATION LOGIC ---
  const deleteMessage = async (msgId) => {
    await deleteDoc(doc(db, "ticker", msgId));
  };

  const banUser = async (user) => {
    if (window.confirm(`Ban ${user} and wipe their messages?`)) {
      await setDoc(doc(db, "blacklist", user), { bannedAt: serverTimestamp(), reason: "Moderator Action" });
      // Clean up their messages
      tickerMessages.filter(m => m.user === user).forEach(m => deleteMessage(m.id));
    }
  };

  if (!isAuthenticated) return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;

  return (
    <div className="min-h-screen p-4 md:p-10 text-white bg-[#020202] font-sans">
      
      {/* --- PRO HEADER --- */}
      <header className="flex flex-col justify-between gap-6 pb-10 mb-12 border-b md:flex-row md:items-center border-white/5">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-red-600 shadow-[0_0_30px_rgba(220,38,38,0.2)] rounded-[2rem]">
            <Cpu size={32} className="text-white animate-pulse" />
          </div>
          <div>
            <h2 className="text-4xl italic font-black leading-none tracking-tighter text-white uppercase">Vortex <span className="font-black text-red-600">ULTRA</span></h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] mt-2">Central Moderation & Signal Intelligence</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setShowAddMatch(true)} className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[11px] uppercase bg-white text-black hover:scale-105 transition-all shadow-xl">
            <Plus size={16}/> Inject Match
          </button>
          <button onClick={() => { sessionStorage.removeItem('vx_admin_auth'); window.location.reload(); }} className="p-4 border bg-zinc-900 border-white/10 rounded-2xl text-zinc-500 hover:text-red-600">
            <LogOut size={22} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        
        {/* LEFT COLUMN: MATCHES & BOT (8 COLS) */}
        <div className="space-y-8 xl:col-span-8">
          
          {/* BOT ENGINE CARD */}
          <div className="p-8 border border-white/5 bg-zinc-900/20 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-between group">
             <div>
                <h3 className="flex items-center gap-3 text-[11px] font-black uppercase text-emerald-500 mb-2"><Bot size={18}/> Automation Engine</h3>
                <p className="text-xl italic font-bold tracking-tighter uppercase">Scraper Intelligence: {botEnabled ? 'Online' : 'Standby'}</p>
             </div>
             <button 
                onClick={() => updateDoc(doc(db, "settings", "bot_control"), { enabled: !botEnabled })} 
                className={`px-10 py-4 rounded-2xl font-black uppercase text-[10px] transition-all ${botEnabled ? 'bg-red-600' : 'bg-emerald-600'}`}
              >
                {botEnabled ? 'Kill Engine' : 'Ignite Engine'}
             </button>
          </div>

          {/* ACTIVE MATCH LIST */}
          <div className="space-y-6">
            {matches.map((match) => (
              <div key={match.id} className="p-8 border bg-zinc-900/10 border-white/5 rounded-[3rem] hover:border-white/10 transition-all">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <img src={match.home?.logo} className="object-contain w-10 h-10" />
                    <span className="text-xl italic font-black tracking-tighter uppercase">{match.home?.name} <span className="text-red-600">v</span> {match.away?.name}</span>
                    <img src={match.away?.logo} className="object-contain w-10 h-10" />
                  </div>
                  <button onClick={() => deleteDoc(doc(db, "matches", match.id))} className="transition-colors text-zinc-700 hover:text-red-600"><Trash2 size={20}/></button>
                </div>

                {/* MATCH CONTROLS */}
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div className="pr-8 space-y-4 border-r border-white/5">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Trophy size={12}/> Live Stats</p>
                    <div className="grid grid-cols-2 gap-4">
                      <input type="number" defaultValue={match.home?.score} className="score-input" onBlur={(e) => updateMatchField(match.id, "home", {...match.home, score: parseInt(e.target.value)})} />
                      <input type="number" defaultValue={match.away?.score} className="score-input" onBlur={(e) => updateMatchField(match.id, "away", {...match.away, score: parseInt(e.target.value)})} />
                      <input type="text" defaultValue={match.minute} className="col-span-2 score-input" onBlur={(e) => updateMatchField(match.id, "minute", e.target.value)} placeholder="Minute..." />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Monitor size={12}/> Signal Overrides</p>
                    {[1, 2, 3].map(n => (
                      <input key={n} placeholder={`Server 0${n} URL...`} className="w-full bg-black/40 border border-white/5 p-3 rounded-xl text-[10px] font-bold" onBlur={(e) => handleUpdateStream(match.id, n, e.target.value)} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: MODERATION HUB (4 COLS) */}
        <div className="space-y-6 xl:col-span-4">
          <div className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col h-[800px]">
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-zinc-900/20">
              <h3 className="flex items-center gap-3 text-[11px] font-black uppercase text-red-600"><ShieldAlert size={18}/> Moderator Hub</h3>
              <span className="text-[9px] font-black bg-red-600/10 text-red-600 px-3 py-1 rounded-full animate-pulse uppercase">Live Feed</span>
            </div>

            {/* MESSAGE LIST */}
            <div className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar">
              {tickerMessages.map((msg) => (
                <div key={msg.id} className="p-4 transition-all border group bg-black/40 border-white/5 rounded-2xl hover:border-red-600/30">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-tighter">{msg.user || 'Guest'}</span>
                    <div className="flex gap-2 transition-opacity opacity-0 group-hover:opacity-100">
                      <button onClick={() => deleteMessage(msg.id)} className="p-1.5 text-zinc-500 hover:text-red-600 transition-colors"><Trash2 size={14}/></button>
                      <button onClick={() => banUser(msg.user)} className="p-1.5 text-zinc-500 hover:text-orange-500 transition-colors"><UserX size={14}/></button>
                    </div>
                  </div>
                  <p className="text-[11px] font-medium leading-relaxed text-zinc-300">{msg.text}</p>
                </div>
              ))}
            </div>

            {/* ADMIN BROADCAST INPUT */}
            <div className="p-6 border-t bg-black/60 border-white/5">
              <div className="flex gap-2">
                <input 
                  value={tickerInput} 
                  onChange={e => setTickerInput(e.target.value)} 
                  className="flex-1 bg-zinc-900 border border-white/10 p-4 rounded-xl text-[11px] font-bold outline-none" 
                  placeholder="Broadcast to all users..." 
                />
                <button 
                  onClick={() => { if(!tickerInput) return; addDoc(collection(db, 'ticker'), { text: tickerInput, user: 'ADMIN', timestamp: serverTimestamp() }); setTickerInput(""); }}
                  className="px-4 text-black transition-all bg-white rounded-xl hover:bg-red-600 hover:text-white"
                >
                  <Send size={16}/>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MATCH INJECTION MODAL (Keep previous logic) */}
      {showAddMatch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <div className="bg-[#0c0c0c] border border-white/10 p-10 rounded-[3rem] w-full max-w-2xl relative">
            <button onClick={() => setShowAddMatch(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white"><X size={28}/></button>
            <h3 className="mb-8 text-3xl italic font-black tracking-tighter text-white uppercase">Inject Signal</h3>
            <form onSubmit={handleManualAdd} className="grid grid-cols-2 gap-6">
              <input placeholder="Home Name" className="admin-input-v2" required onChange={e => setNewMatch({...newMatch, homeName: e.target.value})} />
              <input placeholder="Away Name" className="admin-input-v2" required onChange={e => setNewMatch({...newMatch, awayName: e.target.value})} />
              <input placeholder="Home Logo" className="admin-input-v2" onChange={e => setNewMatch({...newMatch, homeLogo: e.target.value})} />
              <input placeholder="Away Logo" className="admin-input-v2" onChange={e => setNewMatch({...newMatch, awayLogo: e.target.value})} />
              <input placeholder="Kickoff" className="admin-input-v2" required onChange={e => setNewMatch({...newMatch, kickoff: e.target.value})} />
              <input placeholder="League" className="admin-input-v2" required onChange={e => setNewMatch({...newMatch, league: e.target.value})} />
              <input placeholder="Stream URL" className="col-span-2 admin-input-v2" onChange={e => setNewMatch({...newMatch, stream1: e.target.value})} />
              <button type="submit" className="col-span-2 py-6 bg-red-600 rounded-[2rem] font-black uppercase text-xs tracking-widest">Broadcast Live</button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .score-input { width: 100%; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.05); padding: 12px; border-radius: 12px; font-weight: 900; text-align: center; font-size: 14px; outline: none; }
        .score-input:focus { border-color: #dc2626; }
        .admin-input-v2 { width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 18px 24px; border-radius: 1.5rem; font-weight: bold; font-size: 13px; outline: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
      `}</style>
    </div>
  );
}

export default Admin;