import React from 'react';
import { Volume2, MessageSquare, Terminal, Play, Square, Video } from 'lucide-react';
import { AgentDefinition } from '../data/agents';
import { AvatarFace } from './AvatarFace';
import { AudioWaveform } from './AudioWaveform';

interface AgentCardProps {
  agent: AgentDefinition;
  isSelected: boolean;
  isSpeaking: boolean;
  onSelect: (agent: AgentDefinition) => void;
  onTestVoice: (agent: AgentDefinition) => void;
  onStopVoice: () => void;
  onOpenBlueprint: (agent: AgentDefinition) => void;
  onOpenDailyBriefing?: (agent: AgentDefinition) => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  isSelected,
  isSpeaking,
  onSelect,
  onTestVoice,
  onStopVoice,
  onOpenBlueprint,
  onOpenDailyBriefing,
}) => {
  return (
    <div
      className={`group relative flex flex-col justify-between p-4 rounded-2xl transition-all duration-200 bg-slate-900/90 border ${
        isSelected
          ? 'border-cyan-400 ring-1 ring-cyan-400/40 shadow-xl shadow-cyan-950/60'
          : 'border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900'
      }`}
    >
      <div>
        {/* Top bar with Step and Unboxed Department Metadata */}
        <div className="flex items-center justify-between gap-2 mb-2 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-cyan-400 font-semibold">Stage {String(agent.step).padStart(2, '0')}</span>
            <span aria-hidden="true" className="text-slate-600">/</span>
            <span className="truncate max-w-[130px] text-slate-300 font-medium">{agent.callsign}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono tracking-tight">{agent.accentBadge}</span>
        </div>

        {/* Header with Talking Avatar Face and Name */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative shrink-0">
            <AvatarFace
              agent={agent}
              isSpeaking={isSpeaking}
              size="sm"
              showHud={true}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <h3 className="text-base font-bold text-white tracking-tight truncate">{agent.name}</h3>
              {isSpeaking && (
                <span className="inline-flex items-center gap-1 text-[10px] text-cyan-300 font-mono bg-cyan-950/80 border border-cyan-500/50 px-1.5 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  TALKING
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-cyan-300 truncate mt-0.5">{agent.tagline}</p>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">{agent.department}</p>
          </div>
        </div>

        {/* Short personality & departmental description */}
        <p className="text-xs text-slate-300/85 line-clamp-2 mb-3 leading-relaxed">
          {agent.personality}
        </p>

        {/* Audio Waveform Bar when speaking */}
        {isSpeaking ? (
          <div className="mb-3">
            <AudioWaveform isSpeaking={true} color="bg-cyan-400" />
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-3 font-mono">
            <Volume2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{agent.voiceConfig.style.slice(0, 34)}...</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
        <button
          type="button"
          onClick={() => (isSpeaking ? onStopVoice() : onTestVoice(agent))}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors ${
            isSpeaking
              ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60 hover:bg-rose-900/80'
              : 'bg-slate-800/90 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700/60'
          }`}
          title="Preview signature voice phrase with live mouth animation"
        >
          {isSpeaking ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isSpeaking ? 'Mute' : 'Voice Test'}</span>
        </button>

        {onOpenDailyBriefing && (
          <button
            type="button"
            onClick={() => onOpenDailyBriefing(agent)}
            className="flex items-center justify-center p-1.5 rounded-lg text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/80 hover:text-cyan-200 border border-cyan-800/60 transition-colors"
            title="Open Face-to-Face Daily Briefing"
          >
            <Video className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={() => onSelect(agent)}
          className="flex items-center justify-center p-1.5 rounded-lg text-slate-300 bg-slate-800/60 hover:bg-cyan-950/60 hover:text-cyan-300 hover:border-cyan-800 border border-slate-700/60 transition-colors"
          title="Open 1-on-1 Real-time Talkback"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onOpenBlueprint(agent)}
          className="flex items-center justify-center p-1.5 rounded-lg text-slate-300 bg-slate-800/60 hover:bg-indigo-950/60 hover:text-indigo-300 hover:border-indigo-800 border border-slate-700/60 transition-colors"
          title="Inspect & Copy Agent Prompt Blueprint"
        >
          <Terminal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
