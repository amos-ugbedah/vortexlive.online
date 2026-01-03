import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase"; 
import { collection, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { Lock, Plus, Minus, Trash2, Zap, AlertTriangle, ShieldAlert } from "lucide-react";

function Admin() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [status, setStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveMatches, setLiveMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState("");

  const ADMIN_PASSWORD = "vortex_admin_2026";

  useEffect(() => {
    if (!isAuthenticated) return;
    const unsub = onSnapshot(collection(db, "fixtures"), (snap) => {
      setLiveMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) setIsAuthenticated(true);
    else setStatus("❌ DENIED");
  };

  // --- NEW: DEPLOY MATCHES FROM JSON ---
  const handleDeploy = async () => {
    if (!jsonInput.trim()) return setStatus("⚠️ INPUT EMPTY");
    setIsProcessing(true);
    try {
      const data = JSON.parse(jsonInput);
      const matches = Array.isArray(data) ? data : [data];

      for (const m of matches) {
        const id = `${m.home}-${m.away}`.toLowerCase().replace(/\s+/g, '-');
        await setDoc(doc(db, "fixtures", id), {
          ...m,
          homeScore: 0,
          awayScore: 0,
          status: 'NS',
          createdAt: serverTimestamp()
        });
      }
      setStatus("🚀 DEPLOYED SUCCESS");
      setJsonInput("");
    } catch (err) {
      setStatus("❌ INVALID JSON");
    }
    setIsProcessing(false);
  };

  const updateScore = async (match, hDiff, aDiff) => {
    if (isProcessing || !match) return;
    setIsProcessing(true);
    try {
      const matchRef = doc(db, "fixtures", match.id);
      const newHome = Math.max(0, (match.homeScore || 0) + hDiff);
      const newAway = Math.max(0, (match.awayScore || 0) + aDiff);
      await updateDoc(matchRef, { homeScore: newHome, awayScore: newAway, lastUpdate: serverTimestamp() });
      setStatus(hDiff < 0 || aDiff < 0 ? "🖥 VAR ADJUSTMENT" : "⚽ SCORE UPDATED");
    } catch (err) { setStatus("❌ ERROR"); }
    setIsProcessing(false);
    setTimeout(() => setStatus(""), 2000);
  };

  const updateMatchStatus = async (statusLabel, baseMin) => {
    if (!selectedMatchId || isProcessing) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "fixtures", selectedMatchId), { 
        status: statusLabel, 
        baseMinute: baseMin, 
        lastUpdate: serverTimestamp() 
      });
      setStatus(`✅ ${statusLabel}`);
    } catch (error) { setStatus("❌ ERROR"); }
    setIsProcessing(false);
  };

  // --- NEW: EVENT TRIGGERS (FOR BOT PERSONA) ---
  const triggerEvent = async (type) => {
    if (!selectedMatchId) return;
    try {
      await updateDoc(doc(db, "fixtures", selectedMatchId), { 
        lastEvent: type, 
        eventTime: Date.now() 
      });
      setStatus(`🔥 TRIGGERED: ${type}`);
    } catch (err) { setStatus("❌ FAIL"); }
  };

  if (!isAuthenticated) return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-black">
      <form onSubmit={handleLogin} className="w-full max-w-sm p-10 border bg-white/5 rounded-3xl border-white/10">
        <input type="password" placeholder="ADMIN KEY" className="w-full p-4 mb-4 text-white bg-black border outline-none border-white/10 rounded-xl" onChange={(e) => setPassword(e.target.value)} value={password} />
        <button className="w-full py-4 font-bold text-white transition-colors bg-red-600 rounded-xl hover:bg-red-700">AUTHORIZE</button>
      </form>
    </div>
  );

  const selectedMatch = liveMatches.find(m => m.id === selectedMatchId);

  return (
    <div className="min-h-screen bg-[#070708] text-white p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl italic font-black tracking-tighter">VORTEX <span className="text-red-600">HQ</span></h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Live Match & Bot Controller</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 border rounded-full bg-white/5 border-white/10">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
                <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Server: Active</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* LEFT: MATCH SELECTOR & STATUS */}
          <section className="space-y-6 lg:col-span-2">
            <div className="p-8 border bg-white/5 rounded-[2rem] border-white/10">
                <label className="block text-[10px] font-black text-gray-500 uppercase mb-3 ml-2">Active Fixtures</label>
                <select className="w-full p-5 mb-8 text-lg font-bold transition-all bg-black border-2 outline-none border-white/5 focus:border-red-600 rounded-2xl" value={selectedMatchId} onChange={(e) => setSelectedMatchId(e.target.value)}>
                <option value="">SELECT A MATCH TO CONTROL</option>
                {liveMatches.map(m => <option key={m.id} value={m.id}>{m.home} vs {m.away} ({m.status})</option>)}
                </select>

                {selectedMatch ? (
                <div className="space-y-8 duration-500 animate-in fade-in">
                    {/* SCORE CONTROLS */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-6 text-center bg-black border rounded-3xl border-white/5">
                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-4">{selectedMatch.home}</p>
                            <div className="flex items-center justify-center gap-4">
                                <button onClick={() => updateScore(selectedMatch, -1, 0)} className="p-3 text-gray-400 rounded-xl bg-white/5 hover:bg-white/10"><Minus size={20}/></button>
                                <span className="text-5xl font-black min-w-[60px]">{selectedMatch.homeScore}</span>
                                <button onClick={() => updateScore(selectedMatch, 1, 0)} className="p-3 bg-red-600 shadow-lg rounded-xl hover:bg-red-500 shadow-red-600/20"><Plus size={20}/></button>
                            </div>
                        </div>
                        <div className="p-6 text-center bg-black border rounded-3xl border-white/5">
                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-4">{selectedMatch.away}</p>
                            <div className="flex items-center justify-center gap-4">
                                <button onClick={() => updateScore(selectedMatch, 0, -1)} className="p-3 text-gray-400 rounded-xl bg-white/5 hover:bg-white/10"><Minus size={20}/></button>
                                <span className="text-5xl font-black min-w-[60px]">{selectedMatch.awayScore}</span>
                                <button onClick={() => updateScore(selectedMatch, 0, 1)} className="p-3 bg-red-600 shadow-lg rounded-xl hover:bg-red-500 shadow-red-600/20"><Plus size={20}/></button>
                            </div>
                        </div>
                    </div>

                    {/* STATUS BUTTONS */}
                    <div className="grid grid-cols-4 gap-3">
                        {['1H', 'HT', '2H', 'FT'].map((st) => (
                            <button key={st} onClick={() => updateMatchStatus(st, st === '1H' ? 0 : 45)} className={`py-4 rounded-xl font-black text-xs transition-all ${selectedMatch.status === st ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10 text-gray-400'}`}>
                                {st === '1H' ? 'START' : st}
                            </button>
                        ))}
                    </div>

                    {/* BOT EVENT TRIGGERS */}
                    <div className="pt-6 border-t border-white/5">
                        <p className="text-[10px] font-black text-gray-500 uppercase mb-4 ml-1">Bot Event Triggers</p>
                        <div className="grid grid-cols-3 gap-3">
                            <button onClick={() => triggerEvent('RED_CARD')} className="flex items-center justify-center gap-2 p-4 bg-orange-600/10 border border-orange-600/20 rounded-2xl text-orange-500 font-bold text-[10px] hover:bg-orange-600 hover:text-white transition-all">
                                <ShieldAlert size={14}/> RED CARD
                            </button>
                            <button onClick={() => triggerEvent('PENALTY')} className="flex items-center justify-center gap-2 p-4 bg-yellow-600/10 border border-yellow-600/20 rounded-2xl text-yellow-500 font-bold text-[10px] hover:bg-yellow-600 hover:text-white transition-all">
                                <Zap size={14}/> PENALTY
                            </button>
                            <button onClick={() => triggerEvent('VAR')} className="flex items-center justify-center gap-2 p-4 bg-blue-600/10 border border-blue-600/20 rounded-2xl text-blue-500 font-bold text-[10px] hover:bg-blue-600 hover:text-white transition-all">
                                <AlertTriangle size={14}/> VAR CHECK
                            </button>
                        </div>
                    </div>
                </div>
                ) : (
                    <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                        <Zap size={40} className="mx-auto mb-4 text-white/10" />
                        <p className="text-xs font-bold text-white/20 uppercase tracking-[0.2em]">Select a match to take command</p>
                    </div>
                )}
            </div>
          </section>

          {/* RIGHT: DEPLOYMENT & UTILS */}
          <section className="space-y-6">
            <div className="p-6 border bg-white/5 rounded-[2rem] border-white/10">
                <h3 className="flex items-center gap-2 mb-4 text-xs font-black uppercase">
                    <Plus size={16} className="text-red-600"/> Batch Deploy
                </h3>
                <textarea 
                    className="w-full h-64 p-4 mb-4 font-mono text-[10px] border outline-none bg-black border-white/5 rounded-2xl focus:border-red-600 transition-all" 
                    value={jsonInput} 
                    onChange={(e) => setJsonInput(e.target.value)} 
                    placeholder='[
  {
    "home": "Arsenal",
    "away": "Chelsea",
    "league": "Premier League",
    "time": "20:00",
    "streamUrl": "https://..."
  }
]' />
                <button onClick={handleDeploy} disabled={isProcessing} className="w-full py-4 font-black text-black uppercase transition-all bg-white rounded-2xl hover:bg-red-600 hover:text-white disabled:opacity-50">
                    {isProcessing ? "PROCESSING..." : "DEPLOY FIXTURES"}
                </button>
            </div>

            {selectedMatch && (
                 <button 
                 onClick={async () => {
                     if(window.confirm("DELETE MATCH?")) {
                         await deleteDoc(doc(db, "fixtures", selectedMatchId));
                         setSelectedMatchId("");
                         setStatus("🗑 MATCH DELETED");
                     }
                 }}
                 className="w-full py-4 text-xs font-black text-red-500 transition-all border bg-red-600/10 border-red-600/20 rounded-2xl hover:bg-red-600 hover:text-white">
                 DELETE SELECTED MATCH
             </button>
            )}
          </section>
        </div>

        {/* NOTIFICATION TOAST */}
        {status && (
          <div className="fixed px-8 py-4 text-[10px] font-black text-black uppercase -translate-x-1/2 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] bottom-10 left-1/2 animate-in slide-in-from-bottom-5">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
export default Admin;