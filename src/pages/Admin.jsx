import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase"; 
import { collection, doc, updateDoc, onSnapshot, setDoc, deleteDoc, query, orderBy, writeBatch } from "firebase/firestore";
import { ShieldAlert, UserX, ShieldCheck, Tv, Globe, RefreshCw, Zap, LogOut, Send } from "lucide-react";
import AdminLogin from "./AdminLogin";

function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [matches, setMatches] = useState([]);
  const [bannedList, setBannedList] = useState([]);
  const [targetId, setTargetId] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);

  // --- CONFIGURATION ---
  const TELEGRAM_BOT_TOKEN = "YOUR_BOT_TOKEN_HERE";
  const TELEGRAM_CHAT_ID = "@YOUR_CHANNEL_USERNAME"; // or ID

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

  // --- TELEGRAM POSTING LOGIC ---
  const postToTelegram = async () => {
    if (matches.length === 0) return alert("No matches to post!");
    setIsSendingTelegram(true);

    // Format the match list
    const matchList = matches
      .map(m => `⚽️ *${m.homeTeam?.name} vs ${m.awayTeam?.name}*\n⏰ Time: ${m.time || m.kickOffTime || 'TBD'}\n`)
      .join("\n");

    const message = `
🏆 *TODAY'S LIVE FIXTURES* 🏆
-----------------------------------------
${matchList}
-----------------------------------------
📺 *WATCH LIVE IN HD:*
👉 https://vortexlive.online

🔔 *Join our channel for more updates!*
⚠️ *Please stake responsibly.*
    `;

    try {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'Markdown',
        }),
      });

      if (response.ok) {
        alert("Schedule posted to Telegram successfully!");
      } else {
        throw new Error("Telegram API Error");
      }
    } catch (error) {
      alert("Failed to send to Telegram. Check your Token and Chat ID.");
    } finally {
      setIsSendingTelegram(false);
    }
  };

  const generateUrl = (match) => {
    const slug = `${match.homeTeam.name} vs ${match.awayTeam.name}`.replace(/\s+/g, '-').toLowerCase();
    return `https://vidsrc.me/embed/football/${slug}`;
  };

  const handleSyncAll = async () => {
    if (matches.length === 0) return;
    setIsUpdating(true);
    const batch = writeBatch(db);

    matches.forEach((match) => {
      const autoUrl = btoa(generateUrl(match));
      const matchRef = doc(db, "matches", match.id);
      batch.update(matchRef, { 
        streamUrl1: autoUrl,
        streamUrl2: autoUrl 
      });
    });

    try {
      await batch.commit();
      alert("All matches synced successfully!");
    } catch (e) {
      alert("Batch Sync Failed");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBan = async (idToBan) => {
    if(!idToBan) return;
    await setDoc(doc(db, "blacklist", idToBan), { reason: "Suspicious Activity", timestamp: new Date().toISOString() });
    setTargetId("");
  };

  const handleUnban = async (idToUnban) => {
    await deleteDoc(doc(db, "blacklist", idToUnban));
  };

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
              <h2 className="text-2xl italic font-black tracking-tighter uppercase">Broadcast Hub</h2>
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Live Data: {matches.length} Matches</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* NEW TELEGRAM BUTTON */}
            <button 
              onClick={postToTelegram}
              disabled={isSendingTelegram}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isSendingTelegram ? 'bg-zinc-800 text-zinc-500' : 'bg-[#0088cc] hover:bg-[#0077b5] text-white shadow-[0_0_20px_rgba(0,136,204,0.3)]'}`}
            >
              <Send size={14} className={isSendingTelegram ? "animate-pulse" : ""} />
              {isSendingTelegram ? "Posting..." : "Post Schedule"}
            </button>

            <button 
              onClick={handleSyncAll}
              disabled={isUpdating}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isUpdating ? 'bg-zinc-800 text-zinc-500' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]'}`}
            >
              <RefreshCw size={14} className={isUpdating ? "animate-spin" : ""} />
              {isUpdating ? "Syncing..." : "Sync All"}
            </button>
            
            <button 
              onClick={handleLogout}
              className="p-3 transition-all border bg-zinc-900 border-white/5 rounded-xl text-zinc-500 hover:text-red-500 hover:border-red-500/30"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <div className="grid gap-6">
          {matches.map((match) => (
            <div key={match.id} className="p-6 border bg-zinc-900/30 border-white/5 rounded-[2rem] glass-card transition-all hover:border-white/10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <img src={match.homeTeam?.logo} className="object-contain w-8 h-8" alt="" />
                  <div className="flex flex-col">
                    <span className="text-xs font-black uppercase">{match.homeTeam?.name} vs {match.awayTeam?.name}</span>
                    <span className="text-[8px] text-zinc-500 font-bold uppercase">{match.time || match.kickOffTime}</span>
                  </div>
                </div>
                <button onClick={() => {
                  const url = prompt("Paste GitHub M3U8 Link:");
                  if(url) handleUpdateStream(match.id, 1, url);
                }} className="px-3 py-1 bg-blue-600/10 border border-blue-600/20 rounded-full text-[8px] font-black text-blue-500 uppercase flex items-center gap-1">
                  <Zap size={10}/> IPTV
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-500 uppercase flex items-center gap-2 px-1">
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
                           <ShieldCheck size={10}/> Link Active
                        </span>
                      ) : (
                        <span className="uppercase text-zinc-700">∅ Offline</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECURITY PANEL */}
      <div className="p-8 border bg-zinc-900/50 rounded-[2.5rem] border-white/5 max-w-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="flex items-center gap-2 text-[10px] font-black uppercase text-red-600 tracking-widest"><UserX size={16}/> Security Blacklist</h3>
          <span className="text-[10px] bg-red-600/10 text-red-500 px-3 py-1 rounded-full font-bold">{bannedList.length} BANNED</span>
        </div>
        <div className="flex gap-2 mb-6">
          <input type="text" placeholder="Enter User ID..." className="flex-1 p-4 text-xs text-white border outline-none bg-black/40 border-white/5 rounded-xl" value={targetId} onChange={(e) => setTargetId(e.target.value)}/>
          <button onClick={() => handleBan(targetId)} className="px-6 bg-red-600 rounded-xl text-[10px] font-black uppercase">Block</button>
        </div>
        <div className="pr-2 space-y-2 overflow-y-auto max-h-48 custom-scrollbar">
          {bannedList.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 border bg-black/40 border-white/5 rounded-2xl">
              <span className="text-[10px] font-mono text-zinc-400">{user.id}</span>
              <button onClick={() => handleUnban(user.id)} className="text-[10px] font-black text-emerald-500 hover:text-white uppercase">Revoke</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Admin;