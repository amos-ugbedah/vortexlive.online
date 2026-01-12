/* eslint-disable */
import React, { useState, useEffect, memo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail, ShieldCheck, TrendingUp, 
  Heart, Globe, Wifi, Shield, Zap, 
  Lock, Radio, Eye, Award, Star,
  Users, Cpu, BarChart, Cloud,
  ChevronRight, ExternalLink, CheckCircle
} from 'lucide-react';

const Footer = memo(() => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isOnline, setIsOnline] = useState(true);
  const [uptime, setUptime] = useState('99.9%');

  // Check online status
  useEffect(() => {
    const checkOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);

    // Simulate uptime percentage
    const interval = setInterval(() => {
      const uptimeValue = 99.5 + Math.random() * 0.5;
      setUptime(`${uptimeValue.toFixed(1)}%`);
    }, 5000);

    return () => {
      window.removeEventListener('online', checkOnlineStatus);
      window.removeEventListener('offline', checkOnlineStatus);
      clearInterval(interval);
    };
  }, []);

  // Get current time in Lagos
  const [lagosTime, setLagosTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const lagosTime = now.toLocaleTimeString('en-NG', {
        timeZone: 'Africa/Lagos',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });
      setLagosTime(lagosTime);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="w-full bg-gradient-to-b from-black via-[#050505] to-[#0a0a0a] border-t border-white/5 mt-16">
      {/* FOOTER STATS BAR */}
      <div className="bg-gradient-to-r from-red-900/5 via-red-800/10 to-red-900/5 border-b border-white/5 py-3">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-white/60">LIVE MATCHES</span>
              <span className="text-xs font-black text-white ml-1">12</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
              <span className="text-xs font-bold text-white/60">ELITE LEAGUES</span>
              <span className="text-xs font-black text-white ml-1">8</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
              <span className="text-xs font-bold text-white/60">ONLINE USERS</span>
              <span className="text-xs font-black text-white ml-1">2.4K</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
              <span className="text-xs font-bold text-white/60">AI ACCURACY</span>
              <span className="text-xs font-black text-white ml-1">87%</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN FOOTER CONTENT - 3 COLUMNS */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* LEFT COLUMN - VORTEX BRANDING */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-red-600 to-red-700 rounded-xl">
                <Radio size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl italic font-black uppercase leading-none">
                  VORTEX<span className="text-red-600">ULTRA</span>
                </h3>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-1">
                  Professional Sports Intelligence
                </p>
              </div>
            </div>

            <p className="text-sm text-white/50 leading-relaxed">
              The world's most advanced sports tracking platform. 
              Powered by AI, enhanced by passion, trusted by millions.
            </p>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-xs font-bold text-white/60">
                  {isOnline ? 'LIVE' : 'OFFLINE'}
                </span>
              </div>
              <div className="text-xs text-white/40">•</div>
              <div className="flex items-center gap-2">
                <Cloud size={12} className="text-blue-400" />
                <span className="text-xs font-bold text-white/60">Uptime: {uptime}</span>
              </div>
              <div className="text-xs text-white/40">•</div>
              <div className="flex items-center gap-2">
                <Globe size={12} className="text-green-400" />
                <span className="text-xs font-bold text-white/60">Lagos: {lagosTime}</span>
              </div>
            </div>

            {/* SECURITY BADGES */}
            <div className="flex flex-wrap gap-2 pt-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-900/20 to-green-800/10 rounded-lg border border-green-500/20">
                <Shield size={10} className="text-green-400" />
                <span className="text-[10px] font-bold text-green-400">SSL SECURE</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-900/20 to-blue-800/10 rounded-lg border border-blue-500/20">
                <Lock size={10} className="text-blue-400" />
                <span className="text-[10px] font-bold text-blue-400">ENCRYPTED</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-900/20 to-purple-800/10 rounded-lg border border-purple-500/20">
                <Eye size={10} className="text-purple-400" />
                <span className="text-[10px] font-bold text-purple-400">NO-LOG</span>
              </div>
            </div>
          </div>

          {/* MIDDLE COLUMN - QUICK LINKS & PARTNERS */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-gradient-to-br from-yellow-600/20 to-yellow-500/10 rounded-lg">
                <Zap size={16} className="text-yellow-400" />
              </div>
              <h4 className="text-sm font-black uppercase tracking-wider text-white/80">QUICK NAVIGATION</h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <Link 
                  to="/live" 
                  className="flex items-center gap-2 text-xs text-white/60 hover:text-red-400 transition-colors group"
                >
                  <ChevronRight size={10} className="text-red-500/50 group-hover:text-red-500" />
                  <span>Live Matches</span>
                </Link>
                <Link 
                  to="/elite" 
                  className="flex items-center gap-2 text-xs text-white/60 hover:text-yellow-400 transition-colors group"
                >
                  <ChevronRight size={10} className="text-yellow-500/50 group-hover:text-yellow-500" />
                  <span>Elite Leagues</span>
                </Link>
                <Link 
                  to="/upcoming" 
                  className="flex items-center gap-2 text-xs text-white/60 hover:text-blue-400 transition-colors group"
                >
                  <ChevronRight size={10} className="text-blue-500/50 group-hover:text-blue-500" />
                  <span>Upcoming</span>
                </Link>
                <Link 
                  to="/finished" 
                  className="flex items-center gap-2 text-xs text-white/60 hover:text-gray-400 transition-colors group"
                >
                  <ChevronRight size={10} className="text-gray-500/50 group-hover:text-gray-500" />
                  <span>Results</span>
                </Link>
              </div>
              <div className="space-y-3">
                <Link 
                  to="/ai-predictions" 
                  className="flex items-center gap-2 text-xs text-white/60 hover:text-purple-400 transition-colors group"
                >
                  <ChevronRight size={10} className="text-purple-500/50 group-hover:text-purple-500" />
                  <span>AI Predictions</span>
                </Link>
                <Link 
                  to="/stats" 
                  className="flex items-center gap-2 text-xs text-white/60 hover:text-green-400 transition-colors group"
                >
                  <ChevronRight size={10} className="text-green-500/50 group-hover:text-green-500" />
                  <span>Statistics</span>
                </Link>
                <Link 
                  to="/admin" 
                  className="flex items-center gap-2 text-xs text-white/60 hover:text-orange-400 transition-colors group"
                >
                  <ChevronRight size={10} className="text-orange-500/50 group-hover:text-orange-500" />
                  <span>Admin Panel</span>
                </Link>
                <Link 
                  to="/api-docs" 
                  className="flex items-center gap-2 text-xs text-white/60 hover:text-cyan-400 transition-colors group"
                >
                  <ChevronRight size={10} className="text-cyan-500/50 group-hover:text-cyan-500" />
                  <span>API Docs</span>
                </Link>
              </div>
            </div>

            {/* PARTNER BADGES */}
            <div className="pt-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-1.5 bg-gradient-to-br from-green-600/20 to-green-500/10 rounded-lg">
                  <Award size={14} className="text-green-400" />
                </div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-white/70">TRUSTED PARTNERS</h5>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gradient-to-br from-red-900/10 to-red-800/5 rounded-lg p-2 border border-red-500/10 text-center">
                  <span className="text-[10px] font-black text-red-400">Stake</span>
                </div>
                <div className="bg-gradient-to-br from-green-900/10 to-green-800/5 rounded-lg p-2 border border-green-500/10 text-center">
                  <span className="text-[10px] font-black text-green-400">1xBet</span>
                </div>
                <div className="bg-gradient-to-br from-blue-900/10 to-blue-800/5 rounded-lg p-2 border border-blue-500/10 text-center">
                  <span className="text-[10px] font-black text-blue-400">Propeller</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - CONTACT & MONETAG */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-gradient-to-br from-purple-600/20 to-purple-500/10 rounded-lg">
                <Users size={16} className="text-purple-400" />
              </div>
              <h4 className="text-sm font-black uppercase tracking-wider text-white/80">GET IN TOUCH</h4>
            </div>

            <div className="space-y-4">
              <a 
                href="mailto:support@vortexlive.pro"
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-white/5 to-white/10 rounded-xl border border-white/5 hover:border-red-500/20 transition-all group"
              >
                <div className="p-2 bg-gradient-to-br from-red-600 to-red-700 rounded-lg">
                  <Mail size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Support Center</p>
                  <p className="text-[10px] text-white/40">support@vortexlive.pro</p>
                </div>
              </a>

              <Link 
                to="/privacy"
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-white/5 to-white/10 rounded-xl border border-white/5 hover:border-blue-500/20 transition-all group"
              >
                <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg">
                  <ShieldCheck size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Privacy & Terms</p>
                  <p className="text-[10px] text-white/40">GDPR Compliant</p>
                </div>
              </Link>

              {/* MONETAG REFERRAL - PROMINENT */}
              <a 
                href="https://monetag.com/?ref_id=zpdh" 
                target="_blank" 
                rel="noreferrer noopener"
                className="block p-4 bg-gradient-to-br from-green-900/20 via-green-800/10 to-black border border-green-600/30 rounded-xl hover:border-green-500/50 transition-all group hover:shadow-lg hover:shadow-green-600/10"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg">
                      <TrendingUp size={14} className="text-white" />
                    </div>
                    <span className="text-sm font-black text-green-400">Monetize Your Site</span>
                  </div>
                  <ExternalLink size={12} className="text-green-400/50 group-hover:text-green-400" />
                </div>
                <p className="text-xs text-white/60 mb-3">
                  Join Monetag today and start earning with premium ads.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-green-400/70 font-bold">REF: ZPDH</span>
                  <span className="text-[10px] text-white/30">Verified Partner</span>
                </div>
              </a>
            </div>

            {/* TECHNOLOGY STACK */}
            <div className="pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Cpu size={12} className="text-white/40" />
                <span className="text-xs font-bold text-white/50">POWERED BY</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-[10px] px-2 py-1 bg-gradient-to-r from-red-900/10 to-red-800/5 rounded border border-red-500/10 text-red-400">
                  React 18
                </span>
                <span className="text-[10px] px-2 py-1 bg-gradient-to-r from-blue-900/10 to-blue-800/5 rounded border border-blue-500/10 text-blue-400">
                  Firebase
                </span>
                <span className="text-[10px] px-2 py-1 bg-gradient-to-r from-purple-900/10 to-purple-800/5 rounded border border-purple-500/10 text-purple-400">
                  AI/ML
                </span>
                <span className="text-[10px] px-2 py-1 bg-gradient-to-r from-green-900/10 to-green-800/5 rounded border border-green-500/10 text-green-400">
                  Node.js
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM BAR - COPYRIGHT & LINKS */}
        <div className="pt-8 border-t border-white/5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* COPYRIGHT */}
            <div className="flex items-center gap-4">
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                © {currentYear} VORTEXLIVE • PREMIUM SPORTS NETWORK
              </p>
              <div className="hidden md:flex items-center gap-3">
                <span className="text-xs text-white/10">|</span>
                <span className="text-[10px] text-white/40 flex items-center gap-1">
                  <Heart size={8} className="text-red-500/50" />
                  Built with passion in Lagos, NG
                </span>
              </div>
            </div>

            {/* LEGAL LINKS */}
            <div className="flex items-center gap-6">
              <Link to="/terms" className="text-[10px] text-white/40 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link to="/privacy" className="text-[10px] text-white/40 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to="/cookies" className="text-[10px] text-white/40 hover:text-white transition-colors">
                Cookie Policy
              </Link>
              <a 
                href="https://status.vortexlive.pro" 
                target="_blank" 
                rel="noreferrer noopener"
                className="text-[10px] text-white/40 hover:text-green-400 transition-colors flex items-center gap-1"
              >
                <Wifi size={8} />
                Status
              </a>
            </div>

            {/* VERSION */}
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] text-white/30 font-mono">v2.6.1</span>
              <span className="text-[8px] text-white/10">|</span>
              <span className="text-[10px] text-white/30">Build: #2026Q1</span>
            </div>
          </div>

          {/* DISCLAIMER */}
          <div className="text-center mt-6">
            <p className="text-[9px] text-white/20 max-w-3xl mx-auto leading-relaxed">
              ⚠️ Disclaimer: VortexLive is an independent sports data aggregator. 
              We are not affiliated with any sports leagues, teams, or broadcasters. 
              All trademarks and copyrights belong to their respective owners. 
              Betting and gambling are subject to legal restrictions. Please gamble responsibly.
              <span className="block mt-1 text-white/10">18+ | Terms apply | Gamble responsibly</span>
            </p>
          </div>
        </div>
      </div>

      {/* FLOATING CHAT BOTTOM RIGHT */}
      <div className="fixed bottom-6 right-6 z-40">
        <button 
          className="group relative"
          onClick={() => window.open('https://monetag.com/?ref_id=zpdh', '_blank')}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full blur-md opacity-30 group-hover:opacity-50 transition-opacity"></div>
          <div className="relative p-3 bg-gradient-to-br from-green-700 to-emerald-700 rounded-full shadow-2xl shadow-green-600/30 hover:shadow-green-600/50 transition-all group-hover:scale-110">
            <div className="flex items-center justify-center w-8 h-8">
              <BarChart size={18} className="text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-black animate-pulse">
              <div className="w-full h-full flex items-center justify-center">
                <Star size={6} className="text-white" />
              </div>
            </div>
          </div>
          <div className="absolute -top-10 right-0 bg-black/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-green-500/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            <span className="text-xs font-bold text-green-400">Earn with Monetag</span>
            <div className="absolute -bottom-1 right-3 w-2 h-2 bg-black/90 rotate-45 border-r border-b border-green-500/30"></div>
          </div>
        </button>
      </div>
    </footer>
  );
});

// Add display name for debugging
Footer.displayName = 'Footer';

export default Footer;