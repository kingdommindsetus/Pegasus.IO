import React, { useState } from 'react';
import {
  Play,
  Square,
  FastForward,
  RotateCcw,
  Volume2,
  VolumeX,
  FileDown,
  Copy,
  Check,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Radio,
  FileText,
  Video,
} from 'lucide-react';
import { AGENTS, AgentDefinition } from '../data/agents';
import { speakAgent, stopAllAudio } from '../utils/audio';
import { AudioWaveform } from './AudioWaveform';
import { AvatarFace } from './AvatarFace';
import type { CustomAgent } from './AgentFactoryModal';

interface StepResult {
  step: number;
  agentId: string;
  agentName: string;
  tagline: string;
  department: string;
  keyDeliverable: string;
  spokenSummary: string;
  deliverableMarkdown: string;
}

interface WarRoomWorkflowProps {
  projectBrief: string;
  setProjectBrief: (brief: string) => void;
  preferNaturalVoice: boolean;
  onOpenAgentBlueprint: (agent: AgentDefinition) => void;
  onOpen1on1: (agent: AgentDefinition) => void;
  onOpenDailyBriefing?: (agent: AgentDefinition) => void;
  customAgents?: CustomAgent[];
}

const PRESET_BRIEFS = [
  {
    title: 'B2B Enterprise AI Voice Platform',
    brief: 'Launch of an enterprise autonomous AI voice agent platform for healthcare and finance clinics to handle 24/7 inbound patient scheduling with zero wait times.',
  },
  {
    title: 'Luxury Ergonomic Workstation (D2C)',
    brief: 'Global direct-to-consumer launch of a $2,400 biometric motorized standing desk and carbon-fiber chair targeted at remote tech executives and traders.',
  },
  {
    title: 'High-Ticket AI Growth Agency',
    brief: 'Positioning and client acquisition system for a premium $15,000/month boutique agency that deploys custom AI agent teams for Mid-Market B2B companies.',
  },
  {
    title: 'Viral Mobile Video Creation App',
    brief: 'Launch campaign for a mobile iOS/Android AI video editing app that turns raw camera roll footage into viral 60-second TikToks and Reels in one tap.',
  },
];

