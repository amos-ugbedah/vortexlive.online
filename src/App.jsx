/* eslint-disable */
import React, { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { db } from './lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { ShieldAlert, Loader2 } from 'lucide-react';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const Admin = lazy(() => import('./pages/Admin'));
const MatchDetails = lazy(() => import('./pages/MatchDetails'));
const HighlightPage = lazy(() => import('./pages/HighlightPage'));

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen text-white bg-black">
          <div className="text-center p-10 border border-red-600/20 bg-red-600/10 rounded-[2.5rem] max-w-md">
            <ShieldAlert size={48} className="mx-auto mb-4 text-red-600" />
            <h1 className="mb-2 text-2xl font-black uppercase">App Error</h1>
            <p className="mb-4 text-white/70">Something went wrong. Please refresh the page.</p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="px-6 py-2 text-sm font-bold bg-red-600 rounded-lg hover:bg-red-700"
            >
              Refresh App
            </button>
            {process.env.NODE_ENV === 'development' && (
              <pre className="p-2 mt-4 overflow-auto text-xs text-left rounded text-white/40 max-h-40 bg-black/50">
                {this.state.error?.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading Component
const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505]">
    <div className="relative mb-6">
      <div className="w-16 h-16 border-4 rounded-full border-red-600/20"></div>
      <div className="absolute top-0 left-0 w-16 h-16 border-4 border-red-600 rounded-full border-t-transparent animate-spin"></div>
    </div>
    <p className="text-sm font-bold tracking-wider uppercase text-white/40">LOADING VORTEX STREAMS</p>
  </div>
);

// Main App Layout Component
const AppLayout = ({ children, isLandscapeMode, partners, isOnline, appReady }) => (
  <>
    {/* Network Status Indicator */}
    {!isOnline && (
      <div className="sticky top-0 z-50 px-4 py-2 text-sm font-bold text-center bg-yellow-600/90">
        ⚠️ You are offline. Some features may be limited.
      </div>
    )}
    
    {/* Debug Banner for Development */}
    {process.env.NODE_ENV === 'development' && (
      <div className="sticky top-0 z-50 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-center bg-blue-600/90">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        DEVELOPMENT MODE - Local Build
      </div>
    )}
    
    {!isLandscapeMode && <Navbar partners={partners} />}
    
    {/* Main Content Area */}
    <main className="flex-1 w-full">
      {children}
    </main>

    {!isLandscapeMode && <Footer />}
    
    {/* App Status Footer */}
    {appReady && (
      <div className="fixed z-50 bottom-4 right-4">
        <div className="flex items-center gap-2 px-3 py-1 text-xs border rounded-full bg-black/80 backdrop-blur-sm text-white/60 border-white/10">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          <span>Vortex Live</span>
          <span className="text-white/40">•</span>
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>
    )}
  </>
);

function App() {
  const [isBanned, setIsBanned] = useState(false);
  const [isLandscapeMode, setIsLandscapeMode] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [appReady, setAppReady] = useState(false);
  
  const defaultPartners = [
    { 
      name: "1XBET", 
      offer: "200% BONUS", 
      link: "https://reffpa.com/L?tag=d_5098529m_97c_&site=5098529&ad=97", 
      highlight: true 
    },
    { 
      name: "VORTEX", 
      offer: "PRO ACCESS", 
      link: "#", 
      highlight: false 
    }
  ];

  // Debug info on mount
  useEffect(() => {
    console.log('🚀 Vortex Live App Mounted');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Host:', window.location.host);
    console.log('Firebase Project:', 'votexlive-3a8cb');
    
    // Mark app as ready after a short delay
    const timer = setTimeout(() => setAppReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Check network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check landscape mode
  useEffect(() => {
    const checkMode = () => {
      setIsLandscapeMode(window.innerWidth > window.innerHeight && window.innerWidth < 1024);
    };
    
    checkMode();
    window.addEventListener('resize', checkMode);
    return () => window.removeEventListener('resize', checkMode);
  }, []);

  // Check if user is banned
  useEffect(() => {
    let userToken = localStorage.getItem('vortex_utk');
    if (!userToken) {
      userToken = 'vx_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('vortex_utk', userToken);
    }
    
    // Only check ban in production
    if (process.env.NODE_ENV === 'production') {
      const unsubscribe = onSnapshot(doc(db, "blacklist", userToken), (doc) => {
        if (doc.exists()) {
          console.warn('User is banned:', userToken);
          setIsBanned(true);
        }
      });
      
      return () => unsubscribe();
    }
  }, []);

  // Global error handler
  useEffect(() => {
    const handleError = (event) => {
      console.error('Global Error:', event.error);
      
      // Don't show error modal for minor errors
      if (event.error?.message?.includes('ResizeObserver') || 
          event.error?.message?.includes('fetch')) {
        return;
      }
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  if (isBanned) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-black">
        <div className="text-center p-10 border border-red-600/20 bg-red-600/10 rounded-[2.5rem] max-w-md">
          <ShieldAlert size={48} className="mx-auto mb-4 text-red-600" />
          <h1 className="mb-2 text-2xl font-black uppercase">Access Restricted</h1>
          <p className="mb-4 text-white/70">This device has been restricted from accessing Vortex Live.</p>
          <div className="mt-4 text-xs text-white/40">
            ID: {localStorage.getItem('vortex_utk')?.substring(0, 10)}...
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-[#050505] text-white flex flex-col selection:bg-red-600">
          <Routes>
            <Route path="/" element={
              <AppLayout 
                isLandscapeMode={isLandscapeMode}
                partners={defaultPartners}
                isOnline={isOnline}
                appReady={appReady}
              >
                <Suspense fallback={<LoadingFallback />}>
                  <Home />
                </Suspense>
              </AppLayout>
            } />
            
            <Route path="/match/:id" element={
              <AppLayout 
                isLandscapeMode={isLandscapeMode}
                partners={defaultPartners}
                isOnline={isOnline}
                appReady={appReady}
              >
                <Suspense fallback={<LoadingFallback />}>
                  <MatchDetails />
                </Suspense>
              </AppLayout>
            } />
            
            <Route path="/admin" element={
              <AppLayout 
                isLandscapeMode={isLandscapeMode}
                partners={defaultPartners}
                isOnline={isOnline}
                appReady={appReady}
              >
                <Suspense fallback={<LoadingFallback />}>
                  <Admin />
                </Suspense>
              </AppLayout>
            } />
            
            {/* New Highlight Page Route */}
            <Route path="/highlights" element={
              <AppLayout 
                isLandscapeMode={isLandscapeMode}
                partners={defaultPartners}
                isOnline={isOnline}
                appReady={appReady}
              >
                <Suspense fallback={<LoadingFallback />}>
                  <HighlightPage />
                </Suspense>
              </AppLayout>
            } />
            
            {/* Match-specific Highlights */}
            <Route path="/match/:id/highlights" element={
              <AppLayout 
                isLandscapeMode={isLandscapeMode}
                partners={defaultPartners}
                isOnline={isOnline}
                appReady={appReady}
              >
                <Suspense fallback={<LoadingFallback />}>
                  <HighlightPage />
                </Suspense>
              </AppLayout>
            } />
            
            {/* Highlight Generator Route */}
            <Route path="/highlights/generate/:matchId" element={
              <AppLayout 
                isLandscapeMode={isLandscapeMode}
                partners={defaultPartners}
                isOnline={isOnline}
                appReady={appReady}
              >
                <Suspense fallback={<LoadingFallback />}>
                  <HighlightPage mode="generate" />
                </Suspense>
              </AppLayout>
            } />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;