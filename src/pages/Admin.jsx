import React, { useState } from "react";
import { db } from "../lib/firebase"; 
import { collection, getDocs, deleteDoc, doc, setDoc, query, where } from "firebase/firestore";
import { Upload, Trash2, Lock } from "lucide-react";

function Admin() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [status, setStatus] = useState("");

  const ADMIN_PASSWORD = "vortex_admin_2026"; 

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert("Wrong Password!");
    }
  };

  const clearOldMatches = async () => {
    if (!window.confirm("Delete matches older than today?")) return;
    try {
      setStatus("Cleaning database...");
      const today = new Date().toISOString().split('T')[0];
      const q = query(collection(db, "fixtures"), where("date", "<", today));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(m => deleteDoc(doc(db, "fixtures", m.id)));
      await Promise.all(deletePromises);
      setStatus(`✅ Cleaned ${snapshot.size} matches!`);
    } catch (err) { 
      setStatus("❌ Error cleaning database."); 
    }
  };

  const handleUpload = async () => {
    try {
      setStatus("Uploading...");
      const matches = JSON.parse(jsonInput);
      for (const match of matches) {
        const id = match.id || `${match.home}-${match.away}-${match.date}`.toLowerCase().replace(/\s+/g, '-');
        await setDoc(doc(db, "fixtures", id), match);
      }
      setStatus(`✅ Success! ${matches.length} matches updated.`);
      setJsonInput("");
    } catch (e) { 
      setStatus("❌ JSON Error! Check your format."); 
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6 text-white">
        <form onSubmit={handleLogin} className="bg-white/5 p-8 rounded-3xl border border-white/10 w-full max-w-sm text-center">
          <Lock className="mx-auto text-red-600 mb-4" size={40} />
          <h1 className="text-xl font-bold mb-6 italic uppercase tracking-tighter">Vortex<span className="text-red-600">Admin</span></h1>
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full bg-black border border-white/10 rounded-xl p-3 mb-4 outline-none focus:border-red-600" 
            onChange={(e) => setPassword(e.target.value)} 
          />
          <button type="submit" className="w-full bg-red-600 font-bold py-3 rounded-xl hover:bg-red-700 transition">Enter Dashboard</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">Control Center</h1>
          <button 
            onClick={clearOldMatches} 
            className="flex items-center gap-2 bg-red-600/10 text-red-500 border border-red-600/20 px-4 py-2 rounded-xl hover:bg-red-600 hover:text-white transition-all text-xs font-bold"
          >
            <Trash2 size={16} /> CLEAR OLD DATA
          </button>
        </div>

        <div className="mb-4 text-[10px] text-gray-500 font-mono bg-white/5 p-4 rounded-xl border border-white/5">
          UPLOAD FORMAT: [ {"{"} "home": "Team A", "away": "Team B", "links": [ {"{"} "name": "Server 1", "url": "..." {"}"} ] {"}"} ]
        </div>

        <textarea 
          value={jsonInput} 
          onChange={(e) => setJsonInput(e.target.value)} 
          placeholder='Paste JSON here...' 
          className="w-full h-80 bg-white/5 border border-white/10 rounded-3xl p-6 font-mono text-sm text-green-400 focus:outline-none focus:border-green-500 mb-4" 
        />
        
        <button 
          onClick={handleUpload} 
          className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          <Upload size={20} /> DEPLOY MATCHES
        </button>
        
        {status && (
          <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-2xl text-center font-bold text-sm animate-fade-in">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;