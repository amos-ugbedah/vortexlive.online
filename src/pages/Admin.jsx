import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase"; 
import { collection, doc, setDoc, updateDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { Lock, Zap, AlertCircle } from "lucide-react";

function Admin() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [status, setStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveMatches, setLiveMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [activeTab, setActiveTab] = useState("matches");

  const ADMIN_PASSWORD = "vortex_admin_2026";

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const unsub = onSnapshot(collection(db, "fixtures"), (snap) => {
      const matches = snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data(),
        homeScore: d.data().homeScore || 0,
        awayScore: d.data().awayScore || 0,
        status: d.data().status || 'NS'
      }));
      setLiveMatches(matches);
    });
    
    return () => unsub();
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setStatus("✅ ACCESS GRANTED");
      setTimeout(() => setStatus(""), 2000);
    } else {
      setStatus("❌ ACCESS DENIED");
    }
  };

  const updateScore = async (match, hDiff, aDiff) => {
    if (isProcessing || !match) return;
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
    if (!selectedMatchId || isProcessing) {
      setStatus("⚠️ SELECT A MATCH FIRST");
      setTimeout(() => setStatus(""), 2000);
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
      setStatus(`✅ Status: ${statusLabel}`);
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
        const id = match.id || `${match.home}-${match.away}-${Date.now()}`.toLowerCase().replace(/\s+/g, '-');
        
        const matchData = {
          ...match,
          home: match.home || "Home Team",
          away: match.away || "Away Team",
          homeScore: match.homeScore || 0,
          awayScore: match.awayScore || 0,
          status: match.status || 'NS',
          league: match.league || "Football Match",
          id: id,
          lastUpdate: serverTimestamp()
        };
        
        await setDoc(doc(db, "fixtures", id), matchData);
      }
      
      setStatus("✅ MATCHES DEPLOYED");
      setJsonInput("");
    } catch (e) { 
      setStatus("❌ INVALID JSON FORMAT"); 
    }
    setIsProcessing(false);
    setTimeout(() => setStatus(""), 3000);
  };

  const deleteMatch = async (matchId) => {
    if (!window.confirm("Delete this match? This cannot be undone.")) return;
    
    try {
      const matchRef = doc(db, "fixtures", matchId);
      await updateDoc(matchRef, {
        status: "CANCELLED",
        lastUpdate: serverTimestamp()
      });
      setStatus("🗑 Match cancelled");
      setTimeout(() => setStatus(""), 2000);
    } catch (error) {
      setStatus("❌ Failed to delete");
    }
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

  const selectedMatch = liveMatches.find(m => m.id === selectedMatchId);

  return (
    <div className="min-h-screen bg-[#070708] text-white p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-10">
           <h1 className="text-2xl italic font-black">VORTEX <span className="text-red-600">CMD</span></h1>
           <p className="flex items-center gap-2 font-mono text-xs text-green-500">
             <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> SERVER: ONLINE
           </p>
        </header>

        <div className="flex gap-2 mb-6 border-b border-white/10">
          <button
            onClick={() => setActiveTab("matches")}
            className={`px-4 py-2 text-sm font-medium ${activeTab === "matches" ? "text-red-500 border-b-2 border-red-500" : "text-gray-400"}`}
          >
            Live Matches
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`px-4 py-2 text-sm font-medium ${activeTab === "create" ? "text-red-500 border-b-2 border-red-500" : "text-gray-400"}`}
          >
            Create Match
          </button>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          {/* LEFT COLUMN: CREATE/UPLOAD */}
          {activeTab === "create" ? (
            <div className="md:col-span-2">
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
            </div>
          ) : (
            <>
              {/* RIGHT COLUMN: LIVE CONTROLS */}
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

                {selectedMatch && (
                  <div className="p-4 mb-6 border bg-black/50 border-white/10 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold">{selectedMatch.home} vs {selectedMatch.away}</h3>
                      <span className={`px-2 py-1 text-xs rounded ${
                        selectedMatch.status === 'LIVE' || selectedMatch.status === '1H' || selectedMatch.status === '2H' 
                          ? 'bg-red-500/20 text-red-400' 
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {selectedMatch.status}
                      </span>
                    </div>
                    <div className="my-2 text-3xl font-bold text-center">
                      {selectedMatch.homeScore} - {selectedMatch.awayScore}
                    </div>
                    <p className="text-sm text-center text-gray-400">{selectedMatch.league}</p>
                  </div>
                )}

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

              {/* Match List */}
              <section className="p-6 border bg-white/5 rounded-3xl border-white/10">
                <p className="text-[10px] font-bold uppercase text-gray-500 mb-4 ml-1">ACTIVE MATCHES</p>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {liveMatches.length === 0 ? (
                    <p className="py-4 text-center text-gray-400">No active matches</p>
                  ) : (
                    liveMatches.map(match => (
                      <div 
                        key={match.id} 
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedMatchId === match.id ? 'border-red-500 bg-red-500/10' : 'border-white/10 hover:bg-white/5'
                        }`}
                        onClick={() => setSelectedMatchId(match.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{match.home} vs {match.away}</h4>
                            <p className="text-xs text-gray-400">{match.league}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold">{match.homeScore} - {match.awayScore}</div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              match.status === 'LIVE' || match.status === '1H' || match.status === '2H' 
                                ? 'bg-red-500/20 text-red-400' 
                                : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {match.status}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMatch(match.id);
                          }}
                          className="mt-2 text-xs text-gray-500 hover:text-red-400"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </>
          )}
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