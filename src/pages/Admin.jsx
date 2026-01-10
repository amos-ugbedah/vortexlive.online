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
  Trophy, Clock, BarChart2, Monitor, Trash2, UserX, ShieldAlert, Zap, Key, Terminal
} from "lucide-react";
import AdminLogin from "./AdminLogin";

// List of your 13 Keys for monitoring
const API_KEYS_LIST = [
    "0131b99f8e87a724c92f8b455cc6781d", "0e3ac987340e582eb85a41758dc7c33a5dfcec72f940e836d960fe68a28fe904", 
    "3671908177msh066f984698c094ap1c8360jsndb2bc44e1c65", "700ca9a1ed18bf1b842e0210e9ae73ce",
    "2f977aee380c7590bcf18759dfc18aacd0827b65c4d5df6092ecad5f29aebc33", "2f977aee380c7590bcf18759dfc18aacd0827b65c4d5df6092ecad5f29aebc33",
    "08a2395d18de848b4d3542d71234a61212aa43a3027ba11d7d3de3682c6159aa", "08a2395d18de848b4d3542d71234a61212aa43a3027ba11d7d3de3682c6159aa",
    "13026e250b0dc9c788acceb0c5ace63c", "36d031751e132991fd998a3f0f5088b7d1f2446ca9b44351b2a90fde76581478"
];

