/* eslint-disable */
import { db } from "./firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  getDocs, 
  orderBy, 
  limit 
} from "firebase/firestore";

// Backend Cloud Function URLs - Mapped to your Firebase Project
const BASE_URL = "https://us-central1-votexlive-3a8cb.cloudfunctions.net";
const EMERGENCY_SYNC_URL = `${BASE_URL}/emergencySync`;
const ADD_MATCH_URL = `${BASE_URL}/manualAddMatch`; 
const TRIGGER_AUTO_DETECT_URL = `${BASE_URL}/vortexLiveBot`; // This is the scheduler logic
const HEALTH_CHECK_URL = `${BASE_URL}/emergencySync`; // Using sync as health check
const FIX_MATCHES_URL = `${BASE_URL}/emergencySync`;

let isSyncing = false;
let lastSyncTime = null;

/**
 * Check backend health and feature availability
 */
export const checkBackendHealth = async () => {
  try {
    const response = await fetch(HEALTH_CHECK_URL, {
      method: 'GET',
      signal: AbortSignal.timeout(10000) 
    });
    
    if (!response.ok) throw new Error(`Health check failed: ${response.status}`);
    
    const data = await response.json();
    return {
      healthy: true,
      autoDetection: true, // Vortex bot is active by default
      matchesInDB: data.count || 0,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("❌ Health check error:", error);
    return { healthy: false, error: error.message };
  }
};

/**
 * Triggers the main backend sync to fetch matches from API-Football
 */
export const fetchTodayMatches = async () => {
  if (isSyncing) return { success: false, message: "Sync in progress" };
  
  // Rate limit: 1 sync per 60 seconds
  if (lastSyncTime && (Date.now() - lastSyncTime) < 60000) {
    return { success: false, message: "Please wait 1 minute between syncs" };
  }

  isSyncing = true;
  try {
    // Note: Changed to GET to match Firebase onRequest default
    const response = await fetch(EMERGENCY_SYNC_URL, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(45000)
    });

    if (!response.ok) throw new Error(`Backend Error: ${response.status}`);
    
    const result = await response.json();
    lastSyncTime = Date.now();
    return {
      success: true,
      count: result.count || 0,
      eliteCount: result.count || 0
    };
  } catch (error) {
    console.error("❌ Sync failed:", error);
    return { success: false, error: error.message };
  } finally {
    isSyncing = false;
  }
};

/**
 * Listen to live matches in real-time via Firestore Snapshot
 */
export const monitorLiveMatches = (callback) => {
  if (!callback) return null;

  const matchesRef = collection(db, 'matches');
  // Including 'LIVE' to match the backend STATUS_MAP updates
  const q = query(
    matchesRef, 
    where('status', 'in', ['1H', '2H', 'HT', 'ET', 'LIVE', 'P'])
  );

  return onSnapshot(q, (snapshot) => {
    const matches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback({
      type: 'live_update',
      matches,
      count: matches.length,
      timestamp: new Date().toISOString()
    });
  }, (error) => {
    console.error("❌ Firestore monitor error:", error);
  });
};

/**
 * Manual Trigger for the Auto-Detection Logic
 */
export const triggerAutoDetection = async (showAlert = true) => {
  try {
    // This calls the vortexLiveBot logic manually
    const response = await fetch(TRIGGER_AUTO_DETECT_URL);
    const result = await response.json();
    
    if (showAlert) {
      alert(`Auto-Detection Signal Sent!\nVortex Engine is processing live matches.`);
    }
    return { success: true, result };
  } catch (error) {
    if (showAlert) alert(`Signal Error: Backend bot is on auto-schedule.`);
    return { success: false, error: error.message };
  }
};

/**
 * System Overview for Admin Panel
 */
export const getSystemStatus = async () => {
  const health = await checkBackendHealth();
  const now = new Date();
  
  return {
    success: true,
    lagosTime: now.toLocaleTimeString('en-NG', { timeZone: 'Africa/Lagos', hour12: false }),
    health: health.healthy ? 'READY' : 'ERROR',
    autoDetection: health.autoDetection ? 'ACTIVE' : 'OFF',
    sync: {
      lastSync: lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : 'Never',
      isLocked: isSyncing
    }
  };
};

/**
 * Manual Add Match Helper
 */
export const addMatchManually = async (home, away, league, time) => {
    try {
        const url = `${ADD_MATCH_URL}?home=${encodeURIComponent(home)}&away=${encodeURIComponent(away)}&league=${encodeURIComponent(league)}&time=${time}`;
        const response = await fetch(url);
        return await response.json();
    } catch (e) {
        return { success: false, error: e.message };
    }
};

export default {
  fetchTodayMatches,
  monitorLiveMatches,
  triggerAutoDetection,
  checkBackendHealth,
  getSystemStatus,
  addMatchManually
};