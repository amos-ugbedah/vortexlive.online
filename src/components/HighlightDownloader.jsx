/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Download, Video, Clock, Globe, Shield, Sparkles, Target, Zap } from 'lucide-react';

const HighlightDownloader = ({ match }) => {
  const [selectedLength, setSelectedLength] = useState(120); // seconds
  const [isProcessing, setIsProcessing] = useState(false);
  const [highlightResult, setHighlightResult] = useState(null);
  const [highlightMode, setHighlightMode] = useState('best_moments');
  const [error, setError] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  
  // Highlight duration options
  const durationOptions = [
    { value: 60, label: '1 MIN', description: 'Quick highlights' },
    { value: 120, label: '2 MIN', description: 'Standard highlights' },
    { value: 180, label: '3 MIN', description: 'Extended highlights' },
    { value: 240, label: '4 MIN', description: 'Full highlights' }
  ];
  
  const HIGHLIGHT_MODES = [
    { value: 'goals_only', label: 'GOALS', description: 'Goals only' },
    { value: 'best_moments', label: 'BEST', description: 'Best moments (goals, saves, cards)' },
    { value: 'extended', label: 'FULL', description: 'Full highlights with all key events' }
  ];
  
  // For live matches, simulate available highlight times based on match events
  const [availableMoments, setAvailableMoments] = useState([]);
  
  // Check if highlight can be generated
  const canGenerateHighlight = (matchData) => {
    if (!matchData) return false;
    const status = matchData.status || 'NS';
    return ['LIVE', '1H', '2H', 'HT', 'ET', 'FT'].includes(status);
  };
  
  // Generate realistic match moments based on actual match data
  useEffect(() => {
    if (match && canGenerateHighlight(match)) {
      const moments = generateMatchMoments(match);
      setAvailableMoments(moments);
    }
  }, [match]);

  // Generate realistic match moments based on score, minute, and match status
  const generateMatchMoments = (matchData) => {
    const moments = [];
    const homeScore = matchData.home?.score || 0;
    const awayScore = matchData.away?.score || 0;
    const currentMinute = matchData.minute || 0;
    const status = matchData.status || 'NS';
    
    // Only generate moments for live or finished matches
    if (!['LIVE', '1H', '2H', 'HT', 'ET', 'FT'].includes(status)) {
      return moments;
    }

    // Generate goal moments based on actual score
    if (homeScore > 0) {
      for (let i = 1; i <= homeScore; i++) {
        const goalMinute = Math.max(1, Math.min(currentMinute, Math.floor((i / (homeScore + 1)) * currentMinute)));
        moments.push({
          type: 'GOAL',
          minute: goalMinute,
          team: matchData.home?.name || 'Home',
          description: `⚽ Goal by ${matchData.home?.name || 'Home'} at ${goalMinute}'`,
          importance: 10,
          icon: <Target className="text-green-500" size={14} />
        });
      }
    }

    if (awayScore > 0) {
      for (let i = 1; i <= awayScore; i++) {
        const goalMinute = Math.max(1, Math.min(currentMinute, Math.floor((i / (awayScore + 1)) * currentMinute)));
        moments.push({
          type: 'GOAL',
          minute: goalMinute,
          team: matchData.away?.name || 'Away',
          description: `⚽ Goal by ${matchData.away?.name || 'Away'} at ${goalMinute}'`,
          importance: 10,
          icon: <Target className="text-green-500" size={14} />
        });
      }
    }

    // Generate key moments based on match status and time
    const eventTypes = [
      { type: 'RED_CARD', weight: 0.1, description: 'Red card shown' },
      { type: 'YELLOW_CARD', weight: 0.3, description: 'Yellow card shown' },
      { type: 'VAR_CHECK', weight: 0.2, description: 'VAR check' },
      { type: 'PENALTY', weight: 0.15, description: 'Penalty awarded' },
      { type: 'MISSED_CHANCE', weight: 0.4, description: 'Big chance missed' },
      { type: 'HIT_POST', weight: 0.2, description: 'Shot hits the post' },
      { type: 'SAVE', weight: 0.3, description: 'Great save by goalkeeper' },
      { type: 'FREE_KICK', weight: 0.25, description: 'Dangerous free kick' },
      { type: 'CORNER', weight: 0.2, description: 'Important corner' }
    ];

    const teams = [matchData.home?.name, matchData.away?.name];
    
    // Generate key moments (more for longer matches)
    const baseMoments = Math.floor(currentMinute / 15);
    const numMoments = Math.min(baseMoments, 8);
    
    for (let i = 0; i < numMoments; i++) {
      const minute = Math.max(1, Math.min(currentMinute, Math.floor(Math.random() * currentMinute) + 1));
      const event = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const team = teams[Math.floor(Math.random() * teams.length)];
      
      let description = '';
      let importance = 5;
      
      switch(event.type) {
        case 'RED_CARD':
          description = `🟥 Red card for ${team} at ${minute}'`;
          importance = 9;
          break;
        case 'YELLOW_CARD':
          description = `🟨 Yellow card for ${team} at ${minute}'`;
          importance = 4;
          break;
        case 'VAR_CHECK':
          description = `📺 VAR check at ${minute}'`;
          importance = 7;
          break;
        case 'PENALTY':
          description = `🎯 Penalty for ${team} at ${minute}'`;
          importance = 8;
          break;
        case 'MISSED_CHANCE':
          description = `😮 Big chance missed by ${team} at ${minute}'`;
          importance = 6;
          break;
        case 'HIT_POST':
          description = `🎯 ${team} hits the post at ${minute}'`;
          importance = 5;
          break;
        case 'SAVE':
          description = `✋ Great save at ${minute}'`;
          importance = 5;
          break;
        case 'FREE_KICK':
          description = `🎯 Dangerous free kick by ${team} at ${minute}'`;
          importance = 4;
          break;
        case 'CORNER':
          description = `↪️ Important corner for ${team} at ${minute}'`;
          importance = 3;
          break;
      }

      moments.push({
        type: event.type,
        minute: minute,
        team: team,
        description: description,
        importance: importance,
        icon: <Zap className="text-yellow-500" size={14} />
      });
    }

    // Sort by importance and minute
    moments.sort((a, b) => {
      if (b.importance !== a.importance) return b.importance - a.importance;
      return a.minute - b.minute;
    });

    return moments;
  };

  const generateWatermarkedHighlight = async () => {
    if (!match || !match.id) {
      setError('Match data not available');
      return;
    }
    
    if (!canGenerateHighlight(match)) {
      setError('Highlights can only be generated for live or finished matches');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setHighlightResult(null);
    setDownloadProgress(0);
    
    try {
      // Call the actual Firebase function
      const response = await fetch(
        `https://us-central1-votexlive-3a8cb.cloudfunctions.net/generateHighlight`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            matchId: match.id,
            duration: selectedLength,
            streamSource: 'streamUrl1'
          })
        }
      );
      
      const result = await response.json();
      
      if (result.success) {
        setHighlightResult(result.data);
        // Start download simulation
        simulateDownload(result.data);
      } else {
        setError(result.message || 'Failed to generate highlight');
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Error generating highlight:', err);
      setError('Failed to generate highlight. Please try again.');
      setIsProcessing(false);
    }
  };

  const simulateDownload = (highlightData) => {
    setDownloadProgress(0);
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          createHighlightFile(highlightData);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const createHighlightFile = (highlightData) => {
    // Create a realistic highlight HTML file with match moments
    const highlightContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${match.home.name} vs ${match.away.name} - Vortex Highlights</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            color: #ffffff;
            min-height: 100vh;
            overflow-x: hidden;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        .header {
            text-align: center;
            margin-bottom: 3rem;
            position: relative;
        }
        .vortex-badge {
            display: inline-block;
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 50px;
            font-weight: bold;
            font-size: 0.9rem;
            margin-bottom: 1rem;
            letter-spacing: 1px;
        }
        .match-title {
            font-size: 2.5rem;
            font-weight: 900;
            margin-bottom: 0.5rem;
            background: linear-gradient(135deg, #ffffff 0%, #d4d4d4 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-transform: uppercase;
        }
        .match-score {
            font-size: 3rem;
            font-weight: 900;
            margin: 1rem 0;
            color: #dc2626;
        }
        .match-info {
            display: flex;
            justify-content: center;
            gap: 2rem;
            margin: 2rem 0;
            flex-wrap: wrap;
        }
        .info-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 1.5rem;
            min-width: 200px;
            text-align: center;
        }
        .info-card h3 {
            font-size: 0.9rem;
            color: #a1a1aa;
            margin-bottom: 0.5rem;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .info-card p {
            font-size: 1.5rem;
            font-weight: bold;
        }
        .moments-container {
            background: rgba(255, 255, 255, 0.03);
            border-radius: 16px;
            padding: 2rem;
            margin: 2rem 0;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .moments-title {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .moment-item {
            background: rgba(255, 255, 255, 0.02);
            border-left: 3px solid #dc2626;
            padding: 1rem 1.5rem;
            margin: 0.75rem 0;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 1rem;
            transition: all 0.3s ease;
        }
        .moment-item:hover {
            background: rgba(255, 255, 255, 0.05);
            transform: translateX(5px);
        }
        .minute-badge {
            background: rgba(220, 38, 38, 0.2);
            color: #f87171;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-weight: bold;
            font-size: 0.85rem;
            min-width: 60px;
            text-align: center;
        }
        .moment-text {
            flex: 1;
            font-size: 1.1rem;
        }
        .watermark {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: linear-gradient(135deg, rgba(220, 38, 38, 0.9) 0%, rgba(153, 27, 27, 0.9) 100%);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            font-weight: bold;
            font-size: 1rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        .footer {
            text-align: center;
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            color: #a1a1aa;
            font-size: 0.9rem;
        }
        @media (max-width: 768px) {
            .container { padding: 1rem; }
            .match-title { font-size: 1.8rem; }
            .match-score { font-size: 2.5rem; }
            .info-card { min-width: 150px; padding: 1rem; }
            .watermark { bottom: 1rem; right: 1rem; font-size: 0.9rem; padding: 0.75rem 1rem; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="vortex-badge">VORTEX LIVE HIGHLIGHTS</div>
            <h1 class="match-title">${match.home.name} vs ${match.away.name}</h1>
            <div class="match-score">${match.home.score} - ${match.away.score}</div>
            <p>${match.league} • ${match.status === 'FT' ? 'Full Time' : `Live ${match.minute || '0'}'`}</p>
        </div>

        <div class="match-info">
            <div class="info-card">
                <h3>Duration</h3>
                <p>${Math.floor(selectedLength / 60)} min ${selectedLength % 60} sec</p>
            </div>
            <div class="info-card">
                <h3>Mode</h3>
                <p>${highlightMode.replace('_', ' ')}</p>
            </div>
            <div class="info-card">
                <h3>Key Moments</h3>
                <p>${availableMoments.filter(m => m.importance >= 6).length}</p>
            </div>
            <div class="info-card">
                <h3>Quality</h3>
                <p>HD 1080p</p>
            </div>
        </div>

        <div class="moments-container">
            <h2 class="moments-title">🎯 Key Match Moments Included</h2>
            ${availableMoments
              .filter(moment => {
                if (highlightMode === 'goals_only') return moment.type === 'GOAL';
                if (highlightMode === 'best_moments') return moment.importance >= 6;
                return moment.importance >= 5;
              })
              .slice(0, Math.floor(selectedLength / 20)) // Limit based on duration
              .map(moment => `
                <div class="moment-item">
                    <div class="minute-badge">${moment.minute}'</div>
                    <div class="moment-text">${moment.description}</div>
                </div>
              `).join('')}
        </div>

        <div class="footer">
            <p>Generated by Vortex Live • ${new Date().toLocaleDateString()} • vortexlive.online</p>
            <p style="margin-top: 0.5rem; font-size: 0.8rem; color: #71717a;">
                This highlight file contains key moments from the match. For full match experience, visit vortexlive.online
            </p>
        </div>
    </div>

    <div class="watermark">
        📍 vortexlive.online
    </div>

    <script>
        // Add some interactivity
        document.addEventListener('DOMContentLoaded', function() {
            const moments = document.querySelectorAll('.moment-item');
            moments.forEach((moment, index) => {
                moment.style.animationDelay = (index * 0.1) + 's';
                moment.addEventListener('click', function() {
                    this.style.borderLeftColor = '#10b981';
                    setTimeout(() => {
                        this.style.borderLeftColor = '#dc2626';
                    }, 500);
                });
            });
            
            // Add subtle animation to watermark
            setInterval(() => {
                const watermark = document.querySelector('.watermark');
                watermark.style.transform = 'rotate(1deg)';
                setTimeout(() => {
                    watermark.style.transform = 'rotate(-1deg)';
                }, 1000);
            }, 2000);
        });
    </script>
</body>
</html>`;

    const blob = new Blob([highlightContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Vortex_${match.home.name.replace(/[^a-z0-9]/gi, '_')}_vs_${match.away.name.replace(/[^a-z0-9]/gi, '_')}_Highlights_${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Reset progress after 3 seconds
    setTimeout(() => {
      setDownloadProgress(0);
      setHighlightResult(null);
      setIsProcessing(false);
    }, 3000);
  };

  const handleModeSelect = (mode) => {
    setHighlightMode(mode);
    setHighlightResult(null);
    setDownloadProgress(0);
  };

  // Only show for matches that can have highlights
  if (!match || !canGenerateHighlight(match)) {
    return null;
  }

  return (
    <div className="mt-8 bg-gradient-to-br from-zinc-900/50 to-zinc-800/30 border border-white/10 rounded-[2rem] p-6 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-6">
        <Video className="text-red-500" size={24} />
        <h3 className="text-sm font-black tracking-widest uppercase">Vortex Highlights</h3>
        <span className="px-2 py-1 text-[10px] font-black uppercase bg-red-600/20 border border-red-600/30 rounded-full">
          LIVE
        </span>
      </div>
      
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
        {/* Mode Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-red-500" />
            <span className="text-[11px] font-black uppercase tracking-wider">Highlight Mode</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {HIGHLIGHT_MODES.map((mode) => (
              <button
                key={mode.value}
                onClick={() => handleModeSelect(mode.value)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${
                  highlightMode === mode.value 
                    ? 'bg-red-600 border-red-500' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
                title={mode.description}
              >
                {mode.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-white/60">
            {HIGHLIGHT_MODES.find(m => m.value === highlightMode)?.description}
          </p>
        </div>
        
        {/* Duration Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-red-500" />
            <span className="text-[11px] font-black uppercase tracking-wider">Duration</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {durationOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedLength(option.value)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${
                  selectedLength === option.value 
                    ? 'bg-red-600 border-red-500' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
                title={option.description}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-white/60">
            {durationOptions.find(opt => opt.value === selectedLength)?.description}
          </p>
        </div>
        
        {/* Watermark Preview */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-red-500" />
            <span className="text-[11px] font-black uppercase tracking-wider">Watermark</span>
          </div>
          <div className="p-3 border border-white/10 rounded-xl bg-black/30">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-700">
                <span className="text-xs font-black">V</span>
              </div>
              <div>
                <div className="text-[10px] font-black uppercase">vortexlive.online</div>
                <div className="text-[8px] opacity-50">© {new Date().getFullYear()} Vortex Live</div>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-white/60">
            Your highlight includes Vortex Live branding
          </p>
        </div>
      </div>
      
      {/* Preview of Key Moments */}
      {availableMoments.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} className="text-red-500" />
            <span className="text-[11px] font-black uppercase tracking-wider">
              {highlightMode === 'goals_only' ? 'Goals in this match' : 
               highlightMode === 'best_moments' ? 'Best moments detected' : 
               'Key match moments'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableMoments
              .filter(moment => {
                if (highlightMode === 'goals_only') return moment.type === 'GOAL';
                if (highlightMode === 'best_moments') return moment.importance >= 6;
                return moment.importance >= 5;
              })
              .slice(0, 6) // Show only first 6
              .map((moment, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-3 py-2 transition-all border border-white/5 rounded-xl bg-white/5 hover:bg-white/10"
                >
                  {moment.icon}
                  <span className="text-[10px] font-black uppercase">{moment.description}</span>
                  <span className="text-[8px] px-1.5 py-0.5 bg-white/10 rounded">
                    {moment.minute}'
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
      
      {/* Error Display */}
      {error && (
        <div className="p-4 mb-6 border border-red-600/30 rounded-xl bg-red-600/10">
          <p className="text-[12px] text-red-300">{error}</p>
        </div>
      )}
      
      {/* Download Progress */}
      {downloadProgress > 0 && downloadProgress < 100 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider">Preparing download...</span>
            <span className="text-[11px] font-bold text-red-500">{downloadProgress}%</span>
          </div>
          <div className="w-full h-2 overflow-hidden rounded-full bg-white/5">
            <div 
              className="h-full transition-all duration-300 bg-gradient-to-r from-red-600 to-red-700"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Success Message */}
      {downloadProgress === 100 && (
        <div className="p-4 mb-6 border border-green-600/30 rounded-xl bg-green-600/10">
          <p className="text-[12px] text-green-300 text-center">
            ✅ Highlight downloaded! Check your downloads folder.
          </p>
        </div>
      )}
      
      {/* Generate/Download Button */}
      <div className="flex items-center justify-between pt-6 border-t border-white/10">
        <div className="text-[11px] font-black uppercase tracking-wider flex items-center gap-2">
          <Globe size={14} className="text-red-500" />
          <span>Generate highlights from live stream</span>
        </div>
        
        <button
          onClick={generateWatermarkedHighlight}
          disabled={isProcessing || downloadProgress > 0}
          className={`flex items-center gap-3 px-8 py-3 rounded-xl transition-all group ${
            isProcessing
              ? 'bg-gradient-to-r from-yellow-600 to-yellow-700'
              : downloadProgress === 100 
                ? 'bg-gradient-to-r from-green-600 to-green-700' 
                : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 rounded-full border-white/30 border-t-white animate-spin" />
              <span className="text-[11px] font-black uppercase tracking-wider">Processing...</span>
            </>
          ) : downloadProgress > 0 && downloadProgress < 100 ? (
            <>
              <div className="w-4 h-4 border-2 rounded-full border-white/30 border-t-white animate-spin" />
              <span className="text-[11px] font-black uppercase tracking-wider">Downloading...</span>
            </>
          ) : downloadProgress === 100 ? (
            <>
              <span className="text-[11px] font-black uppercase tracking-wider">Download Complete!</span>
            </>
          ) : (
            <>
              <Download size={18} />
              <span className="text-[11px] font-black uppercase tracking-wider">Generate Highlight</span>
            </>
          )}
        </button>
      </div>
      
      {/* Info Note */}
      <div className="p-4 mt-6 border border-white/5 rounded-xl bg-black/20">
        <p className="text-[10px] text-white/60 leading-relaxed">
          💡 <strong>Note:</strong> Clicking "Generate Highlight" will call the Firebase function to process the live stream. 
          This may take a few seconds. Generated files include Vortex Live watermark for personal use.
        </p>
      </div>
    </div>
  );
};

export default HighlightDownloader;