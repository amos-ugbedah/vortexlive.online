import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase"; 
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  onSnapshot 
} from "firebase/firestore";
import { Plus, Minus, Zap, AlertTriangle, ShieldAlert, Target, Trash2 } from "lucide-react";

function Admin() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [status, setStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveMatches, setLiveMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState("");

  const ADMIN_PASSWORD = "vortex_admin_2026";

  // Sync with Firestore
  useEffect(() => {
    if (!isAuthenticated) return;
    const unsub = onSnapshot(collection(db, "fixtures"), (snap) => {
      setLiveMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [isAuthenticated]);

  // Login Handler
  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) setIsAuthenticated(true);
    else {
      setStatus("❌ DENIED");
      setTimeout(() => setStatus(""), 2000);
    }
  };

  // MISSING FUNCTION: Handle JSON Deployment
  const handleDeploy = async () => {
    if (!jsonInput.trim()) return setStatus("⚠️ INPUT EMPTY");
    setIsProcessing(true);
    try {
      const data = JSON.parse(jsonInput);
      const matches = Array.isArray(data) ? data : [data];

      for (const m of matches) {
        // Create a unique ID from team names
        const id = `${m.home}-${m.away}`.toLowerCase().replace(/\s+/g, '-');
        await setDoc(doc(db, "fixtures", id), {
          ...m,
          homeScore: m.homeScore || 0,
          awayScore: m.awayScore || 0,
          status: m.status || 'NS',
          createdAt: serverTimestamp()
        });
      }
      setStatus("🚀 DEPLOYED SUCCESS");
      setJsonInput("");
    } catch (err) {
      console.error(err);
      setStatus("❌ INVALID JSON FORMAT");
    }
    setIsProcessing(false);
    setTimeout(() => setStatus(""), 3000);
  };

  // Score Update Handler
  const updateScore = async (match, hDiff, aDiff) => {
    if (isProcessing || !match) return;
    setIsProcessing(true);
    try {
      const matchRef = doc(db, "fixtures", match.id);
      await updateDoc(matchRef, { 
        homeScore: Math.max(0, (match.homeScore || 0) + hDiff), 
        awayScore: Math.max(0, (match.awayScore || 0) + aDiff), 
        lastUpdate: serverTimestamp() 
      });
      setStatus("⚽ SCORE UPDATED");
    } catch (err) { 
      setStatus("❌ ERROR"); 
    }
    setIsProcessing(false);
    setTimeout(() => setStatus(""), 2000);
  };

  // Bot Event Trigger
  const triggerEvent = async (type, teamName) => {
    if (!selectedMatchId) return;
    try {
      await updateDoc(doc(db, "fixtures", selectedMatchId), { 
        lastEvent: type, 
        eventTeam: teamName,
        eventTime: Date.now() 
      });
      setStatus(`🔥 ${type}: ${teamName}`);
    } catch (err) { 
      setStatus("❌ FAIL"); 
    }
    setTimeout(() => setStatus(""), 2000);
  };

  if (!isAuthenticated) return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-[#070708]">
      <form onSubmit={handleLogin} className="w-full max-w-sm p-10 border bg-white/5 rounded-3xl border-white/10">
        <h2 className="mb-6 font-black tracking-widest text-center text-white uppercase">Vortex Auth</h2>
        <input 
          type="password" 
          placeholder="ADMIN KEY" 
          className="w-full p-4 mb-4 text-white bg-black border outline-none border-white/10 rounded-xl focus:border-red-600" 
          onChange={(e) => setPassword(e.target.value)} 
        />
        <button className="w-full py-4 font-black text-white transition-colors bg-red-600 rounded-xl hover:bg-red-700">AUTHORIZE</button>
      </form>
    </div>
  );

  const selectedMatch = liveMatches.find(m => m.id === selectedMatchId);

  return (
    <div className="min-h-screen bg-[#070708] text-white p-4 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col justify-between gap-4 mb-8 md:flex-row">
          <h1 className="text-3xl italic font-black">VORTEX <span className="text-red-600">HQ</span></h1>
          <div className="flex items-center gap-2 px-4 py-2 border rounded-full bg-green-500/10 border-green-500/20 w-fit">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
            <span className="text-[10px] font-bold text-green-500 uppercase">System Live</span>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="space-y-6 lg:col-span-2">
            <div className="p-4 md:p-8 border bg-white/5 rounded-[2rem] border-white/10">
              <label className="text-[10px] font-bold text-gray-500 uppercase ml-2 mb-2 block">Control Panel</label>
              <select 
                className="w-full p-4 mb-6 text-lg font-bold bg-black border-2 outline-none border-white/5 focus:border-red-600 rounded-2xl" 
                value={selectedMatchId} 
                onChange={(e) => setSelectedMatchId(e.target.value)}
              >
                <option value="">SELECT MATCH</option>
                {liveMatches.map(m => <option key={m.id} value={m.id}>{m.home} vs {m.away} ({m.status})</option>)}
              </select>

              {selectedMatch ? (
                <div className="space-y-6 duration-300 animate-in fade-in">
                  <div className="flex flex-col gap-4 md:flex-row">
                    {/* Home Team Card */}
                    <div className="flex-1 p-6 bg-black border rounded-3xl border-white/5">
                      <p className="text-[10px] text-gray-500 font-black uppercase mb-4">{selectedMatch.home}</p>
                      <div className="flex items-center justify-between mb-6">
                        <button onClick={() => updateScore(selectedMatch, -1, 0)} className="p-3 bg-white/5 rounded-xl hover:bg-white/10"><Minus size={20}/></button>
                        <span className="text-5xl font-black">{selectedMatch.homeScore}</span>
                        <button onClick={() => updateScore(selectedMatch, 1, 0)} className="p-3 bg-red-600 rounded-xl hover:bg-red-500"><Plus size={20}/></button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => triggerEvent('RED_CARD', selectedMatch.home)} className="py-2 bg-orange-600/10 text-orange-500 rounded-lg text-[10px] font-bold border border-orange-600/20 hover:bg-orange-600 hover:text-white transition-all">RED CARD</button>
                        <button onClick={() => triggerEvent('PENALTY', selectedMatch.home)} className="py-2 bg-yellow-600/10 text-yellow-500 rounded-lg text-[10px] font-bold border border-yellow-600/20 hover:bg-yellow-600 hover:text-white transition-all">PENALTY</button>
                      </div>
                    </div>

                    {/* Away Team Card */}
                    <div className="flex-1 p-6 bg-black border rounded-3xl border-white/5">
                      <p className="text-[10px] text-gray-500 font-black uppercase mb-4">{selectedMatch.away}</p>
                      <div className="flex items-center justify-between mb-6">
                        <button onClick={() => updateScore(selectedMatch, 0, -1)} className="p-3 bg-white/5 rounded-xl hover:bg-white/10"><Minus size={20}/></button>
                        <span className="text-5xl font-black">{selectedMatch.awayScore}</span>
                        <button onClick={() => updateScore(selectedMatch, 0, 1)} className="p-3 bg-red-600 rounded-xl hover:bg-red-500"><Plus size={20}/></button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => triggerEvent('RED_CARD', selectedMatch.away)} className="py-2 bg-orange-600/10 text-orange-500 rounded-lg text-[10px] font-bold border border-orange-600/20 hover:bg-orange-600 hover:text-white transition-all">RED CARD</button>
                        <button onClick={() => triggerEvent('PENALTY', selectedMatch.away)} className="py-2 bg-yellow-600/10 text-yellow-500 rounded-lg text-[10px] font-bold border border-yellow-600/20 hover:bg-yellow-600 hover:text-white transition-all">PENALTY</button>
                      </div>
                    </div>
                  </div>

                  {/* Status Grid */}
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {['1H', 'HT', '2H', 'FT'].map(st => (
                      <button 
                        key={st} 
                        onClick={() => updateDoc(doc(db, 'fixtures', selectedMatchId), {status: st})} 
                        className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all ${selectedMatch.status === st ? 'bg-white text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                      >
                        {st}
                      </button>
                    ))}
                    <button onClick={() => triggerEvent('VAR', 'MATCH')} className="col-span-2 py-3 bg-blue-600/10 text-blue-500 border border-blue-600/20 rounded-xl text-[10px] font-black hover:bg-blue-600 hover:text-white transition-all">🖥 VAR CHECK</button>
                  </div>

                  <button 
                    onClick={async () => {
                        if(window.confirm("ARE YOU SURE? THIS WILL REMOVE THE MATCH FROM ALL USERS.")) {
                            await deleteDoc(doc(db, "fixtures", selectedMatchId));
                            setSelectedMatchId("");
                            setStatus("🗑 MATCH DELETED");
                        }
                    }}
                    className="flex items-center justify-center w-full gap-2 py-4 text-xs font-black text-red-500 transition-all border border-red-600/20 bg-red-600/5 rounded-2xl hover:bg-red-600 hover:text-white"
                  >
                    <Trash2 size={14} /> DELETE SELECTED MATCH
                  </button>
                </div>
              ) : (
                <div className="py-20 text-center text-gray-600 border-2 border-dashed border-white/5 rounded-3xl">
                  Select a match to start managing live events.
                </div>
              )}
            </div>
          </section>

          {/* DEPLOY SECTION */}
          <section className="p-6 border bg-white/5 rounded-[2rem] border-white/10 h-fit">
            <h3 className="flex items-center gap-2 mb-4 text-xs font-black uppercase">
              <Zap size={14} className="text-red-600" /> Batch Deploy
            </h3>
            <textarea 
              className="w-full h-48 p-4 bg-black border border-white/5 rounded-2xl text-[10px] font-mono mb-4 outline-none focus:border-red-600 text-gray-300" 
              value={jsonInput} 
              onChange={(e) => setJsonInput(e.target.value)} 
              placeholder='[{"home": "Team A", "away": "Team B", "league": "EPL"}]' 
            />
            <button 
              onClick={handleDeploy} 
              disabled={isProcessing}
              className="w-full py-4 font-black text-black uppercase transition-all bg-white rounded-2xl hover:bg-red-600 hover:text-white disabled:opacity-50"
            >
              {isProcessing ? "PROCESSING..." : "PUBLISH FIXTURES"}
            </button>
          </section>
        </div>

        {/* Status Notification */}
        {status && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white text-black px-8 py-4 rounded-2xl font-black text-[10px] shadow-2xl z-50 animate-in slide-in-from-bottom-5">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;