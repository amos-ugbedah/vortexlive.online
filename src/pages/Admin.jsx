import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase"; 
import { collection, doc, updateDoc, onSnapshot, setDoc, deleteDoc, query, orderBy, writeBatch } from "firebase/firestore";
import { ShieldAlert, UserX, ShieldCheck, Tv, Globe, RefreshCw, Zap, LogOut, Send, Trash2 } from "lucide-react";
import AdminLogin from "./AdminLogin";

function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [matches, setMatches] = useState([]);
  const [bannedList, setBannedList] = useState([]);
  const [targetId, setTargetId] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);

  // --- CONFIGURATION ---
  const TELEGRAM_BOT_TOKEN = "8126112394:AAH7-da80z0C7tLco-ZBoZryH_6hhZBKfhE";
  // UPDATED: Using numeric ID to fix "Chat Not Found" error
  const TELEGRAM_CHAT_ID = "-1002418579730"; 

  useEffect(() => {
    const auth = sessionStorage.getItem('vx_admin_auth');
    if (auth === btoa('authenticated_2026')) {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const q = query(collection(db, "matches"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const unsub = onSnapshot(collection(db, "blacklist"), (snap) => {
      setBannedList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [isAuthenticated]);

  const handleLogout = () => {
    sessionStorage.removeItem('vx_admin_auth');
    setIsAuthenticated(false);
  };

  const handleUpdateStream = async (matchId, serverNum, rawUrl) => {
    if (!rawUrl) return;
    setIsUpdating(true);
    try {
      const encodedUrl = btoa(rawUrl);
      const fieldToUpdate = `streamUrl${serverNum}`;
      await updateDoc(doc(db, "matches", matchId), { [fieldToUpdate]: encodedUrl });
    } catch (e) {
      alert("Update Failed");
    } finally {
      setIsUpdating(false);
    }
  };

  const postToTelegram = async () => {
    if (matches.length === 0) return alert("No matches to post!");
    setIsSendingTelegram(true);

    const matchList = matches
      .map(m => `⚽️ *${m.homeTeam?.name} vs ${m.awayTeam?.name}*\n⏰ Time: ${m.time || m.kickOffTime || 'TBD'}\n`)
      .join("\n");

    const text = `🏆 *TODAY'S LIVE FIXTURES* 🏆\n-----------------------------------------\n${matchList}\n-----------------------------------------\n📺 *WATCH LIVE IN HD:*\n👉 https://vortexlive.online`;

    const queryParams = new URLSearchParams({
      chat_id: TELEGRAM_CHAT_ID,
      text: text,
      parse_mode: 'Markdown',
      disable_web_page_preview: 'false'
    }).toString();

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?${queryParams}`;

    try {
      const response = await fetch(url);
      const result = await response.json();

      if (response.ok) {
        alert("Schedule successfully posted to Telegram!");
      } else {
        console.error("Telegram API Detail:", result);
        alert(`Telegram Error: ${result.description}`);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      alert("CORS or Connection Error. Check if your bot is an Admin in the channel.");
    } finally {
      setIsSendingTelegram(false);
    }
  };

  const generateAutoUrl = (match, serverNum) => {
    const slug = `${match.homeTeam?.name} vs ${match.awayTeam?.name}`.replace(/\s+/g, '-').toLowerCase();
    if (serverNum === 1) return btoa(`https://www.2embed.cc/embed/football/${slug}`);
    if (serverNum === 2) return btoa(`https://vidsrc.me/embed/football/${slug}`);
    if (serverNum === 3) return btoa(`https://embed.su/embed/football/${slug}`);
    return "";
  };

  const handleSyncAll = async () => {
    if (matches.length === 0) return;
    setIsUpdating(true);
    const batch = writeBatch(db);
    matches.forEach((match) => {
      const matchRef = doc(db, "matches", match.id);
      const updates = {};
      if (!match.streamUrl1) updates.streamUrl1 = generateAutoUrl(match, 1);
      if (!match.streamUrl2) updates.streamUrl2 = generateAutoUrl(match, 2);
      if (!match.streamUrl3) updates.streamUrl3 = generateAutoUrl(match, 3);
      if (Object.keys(updates).length > 0) batch.update(matchRef, updates);
    });
    try {
      await batch.commit();
      alert("Sync Complete!");
    } catch (e) {
      alert("Sync Failed");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearAllLinks = async () => {
    if (!window.confirm("Wipe all links?")) return;
    setIsUpdating(true);
    const batch = writeBatch(db);
    matches.forEach((match) => {
      batch.update(doc(db, "matches", match.id), { streamUrl1: "", streamUrl2: "", streamUrl3: "" });
    });
    await batch.commit();
    setIsUpdating(false);
    alert("All links wiped.");
  };

  const handleBan = async (idToBan) => {
    if(!idToBan) return;
    await setDoc(doc(db, "blacklist", idToBan), { reason: "Suspicious Activity", timestamp: new Date().toISOString() });
    setTargetId("");
  };

  const handleUnban = async (idToUnban) => {
    await deleteDoc(doc(db, "blacklist", idToUnban));
  };

  // --- RESTORED LOGIN PROTECTION ---
  if (!isAuthenticated) {
    return <AdminLogin onLogin={setIsAuthenticated} />;
  }

  return (
    <div className="min-h-screen p-4 md:p-10 font-sans text-white bg-[#050505]">
      <section className="mb-12">
        <div className="flex flex-col justify-between gap-4 mb-8 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <Tv className="text-red-600" size={28} />
            <div>
              <h2 className="text-2xl italic font-black tracking-tighter uppercase">Vortex Admin</h2>
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{matches.length} matches found</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={postToTelegram} 
              disabled={isSendingTelegram}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-[9px] uppercase transition-all shadow-lg ${isSendingTelegram ? 'bg-zinc-800 text-zinc-500' : 'bg-[#0088cc] hover:bg-[#0077b5] shadow-[#0088cc]/30'}`}
            >
              <Send size={14} className={isSendingTelegram ? "animate-pulse" : ""} /> 
              {isSendingTelegram ? "Sending..." : "Post To Telegram"}
            </button>
            <button onClick={handleSyncAll} className="flex items-center gap-2 px-5 py-3 rounded-xl font-black text-[9px] uppercase bg-emerald-600 hover:bg-emerald-500 transition-all">
              <RefreshCw size={14} className={isUpdating ? "animate-spin" : ""} /> Auto-Fill All
            </button>
            <button onClick={handleClearAllLinks} className="flex items-center gap-2 px-5 py-3 rounded-xl font-black text-[9px] uppercase bg-zinc-900 border border-red-900/30 text-red-500 hover:bg-red-900/10 transition-all">
              <Trash2 size={14} /> Wipe
            </button>
            <button onClick={handleLogout} className="p-3 transition-all border bg-zinc-900 border-white/5 rounded-xl text-zinc-500 hover:text-white">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <div className="grid gap-6">
          {matches.map((match) => (
            <div key={match.id} className="p-6 border bg-zinc-900/30 border-white/5 rounded-[2rem] hover:border-white/10 transition-all">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <img src={match.homeTeam?.logo} className="object-contain w-8 h-8" alt="" />
                  <div className="flex flex-col">
                    <span className="text-xs font-black tracking-tight uppercase">{match.homeTeam?.name} vs {match.awayTeam?.name}</span>
                    <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">{match.status} | {match.time || match.kickOffTime}</span>
                  </div>
                </div>
                <button onClick={() => {
                  const url = prompt("Force Override Server 1 (IPTV Link):");
                  if(url) handleUpdateStream(match.id, 1, url);
                }} className="px-3 py-1 bg-blue-600/10 border border-blue-600/20 rounded-full text-[8px] font-black text-blue-500 uppercase flex items-center gap-1">
                  <Zap size={10}/> Override S1
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-500 uppercase flex items-center gap-2 px-1 tracking-widest">
                      <Globe size={12} /> Server {num}
                    </label>
                    <input 
                      type="text"
                      placeholder="Paste Manual Link..."
                      className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-[10px] outline-none focus:border-red-600 transition-all text-zinc-300"
                      onBlur={(e) => handleUpdateStream(match.id, num, e.target.value)}
                    />
                    <div className="text-[8px] px-1">
                      {match[`streamUrl${num}`] ? (
                        <span className="flex items-center gap-1 font-bold uppercase text-emerald-500">
                           <ShieldCheck size={10}/> {match[`streamUrl${num}`].length > 100 ? "Auto-Ready" : "Manual Live"}
                        </span>
                      ) : (
                        <span className="uppercase text-zinc-700">∅ Not Synced</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="p-8 border bg-zinc-900/50 rounded-[2.5rem] border-white/5 max-w-xl">
        <h3 className="flex items-center gap-2 text-[10px] font-black uppercase text-red-600 tracking-widest mb-6"><UserX size={16}/> Security Blacklist</h3>
        <div className="flex gap-2 mb-6">
          <input type="text" placeholder="Enter User ID..." className="flex-1 p-4 text-xs text-white border outline-none bg-black/40 border-white/5 rounded-xl" value={targetId} onChange={(e) => setTargetId(e.target.value)}/>
          <button onClick={() => handleBan(targetId)} className="px-6 bg-red-600 rounded-xl text-[10px] font-black uppercase">Block</button>
        </div>
        <div className="space-y-2 overflow-y-auto max-h-48 custom-scrollbar">
          {bannedList.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 border bg-black/40 border-white/5 rounded-2xl">
              <span className="text-[10px] font-mono text-zinc-400">{user.id}</span>
              <button onClick={() => handleUnban(user.id)} className="text-[10px] font-black text-emerald-500 uppercase hover:text-white transition-colors">Revoke</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Admin;