export const WarRoomWorkflow: React.FC<WarRoomWorkflowProps> = ({
  projectBrief,
  setProjectBrief,
  preferNaturalVoice,
  onOpenAgentBlueprint,
  onOpen1on1,
  onOpenDailyBriefing,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(true);
  const [results, setResults] = useState<Record<number, StepResult>>({});
  const [activeAudioStep, setActiveAudioStep] = useState<number | null>(null);
  const [copiedDossier, setCopiedDossier] = useState<boolean>(false);
  const [activeTabStep, setActiveTabStep] = useState<number>(1);
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(32));
  const [isAvatarQaRunning, setIsAvatarQaRunning] = useState<boolean>(false);

  const runAvatarQaChain = async () => {
    if (isAvatarQaRunning || isRunning) return;
    stopAllAudio();
    setIsAvatarQaRunning(true);
    const qaAgents = AGENTS.slice(0, 4);
    try {
      for (const agent of qaAgents) {
        setCurrentStep(agent.step);
        setActiveTabStep(agent.step);
        const nextAgent = AGENTS.find((a) => a.step === agent.step + 1);
        const handoff = nextAgent
          ? `${agent.voiceConfig.samplePhrase} Next, ${nextAgent.name}, take it from here.`
          : agent.voiceConfig.samplePhrase;
        await playAgentBriefing(agent.step, handoff, agent);
        await new Promise((resolve) => setTimeout(resolve, 280));
      }
    } finally {
      stopAllAudio();
      setActiveAudioStep(null);
      setFrequencyData(new Uint8Array(32));
      setIsAvatarQaRunning(false);
    }
  };

  // Run a single step through the backend
  const executeStep = async (stepNum: number, currentResults: Record<number, StepResult>): Promise<StepResult> => {
    const agent = AGENTS.find((a) => a.step === stepNum)!;

    const res = await fetch('/api/workflow/run-step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stepNumber: stepNum,
        projectBrief,
        accumulatedDossier: currentResults,
      }),
    });

    const data = await res.json();
    const result: StepResult = {
      step: stepNum,
      agentId: agent.id,
      agentName: agent.name,
      tagline: agent.tagline,
      department: agent.department,
      keyDeliverable: data.keyDeliverable || agent.knowledge.sampleDeliverables[0],
      spokenSummary: data.spokenSummary || agent.voiceConfig.samplePhrase,
      deliverableMarkdown: data.deliverableMarkdown || '',
    };

    return result;
  };

  const playAgentBriefing = async (
    stepNum: number,
    text: string,
    agent: AgentDefinition
  ) => {
    stopAllAudio();
    setActiveAudioStep(stepNum);

    await speakAgent(
      text,
      agent.id,
      agent.voiceConfig,
      preferNaturalVoice,
      () => setActiveAudioStep(stepNum),
      () => {
        setActiveAudioStep(null);
        setFrequencyData(new Uint8Array(32));
      },
      (freqs) => setFrequencyData(freqs)
    );
  };

  const runFullPipeline = async () => {
    if (isRunning) return;
    stopAllAudio();
    setIsRunning(true);
    setIsPaused(false);

    let accumulator = { ...results };
    let startStep = currentStep === 12 ? 1 : Math.max(1, currentStep);

    // If starting fresh or re-running from beginning
    if (currentStep === 0 || currentStep === 12) {
      accumulator = {};
      setResults({});
      startStep = 1;
    }

    for (let step = startStep; step <= 12; step++) {
      setCurrentStep(step);
      setActiveTabStep(step);

      try {
        const stepResult = await executeStep(step, accumulator);
        accumulator = { ...accumulator, [step]: stepResult };
        setResults(accumulator);

        if (autoSpeak) {
          const agent = AGENTS.find((a) => a.step === step)!;
          await playAgentBriefing(step, stepResult.spokenSummary, agent);
        }
      } catch (err) {
        console.error(`Step ${step} failed:`, err);
        const failedAgent = AGENTS.find((a) => a.step === step)!;
        const fallback: StepResult = {
          step,
          agentId: failedAgent.id,
          agentName: failedAgent.name,
          tagline: failedAgent.tagline,
          department: failedAgent.department,
          keyDeliverable: failedAgent.knowledge.sampleDeliverables[0],
          spokenSummary: `${failedAgent.voiceConfig.samplePhrase} Live analysis was unavailable, so I am preserving the handoff and continuing the mission.`,
          deliverableMarkdown: `### ${failedAgent.name} — continuity mode\n\nThis stage could not complete its live model request. Pegasus preserved the pipeline and continued to the next office.`,
        };
        accumulator = { ...accumulator, [step]: fallback };
        setResults(accumulator);
        if (autoSpeak) await playAgentBriefing(step, fallback.spokenSummary, failedAgent);
      }
    }

    setIsRunning(false);
  };

  const runNextStep = async () => {
    if (isRunning) return;
    const nextStep = currentStep >= 12 ? 1 : currentStep + 1;
    setCurrentStep(nextStep);
    setActiveTabStep(nextStep);
    setIsRunning(true);

    try {
      const stepResult = await executeStep(nextStep, results);
      const updated = { ...results, [nextStep]: stepResult };
      setResults(updated);

      if (autoSpeak) {
        const agent = AGENTS.find((a) => a.step === nextStep)!;
        await playAgentBriefing(nextStep, stepResult.spokenSummary, agent);
      }
    } catch (err) {
      console.error(`Step ${nextStep} error:`, err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    stopAllAudio();
    setIsRunning(false);
    setCurrentStep(0);
    setResults({});
    setActiveAudioStep(null);
    setActiveTabStep(1);
  };

  const handleCopyDossier = () => {
    const markdownOutput = generateDossierMarkdown();
    navigator.clipboard.writeText(markdownOutput);
    setCopiedDossier(true);
    setTimeout(() => setCopiedDossier(false), 2000);
  };

  const handleDownloadDossier = () => {
    const markdownOutput = generateDossierMarkdown();
    const blob = new Blob([markdownOutput], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Pegasus-io-WarRoom-Playbook-${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const generateDossierMarkdown = (): string => {
    let md = `# Pegasus.io: Master Strategy & Execution Playbook\n`;
    md += `**Project Brief**: ${projectBrief}\n`;
    md += `**Generated**: ${new Date().toISOString()}\n\n`;
    md += `---\n\n`;

    AGENTS.forEach((agent) => {
      const res = results[agent.step];
      md += `## Stage ${agent.step}: ${agent.name} — ${agent.tagline}\n`;
      md += `- **Department**: ${agent.department}\n`;
      md += `- **Persona**: ${agent.personality}\n`;
      md += `- **Spoken Briefing**: "${res?.spokenSummary || agent.voiceConfig.samplePhrase}"\n\n`;
      if (res?.deliverableMarkdown) {
        md += `### Strategic Deliverable:\n${res.deliverableMarkdown}\n\n`;
      } else {
        md += `*Stage not executed yet.*\n\n`;
      }
      md += `---\n\n`;
    });

    return md;
  };

  const activeAgent = AGENTS.find((a) => a.step === activeTabStep) || AGENTS[0];
  const activeStepResult = results[activeTabStep];

  return (
    <div className="space-y-6">
      {/* Brief Configuration Card */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span>War Room Mission Objective</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Input your venture or campaign. All 12 autonomous agents will execute their sequential mandates.
            </p>
          </div>

          {/* Quick Preset Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider shrink-0">
              Presets:
            </span>
            {PRESET_BRIEFS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setProjectBrief(p.brief)}
                className="text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60 shrink-0 transition-colors"
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>

        <textarea
          rows={2}
          value={projectBrief}
          onChange={(e) => setProjectBrief(e.target.value)}
          placeholder="Describe the company, offer, or campaign you want the 12-agent team to conquer..."
          className="w-full bg-slate-950 text-slate-100 placeholder-slate-500 text-sm px-4 py-3 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 resize-none font-sans"
        />

        {/* Workflow Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <button
              onClick={runFullPipeline}
              disabled={isRunning}
              className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold shadow-md transition-all ${
                isRunning
                  ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold'
              }`}
            >
              {isRunning ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-400 border-t-cyan-400 animate-spin" />
                  <span>Pipeline Active (Stage {currentStep}/12)...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute Full 12-Stage War Room</span>
                </>
              )}
            </button>

            <button
              onClick={runNextStep}
              disabled={isRunning}
              className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors disabled:opacity-50"
              title="Execute just the next step in sequence"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>Step Forward</span>
            </button>

            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
              title="Reset workflow progress"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Auto-Speech Toggle */}
            <button
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors border ${
                autoSpeak
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300'
              }`}
              title="When enabled, agents speak their briefing aloud when their stage completes"
            >
              {autoSpeak ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>Auto-Voice Briefings: {autoSpeak ? 'ON' : 'OFF'}</span>
            </button>

            {/* Export Buttons */}
            <button
              onClick={handleCopyDossier}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              title="Copy Master Playbook Markdown"
            >
              {copiedDossier ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedDossier ? 'Copied!' : 'Copy Playbook'}</span>
            </button>

            <button
              onClick={handleDownloadDossier}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 transition-colors"
              title="Download Full War Room Markdown Dossier"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Download MD</span>
            </button>
          </div>
        </div>
      </div>

      {/* 12-Agent Interactive Flow Ribbon */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 shadow-xl overflow-x-auto no-scrollbar">
        <div className="flex items-center min-w-max gap-2 py-1">
          {AGENTS.map((agent, index) => {
            const isCompleted = results[agent.step] !== undefined;
            const isCurrent = currentStep === agent.step;
            const isViewing = activeTabStep === agent.step;
            const isSpeakingThis = activeAudioStep === agent.step;

            return (
              <React.Fragment key={agent.id}>
                <button
                  onClick={() => setActiveTabStep(agent.step)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all ${
                    isViewing
                      ? 'bg-slate-800 text-white ring-1 ring-cyan-400 shadow-md'
                      : isCompleted
                      ? 'bg-slate-900/90 text-slate-300 border border-emerald-500/30 hover:bg-slate-850'
                      : isCurrent
                      ? 'bg-cyan-950/80 text-cyan-200 border border-cyan-500/50 animate-pulse'
                      : 'bg-slate-900/40 text-slate-400 border border-slate-800/80 hover:bg-slate-900'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono border ${
                      isCompleted
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-500/50'
                        : isCurrent
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-400 animate-pulse'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {isCompleted ? '✓' : agent.step}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold tracking-tight text-white">{agent.name}</span>
                      {isSpeakingThis && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[110px]">
                      {agent.tagline}
                    </div>
                  </div>
                </button>

                {index < AGENTS.length - 1 && (
                  <ChevronRight
                    className={`w-3.5 h-3.5 shrink-0 ${
                      results[agent.step] ? 'text-emerald-500' : 'text-slate-700'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Active Stage Detailed Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Agent Persona & Voice Player */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3 text-xs font-mono text-slate-400">
              <span className="text-cyan-400 font-semibold">STAGE {String(activeAgent.step).padStart(2, '0')} OF 12</span>
              <span>{activeAgent.accentBadge}</span>
            </div>

            <div className="flex items-center gap-3.5 mb-4">
              <div className="shrink-0">
                <AvatarFace
                  agent={activeAgent}
                  isSpeaking={activeAudioStep === activeAgent.step}
                  frequencyData={activeAudioStep === activeAgent.step ? frequencyData : undefined}
                  size="md"
                  showHud={true}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h3 className="text-lg font-bold text-white tracking-tight truncate">{activeAgent.name}</h3>
                  {activeAudioStep === activeAgent.step && (
                    <span className="text-[10px] text-cyan-300 font-mono bg-cyan-950 border border-cyan-500/50 px-1.5 py-0.5 rounded animate-pulse">
                      SPEAKING
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-cyan-300 mt-0.5">{activeAgent.tagline}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">{activeAgent.department}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              {activeAgent.personality}
            </p>

            {/* Audio Waveform & Speech status */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Radio
                    className={`w-3.5 h-3.5 ${
                      activeAudioStep === activeAgent.step ? 'text-emerald-400 animate-pulse' : 'text-slate-500'
                    }`}
                  />
                  <span>Voice: {activeAgent.voiceConfig.voiceName}</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">{activeAgent.voiceConfig.webSpeechLang}</span>
              </div>

              <AudioWaveform
                isSpeaking={activeAudioStep === activeAgent.step}
                frequencyData={activeAudioStep === activeAgent.step ? frequencyData : undefined}
                color="bg-cyan-400"
              />

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    if (activeAudioStep === activeAgent.step) {
                      stopAllAudio();
                      setActiveAudioStep(null);
                    } else {
                      const speechText =
                        activeStepResult?.spokenSummary || activeAgent.voiceConfig.samplePhrase;
                      playAgentBriefing(activeAgent.step, speechText, activeAgent);
                    }
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                    activeAudioStep === activeAgent.step
                      ? 'bg-rose-950/80 text-rose-300 border border-rose-800/80 hover:bg-rose-900'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
                  }`}
                >
                  {activeAudioStep === activeAgent.step ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop Speech</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Hear Spoken Briefing</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Action Navigation */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <button
              onClick={runAvatarQaChain}
              disabled={isAvatarQaRunning || isRunning}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-emerald-200 bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/50 transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isAvatarQaRunning ? 'Running Simon → Marie → IRIS → Mark…' : 'Run 4-Agent Avatar QA Chain'}</span>
            </button>
            {onOpenDailyBriefing && (
              <button
                onClick={() => onOpenDailyBriefing(activeAgent)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800/60 transition-colors shadow-sm"
              >
                <Video className="w-4 h-4" />
                <span>Watch Face-to-Face Update of the Day</span>
              </button>
            )}

            <button
              onClick={() => onOpen1on1(activeAgent)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 transition-colors"
            >
              <span>Open 1-on-1 Voice Comms with {activeAgent.name}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onOpenAgentBlueprint(activeAgent)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-700/50 transition-colors"
            >
              <span>View & Copy {activeAgent.name}'s Prompt Blueprint</span>
            </button>
          </div>
        </div>

        {/* Right Column: Strategic Deliverable & Spoken Briefing */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white tracking-tight">
                  Stage {activeAgent.step} Strategic Deliverable
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeStepResult?.keyDeliverable || activeAgent.knowledge.sampleDeliverables[0]}
                </p>
              </div>

              {activeStepResult && (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-700/60 px-2.5 py-1 rounded-lg">
                  <Check className="w-3.5 h-3.5" />
                  Executed
                </span>
              )}
            </div>

            {/* Spoken Briefing Transcript Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 mb-5">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>Executive Spoken Summary:</span>
              </div>
              <p className="text-sm text-slate-200 italic leading-relaxed">
                "{activeStepResult?.spokenSummary || activeAgent.voiceConfig.samplePhrase}"
              </p>
            </div>

            {/* Deliverable Markdown Display */}
            {activeStepResult ? (
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans space-y-3 max-h-[380px] overflow-y-auto whitespace-pre-wrap">
                {activeStepResult.deliverableMarkdown}
              </div>
            ) : (
              <div className="p-10 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-3">
                <div className="text-sm font-medium text-slate-400">
                  Stage {activeAgent.step} has not been executed yet.
                </div>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Click below to execute {activeAgent.name}'s analysis or run the entire 12-agent war room pipeline.
                </p>
                <button
                  onClick={() => executeStep(activeAgent.step, results).then((res) => setResults((prev) => ({ ...prev, [activeAgent.step]: res })))}
                  className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute {activeAgent.name}'s Stage Now</span>
                </button>
              </div>
            )}
          </div>

          {/* Bottom Baton Handoff Info */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-mono text-cyan-400">Workflow Handoff:</span>
              <span>
                {activeAgent.step < 12
                  ? `Passes baton to Stage ${activeAgent.step + 1} (${AGENTS[activeAgent.step]?.name} — ${AGENTS[activeAgent.step]?.tagline})`
                  : 'Final stage: All leads converted onto calendar!'}
              </span>
            </div>

            {activeAgent.step < 12 && (
              <button
                onClick={() => setActiveTabStep(activeAgent.step + 1)}
                className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
              >
                <span>View Next Stage</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
