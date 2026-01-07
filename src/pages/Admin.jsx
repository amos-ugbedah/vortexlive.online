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
    if (matches.length === 0) return alert("No matches found to post!");
    setIsSendingTelegram(true);

    const matchList = matches
      .map(m => `⚽️ *${m.homeTeam?.name} vs ${m.awayTeam?.name}*\n⏰ ${m.time || m.kickOffTime || 'TBD'}\n`)
      .join("\n");

    const text = `🏆 *TODAY'S LIVE FIXTURES* 🏆\n\n${matchList}\n🔥 *Watch every match in Ultra HD quality on our official platform below.*`;

    const keyboard = {
      inline_keyboard: [[{ text: "📺 WATCH LIVE NOW", url: "https://vortexlive.online" }]]
    };

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=${encodeURIComponent(text)}&parse_mode=Markdown&reply_markup=${encodeURIComponent(JSON.stringify(keyboard))}`;

    try {
      await fetch(url, { mode: 'no-cors' });
      alert("Broadcast request sent! Check Telegram.");
    } catch (error) {
      alert("Failed to send.");
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
    alert("Links cleared.");
  };

  const handleBan = async (idToBan) => {
    if(!idToBan) return;
    await setDoc(doc(db, "blacklist", idToBan), { reason: "Suspicious Activity", timestamp: new Date().toISOString() });
    setTargetId("");
  };

  const handleUnban = async (idToUnban) => {
    await deleteDoc(doc(db, "blacklist", idToUnban));
  };

  if (!isAuthenticated) return <AdminLogin onLogin={setIsAuthenticated} />;

  return (
    <div className="min-h-screen p-4 md:p-10 font-sans text-white bg-[#050505]">
      <div className="mx-auto max-w-7xl">
        
        {/* HEADER BAR */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 bg-zinc-900/40 p-8 rounded-[2.5rem] border border-white/5">
          <div className="flex items-center gap-4">
            <Tv className="text-red-600" size={32} />
            <div>
              <h2 className="text-3xl italic font-black tracking-tighter uppercase">Vortex Admin</h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{matches.length} matches found</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button onClick={postToTelegram} disabled={isSendingTelegram} className="flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-[10px] uppercase bg-[#0088cc] hover:bg-[#0077b5] transition-all">
              <Send size={16} /> {isSendingTelegram ? "Sending..." : "Post To Telegram"}
            </button>
            <button onClick={handleSyncAll} className="flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-[10px] uppercase bg-emerald-600 hover:bg-emerald-500 transition-all">
              <RefreshCw size={16} className={isUpdating ? "animate-spin" : ""} /> Sync Links
            </button>
            <button onClick={handleClearAllLinks} className="p-4 text-red-500 border bg-zinc-900 border-red-900/30 rounded-2xl hover:bg-red-900/10">
              <Trash2 size={20} />
            </button>
            <button onClick={handleLogout} className="p-4 border bg-zinc-900 border-white/5 rounded-2xl text-zinc-500 hover:text-white">
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* MATCH LIST SECTION - Fixed to ensure visibility */}
        <div className="grid grid-cols-1 gap-6 mb-20 lg:grid-cols-2">
          {matches.length > 0 ? (
            matches.map((match) => (
              <div key={match.id} className="p-6 border bg-zinc-900/30 border-white/5 rounded-[2.5rem] hover:border-white/10 transition-all">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <img src={match.homeTeam?.logo} className="object-contain w-10 h-10" alt="" />
                    <div className="flex flex-col">
                      <span className="text-sm font-black tracking-tight uppercase">{match.homeTeam?.name} vs {match.awayTeam?.name}</span>
                      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{match.time || match.kickOffTime}</span>
                    </div>
                  </div>
                  <button onClick={() => {
                    const url = prompt("Direct IPTV Link:");
                    if(url) handleUpdateStream(match.id, 1, url);
                  }} className="px-4 py-2 bg-blue-600/10 text-blue-500 rounded-xl text-[9px] font-black uppercase border border-blue-600/20">
                    Override
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {[1, 2, 3].map((num) => (
                    <div key={num} className="space-y-2">
                      <label className="text-[9px] font-black text-zinc-600 uppercase flex items-center gap-2 px-1">
                        <Globe size={12} /> Server {num}
                      </label>
                      <input 
                        type="text"
                        placeholder="Paste URL..."
                        className="w-full bg-black/60 border border-white/5 rounded-xl p-3 text-[10px] outline-none focus:border-red-600/50 transition-all text-zinc-400"
                        onBlur={(e) => handleUpdateStream(match.id, num, e.target.value)}
                      />
                      <div className="px-1 text-[8px] font-bold uppercase">
                        {match[`streamUrl${num}`] ? <span className="text-emerald-500">● Live</span> : <span className="text-zinc-800">○ Offline</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full p-20 text-center bg-zinc-900/20 rounded-[3rem] border border-dashed border-white/5">
              <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em]">Waiting for match data from Firebase...</p>
            </div>
          )}
        </div>

        {/* SECURITY PANEL */}
        <div className="p-10 border bg-zinc-900/20 rounded-[3rem] border-white/5 max-w-xl mx-auto">
          <h3 className="flex items-center gap-3 text-[11px] font-black uppercase text-red-600 tracking-widest mb-8"><UserX size={20}/> Blacklist Management</h3>
          <div className="flex gap-3 mb-8">
            <input type="text" placeholder="User ID..." className="flex-1 p-4 text-xs text-white border outline-none bg-black/60 border-white/5 rounded-2xl" value={targetId} onChange={(e) => setTargetId(e.target.value)}/>
            <button onClick={() => handleBan(targetId)} className="px-8 bg-red-600 rounded-2xl text-[11px] font-black uppercase">Ban</button>
          </div>
          <div className="space-y-2 overflow-y-auto max-h-48 custom-scrollbar">
            {bannedList.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border bg-black/40 border-white/5 rounded-2xl">
                <span className="text-[10px] font-mono text-zinc-500">{user.id}</span>
                <button onClick={() => handleUnban(user.id)} className="text-[10px] font-black text-emerald-500 uppercase">Revoke</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admin;