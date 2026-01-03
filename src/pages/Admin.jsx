import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase"; 
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { Lock, Trash2, Database, Play, Pause, Square, CheckCircle, Clock, Plus, Minus, Users, BellRing, LogOut } from "lucide-react";
import OneSignal from 'react-onesignal';

function Admin() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [status, setStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveMatches, setLiveMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [subscriberCount, setSubscriberCount] = useState(0);

  const ADMIN_PASSWORD = "vortex_admin_2026";

  // Initialize OneSignal Subscriber tracking
  useEffect(() => {
    if (isAuthenticated) {
      OneSignal.init({
        appId: "83500a13-673b-486c-8d52-41e1b16d01a5",
        allowLocalhostAsSecureOrigin: true,
      }).then(() => {
        // Here you would normally fetch real-time stats from OneSignal API
        // For now, we'll simulate a growing number based on sessions
        setSubscriberCount(Math.floor(Math.random() * 50) + 12); 
      });
    }
  }, [isAuthenticated]);

  // Real-time listener for Matches
  useEffect(() => {
    if (!isAuthenticated) return;
    const unsub = onSnapshot(collection(db, "fixtures"), (snap) => {
      const matches = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setLiveMatches(matches);
    });
    return () => unsub();
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPassword("");
    } else {
      setStatus("❌ ACCESS DENIED");
      setTimeout(() => setStatus(""), 3000);
    }
  };

  const updateScore = async (match, hDiff, aDiff) => {
    try {
      const matchRef = doc(db, "fixtures", match.id);
      const newHome = Math.max(0, (match.homeScore || 0) + hDiff);
      const newAway = Math.max(0, (match.awayScore || 0) + aDiff);
      
      await updateDoc(matchRef, {
        homeScore: newHome,
        awayScore: newAway,
        lastUpdate: serverTimestamp()
      });
      setStatus(`⚽ ${match.home} ${newHome}-${newAway} ${match.away}`);
    } catch (err) {
      setStatus("❌ SCORE UPDATE FAILED");
    }
    setTimeout(() => setStatus(""), 3000);
  };

  const updateMatchStatus = async (statusLabel, baseMin) => {
    if (!selectedMatchId) {
      setStatus("⚠️ SELECT A MATCH FIRST");
      return;
    }
    setIsProcessing(true);
    try {
      const matchRef = doc(db, "fixtures", selectedMatchId);
      await updateDoc(matchRef, {
        status: statusLabel,
        baseMinute: baseMin,
        lastUpdate: serverTimestamp()
      });
      setStatus(`✅ STATUS: ${statusLabel}`);
    } catch (error) {
      setStatus("❌ UPDATE FAILED");
    }
    setIsProcessing(false);
    setTimeout(() => setStatus(""), 5000);
  };

  const handleUpload = async () => {
    if (!jsonInput.trim()) return;
    try {
      setIsProcessing(true);
      const data = JSON.parse(jsonInput);
      const matches = Array.isArray(data) ? data : [data];
      for (const match of matches) {
        const id = match.id || `${match.home}-${match.away}`.toLowerCase().replace(/\s+/g, '-');
        await setDoc(doc(db, "fixtures", id), { 
          ...match, 
          homeScore: match.homeScore || 0,
          awayScore: match.awayScore || 0,
          id, 
          lastUpdate: serverTimestamp() 
        });
      }
      setStatus(`🚀 ${matches.length} MATCHES DEPLOYED`);
      setJsonInput("");
    } catch (error) {
      setStatus("❌ INVALID JSON");
    }
    setIsProcessing(false);
  };

  const handleWipe = async () => {
    if (!window.confirm("DELETE ALL MATCHES?")) return;
    setIsProcessing(true);
    const snap = await getDocs(collection(db, "fixtures"));
    await Promise.all(snap.docs.map(d => deleteDoc(doc(db, "fixtures", d.id))));
    setIsProcessing(false);
    setStatus("🗑️ DATABASE WIPED");
  };

  if (!isAuthenticated) return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-[#0a0a0b]">
      <form onSubmit={handleLogin} className="bg-white/5 p-10 rounded-[3rem] border border-white/10 w-full max-w-sm text-center backdrop-blur-xl">
        <Lock className="mx-auto mb-6 text-red-600" size={40} />
        <h2 className="mb-6 text-xl italic font-black tracking-tighter text-white uppercase">Vortex Terminal</h2>
        <input 
            type="password" 
            placeholder="ENTER ADMIN KEY" 
            className="w-full p-5 mb-4 font-mono text-center text-white transition-all bg-black border outline-none border-white/10 rounded-2xl focus:border-red-600" 
            onChange={(e) => setPassword(e.target.value)} 
            value={password} 
        />
        <button type="submit" className="w-full py-5 font-black text-white uppercase transition-colors bg-red-600 shadow-lg rounded-2xl hover:bg-red-700 shadow-red-600/20">Authorize</button>
        {status && <p className="mt-4 text-xs font-bold text-red-500 animate-pulse">{status}</p>}
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#070708] text-white p-4 md:p-10 font-sans selection:bg-red-600 selection:text-white">
      <div className="max-w-6xl mx-auto">
        
        {/* STATS HEADER */}
        <div className="grid grid-cols-1 gap-4 mb-10 md:grid-cols-3">
            <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] flex items-center gap-4">
                <div className="p-3 text-red-500 bg-red-600/20 rounded-2xl"><Users size={24}/></div>
                <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Live Visitors</p>
                    <p className="text-2xl font-black">{subscriberCount}</p>
                </div>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] flex items-center gap-4">
                <div className="p-3 text-blue-500 bg-blue-600/20 rounded-2xl"><BellRing size={24}/></div>
                <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Push Subscribers</p>
                    <p className="text-2xl font-black">Active</p>
                </div>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 text-green-500 bg-green-600/20 rounded-2xl"><Clock size={24}/></div>
                    <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Server Status</p>
                        <p className="text-xs font-black text-green-500 uppercase">Node.js Online</p>
                    </div>
                </div>
                <button onClick={() => setIsAuthenticated(false)} className="p-3 text-gray-400 transition-colors bg-white/5 hover:bg-red-600/20 rounded-2xl hover:text-red-500">
                    <LogOut size={20}/>
                </button>
            </div>
        </div>

        <header className="flex items-center justify-between mb-10">
          <h1 className="text-3xl italic font-black tracking-tighter uppercase">Vortex <span className="text-red-600">Command</span></h1>
          <button onClick={handleWipe} className="bg-red-600/10 text-red-500 border border-red-600/20 px-6 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all">Wipe All Fixtures</button>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* LEFT: DATA ENTRY */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Batch Upload (JSON)</p>
                <Database size={14} className="text-gray-600"/>
            </div>
            <textarea 
                className="w-full h-80 bg-white/5 border border-white/10 rounded-[2.5rem] p-6 font-mono text-xs text-blue-400 outline-none focus:border-red-600 transition-all resize-none shadow-inner" 
                value={jsonInput} 
                onChange={(e) => setJsonInput(e.target.value)} 
                placeholder='[{ "home": "Arsenal", "away": "Chelsea", "league": "Premier League", "time": "20:00" }]' 
            />
            <button onClick={handleUpload} className="w-full py-5 font-black text-black uppercase transition-all bg-white rounded-2xl hover:bg-red-600 hover:text-white shadow-xl shadow-white/5 active:scale-[0.98]">Deploy Matches To Live</button>
          </section>

          {/* RIGHT: LIVE CONTROL */}
          <section className="space-y-6">
            <div className="bg-red-600/5 border border-red-600/20 rounded-[3rem] p-8 backdrop-blur-sm">
              <div className="mb-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-600 rounded-full animate-ping"/> Live Controller
                </p>
                <select className="w-full p-5 text-xs font-bold transition-all bg-black border outline-none appearance-none cursor-pointer border-white/10 rounded-2xl focus:border-red-600" value={selectedMatchId} onChange={(e) => setSelectedMatchId(e.target.value)}>
                    <option value="">-- SELECT ACTIVE MATCH --</option>
                    {liveMatches.map(m => <option key={m.id} value={m.id}>{m.home} vs {m.away} ({m.status})</option>)}
                </select>
              </div>

              {/* Status Toggles */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                <StatusBtn label="Kickoff" icon={<Play size={12}/>} color="green" onClick={() => updateMatchStatus('1H', 0)} active={!selectedMatchId}/>
                <StatusBtn label="Halftime" icon={<Pause size={12}/>} color="yellow" onClick={() => updateMatchStatus('HT', 45)} active={!selectedMatchId}/>
                <StatusBtn label="2nd Half" icon={<Play size={12}/>} color="green" onClick={() => updateMatchStatus('2H', 45)} active={!selectedMatchId}/>
                <StatusBtn label="Full Time" icon={<Square size={12}/>} color="gray" onClick={() => updateMatchStatus('FT', 90)} active={!selectedMatchId}/>
              </div>

              {/* Score Control */}
              {selectedMatchId && (
                <div className="pt-8 border-t border-white/10 animate-in fade-in slide-in-from-top-4">
                  <div className="flex items-center justify-around p-6 bg-black/60 rounded-[2rem] border border-white/5">
                    <ScoreControl label="HOME" match={liveMatches.find(m => m.id === selectedMatchId)} onUpdate={(match, diff) => updateScore(match, diff, 0)} side="home" />
                    <div className="h-16 w-[1px] bg-white/10" />
                    <ScoreControl label="AWAY" match={liveMatches.find(m => m.id === selectedMatchId)} onUpdate={(match, diff) => updateScore(match, 0, diff)} side="away" />
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* NOTIFICATION TOAST */}
        {status && (
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white text-black px-10 py-5 rounded-full font-black text-[11px] uppercase z-50 shadow-2xl flex items-center gap-3 animate-bounce">
                <CheckCircle size={16} className="text-green-600"/>
                {status}
            </div>
        )}
      </div>
    </div>
  );
}

