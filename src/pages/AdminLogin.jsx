import React, { useState } from 'react';
import { Lock, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';

const AdminLogin = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Logic: vortex_admin_2026
    if (password === 'vortex_admin_2026') {
      sessionStorage.setItem('vx_admin_auth', btoa('authenticated_2026'));
      onLogin(true);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-red-600 rounded-2xl mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.3)] mb-4">
            <Lock className="text-white" size={32} />
          </div>
          <h1 className="text-3xl italic font-black tracking-tighter text-white uppercase">Vortex <span className="text-red-600">HQ</span></h1>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mt-2">Restricted Access Terminal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="ENTER MASTER KEY"
              className={`w-full bg-zinc-900/50 border ${error ? 'border-red-600' : 'border-white/10'} rounded-2xl p-5 text-center text-sm font-black tracking-[0.5em] text-white outline-none focus:border-red-600 transition-all placeholder:text-zinc-700`}
            />
            {error && (
              <div className="absolute left-0 right-0 text-center -bottom-6">
                <p className="text-[9px] font-black text-red-500 uppercase flex items-center justify-center gap-1">
                  <AlertCircle size={10} /> Invalid Access Credentials
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="flex items-center justify-center w-full gap-2 py-4 text-xs font-black tracking-widest text-black uppercase transition-all bg-white rounded-2xl hover:bg-red-600 hover:text-white group"
          >
            Authenticate <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </button>
        </form>

        <div className="flex justify-center gap-6 mt-12 opacity-20">
            <ShieldCheck className="text-white" size={20} />
            <div className="h-5 w-[1px] bg-white/20"></div>
            <p className="text-[8px] font-black uppercase self-center tracking-widest text-white">Encrypted Session</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;