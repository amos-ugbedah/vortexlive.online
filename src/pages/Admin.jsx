import React, { useState, useEffect, useCallback } from "react";
import { db } from "../lib/firebase"; 
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { Lock, Trash2, Database, Play, Pause, Square, RefreshCw, CheckCircle, Clock } from "lucide-react";

function Admin() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [status, setStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveMatches, setLiveMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState("");

  const ADMIN_PASSWORD = "vortex_admin_2026";

  // Fetch current matches from DB - Fixed with useCallback
  const fetchMatches = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "fixtures"));
      const matches = querySnapshot.docs.map(docSnapshot => ({ 
        id: docSnapshot.id, 
        ...docSnapshot.data() 
      }));
      setLiveMatches(matches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      setStatus("❌ Failed to fetch matches");
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMatches();
    }
  }, [isAuthenticated, fetchMatches]);

  const handleLogin = (event) => {
    event.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPassword("");
    } else {
      setStatus("❌ ACCESS DENIED");
      setTimeout(() => setStatus(""), 3000);
    }
  };

  // Live timer control - Fixed error parameter
  const updateMatchStatus = async (statusLabel, baseMin) => {
    if (!selectedMatchId) {
      setStatus("⚠️ SELECT A MATCH FIRST");
      setTimeout(() => setStatus(""), 3000);
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
      setStatus(`✅ ${selectedMatchId} -> ${statusLabel}`);
      fetchMatches(); // Refresh list
    } catch (error) {
      console.error("Update error:", error);
      setStatus("❌ UPDATE FAILED");
    }
    setIsProcessing(false);
    
    setTimeout(() => setStatus(""), 5000);
  };

  const handleUpload = async () => {
    if (!jsonInput.trim()) {
      setStatus("⚠️ JSON input is empty");
      setTimeout(() => setStatus(""), 3000);
      return;
    }
    
    try {
      setIsProcessing(true);
      const data = JSON.parse(jsonInput);
      const matches = Array.isArray(data) ? data : [data];
      
      for (const match of matches) {
        const id = match.id || `${match.home || 'team'}-${match.away || 'team'}`
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
        
        await setDoc(doc(db, "fixtures", id), { 
          ...match, 
          id, 
          lastUpdate: serverTimestamp() 
        });
      }
      
      setStatus(`🚀 ${matches.length} match(es) deployed successfully`);
      setJsonInput("");
      fetchMatches();
    } catch (error) {
      console.error("Upload error:", error);
      if (error instanceof SyntaxError) {
        setStatus("❌ Invalid JSON syntax");
      } else {
        setStatus("❌ Upload failed");
      }
    }
    setIsProcessing(false);
    
    setTimeout(() => setStatus(""), 6000);
  };

  const handleWipe = async () => {
    if (!window.confirm("⚠️ DELETE ALL MATCHES FROM DATABASE?\nThis cannot be undone!")) return;
    
    setIsProcessing(true);
    try {
      const snap = await getDocs(collection(db, "fixtures"));
      const deletePromises = snap.docs.map(docSnapshot => 
        deleteDoc(doc(db, "fixtures", docSnapshot.id))
      );
      await Promise.all(deletePromises);
      setStatus(`🗑️ Cleared ${snap.size} match(es) from database`);
      setLiveMatches([]);
      setSelectedMatchId("");
    } catch (error) {
      console.error("Wipe error:", error);
      setStatus("❌ Failed to clear database");
    }
    setIsProcessing(false);
    
    setTimeout(() => setStatus(""), 5000);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setJsonInput("");
    setStatus("");
    setSelectedMatchId("");
    setLiveMatches([]);
  };

  if (!isAuthenticated) return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-black">
      <form onSubmit={handleLogin} className="bg-white/5 p-10 rounded-[3rem] border border-white/10 w-full max-w-sm text-center">
        <Lock className="mx-auto mb-6 text-red-600" size={40} />
        <input 
          type="password" 
          placeholder="ADMIN KEY" 
          className="w-full p-5 mb-4 text-center text-white transition-all bg-black border outline-none border-white/10 rounded-2xl focus:border-red-600"
          onChange={(e) => setPassword(e.target.value)}
          value={password}
        />
        <button 
          type="submit"
          className="w-full py-5 font-black tracking-widest text-white uppercase transition-all bg-red-600 rounded-2xl hover:bg-red-700 disabled:opacity-50"
          disabled={!password.trim()}
        >
          Authorize
        </button>
        {status && <p className="mt-4 text-xs font-bold text-red-500 animate-pulse">{status}</p>}
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#070708] text-white p-4 md:p-10">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col items-start justify-between gap-4 mb-10 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl italic font-black uppercase">Vortex <span className="text-red-600">Command</span></h1>
              <button 
                onClick={handleLogout}
                className="px-3 py-1 text-xs transition-all rounded-full bg-white/10 hover:bg-white/20"
              >
                Logout
              </button>
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
              {liveMatches.length} match(es) in database
            </p>
          </div>
          <button 
            onClick={handleWipe} 
            disabled={isProcessing}
            className="bg-red-600/20 text-red-500 border border-red-600/30 px-6 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
          >
            <Trash2 size={12} className="inline mr-2" /> Wipe All
          </button>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left: JSON Upload */}
          <section>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Batch Upload (JSON)</p>
            <textarea 
              className="w-full h-80 bg-white/5 border border-white/10 rounded-[2rem] p-6 font-mono text-xs text-blue-400 outline-none focus:border-red-600 transition-all resize-none"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='[{ "home": "Arsenal", "away": "Chelsea", "status": "NS", "time": "20:00" }]'
              disabled={isProcessing}
            />
            <button 
              onClick={handleUpload} 
              disabled={isProcessing || !jsonInput.trim()}
              className="flex items-center justify-center w-full gap-2 py-5 mt-4 text-xs font-black text-black uppercase transition-all bg-white rounded-2xl hover:bg-red-600 hover:text-white disabled:opacity-50"
            >
              <Database size={16} /> {isProcessing ? "PROCESSING..." : "Push Matches Live"}
            </button>
          </section>

          {/* Right: Live Timer Controls */}
          <section className="space-y-6">
            <div className="bg-red-600/5 border border-red-600/20 rounded-[2.5rem] p-8">
              <div className="flex items-center gap-2 mb-6 text-red-500">
                <Clock size={18} />
                <h2 className="text-[10px] font-black uppercase tracking-widest">Live Match Controller</h2>
              </div>
              
              <select 
                className="w-full p-4 mb-6 text-xs font-bold transition-all bg-black border outline-none cursor-pointer border-white/10 rounded-xl focus:border-red-600"
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                disabled={isProcessing || liveMatches.length === 0}
              >
                <option value="">-- SELECT ACTIVE MATCH --</option>
                {liveMatches.map(match => (
                  <option key={match.id} value={match.id}>
                    {match.home || 'TBD'} vs {match.away || 'TBD'} ({match.status || 'NS'})
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => updateMatchStatus('1H', 0)} 
                  disabled={isProcessing || !selectedMatchId}
                  className="bg-green-600/20 border border-green-600/30 text-green-500 p-4 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-green-600 hover:text-white transition-all disabled:opacity-50"
                >
                  <Play size={12}/> 1st Half
                </button>
                <button 
                  onClick={() => updateMatchStatus('HT', 45)} 
                  disabled={isProcessing || !selectedMatchId}
                  className="bg-yellow-600/20 border border-yellow-600/30 text-yellow-500 p-4 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-yellow-600 hover:text-white transition-all disabled:opacity-50"
                >
                  <Pause size={12}/> Halftime
                </button>
                <button 
                  onClick={() => updateMatchStatus('2H', 45)} 
                  disabled={isProcessing || !selectedMatchId}
                  className="bg-green-600/20 border border-green-600/30 text-green-500 p-4 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-green-600 hover:text-white transition-all disabled:opacity-50"
                >
                  <Play size={12}/> 2nd Half
                </button>
                <button 
                  onClick={() => updateMatchStatus('FT', 90)} 
                  disabled={isProcessing || !selectedMatchId}
                  className="bg-white/5 border border-white/10 text-gray-400 p-4 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
                >
                  <Square size={12}/> Full Time
                </button>
              </div>
            </div>

            {/* Quick Sync Button */}
            <button 
              onClick={fetchMatches} 
              disabled={isProcessing}
              className="w-full py-3 border border-white/5 rounded-xl text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw size={12} /> Refresh Match List ({liveMatches.length})
            </button>
          </section>
        </div>

        {status && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white text-black px-8 py-4 rounded-full font-black text-[10px] uppercase flex items-center gap-2 shadow-2xl animate-bounce border border-red-600 z-50">
            <CheckCircle size={14} className="text-green-600" /> {status}
          </div>
        )}
        
        {isProcessing && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-[#070708] border border-white/10 rounded-2xl p-8 text-center">
              <RefreshCw size={32} className="mx-auto mb-4 text-red-600 animate-spin" />
              <p className="text-sm font-bold tracking-wider uppercase">Processing...</p>
              <p className="mt-2 text-xs text-gray-500">Please wait</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;