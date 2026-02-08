import React, { useState } from 'react';
import { 
  Trash2, Trophy, EyeOff, Globe, X, Send, 
  Settings, Clock, Activity, ShieldAlert, Edit3 
} from 'lucide-react';
import { doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase'; // Adjust based on your file structure

const Admin = ({ 
  filteredMatches, 
  searchQuery, 
  handleQuickAction, 
  handleUpdateScore, 
  handleUpdateStatus, 
  handleUpdateStream, 
  handleDeleteMatch, 
  handleUpdateAIPick,
  editingMatchId,
  setEditingMatchId,
  tickerMessages,
  tickerInput,
  setTickerInput,
  handleBroadcast,
  showAddMatch,
  setShowAddMatch,
  newMatch,
  setNewMatch,
  handleManualAdd,
  STATUS_OPTIONS,
  safeDecodeBase64
}) => {

  return (
    <div className="min-h-screen p-4 md:p-8 text-zinc-100 bg-[#09090b]">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase md:text-4xl">
            Command <span className="text-red-600">Center</span>
          </h1>
          <p className="text-sm text-zinc-500">Live Match Control & Global Broadcast System</p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={() => setShowAddMatch(true)}
            className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-black transition-all bg-white rounded-xl hover:bg-zinc-200"
          >
            <Activity size={18} /> Inject Signal
          </button>
        </div>
      </div>

      {/* MATCH CONTROL GRID */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase text-zinc-500">
            <Clock size={14} /> Active Signals ({filteredMatches.length})
          </h3>
        </div>

        <div className="relative">
          {filteredMatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border bg-zinc-900/10 border-white/5 rounded-2xl">
              <div className="p-4 mb-4 rounded-full bg-white/5">
                <ShieldAlert className="text-zinc-600" size={32} />
              </div>
              <p className="font-medium text-zinc-400">No matches matched your criteria.</p>
              <p className="mt-1 text-xs text-zinc-600">
                {searchQuery ? 'Refine your search query.' : 'Run Global Sync to fetch live data.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredMatches.map((match) => (
                <div 
                  key={match.id} 
                  className={`relative overflow-hidden p-6 border rounded-2xl transition-all duration-300 ${
                    match.isHidden 
                    ? 'bg-black/40 border-yellow-600/30 grayscale-[0.5]' 
                    : 'bg-zinc-900/20 border-white/5 hover:border-white/10 shadow-xl'
                  }`}
                >
                  {/* Status Bar */}
                  <div className="flex flex-col justify-between gap-4 mb-6 md:flex-row md:items-center">
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col items-center group">
                        <div className="flex items-center justify-center overflow-hidden transition-transform border rounded-full w-14 h-14 bg-black/60 border-white/5 group-hover:scale-105">
                          {match.home?.logo ? (
                            <img src={match.home.logo} className="object-contain w-10 h-10" alt={match.home.name} />
                          ) : (
                            <span className="text-xl font-bold">{match.home?.name?.charAt(0) || 'H'}</span>
                          )}
                        </div>
                        <span className="text-[9px] font-black text-zinc-600 mt-2 tracking-widest">HOME</span>
                      </div>
                      
                      <div className="flex flex-col items-center px-4">
                        <div className="flex items-center gap-4">
                          <span className="text-4xl font-black tracking-tighter">{match.home?.score || 0}</span>
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-red-600 bg-red-600/10 px-2 rounded">VS</span>
                          </div>
                          <span className="text-4xl font-black tracking-tighter">{match.away?.score || 0}</span>
                        </div>
                        <p className="mt-2 text-xs font-medium text-zinc-400">{match.home?.name} vs {match.away?.name}</p>
                      </div>
                      
                      <div className="flex flex-col items-center group">
                        <div className="flex items-center justify-center overflow-hidden transition-transform border rounded-full w-14 h-14 bg-black/60 border-white/5 group-hover:scale-105">
                          {match.away?.logo ? (
                            <img src={match.away.logo} className="object-contain w-10 h-10" alt={match.away.name} />
                          ) : (
                            <span className="text-xl font-bold">{match.away?.name?.charAt(0) || 'A'}</span>
                          )}
                        </div>
                        <span className="text-[9px] font-black text-zinc-600 mt-2 tracking-widest">AWAY</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <div className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                        STATUS_OPTIONS.find(s => s.value === match.status)?.color || 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {match.status} {match.minute ? `• ${match.minute}'` : ''}
                      </div>
                      {match.isElite && (
                        <div className="px-3 py-1.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-full text-[11px] font-black flex items-center gap-1.5">
                          <Trophy size={12} /> ELITE
                        </div>
                      )}
                      {match.isHidden && (
                        <div className="px-3 py-1.5 bg-zinc-800 text-zinc-400 rounded-full text-[11px] font-black flex items-center gap-1.5">
                          <EyeOff size={12} /> HIDDEN
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Grid */}
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Quick Controls */}
                    <div className="p-4 border rounded-xl bg-black/20 border-white/5">
                      <p className="text-[10px] font-bold uppercase text-zinc-500 mb-3 flex items-center gap-2">
                        <Settings size={12}/> Match Sequence
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {['start', 'halftime', 'resume', 'end'].map(action => (
                          <button
                            key={action}
                            onClick={() => handleQuickAction(action, match)}
                            className="flex-1 min-w-[80px] px-3 py-2 text-[11px] font-bold uppercase transition-all rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 border border-white/5"
                          >
                            {action}
                          </button>
                        ))}
                        <button
                          onClick={() => handleQuickAction('toggle_elite', match)}
                          className={`flex-1 min-w-[100px] px-3 py-2 text-[11px] font-bold uppercase rounded-lg transition-all ${match.isElite ? 'bg-yellow-600/20 text-yellow-500 border border-yellow-600/30' : 'bg-white/5 hover:bg-white/10'}`}
                        >
                          {match.isElite ? 'Unmark Elite' : 'Mark Elite'}
                        </button>
                        <button
                          onClick={() => handleQuickAction('toggle_hidden', match)}
                          className={`flex-1 min-w-[100px] px-3 py-2 text-[11px] font-bold uppercase rounded-lg transition-all ${match.isHidden ? 'bg-white text-black font-black' : 'bg-white/5 hover:bg-white/10'}`}
                        >
                          {match.isHidden ? 'Un-Hide' : 'Hide Match'}
                        </button>
                      </div>
                    </div>
                    
                    {/* Score & Status Control */}
                    <div className="p-4 border rounded-xl bg-black/20 border-white/5">
                      <p className="text-[10px] font-bold uppercase text-zinc-500 mb-3 flex items-center gap-2">
                        <Edit3 size={12}/> Score & Timing
                      </p>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1">
                          <label className="block text-[9px] text-zinc-500 uppercase mb-1 font-bold">Home</label>
                          <input
                            type="number"
                            defaultValue={match.home?.score || 0}
                            className="w-full p-2.5 font-black text-lg text-center border rounded-lg bg-black/50 border-white/10 focus:border-red-600/50 outline-none transition-colors"
                            onBlur={(e) => handleUpdateScore(match.id, 'home', e.target.value)}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-[9px] text-zinc-500 uppercase mb-1 font-bold">Away</label>
                          <input
                            type="number"
                            defaultValue={match.away?.score || 0}
                            className="w-full p-2.5 font-black text-lg text-center border rounded-lg bg-black/50 border-white/10 focus:border-red-600/50 outline-none transition-colors"
                            onBlur={(e) => handleUpdateScore(match.id, 'away', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={match.status}
                          className="flex-1 p-2.5 text-xs font-bold border rounded-lg bg-black/50 border-white/10 focus:border-red-600/50 outline-none"
                          onChange={(e) => handleUpdateStatus(match.id, e.target.value, match.minute)}
                        >
                          {STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <div className="w-20">
                          <input
                            type="number"
                            defaultValue={match.minute}
                            placeholder="Min"
                            className="w-full p-2.5 text-xs font-bold text-center border rounded-lg bg-black/50 border-white/10 focus:border-red-600/50 outline-none"
                            onBlur={(e) => handleUpdateStatus(match.id, match.status, e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Stream & Critical Actions */}
                    <div className="p-4 border rounded-xl bg-black/20 border-white/5">
                      <p className="text-[10px] font-bold uppercase text-zinc-500 mb-3 flex items-center gap-2">
                        <Globe size={12}/> Delivery URL
                      </p>
                      <textarea
                        defaultValue={match.streamUrl1 ? safeDecodeBase64(match.streamUrl1) : ''}
                        className="w-full h-[72px] p-3 text-[11px] font-mono border rounded-lg resize-none bg-black/50 border-white/10 focus:border-red-600/50 outline-none mb-3"
                        onBlur={(e) => handleUpdateStream(match.id, e.target.value)}
                        placeholder="Paste encoded stream URL..."
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if(window.confirm("Permanent Delete: Are you sure?")) handleDeleteMatch(match.id);
                          }}
                          className="flex items-center justify-center flex-1 gap-2 px-3 py-2.5 text-[11px] font-black uppercase text-red-500 transition-all rounded-lg bg-red-600/10 border border-red-600/20 hover:bg-red-600/20"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                        <button
                          onClick={() => setEditingMatchId(editingMatchId === match.id ? null : match.id)}
                          className={`flex-1 px-3 py-2.5 text-[11px] font-black uppercase transition-all rounded-lg border ${editingMatchId === match.id ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10 border-white/10'}`}
                        >
                          {editingMatchId === match.id ? 'Save Changes' : 'Detailed Edit'}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Editor (Slide Down) */}
                  {editingMatchId === match.id && (
                    <div className="pt-6 mt-6 space-y-6 duration-300 border-t border-white/10 animate-in fade-in slide-in-from-top-2">
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] font-bold uppercase text-zinc-500 mb-2">Competition / League Name</p>
                            <input
                              type="text"
                              defaultValue={match.league}
                              className="w-full p-3 text-sm font-medium border outline-none rounded-xl bg-black/50 border-white/10 focus:border-red-600/50"
                              onBlur={(e) => updateDoc(doc(db, "matches", match.id), { 
                                league: e.target.value,
                                lastUpdated: serverTimestamp() 
                              })}
                            />
                          </div>
                          <div className="p-4 border rounded-xl bg-black/40 border-white/5">
                            <p className="text-[10px] font-bold uppercase text-zinc-500 mb-1">Internal Reference</p>
                            <code className="text-[10px] text-zinc-600 break-all">{match.id}</code>
                            <p className="mt-2 text-xs text-zinc-400">
                              Kickoff: {new Date(match.kickoff).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-zinc-500 mb-2">AI Signal Prediction</p>
                          <textarea
                            defaultValue={match.aiPick}
                            className="w-full h-32 p-4 text-xs font-medium leading-relaxed border outline-none resize-none rounded-xl bg-black/50 border-white/10 focus:border-red-600/50"
                            placeholder="e.g. Over 2.5 Goals predicted based on high offensive pressure..."
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
      <div className="mt-12">
        <div className="flex items-center justify-between px-2 mb-4">
          <h3 className="flex items-center gap-2 text-xs font-black tracking-widest uppercase text-zinc-500">
            <Globe size={14} className="text-red-600"/> Live Ticker Infrastructure
          </h3>
          <button 
            onClick={() => {
              if(window.confirm("Clear all recent messages?")) {
                const messages = tickerMessages.slice(0, 5);
                messages.forEach(msg => deleteDoc(doc(db, "ticker", msg.id)));
              }
            }}
            className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-tighter text-red-400 transition-colors rounded-full bg-red-600/10 border border-red-600/20 hover:bg-red-600/20"
          >
            Purge Buffer
          </button>
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="bg-zinc-900/40 border border-white/5 rounded-2xl h-[450px] flex flex-col shadow-2xl">
              <div className="p-4 border-b border-white/5 bg-black/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                    <span className="text-sm font-black tracking-tighter uppercase">Live Transmission Feed</span>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 bg-white/5 px-2 py-1 rounded">{tickerMessages.length} PKTS</span>
                </div>
              </div>
              <div className="flex-1 p-4 space-y-3 overflow-y-auto scrollbar-hide">
                {tickerMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full opacity-30">
                    <Globe size={40} className="mb-4" />
                    <p className="text-sm font-medium">No telemetry data detected</p>
                  </div>
                ) : (
                  tickerMessages.map((msg) => (
                    <div key={msg.id} className="p-4 transition-colors border group bg-black/40 border-white/5 rounded-xl hover:border-white/10">
                      <div className="flex items-start justify-between">
                        <p className="flex-1 text-sm font-medium leading-relaxed text-zinc-200">{msg.text}</p>
                        <button
                          onClick={() => deleteDoc(doc(db, "ticker", msg.id))}
                          className="p-1 ml-4 transition-colors opacity-0 text-zinc-600 hover:text-red-500 group-hover:opacity-100"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="text-[9px] font-black uppercase text-zinc-500 mt-3 flex items-center gap-2">
                        <span className="text-red-500">{msg.user || 'SYSTEM'}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-700" />
                        <span>{msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString() : 'SYNCHRONIZING'}</span>
                        {msg.type && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-zinc-700" />
                            <span className={`px-2 py-0.5 rounded-full ${
                              msg.type === 'error' ? 'bg-red-600/20 text-red-400' :
                              msg.type === 'system' ? 'bg-blue-600/20 text-blue-400' :
                              'bg-zinc-600/20 text-zinc-400'
                            }`}>
                              {msg.type}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="p-6 border shadow-xl bg-black/40 border-white/5 rounded-2xl">
              <h4 className="mb-4 text-xs font-black tracking-widest uppercase text-zinc-400">Manual Broadcast</h4>
              <textarea
                value={tickerInput}
                onChange={e => setTickerInput(e.target.value)}
                className="w-full h-32 p-4 mb-4 text-sm font-medium leading-relaxed border outline-none resize-none rounded-xl bg-black/50 border-white/10 focus:border-red-600/50"
                placeholder="Enter message for all connected clients..."
              />
              <button
                onClick={handleBroadcast}
                disabled={!tickerInput.trim()}
                className="flex items-center justify-center w-full gap-2 p-4 text-sm font-black tracking-widest uppercase transition-all bg-red-600 shadow-lg rounded-xl hover:bg-red-700 disabled:opacity-30 disabled:grayscale shadow-red-600/20"
              >
                <Send size={18} /> Transmit Message
              </button>
            </div>
            
            <div className="p-6 border bg-black/40 border-white/5 rounded-2xl">
              <h4 className="mb-4 text-xs font-black tracking-widest uppercase text-zinc-400">Quick Protocols</h4>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { label: '⚡ Maintenance', text: '⚡ SYSTEM: Server maintenance in 10 minutes' },
                  { label: '🎯 AI Prediction', text: '🎯 AI: New predictions available for elite matches' },
                  { label: '⚠️ Stream Issue', text: '⚠️ URGENT: Stream issues detected, fixing now...' }
                ].map((cmd, i) => (
                  <button
                    key={i}
                    onClick={() => setTickerInput(cmd.text)}
                    className="w-full p-3 text-xs font-bold text-left transition-all border border-transparent rounded-lg bg-white/5 hover:bg-white/10 hover:border-white/5"
                  >
                    {cmd.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INJECTION MODAL */}
      {showAddMatch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
          <form 
            onSubmit={handleManualAdd} 
            className="bg-zinc-900 p-6 md:p-10 rounded-3xl border border-white/10 w-full max-w-4xl space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-2xl font-black tracking-tighter uppercase">Signal <span className="text-red-600">Injection</span></h3>
                <p className="text-xs text-zinc-500">Manually override database with new match signal</p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowAddMatch(false)}
                className="p-3 transition-colors rounded-full bg-white/5 hover:bg-white/10"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {/* Home Team Config */}
              <div className="p-5 space-y-4 border rounded-2xl bg-black/30 border-white/5">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Home Configuration</h4>
                <div className="space-y-3">
                  <input 
                    placeholder="Team Name" 
                    required 
                    className="w-full p-3.5 text-sm font-bold bg-black border rounded-xl border-white/10 focus:border-red-600/50 outline-none" 
                    value={newMatch.homeName}
                    onChange={e => setNewMatch({...newMatch, homeName: e.target.value})} 
                  />
                  <input 
                    placeholder="Logo PNG URL" 
                    className="w-full p-3.5 text-xs font-mono bg-black border rounded-xl border-white/10 focus:border-red-600/50 outline-none" 
                    value={newMatch.homeLogo}
                    onChange={e => setNewMatch({...newMatch, homeLogo: e.target.value})} 
                  />
                </div>
              </div>

              {/* Away Team Config */}
              <div className="p-5 space-y-4 border rounded-2xl bg-black/30 border-white/5">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Away Configuration</h4>
                <div className="space-y-3">
                  <input 
                    placeholder="Team Name" 
                    required 
                    className="w-full p-3.5 text-sm font-bold bg-black border rounded-xl border-white/10 focus:border-red-600/50 outline-none" 
                    value={newMatch.awayName}
                    onChange={e => setNewMatch({...newMatch, awayName: e.target.value})} 
                  />
                  <input 
                    placeholder="Logo PNG URL" 
                    className="w-full p-3.5 text-xs font-mono bg-black border rounded-xl border-white/10 focus:border-red-600/50 outline-none" 
                    value={newMatch.awayLogo}
                    onChange={e => setNewMatch({...newMatch, awayLogo: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-500 px-1">League</label>
                <input 
                  placeholder="e.g. Premier League" 
                  className="w-full p-3.5 text-sm font-bold bg-black border rounded-xl border-white/10 focus:border-red-600/50 outline-none" 
                  value={newMatch.league}
                  onChange={e => setNewMatch({...newMatch, league: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-500 px-1">Kickoff (Local)</label>
                <input 
                  type="datetime-local" 
                  className="w-full p-3.5 text-sm font-bold bg-black border rounded-xl border-white/10 focus:border-red-600/50 outline-none" 
                  value={newMatch.kickoff}
                  onChange={e => setNewMatch({...newMatch, kickoff: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-500 px-1">Initial Status</label>
                <select 
                  className="w-full p-3.5 text-sm font-bold bg-black border rounded-xl border-white/10 focus:border-red-600/50 outline-none appearance-none"
                  value={newMatch.status}
                  onChange={e => setNewMatch({...newMatch, status: e.target.value})}
                >
                  {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Delivery & Flags */}
            <div className="grid items-end grid-cols-1 gap-6 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-500 px-1">Start Min</label>
                <input 
                  type="number" 
                  className="w-full p-3.5 text-sm font-bold bg-black border rounded-xl border-white/10 focus:border-red-600/50 outline-none" 
                  value={newMatch.minute}
                  onChange={e => setNewMatch({...newMatch, minute: e.target.value})} 
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-bold uppercase text-zinc-500 px-1">Source Stream URL</label>
                <input 
                  placeholder="https://live-provider.com/..." 
                  required 
                  className="w-full p-3.5 text-xs font-mono bg-black border rounded-xl border-white/10 focus:border-red-600/50 outline-none" 
                  value={newMatch.stream1}
                  onChange={e => setNewMatch({...newMatch, stream1: e.target.value})} 
                />
              </div>
              <div className="flex gap-4 p-3.5 bg-black/40 rounded-xl border border-white/5">
                <label className="flex items-center justify-center flex-1 gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={newMatch.isElite}
                    onChange={e => setNewMatch({...newMatch, isElite: e.target.checked})}
                    className="w-4 h-4 rounded accent-red-600"
                  />
                  <span className="text-[10px] font-black uppercase group-hover:text-red-500 transition-colors">Elite</span>
                </label>
                <label className="flex items-center justify-center flex-1 gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={newMatch.isHidden}
                    onChange={e => setNewMatch({...newMatch, isHidden: e.target.checked})}
                    className="w-4 h-4 rounded accent-yellow-500"
                  />
                  <span className="text-[10px] font-black uppercase group-hover:text-yellow-500 transition-colors">Hide</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-zinc-500 px-1">Initial AI Narrative</label>
              <textarea 
                placeholder="Predictive analysis for match start..."
                className="w-full h-24 p-4 text-sm font-medium bg-black border outline-none resize-none rounded-2xl border-white/10 focus:border-red-600/50"
                value={newMatch.aiPick}
                onChange={e => setNewMatch({...newMatch, aiPick: e.target.value})}
              />
            </div>

            <button type="submit" className="w-full py-5 font-black tracking-[0.2em] uppercase transition-all rounded-2xl shadow-2xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 hover:scale-[1.01] active:scale-[0.99] shadow-red-600/20">
              Execute Injection & Broadcast
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Admin;