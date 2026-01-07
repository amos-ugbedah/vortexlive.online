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

  // --- OPTIMIZED TELEGRAM BROADCAST ---
  const postToTelegram = async () => {
    if (matches.length === 0) return alert("No matches found!");
    setIsSendingTelegram(true);

    const dateStr = new Date().toISOString().split('T')[0];
    const matchList = matches
      .map(m => `⏰ ${m.time || m.kickOffTime || 'TBD'} | *${m.homeTeam?.name} vs ${m.awayTeam?.name}*\n🔗 [Watch Now](https://vortexlive.online)\n`)
      .join("\n");

    const text = `📅 *TODAY'S TOP FIXTURES* (${dateStr})\n\n${matchList}\n🔥 *Stream every match live in HD below!*`;

    // Inline Keyboard "Big Button"
    const keyboard = {
      inline_keyboard: [[{ text: "📺 WATCH LIVE NOW", url: "https://vortexlive.online" }]]
    };

    try {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: text,
          parse_mode: 'Markdown',
          reply_markup: keyboard,
          disable_web_page_preview: true
        })
      });

      const result = await response.json();
      if (result.ok) {
        alert("Broadcast successfully posted!");
      } else {
        alert(`Telegram Error: ${result.description}`);
      }
    } catch (error) {
      alert("Network error. Check your connection or browser security settings.");
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
    await setDoc(doc(db, "blacklist", idToBan), { reason: "Security Policy", timestamp: new Date().toISOString() });
    setTargetId("");
  };

  const handleUnban = async (idToUnban) => {
    await deleteDoc(doc(db, "blacklist", idToUnban));
  };

  if (!isAuthenticated) return <AdminLogin onLogin={setIsAuthenticated} />;

  return (
    <div className="min-h-screen p-4 md:p-10 font-sans text-white bg-[#050505]">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER BAR */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 bg-zinc-900/40 p-8 rounded-[2.5rem] border border-white/5">
          <div className="flex items-center gap-4">
            <Tv className="text-red-600" size={32} />
            <div>
              <h2 className="text-3xl italic font-black leading-none tracking-tighter uppercase">Vortex Control</h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1">{matches.length} Matches Found</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button onClick={postToTelegram} disabled={isSendingTelegram} className="flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-[10px] uppercase bg-[#0088cc] hover:bg-[#0077b5] transition-all shadow-lg shadow-[#0088cc]/20">
              <Send size={16} className={isSendingTelegram ? "animate-pulse" : ""} /> 
              {isSendingTelegram ? "Posting..." : "Push Telegram"}
            </button>
            <button onClick={handleSyncAll} className="flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-[10px] uppercase bg-emerald-600 hover:bg-emerald-500 transition-all">
              <RefreshCw size={16} className={isUpdating ? "animate-spin" : ""} /> Sync All
            </button>
            <button onClick={handleClearAllLinks} className="p-4 text-red-500 transition-all border bg-zinc-900 border-red-900/30 rounded-2xl hover:bg-red-900/10">
              <Trash2 size={20} />
            </button>
            <button onClick={handleLogout} className="p-4 transition-all border bg-zinc-900 border-white/5 rounded-2xl text-zinc-500 hover:text-white">
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* MATCH LISTING */}
        <div className="grid grid-cols-1 gap-6 mb-20 md:grid-cols-2 lg:grid-cols-2">
          {matches.map((match) => (
            <div key={match.id} className="p-6 border bg-zinc-900/20 border-white/5 rounded-[2.5rem] hover:border-white/10 transition-all group">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 p-2 border bg-black/40 rounded-2xl border-white/5">
                    <img src={match.homeTeam?.logo} className="object-contain w-full h-full" alt="" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black tracking-tight uppercase">{match.homeTeam?.name} vs {match.awayTeam?.name}</span>
                    <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">{match.time || match.kickOffTime}</span>
                  </div>
                </div>
                <button onClick={() => {
                  const url = prompt("Direct IPTV / M3U8 Link:");
                  if(url) handleUpdateStream(match.id, 1, url);
                }} className="px-4 py-2 bg-blue-600/10 text-blue-500 rounded-xl text-[9px] font-black uppercase border border-blue-600/20 hover:bg-blue-600 hover:text-white transition-all">
                  <Zap size={10} className="inline mr-1 mb-0.5"/> S1 Override
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="space-y-2">
                    <label className="text-[8px] font-black text-zinc-700 uppercase px-1 flex items-center gap-1">
                      <Globe size={10}/> Server {num}
                    </label>
                    <input 
                      type="text"
                      placeholder="Paste Link"
                      className="w-full bg-black/60 border border-white/5 rounded-xl p-3 text-[10px] outline-none focus:border-red-600/50 transition-all text-zinc-400 placeholder:text-zinc-800"
                      onBlur={(e) => handleUpdateStream(match.id, num, e.target.value)}
                    />
                    <div className="text-[8px] text-center font-bold">
                      {match[`streamUrl${num}`] ? (
                        <span className="flex items-center justify-center gap-1 text-emerald-500">
                          <ShieldCheck size={10}/> READY
                        </span>
                      ) : (
                        <span className="text-zinc-800">NO LINK</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* SECURITY BLACKLIST */}
        <div className="p-8 border bg-zinc-900/40 rounded-[3rem] border-white/5 max-w-xl mx-auto mb-10">
          <h3 className="flex items-center gap-3 text-[11px] font-black uppercase text-red-600 tracking-widest mb-8">
            <UserX size={18}/> Security Blacklist
          </h3>
          <div className="flex gap-3 mb-8">
            <input 
              type="text" 
              placeholder="Enter User Token ID..." 
              className="flex-1 p-4 text-xs text-white transition-all border outline-none bg-black/60 border-white/5 rounded-2xl focus:border-red-600/50" 
              value={targetId} 
              onChange={(e) => setTargetId(e.target.value)}
            />
            <button onClick={() => handleBan(targetId)} className="px-8 bg-red-600 rounded-2xl text-[11px] font-black uppercase hover:bg-red-500 transition-all shadow-lg shadow-red-600/20">
              Block
            </button>
          </div>
          <div className="pr-2 space-y-2 overflow-y-auto max-h-48 custom-scrollbar">
            {bannedList.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border bg-black/40 border-white/5 rounded-2xl group">
                <span className="text-[10px] font-mono text-zinc-500 group-hover:text-zinc-300 transition-colors">{user.id}</span>
                <button onClick={() => handleUnban(user.id)} className="text-[10px] font-black text-emerald-500 uppercase hover:text-white transition-all">
                  Revoke
                </button>
              </div>
            ))}
            {bannedList.length === 0 && (
              <p className="text-[10px] text-center text-zinc-700 font-bold uppercase py-4">No active bans</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admin;