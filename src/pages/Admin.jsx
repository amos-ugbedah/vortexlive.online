import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase"; 
import { collection, getDocs, deleteDoc, doc, setDoc, writeBatch } from "firebase/firestore";
import { Upload, Trash2, Lock, LayoutDashboard, CheckCircle, AlertTriangle, Eye, RefreshCw } from "lucide-react";

function Admin() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState([]);

  const ADMIN_PASSWORD = "vortex_admin_2026"; 

  // Auto-validate JSON as the user types
  useEffect(() => {
    try {
      if (jsonInput.trim()) {
        const parsed = JSON.parse(jsonInput);
        setPreview(Array.isArray(parsed) ? parsed : [parsed]);
      } else {
        setPreview([]);
      }
    } catch (e) {
      setPreview([]);
    }
  }, [jsonInput]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert("Unauthorized Access Attempt Logged.");
    }
  };

  // UPDATED: Hard Reset function to clear ALL data instantly
  const clearAllData = async () => {
    if (!window.confirm("⚠️ ACTION REQUIRED: This will delete EVERY match currently on the home page. Continue?")) return;
    
    try {
      setStatus("🔄 Purging all database entries...");
      const snapshot = await getDocs(collection(db, "fixtures"));
      
      if (snapshot.empty) {
        setStatus("✅ Database is already empty.");
        return;
      }

      // Using a batch for faster deletion
      const batch = writeBatch(db);
      snapshot.docs.forEach((m) => {
        batch.delete(doc(db, "fixtures", m.id));
      });
      
      await batch.commit();
      setStatus(`✅ Success: ${snapshot.size} matches removed. Site is clean.`);
    } catch (err) { 
      console.error(err);
      setStatus("❌ Error: Could not clear database. Try again."); 
    }
  };

  const handleUpload = async () => {
    if (!jsonInput.trim()) return setStatus("⚠️ Input is empty.");
    try {
      setStatus("🚀 Deploying to Edge Servers...");
      const matches = JSON.parse(jsonInput);
      const matchArray = Array.isArray(matches) ? matches : [matches];

      for (const match of matchArray) {
        // Generate a clean ID (Slug) based on teams and date
        const id = match.id || `${match.home}-${match.away}-${match.date}`.toLowerCase().replace(/\s+/g, '-');
        
        await setDoc(doc(db, "fixtures", id), {
          ...match,
          updatedAt: new Date().toISOString()
        });
      }
      setStatus(`✅ Deployment Successful! ${matchArray.length} matches live.`);
      setJsonInput("");
    } catch (e) { 
      setStatus("❌ Syntax Error: Check your JSON commas/brackets."); 
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6 text-white font-sans">
        <form onSubmit={handleLogin} className="bg-white/5 p-10 rounded-[2.5rem] border border-white/10 w-full max-w-sm text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="text-red-600" size={32} />
          </div>
          <h1 className="text-2xl font-black mb-2 italic uppercase tracking-tighter">Vortex<span className="text-red-600">Secure</span></h1>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-8">Admin Authorization Required</p>
          <input 
            type="password" 
            placeholder="Enter Encrypted Key" 
            className="w-full bg-black border border-white/10 rounded-2xl p-4 mb-4 outline-none focus:border-red-600 transition-all text-center font-mono" 
            onChange={(e) => setPassword(e.target.value)} 
          />
          <button type="submit" className="w-full bg-red-600 font-black py-4 rounded-2xl hover:bg-red-700 transition-all uppercase tracking-widest text-xs shadow-lg shadow-red-600/20">
            Access Command Center
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-4 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
                <LayoutDashboard size={18} className="text-red-600" />
                <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">Broadcast Control</h1>
            </div>
            <p className="text-gray-500 text-[10px] font-bold tracking-[0.4em] uppercase">Global Fixture Management Suite</p>
          </div>
          <button 
            onClick={clearAllData} 
            className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-2xl hover:bg-red-700 transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-600/20"
          >
            <Trash2 size={14} /> Wipe All Matches
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">JSON Configuration</span>
                {jsonInput && <span className="text-[10px] font-black uppercase text-green-500 flex items-center gap-1"><CheckCircle size={10}/> Valid Format</span>}
            </div>
            <textarea 
              value={jsonInput} 
              onChange={(e) => setJsonInput(e.target.value)} 
              placeholder='[ { "home": "Team A", "away": "Team B", "league": "League Name", "date": "2026-01-02", "time": "15:35", "status": "live", "links": [...] } ]' 
              className="w-full h-[450px] bg-white/[0.03] border border-white/10 rounded-[2rem] p-6 font-mono text-sm text-green-400 focus:outline-none focus:border-red-600/50 transition-all placeholder:text-gray-700 shadow-inner" 
            />
            <button 
              onClick={handleUpload} 
              className="w-full bg-white text-black font-black py-5 rounded-[1.5rem] hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-3 shadow-xl transform active:scale-[0.98]"
            >
              <Upload size={20} /> PUSH TO PRODUCTION
            </button>
          </div>

          {/* Preview Section */}
          <div className="space-y-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-2 flex items-center gap-2">
                <Eye size={12} /> Live Preview (Auto-Sync)
            </span>
            <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 h-[530px] overflow-y-auto space-y-4 border-dashed">
              {preview.length > 0 ? (
                preview.map((m, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center justify-between animate-in slide-in-from-right-4 duration-300">
                    <div>
                        <p className="text-[10px] font-black text-red-600 uppercase mb-1">{m.date || 'No Date'} @ {m.time || 'No Time'}</p>
                        <h3 className="font-black italic uppercase text-sm">{m.home} vs {m.away}</h3>
                        <p className="text-[10px] text-gray-500 font-bold">{m.links?.length || 0} Stream Servers Ready</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                        <CheckCircle size={16} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                    <AlertTriangle size={40} className="mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest">Awaiting Valid JSON Input...</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {status && (
          <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-2xl text-center font-black text-[10px] uppercase tracking-[0.2em] text-red-500 animate-pulse">
            <RefreshCw size={12} className="inline mr-2 animate-spin" /> {status}
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;