import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Square,
  ChevronLeft,
  ChevronRight,
  FastForward,
  Sparkles,
  Volume2,
  Copy,
  Check,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { AGENTS, AgentDefinition } from '../data/agents';
import { AvatarFace } from './AvatarFace';
import { speakAgent, stopAllAudio } from '../utils/audio';

interface DailyBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferNaturalVoice: boolean;
  projectBrief: string;
  onOpen1on1: (agent: AgentDefinition) => void;
  initialAgent?: AgentDefinition;
  agent?: AgentDefinition;
}

export const DailyBriefingModal: React.FC<DailyBriefingModalProps> = ({
  isOpen,
  onClose,
  preferNaturalVoice,
  projectBrief,
  onOpen1on1,
  initialAgent,
  agent: propAgent,
}) => {
  const [currentAgentIndex, setCurrentAgentIndex] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPlayingAll, setIsPlayingAll] = useState<boolean>(false);
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(32));
  const [copied, setCopied] = useState<boolean>(false);
  const [dailyBriefingText, setDailyBriefingText] = useState<string>('');
  const [isLoadingBriefing, setIsLoadingBriefing] = useState<boolean>(false);

  const agent = AGENTS[currentAgentIndex];

  useEffect(() => {
    const target = propAgent || initialAgent;
    if (target) {
      const idx = AGENTS.findIndex((a) => a.id === target.id);
      if (idx !== -1) setCurrentAgentIndex(idx);
    }
  }, [initialAgent, propAgent, isOpen]);

  // Generate / Load the Daily Update for the current agent
  useEffect(() => {
    if (isOpen && agent) {
      loadDailyBriefing();
    }
    return () => {
      stopAllAudio();
    };
  }, [isOpen, currentAgentIndex]);

  const loadDailyBriefing = async () => {
    stopAllAudio();
    setIsSpeaking(false);
    setIsLoadingBriefing(true);

    const promptText = `Generate your 08:00 AM Daily Executive Briefing ("Update of the Day") for:
Project: "${projectBrief || 'B2B Enterprise AI Platform'}"
Role: ${agent.name} (${agent.tagline}), Department: ${agent.department}.
Personality Voice: ${agent.voiceConfig.style}.

Speak directly to the Commander / Founder face-to-face in 3 to 4 punchy, natural spoken sentences.
State what happened overnight, your top focus today, and the critical handoff. Include your signature personality tone.`;

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          message: promptText,
          projectBrief,
        }),
      });
      const data = await res.json();
      const text = data.text || agent.voiceConfig.samplePhrase;
      setDailyBriefingText(text);
      setIsLoadingBriefing(false);

      // Auto-start face talking
      startTalking(text);
    } catch {
      const fallback = `Good morning Commander. This is ${agent.name} with your daily ${agent.tagline} briefing. All systems in ${agent.department} are locked onto our core leverage point. Let us execute today's mission.`;
      setDailyBriefingText(fallback);
      setIsLoadingBriefing(false);
      startTalking(fallback);
    }
  };

  const startTalking = (textToSpeak: string) => {
    stopAllAudio();
    setIsSpeaking(true);

    speakAgent(
      textToSpeak,
      agent.id,
      agent.voiceConfig,
      preferNaturalVoice,
      () => setIsSpeaking(true),
      () => {
        setIsSpeaking(false);
        setFrequencyData(new Uint8Array(32));

        // If in "Play All Chain" mode, advance to next agent
        if (isPlayingAll && currentAgentIndex < AGENTS.length - 1) {
          setTimeout(() => {
            setCurrentAgentIndex((prev) => prev + 1);
          }, 800);
        } else if (isPlayingAll) {
          setIsPlayingAll(false);
        }
      },
      (freqs) => setFrequencyData(freqs)
    );
  };

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      stopAllAudio();
      setIsSpeaking(false);
      setIsPlayingAll(false);
    } else {
      startTalking(dailyBriefingText || agent.voiceConfig.samplePhrase);
    }
  };

  const handleNextAgent = () => {
    stopAllAudio();
    setIsPlayingAll(false);
    setCurrentAgentIndex((prev) => (prev + 1) % AGENTS.length);
  };

  const handlePrevAgent = () => {
    stopAllAudio();
    setIsPlayingAll(false);
    setCurrentAgentIndex((prev) => (prev - 1 + AGENTS.length) % AGENTS.length);
  };

  const handleStartChainAll = () => {
    stopAllAudio();
    setIsPlayingAll(true);
    setCurrentAgentIndex(0);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(dailyBriefingText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl h-[92vh] flex flex-col bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden shadow-cyan-950/60 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/90 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  PEGASUS Daily Executive Briefing
                </h2>
                <span className="text-xs text-cyan-400 font-mono">Stage {agent.step} of 12</span>
              </div>
              <p className="text-xs text-slate-400">
                Face-to-face live status updates with real-time lip movement
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStartChainAll}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isPlayingAll
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Play all 12 agents' daily updates sequentially"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>{isPlayingAll ? 'Playing Pegasus Chain...' : 'Play Full Chain (All 12)'}</span>
            </button>

            <button
              onClick={() => {
                stopAllAudio();
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Stage: Cinematic Talking Hologram */}
        <div className="flex-1 flex flex-col md:flex-row items-center justify-between p-6 gap-6 bg-radial from-slate-900 via-slate-950 to-black overflow-y-auto">
          {/* Left: The Large Talking Avatar Face */}
          <div className="flex flex-col items-center justify-center space-y-4 shrink-0">
            <div className="relative p-2 rounded-3xl bg-slate-950/80 border border-cyan-500/30 shadow-2xl shadow-cyan-500/20">
              <AvatarFace
                agent={agent}
                isSpeaking={isSpeaking}
                frequencyData={frequencyData}
                size="xl"
                showHud={true}
              />
            </div>

            {/* Vocal Status & Tone Badge */}
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300 font-mono">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isSpeaking ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'
                  }`}
                />
                <span>Voice: {agent.voiceConfig.voiceName}</span>
                <span className="text-slate-600">·</span>
                <span className="text-cyan-300">{agent.accentBadge}</span>
              </div>
            </div>
          </div>

          {/* Right: Briefing Transcript & Department Intelligence */}
          <div className="flex-1 flex flex-col justify-between w-full h-full space-y-4">
            <div>
              {/* Agent Title & Mission */}
              <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">{agent.name}</h3>
                  <p className="text-sm font-semibold text-cyan-300">{agent.tagline}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{agent.department}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePrevAgent}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                    title="Previous Agent"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextAgent}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                    title="Next Agent"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Personality quote */}
              <p className="text-xs text-slate-400 italic py-2 leading-relaxed">
                "{agent.personality}"
              </p>

              {/* The Live Speech Bubble / Transcript */}
              <div className="relative mt-3 p-5 rounded-2xl bg-slate-950 border border-cyan-500/30 text-slate-100 shadow-inner">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>08:00 AM Update of the Day:</span>
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {isLoadingBriefing ? (
                  <div className="py-6 flex items-center justify-center gap-2 text-xs text-cyan-300">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>{agent.name} is preparing today's briefing...</span>
                  </div>
                ) : (
                  <p className="text-sm sm:text-base leading-relaxed text-slate-200 font-sans whitespace-pre-wrap">
                    "{dailyBriefingText}"
                  </p>
                )}
              </div>

              {/* Department Knowledge Footprint */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Primary Framework</div>
                  <div className="text-xs font-semibold text-emerald-400 mt-0.5 truncate">
                    {agent.knowledge.frameworks[0]}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Critical Output</div>
                  <div className="text-xs font-semibold text-amber-400 mt-0.5 truncate">
                    {agent.knowledge.sampleDeliverables[0]}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={handleToggleSpeak}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all shadow-md ${
                  isSpeaking
                    ? 'bg-rose-500 hover:bg-rose-600 text-white'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                }`}
              >
                {isSpeaking ? (
                  <>
                    <Square className="w-4 h-4 fill-current" />
                    <span>Pause Talking</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Hear {agent.name} Speak</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  stopAllAudio();
                  onClose();
                  onOpen1on1(agent);
                }}
                className="flex items-center gap-2 py-3 px-4 rounded-xl text-sm font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                title="Open live two-way talkback with this agent"
              >
                <span>Talk Back</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Chain Selector Ribbon */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 min-w-max">
            {AGENTS.map((a, idx) => {
              const isCurrent = idx === currentAgentIndex;
              return (
                <button
                  key={a.id}
                  onClick={() => {
                    stopAllAudio();
                    setIsPlayingAll(false);
                    setCurrentAgentIndex(idx);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${
                    isCurrent
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/80 font-semibold'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-850 hover:text-slate-200'
                  }`}
                >
                  <span className="font-mono text-[11px] text-cyan-400">0{a.step}</span>
                  <span>{a.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
