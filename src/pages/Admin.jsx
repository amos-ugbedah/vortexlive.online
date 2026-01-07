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
  
  // PASTE YOUR NUMERIC ID HERE (e.g., "-1002418579730")
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

  // --- FINAL STABLE TELEGRAM LOGIC ---
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
        console.error("Telegram API Error:", result);
        alert(`Telegram Error: ${result.description}`);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      alert("Connection failed. Check your internet or numeric ID.");
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

  if (!isAuthenticated) return <AdminLogin onLogin={setIsAuthenticated} />;

  return (
    <div className="min-h-screen p-4 md:p-10 font-sans text-white bg-[#050505]">
      {/* UI remains the same as your provided code */}
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
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-[9px] uppercase transition-all shadow-lg ${isSendingTelegram ? 'bg-zinc-800 text-zinc-500' : 'bg-[#0088cc] hover:bg-[#0077b5] shadow-[#0088cc]/20'}`}
            >
              <Send size={14} className={isSendingTelegram ? "animate-pulse" : ""} /> 
              {isSendingTelegram ? "Sending..." : "Post To Telegram"}
            </button>
            <button onClick={handleSyncAll} className="flex items-center gap-2 px-5 py-3 rounded-xl font-black text-[9px] uppercase bg-emerald-600 hover:bg-emerald-500 transition-all">
              <RefreshCw size={14} className={isUpdating ? "animate-spin" : ""} /> Auto-Fill All
            </button>
            <button onClick={handleLogout} className="p-3 transition-all border bg-zinc-900 border-white/5 rounded-xl text-zinc-500 hover:text-white">
              <LogOut size={18} />
            </button>
          </div>
        </div>
        {/* ... Rest of Match Mapping UI ... */}
      </section>
    </div>
  );
}

export default Admin;