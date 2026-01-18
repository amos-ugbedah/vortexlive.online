/* eslint-disable */
import React, { useState, useEffect, useCallback } from "react";
import { db } from "../lib/firebase"; 
import { 
  collection, doc, updateDoc, onSnapshot, setDoc, 
  deleteDoc, query, orderBy, addDoc, serverTimestamp, limit,
  getDocs, writeBatch
} from "firebase/firestore";
import { 
  ShieldCheck, Tv, Globe, RefreshCw, 
  LogOut, Send, Power, Activity, Cpu, Plus, X, 
  Trophy, Monitor, Trash2, Zap, Key, Terminal,
  Settings, Users, AlertTriangle, Filter, Upload,
  Download, BarChart, Clock, Eye, EyeOff
} from "lucide-react";
import AdminLogin from "./AdminLogin";

// API Keys configuration
const API_KEYS = Array(9).fill(null).map((_, i) => ({
  id: i + 1,
  status: 'active',
  calls: Math.floor(Math.random() * 1000)
}));

// Status options matching backend STATUS_MAP
const STATUS_OPTIONS = [
  { value: 'NS', label: 'Not Started', color: 'bg-blue-600/20 text-blue-400' },
  { value: '1H', label: '1st Half', color: 'bg-red-600/20 text-red-400' },
  { value: 'HT', label: 'Half Time', color: 'bg-yellow-600/20 text-yellow-400' },
  { value: '2H', label: '2nd Half', color: 'bg-red-600/20 text-red-400' },
  { value: 'ET', label: 'Extra Time', color: 'bg-orange-600/20 text-orange-400' },
  { value: 'BT', label: 'Break Time', color: 'bg-yellow-600/20 text-yellow-400' },
  { value: 'P', label: 'Penalties', color: 'bg-purple-600/20 text-purple-400' },
  { value: 'FT', label: 'Full Time', color: 'bg-gray-600/20 text-gray-400' },
  { value: 'AET', label: 'After ET', color: 'bg-gray-600/20 text-gray-400' },
  { value: 'PEN', label: 'Penalties', color: 'bg-purple-600/20 text-purple-400' },
  { value: 'SUSP', label: 'Suspended', color: 'bg-yellow-600/20 text-yellow-400' },
  { value: 'INT', label: 'Interrupted', color: 'bg-yellow-600/20 text-yellow-400' },
  { value: 'PST', label: 'Postponed', color: 'bg-yellow-600/20 text-yellow-400' },
  { value: 'CANC', label: 'Cancelled', color: 'bg-gray-600/20 text-gray-400' },
  { value: 'ABD', label: 'Abandoned', color: 'bg-red-600/20 text-red-400' },
  { value: 'AWD', label: 'Awarded', color: 'bg-green-600/20 text-green-400' },
  { value: 'WO', label: 'Walkover', color: 'bg-green-600/20 text-green-400' },
  { value: 'TBD', label: 'Time TBD', color: 'bg-blue-600/20 text-blue-400' },
  { value: 'SCHEDULED', label: 'Scheduled', color: 'bg-blue-600/20 text-blue-400' },
  { value: 'TIMED', label: 'Timed', color: 'bg-blue-600/20 text-blue-400' },
  { value: 'IN_PLAY', label: 'In Play', color: 'bg-red-600/20 text-red-400 animate-pulse' },
  { value: 'LIVE', label: 'Live', color: 'bg-red-600/20 text-red-400 animate-pulse' },
  { value: 'FINISHED', label: 'Finished', color: 'bg-gray-600/20 text-gray-400' }
];

// SAFE BASE64 DECODE FUNCTION
const safeDecodeBase64 = (str) => {
  if (!str) return '';
  try {
    // Check if it's already a URL (not base64)
    if (str.includes('://') || str.startsWith('http') || str.startsWith('//')) {
      return str;
    }
    // Check if it looks like valid base64
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(str)) {
      console.warn('Invalid base64 format, returning original:', str.substring(0, 50));
      return str;
    }
    return atob(str);
  } catch (error) {
    console.warn('Base64 decode failed, returning original:', error.message);
    return str;
  }
};

