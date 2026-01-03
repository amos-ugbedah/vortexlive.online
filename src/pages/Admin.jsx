import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase"; 
import { collection, doc, setDoc, updateDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { Lock, Plus, Minus, Trash2 } from "lucide-react";

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
      await updateDoc(doc(db, "fixtures", selectedMatchId), { status: statusLabel, baseMinute: baseMin, lastUpdate: serverTimestamp() });
      setStatus(`✅ ${statusLabel}`);
    } catch (error) { setStatus("❌ ERROR"); }
    setIsProcessing(false);
    setTimeout(() => setStatus(""), 2000);
  };

  if (!isAuthenticated) return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-black">
      <form onSubmit={handleLogin} className="w-full max-w-sm p-10 border bg-white/5 rounded-3xl border-white/10">
        <input type="password" placeholder="ADMIN KEY" className="w-full p-4 mb-4 text-white bg-black border outline-none border-white/10 rounded-xl" onChange={(e) => setPassword(e.target.value)} value={password} />
        <button className="w-full py-4 font-bold text-white bg-red-600 rounded-xl">AUTHORIZE</button>
      </form>
    </div>
  );

  const selectedMatch = liveMatches.find(m => m.id === selectedMatchId);

  return (
    <div className="min-h-screen bg-[#070708] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-10">
          <h1 className="text-2xl italic font-black">VORTEX <span className="text-red-600">CMD</span></h1>
          <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/><span className="text-xs font-bold text-green-500">SERVER ACTIVE</span></div>
        </header>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <section className="p-6 border bg-white/5 rounded-3xl border-white/10">
            <select className="w-full p-4 mb-6 bg-black border outline-none border-white/10 rounded-xl" value={selectedMatchId} onChange={(e) => setSelectedMatchId(e.target.value)}>
              <option value="">SELECT MATCH</option>
              {liveMatches.map(m => <option key={m.id} value={m.id}>{m.home} vs {m.away}</option>)}
            </select>

            <div className="grid grid-cols-2 gap-3 mb-8">
              <button onClick={() => updateMatchStatus('1H', 0)} className="p-3 bg-white/5 rounded-xl font-bold text-[10px] hover:bg-green-600/20">KICKOFF</button>
              <button onClick={() => updateMatchStatus('HT', 45)} className="p-3 bg-white/5 rounded-xl font-bold text-[10px] hover:bg-yellow-600/20">HT</button>
              <button onClick={() => updateMatchStatus('2H', 45)} className="p-3 bg-white/5 rounded-xl font-bold text-[10px] hover:bg-green-600/20">2H</button>
              <button onClick={() => updateMatchStatus('FT', 90)} className="p-3 bg-white/5 rounded-xl font-bold text-[10px] hover:bg-red-600/20">FT</button>
            </div>

            {selectedMatch && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-6 bg-black border rounded-2xl border-white/5">
                  <div className="space-y-3 text-center">
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Home</p>
                    <div className="flex items-center gap-2">
                        <button onClick={() => updateScore(selectedMatch, -1, 0)} className="p-2 text-gray-400 rounded-lg bg-white/5 hover:text-white"><Minus size={16}/></button>
                        <span className="px-2 text-3xl font-black">{selectedMatch.homeScore}</span>
                        <button onClick={() => updateScore(selectedMatch, 1, 0)} className="p-2 bg-red-600 rounded-lg"><Plus size={16}/></button>
                    </div>
                  </div>
                  <div className="space-y-3 text-center">
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Away</p>
                    <div className="flex items-center gap-2">
                        <button onClick={() => updateScore(selectedMatch, 0, -1)} className="p-2 text-gray-400 rounded-lg bg-white/5 hover:text-white"><Minus size={16}/></button>
                        <span className="px-2 text-3xl font-black">{selectedMatch.awayScore}</span>
                        <button onClick={() => updateScore(selectedMatch, 0, 1)} className="p-2 bg-red-600 rounded-lg"><Plus size={16}/></button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section>
            <textarea className="w-full h-48 p-4 mb-4 font-mono text-xs border outline-none bg-white/5 border-white/10 rounded-2xl focus:border-red-600" value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} placeholder='[{"home": "Team A", "away": "Team B"}]' />
            <button onClick={() => {/* Handle Upload function */}} className="w-full py-4 font-black text-black uppercase bg-white rounded-xl hover:bg-gray-200">Deploy Match</button>
          </section>
        </div>
        {status && <div className="fixed px-8 py-3 text-xs font-black text-black uppercase -translate-x-1/2 bg-white rounded-full shadow-2xl bottom-10 left-1/2">{status}</div>}
      </div>
    </div>
  );
}
export default Admin;