// Sub-components for cleaner code
const StatusBtn = ({ label, icon, color, onClick, active }) => {
    const colors = {
        green: "bg-green-600/10 border-green-600/20 text-green-500 hover:bg-green-600",
        yellow: "bg-yellow-600/10 border-yellow-600/20 text-yellow-500 hover:bg-yellow-600",
        gray: "bg-white/5 border-white/10 text-gray-400 hover:bg-white/20"
    };
    return (
        <button 
            disabled={active} 
            onClick={onClick} 
            className={`${colors[color]} border p-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-20 hover:text-white`}
        >
            {icon} {label}
        </button>
    );
};

const ScoreControl = ({ label, match, onUpdate, side }) => (
  <div className="text-center">
    <p className="text-[10px] text-gray-500 font-black mb-4 uppercase tracking-[0.2em]">{label}</p>
    <div className="flex items-center gap-5">
      <button onClick={() => onUpdate(match, -1)} className="p-3 transition-all rounded-xl bg-white/5 hover:bg-red-600 active:scale-90"><Minus size={18}/></button>
      <span className="w-12 font-mono text-4xl font-black">{side === 'home' ? match.homeScore : match.awayScore}</span>
      <button onClick={() => onUpdate(match, 1)} className="p-3 transition-all rounded-xl bg-white/5 hover:bg-green-600 active:scale-90"><Plus size={18}/></button>
    </div>
  </div>
);

export default Admin;