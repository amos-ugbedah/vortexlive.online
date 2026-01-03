import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase"; 
import { collection, doc, setDoc, updateDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { Lock, Plus, Minus } from "lucide-react";

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
      const matches = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setLiveMatches(matches);
    });
    return () => unsub();
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) setIsAuthenticated(true);
    else setStatus("❌ ACCESS DENIED");
  };

  const updateScore = async (match, hDiff, aDiff) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const matchRef = doc(db, "fixtures", match.id);
      const newHome = Math.max(0, (match.homeScore || 0) + hDiff);
      const newAway = Math.max(0, (match.awayScore || 0) + aDiff);
      await updateDoc(matchRef, { homeScore: newHome, awayScore: newAway, lastUpdate: serverTimestamp() });
      setStatus(`⚽ ${newHome}-${newAway}`);
    } catch (err) { setStatus("❌ FAILED"); }
    setIsProcessing(false);
    setTimeout(() => setStatus(""), 2000);
  };

  const updateMatchStatus = async (statusLabel, baseMin) => {
    if (!selectedMatchId || isProcessing) return;
    setIsProcessing(true);
    try {
      const matchRef = doc(db, "fixtures", selectedMatchId);
      await updateDoc(matchRef, { status: statusLabel, baseMinute: baseMin, lastUpdate: serverTimestamp() });
      setStatus(`✅ ${statusLabel}`);
    } catch (error) { setStatus("❌ FAILED"); }
    setIsProcessing(false);
    setTimeout(() => setStatus(""), 2000);
  };

  if (!isAuthenticated) return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-black">
      <form onSubmit={handleLogin} className="w-full max-w-sm p-10 border bg-white/5 rounded-3xl border-white/10">
        <input type="password" placeholder="ADMIN KEY" className="w-full p-4 mb-4 text-white bg-black border outline-none border-white/10 rounded-xl" onChange={(e) => setPassword(e.target.value)} value={password} />
        <button className="w-full py-4 font-bold text-white uppercase bg-red-600 rounded-xl">Authorize</button>
      </form>
    </div>
  );

  const selectedMatch = liveMatches.find(m => m.id === selectedMatchId);

  return (
    <div className="min-h-screen bg-[#070708] text-white p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-2xl italic font-black">VORTEX <span className="text-red-600">CMD</span></h1>
          <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-ping"/> <span className="text-[10px] font-bold">LIVE</span></div>
        </header>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <section>
            <textarea className="w-full h-48 p-4 mb-4 font-mono text-xs border bg-white/5 border-white/10 rounded-2xl" value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} placeholder="JSON Input..." />
            <button onClick={() => {/* handleUpload function logic here */}} className="w-full py-4 font-black text-black uppercase bg-white rounded-xl">Deploy</button>
          </section>

          <section className="p-6 border bg-white/5 rounded-3xl border-white/10">
            <select className="w-full p-4 mb-6 bg-black border outline-none border-white/10 rounded-xl" value={selectedMatchId} onChange={(e) => setSelectedMatchId(e.target.value)}>
              <option value="">SELECT MATCH</option>
              {liveMatches.map(m => <option key={m.id} value={m.id}>{m.home} vs {m.away}</option>)}
            </select>

            <div className="grid grid-cols-2 gap-3 mb-8">
              <button onClick={() => updateMatchStatus('1H', 0)} className="p-3 text-xs font-bold text-green-500 uppercase bg-green-600/20 rounded-xl">Kickoff</button>
              <button onClick={() => updateMatchStatus('HT', 45)} className="p-3 text-xs font-bold text-yellow-500 uppercase bg-yellow-600/20 rounded-xl">HT</button>
              <button onClick={() => updateMatchStatus('2H', 45)} className="p-3 text-xs font-bold text-green-500 uppercase bg-green-600/20 rounded-xl">2H</button>
              <button onClick={() => updateMatchStatus('FT', 90)} className="p-3 text-xs font-bold text-gray-400 uppercase bg-white/10 rounded-xl">FT</button>
            </div>

            {selectedMatch && (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border bg-black/40 rounded-2xl border-white/5">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 font-bold mb-2">HOME</p>
                    <div className="flex items-center gap-3">
                      <button onClick={() => updateScore(selectedMatch, -1, 0)} className="p-2 rounded-lg bg-white/5"><Minus size={14}/></button>
                      <span className="text-2xl font-black">{selectedMatch.homeScore}</span>
                      <button onClick={() => updateScore(selectedMatch, 1, 0)} className="p-2 bg-red-600 rounded-lg"><Plus size={14}/></button>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 font-bold mb-2">AWAY</p>
                    <div className="flex items-center gap-3">
                      <button onClick={() => updateScore(selectedMatch, 0, -1)} className="p-2 rounded-lg bg-white/5"><Minus size={14}/></button>
                      <span className="text-2xl font-black">{selectedMatch.awayScore}</span>
                      <button onClick={() => updateScore(selectedMatch, 0, 1)} className="p-2 bg-red-600 rounded-lg"><Plus size={14}/></button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
        {status && <div className="fixed px-8 py-3 text-xs font-black text-black uppercase -translate-x-1/2 bg-white rounded-full shadow-2xl bottom-10 left-1/2">{status}</div>}
      </div>
    </div>
  );
}
export default Admin;