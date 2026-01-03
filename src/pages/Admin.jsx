import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase"; 
import { collection, doc, setDoc, updateDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { Lock } from "lucide-react";

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
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setStatus("");
    } else {
      setStatus("❌ ACCESS DENIED");
    }
  };

  const updateScore = async (match, hDiff, aDiff) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const matchRef = doc(db, "fixtures", match.id);
      const newHome = Math.max(0, (match.homeScore || 0) + hDiff);
      const newAway = Math.max(0, (match.awayScore || 0) + aDiff);
      await updateDoc(matchRef, { 
        homeScore: newHome, 
        awayScore: newAway, 
        lastUpdate: serverTimestamp() 
      });
      setStatus(`⚽ Updated: ${newHome}-${newAway}`);
    } catch (err) { 
      setStatus("❌ FAILED"); 
    }
    setIsProcessing(false);
    setTimeout(() => setStatus(""), 3000);
  };

  const updateMatchStatus = async (statusLabel, baseMin) => {
    if (!selectedMatchId || isProcessing) return setStatus("⚠️ SELECT MATCH");
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
      setStatus("❌ FAILED"); 
    }
    setIsProcessing(false);
    setTimeout(() => setStatus(""), 3000);
  };

  const handleUpload = async () => {
    if (!jsonInput.trim() || isProcessing) return;
    setIsProcessing(true);
    try {
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
      setStatus("🚀 DEPLOYED");
      setJsonInput("");
    } catch (e) { 
      setStatus("❌ INVALID JSON"); 
    }
    setIsProcessing(false);
    setTimeout(() => setStatus(""), 3000);
  };

  if (!isAuthenticated) return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <form onSubmit={handleLogin} className="p-10 border bg-white/5 rounded-3xl border-white/10">
        <div className="flex justify-center mb-6"><Lock className="text-red-600" size={32} /></div>
        <input 
          type="password" 
          placeholder="ADMIN KEY" 
          className="p-4 text-white bg-black border outline-none border-white/10 rounded-xl focus:border-red-600" 
          onChange={(e) => setPassword(e.target.value)} 
          value={password} 
        />
        <button className="w-full py-4 mt-4 font-bold text-white transition-colors bg-red-600 rounded-xl hover:bg-red-700">LOGIN</button>
        {status && <p className="mt-4 text-xs text-center text-red-500">{status}</p>}
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#070708] text-white p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-10">
           <h1 className="text-2xl italic font-black">VORTEX <span className="text-red-600">CMD</span></h1>
           <p className="flex items-center gap-2 font-mono text-xs text-green-500">
             <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> SERVER: ONLINE
           </p>
        </header>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          {/* JSON Uploader */}
          <section>
            <p className="text-[10px] font-bold uppercase text-gray-500 mb-2 ml-2">Match Deployment (JSON)</p>
            <textarea 
              className="w-full h-64 p-4 font-mono text-xs transition-all border outline-none bg-white/5 border-white/10 rounded-2xl focus:border-red-600" 
              value={jsonInput} 
              onChange={(e) => setJsonInput(e.target.value)} 
              placeholder='[{"home": "Senegal", "away": "Sudan", "league": "AFCON"}]' 
            />
            <button 
              onClick={handleUpload} 
              disabled={isProcessing}
              className="w-full py-4 mt-4 font-black text-black bg-white rounded-xl hover:bg-gray-200 disabled:opacity-50"
            >
              {isProcessing ? "PROCESSING..." : "UPLOAD MATCHES"}
            </button>
          </section>

          {/* Live Controls */}
          <section className="p-6 border bg-white/5 rounded-3xl border-white/10">
            <p className="text-[10px] font-bold uppercase text-red-500 mb-4 ml-1">Live Controller</p>
            <select 
              className="w-full p-4 mb-6 bg-black border outline-none border-white/10 rounded-xl focus:border-red-600" 
              value={selectedMatchId} 
              onChange={(e) => setSelectedMatchId(e.target.value)}
            >
              <option value="">SELECT ACTIVE MATCH</option>
              {liveMatches.map(m => (
                <option key={m.id} value={m.id}>{m.home} vs {m.away} ({m.status || 'NS'})</option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <button disabled={isProcessing} onClick={() => updateMatchStatus('1H', 0)} className="p-4 font-bold text-green-500 transition-all border bg-green-600/10 border-green-600/20 rounded-xl hover:bg-green-600 hover:text-white">KICKOFF</button>
              <button disabled={isProcessing} onClick={() => updateMatchStatus('HT', 45)} className="p-4 font-bold text-yellow-500 transition-all border bg-yellow-600/10 border-yellow-600/20 rounded-xl hover:bg-yellow-600 hover:text-white">HALFTIME</button>
              <button disabled={isProcessing} onClick={() => updateMatchStatus('2H', 45)} className="p-4 font-bold text-green-500 transition-all border bg-green-600/10 border-green-600/20 rounded-xl hover:bg-green-600 hover:text-white">2ND HALF</button>
              <button disabled={isProcessing} onClick={() => updateMatchStatus('FT', 90)} className="p-4 font-bold text-gray-400 transition-all border bg-gray-600/10 border-gray-600/20 rounded-xl hover:bg-gray-600 hover:text-white">FULL TIME</button>
            </div>

            {selectedMatchId && (
              <div className="flex justify-between p-4 border bg-black/50 border-white/5 rounded-xl">
                <button 
                  disabled={isProcessing}
                  onClick={() => updateScore(liveMatches.find(m=>m.id===selectedMatchId), 1, 0)} 
                  className="px-6 py-2 font-bold bg-red-600 rounded-lg hover:bg-red-700 active:scale-95"
                >
                  HOME +1
                </button>
                <button 
                  disabled={isProcessing}
                  onClick={() => updateScore(liveMatches.find(m=>m.id===selectedMatchId), 0, 1)} 
                  className="px-6 py-2 font-bold bg-red-600 rounded-lg hover:bg-red-700 active:scale-95"
                >
                  AWAY +1
                </button>
              </div>
            )}
          </section>
        </div>

        {status && (
          <div className="fixed px-8 py-4 font-black text-black -translate-x-1/2 bg-white rounded-full shadow-2xl bottom-10 left-1/2 animate-bounce">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;