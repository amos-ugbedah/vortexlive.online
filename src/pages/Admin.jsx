import React, { useState, useEffect, useCallback } from "react";
import { db } from "../lib/firebase"; 
import { collection, getDocs, doc, setDoc, writeBatch, updateDoc, serverTimestamp } from "firebase/firestore";
import { Upload, Trash2, Lock, LayoutDashboard, CheckCircle, AlertTriangle, Eye, RefreshCw, Play, Pause, Square } from "lucide-react";

function Admin() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState(""); 
  const [isProcessing, setIsProcessing] = useState(false);

  const ADMIN_PASSWORD = "vortex_admin_2026"; 

  // Optimized Preview Logic with error boundary
  useEffect(() => {
    if (!jsonInput.trim()) {
      setPreview([]);
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      const normalized = Array.isArray(parsed) ? parsed : [parsed];
      
      // Ensure every item has a temporary ID for the preview clicker to work
      const safePreview = normalized.map(match => ({
        ...match,
        previewId: match.id || `${match.home || 'h'}-${match.away || 'a'}-${match.date || 'd'}`.toLowerCase().replace(/\s+/g, '-')
      }));
      
      setPreview(safePreview);
    } catch (error) {
      console.error("JSON parsing error:", error);
      setPreview([]);
    }
  }, [jsonInput]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPassword("");
    } else {
      setStatus("❌ Unauthorized Access Attempt");
      setTimeout(() => setStatus(""), 3000);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setJsonInput("");
    setPreview([]);
    setStatus("");
    setSelectedMatchId("");
  };

  const triggerMatchControl = async (id, matchStatus, baseMin) => {
    if (!id.trim()) {
      setStatus("⚠️ Please select or enter a Match ID first.");
      setTimeout(() => setStatus(""), 3000);
      return;
    }
    
    try {
      setIsProcessing(true);
      setStatus(`🔄 Updating ${id}...`);
      
      const matchRef = doc(db, "fixtures", id);
      await updateDoc(matchRef, {
        status: matchStatus,
        baseMinute: baseMin,
        lastUpdate: serverTimestamp()
      });
      
      setStatus(`✅ Match ${id} updated to ${matchStatus}`);
    } catch (error) {
      console.error("Error updating match:", error);
      setStatus("❌ Error: Document not found or update failed.");
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatus(""), 5000);
    }
  };

  const clearAllData = async () => {
    if (!window.confirm("⚠️ CRITICAL ACTION: Delete ALL matches from database? This cannot be undone.")) return;
    
    try {
      setIsProcessing(true);
      setStatus("🔄 Purging database...");
      
      const snapshot = await getDocs(collection(db, "fixtures"));
      
      if (snapshot.empty) {
        setStatus("✅ Database already empty.");
        setTimeout(() => setStatus(""), 3000);
        return;
      }
      
      const batch = writeBatch(db);
      snapshot.docs.forEach((docSnapshot) => {
        batch.delete(doc(db, "fixtures", docSnapshot.id));
      });
      
      await batch.commit();
      setStatus(`✅ Success: ${snapshot.size} matches removed.`);
      setPreview([]);
      setSelectedMatchId("");
    } catch (error) {
      console.error("Error clearing data:", error);
      setStatus("❌ Error: Could not clear database.");
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatus(""), 5000);
    }
  };

  const handleUpload = async () => {
    if (!jsonInput.trim()) {
      setStatus("⚠️ Input is empty.");
      setTimeout(() => setStatus(""), 3000);
      return;
    }
    
    try {
      setIsProcessing(true);
      setStatus("🚀 Deploying to production...");
      
      const matches = JSON.parse(jsonInput);
      const matchArray = Array.isArray(matches) ? matches : [matches];
      
      // Validate required fields
      const invalidMatches = matchArray.filter(match => !match.home || !match.away);
      if (invalidMatches.length > 0) {
        setStatus(`⚠️ ${invalidMatches.length} matches missing home/away teams`);
        setTimeout(() => setStatus(""), 4000);
        return;
      }
      
      // Upload matches sequentially to avoid Firebase batch limits
      for (const match of matchArray) {
        const id = match.id || `${match.home}-${match.away}-${match.date || new Date().toISOString().split('T')[0]}`
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
        
        await setDoc(doc(db, "fixtures", id), {
          ...match,
          id,
          uploadedAt: new Date().toISOString(),
          lastUpdated: serverTimestamp()
        });
      }
      
      setStatus(`✅ Success! ${matchArray.length} matches deployed to production.`);
      setJsonInput("");
      setPreview([]);
      setSelectedMatchId("");
    } catch (error) {
      console.error("Upload error:", error);
      if (error instanceof SyntaxError) {
        setStatus("❌ Syntax Error: Invalid JSON format. Check brackets, commas, and quotes.");
      } else {
        setStatus("❌ Upload failed. Check Firebase connection.");
      }
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatus(""), 6000);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6 text-white font-sans">
        <form onSubmit={handleLogin} className="bg-white/5 p-10 rounded-[2.5rem] border border-white/10 w-full max-w-sm text-center shadow-2xl backdrop-blur-sm">
          <div className="w-16 h-16 bg-red-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="text-red-600" size={32} />
          </div>
          <h1 className="text-2xl font-black mb-2 italic uppercase tracking-tighter">Vortex<span className="text-red-600">Secure</span></h1>
          <p className="text-gray-500 text-xs mb-6">Admin Command Center v2.1</p>
          <input 
            type="password" 
            placeholder="Enter Encrypted Key" 
            value={password}
            className="w-full bg-black border border-white/10 rounded-2xl p-4 mb-4 text-center outline-none focus:border-red-600 transition-all font-mono" 
            onChange={(e) => setPassword(e.target.value)} 
            autoComplete="current-password"
          />
          <button 
            type="submit" 
            className="w-full bg-red-600 font-black py-4 rounded-2xl uppercase tracking-widest text-xs hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!password.trim()}
          >
            Access Command Center
          </button>
        </form>
        
        {status && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-red-600 text-white rounded-full font-black text-xs uppercase shadow-2xl animate-pulse">
            {status}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-4 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-black italic uppercase tracking-tighter">
                Broadcast Control
              </h1>
              <button 
                onClick={handleLogout}
                className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition-all"
              >
                Logout
              </button>
            </div>
            <p className="text-gray-500 text-[10px] font-bold tracking-[0.4em] uppercase">VortexLive Engine v2.1</p>
          </div>
          <button 
            onClick={clearAllData} 
            className="flex items-center gap-2 bg-red-600 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isProcessing}
          >
            <Trash2 size={14} /> Wipe All Data
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* JSON Input Area */}
          <div className="space-y-4">
            <div className="flex justify-between px-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <span>JSON Payload</span>
              <Eye size={14} />
            </div>
            <textarea 
              value={jsonInput} 
              onChange={(e) => setJsonInput(e.target.value)} 
              placeholder='[ { "id": "match-1", "home": "Team A", "away": "Team B", "date": "2024-01-01", "status": "NS" } ]' 
              className="w-full h-[400px] bg-white/[0.03] border border-white/10 rounded-[2rem] p-6 font-mono text-sm text-green-400 focus:outline-none focus:border-red-600/50 transition-all shadow-inner resize-none" 
              disabled={isProcessing}
            />
            <button 
              onClick={handleUpload} 
              className="w-full bg-white text-black font-black py-5 rounded-[1.5rem] hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-3 shadow-xl transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isProcessing || !jsonInput.trim()}
            >
              <Upload size={20} /> 
              {isProcessing ? "PROCESSING..." : "PUSH TO PRODUCTION"}
            </button>
          </div>

          {/* Controls & Preview */}
          <div className="space-y-6">
            <div className="bg-red-600/10 border border-red-600/20 rounded-[2rem] p-6 backdrop-blur-sm">
              <h2 className="text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 text-red-500">
                <RefreshCw size={14} className={`${isProcessing ? 'animate-spin' : 'animate-spin-slow'}`}/> 
                Live Timer Control
              </h2>
              <input 
                placeholder="Match ID (auto-fills from preview click)" 
                className="w-full bg-black border border-white/10 rounded-xl p-3 mb-4 text-xs focus:border-red-600 outline-none transition-all font-mono"
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                disabled={isProcessing}
              />
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => triggerMatchControl(selectedMatchId, '1H', 0)} 
                  className="bg-green-600 p-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isProcessing || !selectedMatchId}
                >
                  <Play size={12}/> Kickoff 1H
                </button>
                <button 
                  onClick={() => triggerMatchControl(selectedMatchId, 'HT', 45)} 
                  className="bg-yellow-600 p-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-yellow-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isProcessing || !selectedMatchId}
                >
                  <Pause size={12}/> Halftime
                </button>
                <button 
                  onClick={() => triggerMatchControl(selectedMatchId, '2H', 45)} 
                  className="bg-green-600 p-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isProcessing || !selectedMatchId}
                >
                  <Play size={12}/> Kickoff 2H
                </button>
                <button 
                  onClick={() => triggerMatchControl(selectedMatchId, 'FT', 90)} 
                  className="bg-gray-700 p-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isProcessing || !selectedMatchId}
                >
                  <Square size={12}/> Full Time
                </button>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 h-[250px] overflow-y-auto space-y-4 border-dashed">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                  Click match below to control:
                </span>
                <span className="text-[10px] text-gray-500 font-mono">
                  {preview.length} matches
                </span>
              </div>
              
              {preview.length > 0 ? (
                preview.map((match, index) => (
                  <div 
                    key={`${match.previewId}-${index}`}
                    onClick={() => !isProcessing && setSelectedMatchId(match.previewId)} 
                    className={`cursor-pointer border p-4 rounded-2xl flex justify-between items-center transition-all ${selectedMatchId === match.previewId ? 'bg-red-600/20 border-red-600' : 'bg-white/5 border-white/10 hover:border-white/30'} ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="overflow-hidden">
                      <h3 className="font-black uppercase text-xs italic truncate">
                        {match.home || '???'} vs {match.away || '???'}
                      </h3>
                      <p className="text-[9px] text-gray-500 uppercase font-mono truncate">
                        {match.previewId}
                      </p>
                      {match.date && (
                        <p className="text-[8px] text-gray-600 mt-1">
                          {match.date}
                        </p>
                      )}
                    </div>
                    <CheckCircle 
                      size={14} 
                      className={selectedMatchId === match.previewId ? "text-red-500" : "text-green-500"} 
                    />
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                  <AlertTriangle size={32} className="mb-2" />
                  <p className="text-[10px] font-black uppercase">Awaiting Valid JSON...</p>
                  <p className="text-[8px] text-gray-600 mt-1">Paste JSON array to preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {status && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-white text-black rounded-full font-black text-xs uppercase shadow-2xl z-50 animate-bounce">
            {status}
          </div>
        )}
        
        {isProcessing && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40">
            <div className="bg-[#0a0a0c] border border-white/10 rounded-2xl p-8 text-center">
              <RefreshCw size={32} className="animate-spin mx-auto mb-4 text-red-600" />
              <p className="text-sm font-bold uppercase tracking-wider">Processing...</p>
              <p className="text-xs text-gray-500 mt-2">Please wait</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;