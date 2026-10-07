import React from 'react';
import {
  Volume2,
  VolumeX,
  Radio,
  FileCode2,
  Users,
  GitFork,
  Cpu,
  Square,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'workflow' | 'grid' | 'blueprints';
  setActiveTab: (tab: 'workflow' | 'grid' | 'blueprints') => void;
  preferNaturalVoice: boolean;
  setPreferNaturalVoice: (val: boolean) => void;
  isAnyAudioPlaying: boolean;
  onStopAllAudio: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  preferNaturalVoice,
  setPreferNaturalVoice,
  isAnyAudioPlaying,
  onStopAllAudio,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-950/50">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">Pegasus.io</h1>
                <span className="text-xs text-cyan-400 font-mono">Pegasus Core</span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                12 specialized executive agents · durable governed execution
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex items-center gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('workflow')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'workflow'
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>War Room Pipeline</span>
            </button>

            <button
              onClick={() => setActiveTab('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'grid'
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>12-Voice Grid</span>
            </button>

            <button
              onClick={() => setActiveTab('blueprints')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'blueprints'
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Agent Blueprints</span>
            </button>
          </nav>

          {/* Right Controls: Live provider state & Master Mute */}
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border bg-slate-900 text-emerald-300 border-emerald-900/60" title="Pegasus Core reasoning provider">
              <Cpu className="w-3.5 h-3.5" />
              <span>Brain: Google AI Studio</span>
            </div>
            {/* Audio Engine Mode Toggle */}
            <button
              onClick={() => setPreferNaturalVoice(!preferNaturalVoice)}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                preferNaturalVoice
                  ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title="Zero-cost browser Web Speech voices"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Voice: Browser Web Speech</span>
            </button>

            {/* Master Audio Stop / Mute */}
            {isAnyAudioPlaying ? (
              <button
                onClick={onStopAllAudio}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500 hover:bg-rose-400 text-white shadow-md animate-pulse transition-all"
                title="Stop all currently playing voices"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Mute All</span>
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-mono px-2 py-1">
                <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Voice Ready</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