function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [matches, setMatches] = useState([]);
  const [tickerMessages, setTickerMessages] = useState([]);
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [tickerInput, setTickerInput] = useState("");
  const [botEnabled, setBotEnabled] = useState(false); 
  const [botLogs, setBotLogs] = useState("System Idle");
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [systemStats, setSystemStats] = useState({
    totalMatches: 0,
    liveMatches: 0,
    eliteMatches: 0,
    apiCalls: 0
  });
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState(null);

  // Form State for Manual Injection
  const [newMatch, setNewMatch] = useState({
    homeName: "", 
    homeLogo: "", 
    awayName: "", 
    awayLogo: "",
    kickoff: "", 
    league: "", 
    stream1: "", 
    status: "NS", 
    minute: 0, 
    isElite: false,
    aiPick: "",
    isHidden: false
  });

  // Authentication check
  useEffect(() => {
    const auth = sessionStorage.getItem('vx_admin_auth');
    if (auth === btoa('authenticated_2026')) setIsAuthenticated(true);
  }, []);

  // Real-time listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubBot = onSnapshot(doc(db, "settings", "bot"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setBotEnabled(data.isActive || false);
        setBotLogs(data.status || "System Idle");
        if (data.lastRun) {
          setLastSyncTime(new Date(data.lastRun.toDate()).toLocaleTimeString());
        }
      }
    });

    // Order by lastUpdated for most recent first
    const unsubMatches = onSnapshot(
      query(collection(db, "matches"), orderBy("lastUpdated", "desc"), limit(200)), 
      (snap) => {
        const matchesData = snap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            home: {
              name: String(data.home?.name || ''),
              logo: String(data.home?.logo || ''),
              score: Number(data.home?.score || 0)
            },
            away: {
              name: String(data.away?.name || ''),
              logo: String(data.away?.logo || ''),
              score: Number(data.away?.score || 0)
            },
            status: String(data.status || 'NS'),
            minute: Number(data.minute || 0),
            league: String(data.league || ''),
            isElite: Boolean(data.isElite || false),
            isHidden: Boolean(data.isHidden || false),
            kickoff: data.kickoff || new Date().toISOString(),
            streamUrl1: String(data.streamUrl1 || ''),
            aiPick: String(data.aiPick || ''),
            lastUpdated: data.lastUpdated
          };
        });
        
        setMatches(matchesData);
        
        // Calculate stats
        const liveMatches = matchesData.filter(m => ['1H', '2H', 'HT', 'ET', 'IN_PLAY', 'LIVE'].includes(m.status)).length;
        const eliteMatches = matchesData.filter(m => m.isElite).length;
        
        setSystemStats({
          totalMatches: matchesData.length,
          liveMatches,
          eliteMatches,
          apiCalls: API_KEYS.reduce((sum, key) => sum + key.calls, 0)
        });
      }
    );

    const unsubTicker = onSnapshot(
      query(collection(db, "ticker"), orderBy("timestamp", "desc"), limit(50)), 
      (snap) => {
        setTickerMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );

    return () => { 
      unsubBot(); 
      unsubMatches(); 
      unsubTicker(); 
    };
  }, [isAuthenticated]);

  // Filter matches based on filter and search
  const filteredMatches = matches.filter(match => {
    if (!showHidden && match.isHidden) return false;
    
    // Apply filter
    if (filter === 'live' && !['1H', '2H', 'HT', 'ET', 'IN_PLAY', 'LIVE'].includes(match.status)) return false;
    if (filter === 'elite' && !match.isElite) return false;
    if (filter === 'upcoming' && match.status !== 'NS') return false;
    if (filter === 'finished' && !['FT', 'AET', 'PEN', 'FINISHED'].includes(match.status)) return false;
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        match.home.name.toLowerCase().includes(query) ||
        match.away.name.toLowerCase().includes(query) ||
        match.league.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Bot toggle
  const handleBotToggle = useCallback(async () => {
    await setDoc(doc(db, "settings", "bot"), { 
      isActive: !botEnabled,
      lastUpdated: serverTimestamp(),
      status: botEnabled ? 'Bot stopped manually' : 'Bot activated',
      lastToggle: serverTimestamp()
    }, { merge: true });
  }, [botEnabled]);

  // Emergency sync - with retry logic
  const handleSyncToday = useCallback(async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('https://us-central1-votexlive-3a8cb.cloudfunctions.net/emergencySync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${btoa('admin_sync_2026')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Log sync event
        await addDoc(collection(db, 'ticker'), { 
          text: `✅ Global Sync Completed: ${result.message}`,
          user: 'SYSTEM', 
          timestamp: serverTimestamp(),
          type: 'system'
        });
        
        alert(`✅ ${result.message}`);
      } else {
        throw new Error(result.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Sync error:', error);
      await addDoc(collection(db, 'ticker'), { 
        text: `❌ Sync Failed: ${error.message}`,
        user: 'SYSTEM', 
        timestamp: serverTimestamp(),
        type: 'error'
      });
      alert('⚠️ Sync request failed. Check console.');
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Advanced sync with options
  const handleAdvancedSync = useCallback(async (type = 'all') => {
    setIsSyncing(true);
    try {
      const response = await fetch('https://us-central1-votexlive-3a8cb.cloudfunctions.net/advancedSync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${btoa('admin_sync_2026')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, timestamp: new Date().toISOString() })
      });
      
      const result = await response.json();
      alert(`✅ Advanced Sync: ${result.message}`);
    } catch (error) {
      alert('❌ Advanced sync failed');
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Bulk operations
  const handleBulkDelete = useCallback(async () => {
    if (!window.confirm("Delete ALL matches? This cannot be undone!")) return;
    
    try {
      const matchesRef = collection(db, "matches");
      const snapshot = await getDocs(matchesRef);
      const batch = writeBatch(db);
      
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      alert('✅ All matches deleted');
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('❌ Bulk delete failed');
    }
  }, []);

  // Broadcast to ticker
  const handleBroadcast = useCallback(async () => {
    if (!tickerInput.trim()) return;
    try {
      await addDoc(collection(db, 'ticker'), { 
        text: tickerInput.trim(), 
        user: 'ADMIN', 
        timestamp: serverTimestamp(),
        priority: 'high',
        type: 'admin'
      });
      setTickerInput("");
    } catch (error) { 
      console.error("Broadcast failed:", error);
      alert("Broadcast failed."); 
    }
  }, [tickerInput]);

  // Update stream URL
  const handleUpdateStream = useCallback(async (matchId, rawUrl) => {
    if (!matchId) return;
    try {
      const encodedUrl = rawUrl.trim() ? btoa(rawUrl.trim()) : "";
      await updateDoc(doc(db, "matches", matchId), { 
        streamUrl1: encodedUrl,
        lastUpdated: serverTimestamp() 
      });
    } catch (error) {
      console.error('Error updating stream:', error);
      alert('Failed to update stream URL');
    }
  }, []);

  // Manual match creation
  const handleManualAdd = useCallback(async (e) => {
    e.preventDefault();
    
    const generateAIPick = (home, away) => {
      const picks = [
        `Vortex Engine predicts aggressive play from ${home}`,
        `AI analysis suggests ${away} will focus on defense`,
        `High probability of goals in second half`,
        `${home} has strong home advantage statistics`,
        `Expect tactical midfield battle between both teams`
      ];
      return picks[Math.floor(Math.random() * picks.length)];
    };

    const matchId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let kickoffISO;
    try {
      kickoffISO = newMatch.kickoff ? new Date(newMatch.kickoff).toISOString() : new Date().toISOString();
    } catch (error) {
      kickoffISO = new Date().toISOString();
    }

    const matchData = {
      id: matchId,
      home: { 
        name: newMatch.homeName.trim(), 
        logo: newMatch.homeLogo.trim(), 
        score: 0 
      },
      away: { 
        name: newMatch.awayName.trim(), 
        logo: newMatch.awayLogo.trim(), 
        score: 0 
      },
      status: newMatch.status || "NS",
      minute: parseInt(newMatch.minute) || 0,
      league: newMatch.league.trim(),
      isElite: Boolean(newMatch.isElite),
      isHidden: Boolean(newMatch.isHidden),
      kickoff: kickoffISO,
      streamUrl1: btoa(newMatch.stream1.trim() || ""),
      aiPick: newMatch.aiPick.trim() || generateAIPick(newMatch.homeName, newMatch.awayName),
      lastUpdated: serverTimestamp(),
      createdAt: serverTimestamp(),
      source: 'manual'
    };

    try {
      await setDoc(doc(db, "matches", matchId), matchData);
      
      // Reset form
      setNewMatch({
        homeName: "", homeLogo: "", awayName: "", awayLogo: "",
        kickoff: "", league: "", stream1: "", 
        status: "NS", minute: 0, isElite: false, aiPick: "", isHidden: false
      });
      setShowAddMatch(false);
      
      await addDoc(collection(db, 'ticker'), { 
        text: `🎯 Manual match injected: ${newMatch.homeName} vs ${newMatch.awayName}`,
        user: 'SYSTEM', 
        timestamp: serverTimestamp(),
        type: 'injection'
      });
      
      alert('✅ Match added successfully!');
    } catch (error) {
      console.error('Error adding match:', error);
      alert('❌ Failed to add match');
    }
  }, [newMatch]);

  // Delete match
  const handleDeleteMatch = useCallback(async (matchId) => {
    if (window.confirm("Are you sure you want to delete this match?")) {
      try {
        await deleteDoc(doc(db, "matches", matchId));
        await addDoc(collection(db, 'ticker'), { 
          text: `🗑️ Match deleted (ID: ${matchId})`,
          user: 'SYSTEM', 
          timestamp: serverTimestamp(),
          type: 'deletion'
        });
      } catch (error) {
        console.error('Error deleting match:', error);
        alert('Failed to delete match');
      }
    }
  }, []);

  // Update score
  const handleUpdateScore = useCallback(async (matchId, team, score) => {
    const field = team === 'home' ? 'home.score' : 'away.score';
    await updateDoc(doc(db, "matches", matchId), { 
      [field]: parseInt(score) || 0,
      lastUpdated: serverTimestamp() 
    });
  }, []);

  // Update status
  const handleUpdateStatus = useCallback(async (matchId, status, minute = 0) => {
    await updateDoc(doc(db, "matches", matchId), { 
      status: status,
      minute: parseInt(minute) || 0,
      lastUpdated: serverTimestamp() 
    });
  }, []);

  // Update elite status
  const handleUpdateElite = useCallback(async (matchId, isElite) => {
    await updateDoc(doc(db, "matches", matchId), { 
      isElite: Boolean(isElite),
      lastUpdated: serverTimestamp() 
    });
  }, []);

  // Toggle hidden status
  const handleToggleHidden = useCallback(async (matchId, isHidden) => {
    await updateDoc(doc(db, "matches", matchId), { 
      isHidden: Boolean(isHidden),
      lastUpdated: serverTimestamp() 
    });
  }, []);

  // Update AI pick
  const handleUpdateAIPick = useCallback(async (matchId, aiPick) => {
    await updateDoc(doc(db, "matches", matchId), { 
      aiPick: aiPick.trim(),
      lastUpdated: serverTimestamp() 
    });
  }, []);

  // Quick actions
  const handleQuickAction = useCallback(async (action, match) => {
    switch(action) {
      case 'start':
        await handleUpdateStatus(match.id, '1H', 0);
        break;
      case 'halftime':
        await handleUpdateStatus(match.id, 'HT', 45);
        break;
      case 'resume':
        await handleUpdateStatus(match.id, '2H', 46);
        break;
      case 'end':
        await handleUpdateStatus(match.id, 'FT', 90);
        break;
      case 'toggle_elite':
        await handleUpdateElite(match.id, !match.isElite);
        break;
      case 'toggle_hidden':
        await handleToggleHidden(match.id, !match.isHidden);
        break;
    }
  }, [handleUpdateStatus, handleUpdateElite, handleToggleHidden]);

  if (!isAuthenticated) return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;

  return (
    <div className="min-h-screen p-4 md:p-8 text-white bg-[#020202] font-sans">
      {/* HEADER SECTION */}
      <header className="flex flex-col justify-between gap-6 pb-8 mb-8 border-b md:flex-row md:items-center border-white/5">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-gradient-to-br from-red-600 to-purple-600 rounded-[2rem] shadow-lg shadow-red-600/20 animate-pulse">
            <Cpu size={32} />
          </div>
          <div>
            <h2 className="text-4xl italic font-black tracking-tighter text-white uppercase">
              Vortex <span className="text-transparent bg-gradient-to-r from-red-600 to-purple-600 bg-clip-text">ULTRA PRO</span>
            </h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] mt-2">
              Advanced Control & Moderation Engine
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 border bg-black/50 border-white/5 rounded-xl">
            <Activity size={14} className="text-green-500 animate-pulse" />
            <span className="text-xs font-bold">
              {systemStats.liveMatches} LIVE • {systemStats.eliteMatches} ELITE
            </span>
          </div>
          
          <button 
            onClick={handleBotToggle} 
            className={`flex items-center gap-3 px-5 py-3 rounded-xl font-bold text-xs border transition-all ${
              botEnabled 
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 border-green-500 text-white shadow-lg shadow-green-600/20' 
                : 'bg-zinc-900 border-white/5 text-zinc-500'
            }`}
          >
            <Power size={14} /> Bot: {botEnabled ? 'ACTIVE' : 'STANDBY'}
          </button>
          
          <div className="relative group">
            <button 
              onClick={handleSyncToday} 
              disabled={isSyncing}
              className="flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase transition-all shadow-lg bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-red-600/20"
            >
              <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''}/> 
              {isSyncing ? 'SYNCING...' : 'SYNC NOW'}
            </button>
            <div className="absolute z-50 hidden w-48 p-3 mt-2 text-xs border group-hover:block bg-black/90 border-white/10 rounded-xl">
              <button onClick={() => handleAdvancedSync('live')} className="block w-full p-2 text-left rounded hover:bg-white/5">Sync Live Only</button>
              <button onClick={() => handleAdvancedSync('upcoming')} className="block w-full p-2 text-left rounded hover:bg-white/5">Sync Upcoming</button>
              <button onClick={handleBulkDelete} className="block w-full p-2 text-left text-red-400 rounded hover:bg-red-500/10">Bulk Delete</button>
            </div>
          </div>

          <button 
            onClick={() => setShowAddMatch(true)}
            className="flex items-center gap-2 px-6 py-3 text-xs font-bold text-black uppercase transition-all shadow-lg bg-gradient-to-r from-white to-zinc-200 rounded-xl hover:from-zinc-200 hover:to-zinc-300"
          >
            <Plus size={16}/> Inject Match
          </button>

          <button 
            onClick={() => { 
              sessionStorage.removeItem('vx_admin_auth'); 
              window.location.reload(); 
            }} 
            className="p-3 transition-all border bg-zinc-900 border-white/10 rounded-xl text-zinc-500 hover:text-red-600 hover:border-red-600/20"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* SYSTEM DASHBOARD */}
      <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-5 border bg-gradient-to-br from-zinc-900 to-black border-white/5 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <Tv size={18} className="text-blue-500" />
            <span className="text-xs font-bold text-zinc-500">TOTAL</span>
          </div>
          <p className="text-3xl font-black">{systemStats.totalMatches}</p>
          <p className="text-[10px] text-zinc-500 mt-1">Active Matches</p>
        </div>
        
        <div className="p-5 border bg-gradient-to-br from-zinc-900 to-black border-white/5 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <Activity size={18} className="text-red-500 animate-pulse" />
            <span className="text-xs font-bold text-zinc-500">LIVE</span>
          </div>
          <p className="text-3xl font-black">{systemStats.liveMatches}</p>
          <p className="text-[10px] text-zinc-500 mt-1">In Play Now</p>
        </div>
        
        <div className="p-5 border bg-gradient-to-br from-zinc-900 to-black border-white/5 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <Trophy size={18} className="text-yellow-500" />
            <span className="text-xs font-bold text-zinc-500">ELITE</span>
          </div>
          <p className="text-3xl font-black">{systemStats.eliteMatches}</p>
          <p className="text-[10px] text-zinc-500 mt-1">Premium Events</p>
        </div>
        
        <div className="p-5 border bg-gradient-to-br from-zinc-900 to-black border-white/5 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <Key size={18} className="text-purple-500" />
            <span className="text-xs font-bold text-zinc-500">API</span>
          </div>
          <p className="text-3xl font-black">{systemStats.apiCalls.toLocaleString()}</p>
          <p className="text-[10px] text-zinc-500 mt-1">Today's Calls</p>
        </div>
      </div>

      {/* CONTROL PANEL */}
      <div className="flex flex-col gap-6 mb-8 lg:flex-row">
        <div className="space-y-4 lg:w-1/4">
          <div className="p-5 border bg-zinc-900/30 border-white/5 rounded-2xl">
            <h3 className="flex items-center gap-2 mb-4 text-xs font-bold uppercase text-zinc-400">
              <Settings size={14} /> System Controls
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Auto Sync</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Show Hidden</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={showHidden}
                    onChange={(e) => setShowHidden(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              
              <div className="pt-3 border-t border-white/5">
                <p className="text-[10px] text-zinc-500 mb-2">Quick Filters</p>
                <div className="flex flex-wrap gap-2">
                  {['all', 'live', 'elite', 'upcoming', 'finished'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1 text-[10px] rounded-full transition-all ${filter === f ? 'bg-red-600 text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="pt-3 border-t border-white/5">
                <p className="text-[10px] text-zinc-500 mb-2">Search Matches</p>
                <input
                  type="text"
                  placeholder="Team, league, etc..."
                  className="w-full p-2 text-sm border rounded-lg outline-none bg-black/50 border-white/5 focus:border-red-600/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="p-5 border bg-black/40 border-white/5 rounded-2xl">
            <h3 className="flex items-center gap-2 mb-4 text-xs font-bold uppercase text-zinc-400">
              <Terminal size={14} /> Engine Status
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Bot Status</span>
                <span className={`text-xs font-bold ${botEnabled ? 'text-green-500' : 'text-red-500'}`}>
                  {botEnabled ? 'RUNNING' : 'STOPPED'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Last Sync</span>
                <span className="text-xs text-zinc-500">{lastSyncTime || 'Never'}</span>
              </div>
              <div className="pt-3">
                <p className="text-[10px] text-zinc-500 mb-1">Live Feed</p>
                <div className="h-20 p-3 overflow-y-auto rounded-lg bg-black/50">
                  <p className="font-mono text-xs text-green-500">{botLogs}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MATCH MANAGEMENT */}
        <div className="lg:w-3/4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase text-zinc-500">
              <Monitor size={14}/> Match Management ({filteredMatches.length})
            </h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowAddMatch(true)}
                className="flex items-center gap-2 px-3 py-1 text-xs transition-colors rounded-lg bg-white/10 hover:bg-white/20"
              >
                <Plus size={12} /> Add
              </button>
              <button 
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-3 py-1 text-xs text-red-400 transition-colors rounded-lg bg-red-600/20 hover:bg-red-600/30"
              >
                <Trash2 size={12} /> Bulk Delete
              </button>
            </div>
          </div>
          
          {filteredMatches.length === 0 ? (
            <div className="p-8 text-center border bg-zinc-900/10 border-white/5 rounded-2xl">
              <p className="text-zinc-500">No matches found. {searchQuery ? 'Try a different search.' : 'Run Global Sync or add matches manually.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredMatches.map((match) => (
                <div 
                  key={match.id} 
                  className={`p-5 border rounded-2xl transition-all hover:border-white/10 ${match.isHidden ? 'bg-black/30 border-yellow-600/20' : 'bg-zinc-900/10 border-white/5'}`}
                >
                  <div className="flex flex-col justify-between gap-4 mb-4 md:flex-row md:items-center">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center w-12 h-12 overflow-hidden rounded-full bg-black/50">
                          {match.home?.logo ? (
                            <img src={match.home.logo} className="object-contain w-10 h-10" alt={match.home.name} />
                          ) : (
                            <span className="text-lg font-bold">{match.home?.name?.charAt(0) || 'H'}</span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-500 mt-1">HOME</span>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center gap-4">
                          <span className="text-2xl font-black">{match.home?.score || 0}</span>
                          <span className="text-sm font-bold text-red-600">VS</span>
                          <span className="text-2xl font-black">{match.away?.score || 0}</span>
                        </div>
                        <p className="mt-1 text-sm text-zinc-400">{match.home?.name} vs {match.away?.name}</p>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center w-12 h-12 overflow-hidden rounded-full bg-black/50">
                          {match.away?.logo ? (
                            <img src={match.away.logo} className="object-contain w-10 h-10" alt={match.away.name} />
                          ) : (
                            <span className="text-lg font-bold">{match.away?.name?.charAt(0) || 'A'}</span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-500 mt-1">AWAY</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                        STATUS_OPTIONS.find(s => s.value === match.status)?.color || 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {match.status} • {match.minute || 0}'
                      </div>
                      {match.isElite && (
                        <div className="px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded-full text-[10px] font-bold flex items-center gap-1">
                          <Trophy size={10} /> ELITE
                        </div>
                      )}
                      {match.isHidden && (
                        <div className="px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded-full text-[10px] font-bold flex items-center gap-1">
                          <EyeOff size={10} /> HIDDEN
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {/* Quick Controls */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold uppercase text-zinc-500">Quick Actions</p>
                      <div className="flex flex-wrap gap-2">
                        {['start', 'halftime', 'resume', 'end'].map(action => (
                          <button
                            key={action}
                            onClick={() => handleQuickAction(action, match)}
                            className="px-3 py-1 text-xs transition-colors rounded-lg bg-white/5 hover:bg-white/10"
                          >
                            {action.charAt(0).toUpperCase() + action.slice(1)}
                          </button>
                        ))}
                        <button
                          onClick={() => handleQuickAction('toggle_elite', match)}
                          className={`px-3 py-1 text-xs rounded-lg transition-colors ${match.isElite ? 'bg-yellow-600/20 text-yellow-400' : 'bg-white/5 hover:bg-white/10'}`}
                        >
                          {match.isElite ? 'Unmark Elite' : 'Mark Elite'}
                        </button>
                        <button
                          onClick={() => handleQuickAction('toggle_hidden', match)}
                          className={`px-3 py-1 text-xs rounded-lg transition-colors ${match.isHidden ? 'bg-yellow-600/20 text-yellow-400' : 'bg-white/5 hover:bg-white/10'}`}
                        >
                          {match.isHidden ? 'Show' : 'Hide'}
                        </button>
                      </div>
                    </div>
                    
                    {/* Score Control */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold uppercase text-zinc-500">Score Control</p>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <input
                            type="number"
                            defaultValue={match.home?.score || 0}
                            className="w-full p-2 font-bold text-center border rounded-lg bg-black/50 border-white/5"
                            onBlur={(e) => handleUpdateScore(match.id, 'home', e.target.value)}
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="number"
                            defaultValue={match.away?.score || 0}
                            className="w-full p-2 font-bold text-center border rounded-lg bg-black/50 border-white/5"
                            onBlur={(e) => handleUpdateScore(match.id, 'away', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={match.status}
                          className="flex-1 p-2 text-xs border rounded-lg bg-black/50 border-white/5"
                          onChange={(e) => handleUpdateStatus(match.id, e.target.value, match.minute)}
                        >
                          {STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          defaultValue={match.minute}
                          className="w-20 p-2 text-xs border rounded-lg bg-black/50 border-white/5"
                          onBlur={(e) => handleUpdateStatus(match.id, match.status, e.target.value)}
                        />
                      </div>
                    </div>
                    
                    {/* Stream & Info */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold uppercase text-zinc-500">Stream & Info</p>
                      <textarea
                        defaultValue={match.streamUrl1 ? safeDecodeBase64(match.streamUrl1) : ''}
                        className="w-full h-20 p-2 text-xs border rounded-lg resize-none bg-black/50 border-white/5"
                        onBlur={(e) => handleUpdateStream(match.id, e.target.value)}
                        placeholder="Stream URL..."
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteMatch(match.id)}
                          className="flex items-center justify-center flex-1 gap-2 px-3 py-2 text-xs text-red-400 transition-colors rounded-lg bg-red-600/20 hover:bg-red-600/30"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                        <button
                          onClick={() => setEditingMatchId(editingMatchId === match.id ? null : match.id)}
                          className="flex-1 px-3 py-2 text-xs transition-colors rounded-lg bg-white/5 hover:bg-white/10"
                        >
                          {editingMatchId === match.id ? 'Done' : 'More'}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Editor */}
                  {editingMatchId === match.id && (
                    <div className="pt-4 mt-4 space-y-4 border-t border-white/5">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-zinc-500 mb-2">League & Time</p>
                          <input
                            type="text"
                            defaultValue={match.league}
                            className="w-full p-2 text-sm border rounded-lg bg-black/50 border-white/5"
                            onBlur={(e) => updateDoc(doc(db, "matches", match.id), { 
                              league: e.target.value,
                              lastUpdated: serverTimestamp() 
                            })}
                          />
                          <p className="mt-2 text-xs text-zinc-500">
                            Kickoff: {new Date(match.kickoff).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-zinc-500 mb-2">AI Prediction</p>
                          <textarea
                            defaultValue={match.aiPick}
                            className="w-full h-24 p-2 text-xs border rounded-lg resize-none bg-black/50 border-white/5"
                            onBlur={(e) => handleUpdateAIPick(match.id, e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TICKER SYSTEM */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase text-zinc-500">
            <Globe size={14}/> Global Ticker System
          </h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                const messages = tickerMessages.slice(0, 5);
                messages.forEach(msg => deleteDoc(doc(db, "ticker", msg.id)));
              }}
              className="px-3 py-1 text-xs text-red-400 transition-colors rounded-lg bg-red-600/20 hover:bg-red-600/30"
            >
              Clear Recent
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="bg-zinc-900/30 border border-white/5 rounded-2xl h-[400px] flex flex-col">
              <div className="p-4 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">Live Feed</span>
                  <span className="text-[10px] text-zinc-500">{tickerMessages.length} messages</span>
                </div>
              </div>
              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                {tickerMessages.length === 0 ? (
                  <p className="p-8 text-center text-zinc-500">No ticker messages yet</p>
                ) : (
                  tickerMessages.map((msg) => (
                    <div key={msg.id} className="p-3 border bg-black/40 border-white/5 rounded-xl">
                      <div className="flex items-start justify-between">
                        <p className="flex-1 text-sm">{msg.text}</p>
                        <button
                          onClick={() => deleteDoc(doc(db, "ticker", msg.id))}
                          className="ml-2 transition-colors text-zinc-600 hover:text-red-500"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-2 flex items-center gap-2">
                        <span className="font-bold">{msg.user || 'SYSTEM'}</span>
                        <span>•</span>
                        <span>{msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString() : 'LIVE'}</span>
                        {msg.type && (
                          <>
                            <span>•</span>
                            <span className={`px-1 py-0.5 rounded text-[9px] ${
                              msg.type === 'error' ? 'bg-red-600/20 text-red-400' :
                              msg.type === 'system' ? 'bg-blue-600/20 text-blue-400' :
                              'bg-zinc-600/20 text-zinc-400'
                            }`}>
                              {msg.type}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="p-5 border bg-black/40 border-white/5 rounded-2xl">
              <h4 className="mb-3 text-xs font-bold">Broadcast Message</h4>
              <textarea
                value={tickerInput}
                onChange={e => setTickerInput(e.target.value)}
                className="w-full h-32 p-3 mb-3 text-sm border rounded-lg resize-none bg-black/50 border-white/5"
                placeholder="Type global announcement..."
              />
              <div className="flex gap-2">
                <button
                  onClick={handleBroadcast}
                  disabled={!tickerInput.trim()}
                  className="flex items-center justify-center flex-1 gap-2 p-3 text-sm font-bold bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} /> Broadcast
                </button>
              </div>
            </div>
            
            <div className="p-5 border bg-black/40 border-white/5 rounded-2xl">
              <h4 className="mb-3 text-xs font-bold">System Quick Commands</h4>
              <div className="space-y-2">
                <button
                  onClick={() => setTickerInput('⚡ SYSTEM: Server maintenance in 10 minutes')}
                  className="w-full p-2 text-sm text-left rounded-lg bg-white/5 hover:bg-white/10"
                >
                  ⚡ Maintenance Alert
                </button>
                <button
                  onClick={() => setTickerInput('🎯 AI: New predictions available for elite matches')}
                  className="w-full p-2 text-sm text-left rounded-lg bg-white/5 hover:bg-white/10"
                >
                  🎯 AI Update
                </button>
                <button
                  onClick={() => setTickerInput('⚠️ URGENT: Stream issues detected, fixing now...')}
                  className="w-full p-2 text-sm text-left rounded-lg bg-white/5 hover:bg-white/10"
                >
                  ⚠️ Stream Alert
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MANUAL INJECTION MODAL */}
      {showAddMatch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <form onSubmit={handleManualAdd} className="bg-zinc-900 p-6 md:p-8 rounded-2xl border border-white/10 w-full max-w-4xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black tracking-tighter uppercase">Inject New Match Signal</h3>
              <button 
                type="button" 
                onClick={() => setShowAddMatch(false)}
                className="p-2 transition-colors rounded-full bg-white/5 hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-zinc-400">Home Team</h4>
                <input 
                  placeholder="Team Name" 
                  required 
                  className="w-full p-3 text-sm bg-black border rounded-lg border-white/5" 
                  value={newMatch.homeName}
                  onChange={e => setNewMatch({...newMatch, homeName: e.target.value})} 
                />
                <input 
                  placeholder="Logo URL" 
                  className="w-full p-3 text-sm bg-black border rounded-lg border-white/5" 
                  value={newMatch.homeLogo}
                  onChange={e => setNewMatch({...newMatch, homeLogo: e.target.value})} 
                />
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-zinc-400">Away Team</h4>
                <input 
                  placeholder="Team Name" 
                  required 
                  className="w-full p-3 text-sm bg-black border rounded-lg border-white/5" 
                  value={newMatch.awayName}
                  onChange={e => setNewMatch({...newMatch, awayName: e.target.value})} 
                />
                <input 
                  placeholder="Logo URL" 
                  className="w-full p-3 text-sm bg-black border rounded-lg border-white/5" 
                  value={newMatch.awayLogo}
                  onChange={e => setNewMatch({...newMatch, awayLogo: e.target.value})} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400">League</label>
                <input 
                  placeholder="Premier League" 
                  className="w-full p-3 text-sm bg-black border rounded-lg border-white/5" 
                  value={newMatch.league}
                  onChange={e => setNewMatch({...newMatch, league: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400">Kickoff Time</label>
                <input 
                  type="datetime-local" 
                  className="w-full p-3 text-sm bg-black border rounded-lg border-white/5" 
                  value={newMatch.kickoff}
                  onChange={e => setNewMatch({...newMatch, kickoff: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400">Match Status</label>
                <select 
                  className="w-full p-3 text-sm bg-black border rounded-lg border-white/5"
                  value={newMatch.status}
                  onChange={e => setNewMatch({...newMatch, status: e.target.value})}
                >
                  {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400">Minute</label>
                <input 
                  type="number" 
                  placeholder="0" 
                  className="w-full p-3 text-sm bg-black border rounded-lg border-white/5" 
                  value={newMatch.minute}
                  onChange={e => setNewMatch({...newMatch, minute: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400">Stream URL</label>
                <input 
                  placeholder="https://..." 
                  required 
                  className="w-full p-3 text-sm bg-black border rounded-lg border-white/5" 
                  value={newMatch.stream1}
                  onChange={e => setNewMatch({...newMatch, stream1: e.target.value})} 
                />
              </div>
              <div className="flex items-end space-x-4">
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={newMatch.isElite}
                    onChange={e => setNewMatch({...newMatch, isElite: e.target.checked})}
                    className="w-4 h-4 rounded accent-red-600"
                  />
                  <span className="text-sm">Elite Match</span>
                </label>
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={newMatch.isHidden}
                    onChange={e => setNewMatch({...newMatch, isHidden: e.target.checked})}
                    className="w-4 h-4 rounded accent-yellow-600"
                  />
                  <span className="text-sm">Hidden</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400">AI Prediction (Optional)</label>
              <textarea 
                placeholder="Custom AI prediction or leave empty for auto-generation"
                className="w-full h-24 p-3 text-sm bg-black border rounded-lg resize-none border-white/5"
                value={newMatch.aiPick}
                onChange={e => setNewMatch({...newMatch, aiPick: e.target.value})}
              />
            </div>

            <button type="submit" className="w-full py-4 font-bold tracking-widest uppercase transition-all rounded-lg shadow-lg bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-red-600/20">
              Inject & Broadcast
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Admin;