function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [matches, setMatches] = useState([]);
  const [tickerMessages, setTickerMessages] = useState([]);
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [tickerInput, setTickerInput] = useState("");
  const [botEnabled, setBotEnabled] = useState(false); 
  const [botLogs, setBotLogs] = useState("Waiting for signal...");
  const [isSyncing, setIsSyncing] = useState(false);

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

    // 1. Listen to Live Bot Status & Logs
    const unsubBot = onSnapshot(doc(db, "settings", "bot"), (doc) => {
      if (doc.exists()) {
          setBotEnabled(doc.data().isActive);
          setBotLogs(doc.data().status || "System Idle");
      }
    });

    // 2. Listen to Matches
    const unsubMatches = onSnapshot(query(collection(db, "matches"), orderBy("lastUpdated", "desc")), (snap) => {
      setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 3. Listen to Ticker
    const unsubTicker = onSnapshot(query(collection(db, "ticker"), orderBy("timestamp", "desc"), limit(50)), (snap) => {
      setTickerMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubBot(); unsubMatches(); unsubTicker(); };
  }, [isAuthenticated]);

  // --- SYSTEM IGNITION (ONE TIME SETUP) ---
  const runSystemIgnition = async () => {
    try {
      await setDoc(doc(db, "settings", "bot"), {
        isActive: true,
        lastUpdate: serverTimestamp(),
        version: "Vortex-Ultra-1.0",
        status: "System Online & Automation Active"
      });
      await addDoc(collection(db, "ticker"), {
        text: "Vortex Ultra Systems Online. Automation Active.",
        user: "SYSTEM",
        timestamp: serverTimestamp()
      });
      alert("SUCCESS: Settings collection and Bot document created!");
    } catch (e) {
      alert("Setup Failed: " + e.message);
    }
  };

  // --- BOT POWER TOGGLE ---
  const handleBotToggle = async () => {
    const newState = !botEnabled;
    try {
      await setDoc(doc(db, "settings", "bot"), { isActive: newState }, { merge: true });
    } catch (e) {
      alert("Error toggling bot power.");
    }
  };

  // --- GLOBAL SYNC TRIGGER ---
  const handleSyncToday = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('https://emergencysync-z7yzwikqsa-uc.a.run.app'); 
      const text = await response.text();
      alert(`Vortex Engine: ${text}`);
    } catch (e) {
      alert("Sync Failed. Check if API Keys are exhausted.");
    } finally {
      setIsSyncing(false);
    }
  };

  // --- BROADCAST ---
  const handleBroadcast = async () => {
    if(!tickerInput) return;
    try {
        await addDoc(collection(db, 'ticker'), { 
            text: tickerInput, 
            user: 'ADMIN', 
            timestamp: serverTimestamp() 
        });
        await fetch('https://broadcasttoticker-z7yzwikqsa-uc.a.run.app', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ message: tickerInput })
        });
        setTickerInput("");
    } catch (e) { 
      alert("Broadcast recorded locally, but Telegram sync failed.");
    }
  };

  const handleUpdateStream = async (matchId, serverNum, rawUrl) => {
    if (!rawUrl) return;
    const encodedUrl = btoa(rawUrl);
    await updateDoc(doc(db, "matches", matchId), { [`streamUrl${serverNum}`]: encodedUrl });
  };

  const updateMatchField = async (matchId, field, value) => {
    await updateDoc(doc(db, "matches", matchId), { [field]: value });
  };

  const handleManualAdd = async (e) => {
    e.preventDefault();
    const matchId = `manual_${Date.now()}`;
    await setDoc(doc(db, "matches", matchId), {
        id: matchId,
        home: { name: newMatch.homeName, logo: newMatch.homeLogo, score: 0 },
        away: { name: newMatch.awayName, logo: newMatch.awayLogo, score: 0 },
        league: newMatch.league,
        status: "NS",
        kickoff: newMatch.kickoff,
        streamUrl1: btoa(newMatch.stream1),
        lastUpdated: serverTimestamp()
    });
    setShowAddMatch(false);
  };

  if (!isAuthenticated) return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;

  return (
    <div className="min-h-screen p-4 md:p-10 text-white bg-[#020202] font-sans">
      
      <header className="flex flex-col justify-between gap-6 pb-10 mb-12 border-b md:flex-row md:items-center border-white/5">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-red-600 shadow-[0_0_30px_rgba(220,38,38,0.2)] rounded-[2rem]">
            <Cpu size={32} className="text-white animate-pulse" />
          </div>
          <div>
            <h2 className="text-4xl italic font-black leading-none tracking-tighter text-white uppercase">Vortex <span className="font-black text-red-600">ULTRA</span></h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] mt-2">Moderation Hub</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={handleBotToggle}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-[10px] uppercase transition-all border ${botEnabled ? 'bg-green-600/10 border-green-500 text-green-500' : 'bg-zinc-900 border-white/5 text-zinc-500'}`}
          >
            <Power size={14} /> Auto-Update: {botEnabled ? 'ENABLED' : 'DISABLED'}
          </button>

          <button 
            onClick={handleSyncToday} 
            disabled={isSyncing}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[11px] uppercase transition-all ${isSyncing ? 'bg-zinc-800' : 'bg-red-600 hover:scale-105 shadow-lg shadow-red-600/20'}`}
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''}/> {isSyncing ? 'Syncing...' : 'Global Sync'}
          </button>
          
          <button onClick={() => setShowAddMatch(true)} className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[11px] uppercase bg-white text-black hover:scale-105 transition-all">
            <Plus size={16}/> Inject Match
          </button>

          <button onClick={() => { sessionStorage.removeItem('vx_admin_auth'); window.location.reload(); }} className="p-4 border bg-zinc-900 border-white/10 rounded-2xl text-zinc-500 hover:text-red-600 transition-colors">
            <LogOut size={22} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* API KEYS MONITORING */}
          <div className="p-6 bg-zinc-900/20 border border-white/5 rounded-[2rem]">
              <div className="flex items-center gap-3 mb-4">
                  <Key size={18} className="text-red-600" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Key Rotation Pool</h3>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {API_KEYS_LIST.map((_, idx) => (
                      <div key={idx} className={`h-1.5 rounded-full ${botEnabled ? 'bg-red-600 animate-pulse' : 'bg-zinc-800'}`} />
                  ))}
              </div>
              <p className="mt-3 text-[9px] text-zinc-600 font-bold uppercase italic">System utilizing 13-Key cycle to bypass rate limits.</p>
          </div>

          {/* REAL TIME BOT LOGS */}
          <div className="p-6 bg-black border border-white/5 rounded-[2rem] flex items-center gap-4">
              <div className="p-3 bg-zinc-900 rounded-xl text-red-600">
                  <Terminal size={20} />
              </div>
              <div className="flex-1">
                  <h4 className="text-[10px] font-black uppercase text-zinc-500 mb-1">Live Engine Status</h4>
                  <p className="text-xs font-mono text-green-500 uppercase tracking-tighter">{botLogs}</p>
              </div>
              <button onClick={runSystemIgnition} className="text-[9px] bg-red-600/10 border border-red-600/20 text-red-600 px-3 py-1 rounded-md font-black">RE-IGNITE</button>
          </div>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          {matches.length === 0 && (
             <div className="p-20 text-center border rounded-3xl border-white/5 bg-zinc-900/10">
                <Activity size={48} className="mx-auto mb-4 text-zinc-800" />
                <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">No Live Signals Detected</p>
             </div>
          )}
          {matches.map((match) => (
            <div key={match.id} className="p-8 border bg-zinc-900/10 border-white/5 rounded-[3rem] hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <img src={match.home?.logo} className="object-contain w-10 h-10" />
                  <span className="text-xl italic font-black tracking-tighter uppercase">{match.home?.name} <span className="text-red-600">v</span> {match.away?.name}</span>
                  <img src={match.away?.logo} className="object-contain w-10 h-10" />
                </div>
                <div className="flex gap-4">
                   <button onClick={() => updateMatchField(match.id, "isElite", !match.isElite)} className={`p-2 rounded-lg transition-colors ${match.isElite ? 'text-red-600' : 'text-zinc-700'}`} title="Mark as Elite">
                      <Zap size={20} fill={match.isElite ? "currentColor" : "none"}/>
                   </button>
                   <button onClick={() => deleteDoc(doc(db, "matches", match.id))} className="text-zinc-700 hover:text-red-600 transition-colors"><Trash2 size={20}/></button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="pr-8 space-y-4 border-r border-white/5">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Trophy size={12}/> Live Stats</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[8px] uppercase text-zinc-600 font-bold mb-1 block ml-2">Home Score</label>
                      <input type="number" defaultValue={match.home?.score} className="score-input" onBlur={(e) => updateMatchField(match.id, "home", {...match.home, score: parseInt(e.target.value)})} />
                    </div>
                    <div>
                      <label className="text-[8px] uppercase text-zinc-600 font-bold mb-1 block ml-2">Away Score</label>
                      <input type="number" defaultValue={match.away?.score} className="score-input" onBlur={(e) => updateMatchField(match.id, "away", {...match.away, score: parseInt(e.target.value)})} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[8px] uppercase text-zinc-600 font-bold mb-1 block ml-2">Match Status</label>
                      <input type="text" defaultValue={match.status} className="score-input" onBlur={(e) => updateMatchField(match.id, "status", e.target.value)} placeholder="LIVE, NS, FT..." />
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2"><Monitor size={12}/> Stream Override (Raw URLs)</p>
                  {[1, 2, 3].map(n => (
                    <input key={n} placeholder={`Server 0${n} Raw URL...`} className="w-full bg-black/40 border border-white/5 p-3 rounded-xl text-[10px] font-bold outline-none focus:border-red-600 transition-colors" onBlur={(e) => handleUpdateStream(match.id, n, e.target.value)} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6 xl:col-span-4">
          <div className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] flex flex-col h-[700px] sticky top-10">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-[11px] font-black uppercase text-red-600 flex items-center gap-2"><ShieldAlert size={16}/> Global Ticker</h3>
            </div>
            <div className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar">
              {tickerMessages.map((msg) => (
                <div key={msg.id} className="p-4 border bg-black/40 border-white/5 rounded-2xl group">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-black text-red-500">{msg.user}</span>
                    <button onClick={() => deleteDoc(doc(db, "ticker", msg.id))} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-600"><Trash2 size={12}/></button>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">{msg.text}</p>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-white/5">
              <div className="flex gap-2">
                <input 
                  value={tickerInput} 
                  onChange={e => setTickerInput(e.target.value)} 
                  className="flex-1 bg-zinc-900 border border-white/10 p-4 rounded-xl text-[11px] font-bold outline-none focus:border-red-600/50 transition-all" 
                  placeholder="Broadcast to App & Telegram..." 
                />
                <button 
                  onClick={handleBroadcast}
                  className="px-6 bg-white text-black rounded-xl hover:bg-red-600 hover:text-white transition-all active:scale-95"
                >
                  <Send size={18}/>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddMatch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <div className="bg-[#0c0c0c] border border-white/10 p-10 rounded-[3rem] w-full max-w-2xl relative">
            <button onClick={() => setShowAddMatch(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white"><X size={28}/></button>
            <h3 className="mb-8 text-3xl italic font-black tracking-tighter text-white uppercase">Inject Signal</h3>
            <form onSubmit={handleManualAdd} className="grid grid-cols-2 gap-6">
              <input placeholder="Home Name" className="admin-input-v2" required onChange={e => setNewMatch({...newMatch, homeName: e.target.value})} />
              <input placeholder="Away Name" className="admin-input-v2" required onChange={e => setNewMatch({...newMatch, awayName: e.target.value})} />
              <input placeholder="Home Logo URL" className="admin-input-v2" onChange={e => setNewMatch({...newMatch, homeLogo: e.target.value})} />
              <input placeholder="Away Logo URL" className="admin-input-v2" onChange={e => setNewMatch({...newMatch, awayLogo: e.target.value})} />
              <input placeholder="Kickoff (e.g. 20:00)" className="admin-input-v2" required onChange={e => setNewMatch({...newMatch, kickoff: e.target.value})} />
              <input placeholder="League Name" className="admin-input-v2" required onChange={e => setNewMatch({...newMatch, league: e.target.value})} />
              <input placeholder="Stream URL (Server 1)" className="col-span-2 admin-input-v2" onChange={e => setNewMatch({...newMatch, stream1: e.target.value})} />
              <button type="submit" className="col-span-2 py-6 bg-red-600 rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-red-700 transition-all">Broadcast Live</button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .score-input { width: 100%; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.05); padding: 12px; border-radius: 12px; font-weight: 900; text-align: center; font-size: 14px; outline: none; transition: all 0.2s; }
        .score-input:focus { border-color: #dc2626; background: rgba(220, 38, 38, 0.05); }
        .admin-input-v2 { width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 18px 24px; border-radius: 1.5rem; font-weight: bold; font-size: 13px; outline: none; color: white; transition: all 0.2s; }
        .admin-input-v2:focus { border-color: #dc2626; background: rgba(255,255,255,0.05); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
      `}</style>
    </div>
  );
}

export default Admin;