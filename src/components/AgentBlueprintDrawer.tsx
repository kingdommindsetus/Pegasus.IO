import React, { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  X,
  Code2,
  BookOpen,
  Volume2,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';
import { AgentDefinition, AGENTS } from '../data/agents';

interface AgentBlueprintDrawerProps {
  agent: AgentDefinition | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AgentBlueprintDrawer: React.FC<AgentBlueprintDrawerProps> = ({
  agent,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'prompt' | 'knowledge' | 'voice' | 'crewai' | 'autogen' | 'json'>('prompt');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen || !agent) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadAll = () => {
    const fullBlueprint = {
      project: 'Pegasus.io - Autonomous AI Agent Team',
      exportedAt: new Date().toISOString(),
      workflowSequence: [
        'Simon (Decides what matters)',
        'Marie (Organizes it)',
        'IRIS (Gathers/checks intelligence)',
        'Mark (Develops marketing direction)',
        'Cammy (Turns it into a campaign)',
        'Evan (Creates the content)',
        'Tube (Handles video)',
        'Lucy (Distributes it)',
        'Snake (Measures it)',
        'Alice (Storefront CRO)',
        'Echo (Pursues leads)',
        'Booker (Gets them onto calendar)'
      ],
      agents: AGENTS.map((a) => ({
        id: a.id,
        name: a.name,
        step: a.step,
        callsign: a.callsign,
        tagline: a.tagline,
        department: a.department,
        workflowAction: a.workflowAction,
        personality: a.personality,
        voiceConfig: a.voiceConfig,
        knowledge: a.knowledge,
        systemPrompt: a.systemPrompt,
        crewAiPython: a.crewAiPython,
        autogenPython: a.autogenPython,
      })),
    };

    const blob = new Blob([JSON.stringify(fullBlueprint, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Pegasus-io-Agent-Team-Blueprints.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const jsonConfig = JSON.stringify(
    {
      id: agent.id,
      name: agent.name,
      callsign: agent.callsign,
      step: agent.step,
      tagline: agent.tagline,
      department: agent.department,
      workflowAction: agent.workflowAction,
      voiceConfig: agent.voiceConfig,
      knowledge: agent.knowledge,
      systemPrompt: agent.systemPrompt,
    },
    null,
    2
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl h-full flex flex-col bg-slate-900 border-l border-slate-700 shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border shadow-sm ${agent.themeColor.avatarBg}`}
            >
              {agent.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white tracking-tight">{agent.name} Blueprint</h2>
                <span className="text-xs text-cyan-400 font-mono">Stage {agent.step} of 12</span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-sm">{agent.tagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAll}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium text-cyan-300 bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-700/60 transition-colors"
              title="Download all 12 agent blueprints as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export All 12</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 py-2.5 bg-slate-950/90 border-b border-slate-800 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('prompt')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'prompt'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>System Prompt</span>
          </button>

          <button
            onClick={() => setActiveTab('knowledge')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'knowledge'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Knowledge Base</span>
          </button>

          <button
            onClick={() => setActiveTab('voice')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'voice'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Voice Specs</span>
          </button>

          <button
            onClick={() => setActiveTab('crewai')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'crewai'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>CrewAI</span>
          </button>

          <button
            onClick={() => setActiveTab('autogen')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'autogen'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>AutoGen</span>
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'json'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>JSON Spec</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'prompt' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">
                  Ready to copy for OpenAI, Claude, Gemini, or custom LangChain agent
                </span>
                <button
                  onClick={() => handleCopy(agent.systemPrompt, 'prompt')}
                  className="flex items-center gap-1 text-xs text-cyan-300 hover:text-cyan-200 bg-cyan-950/60 border border-cyan-800 px-2.5 py-1 rounded-md transition-colors"
                >
                  {copiedKey === 'prompt' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'prompt' ? 'Copied!' : 'Copy System Prompt'}</span>
                </button>
              </div>

              <div className="relative p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {agent.systemPrompt}
              </div>
            </div>
          )}

          {activeTab === 'knowledge' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">{agent.knowledge.category}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Specialized domain methodologies and decision matrices</p>
                </div>
                <button
                  onClick={() => handleCopy(JSON.stringify(agent.knowledge, null, 2), 'knowledge')}
                  className="flex items-center gap-1 text-xs text-emerald-300 hover:text-emerald-200 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded-md transition-colors"
                >
                  {copiedKey === 'knowledge' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'knowledge' ? 'Copied!' : 'Copy Knowledge'}</span>
                </button>
              </div>

              {/* Frameworks */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-xs font-medium text-emerald-400 uppercase tracking-wider font-mono">
                  Mastered Frameworks
                </div>
                <ul className="space-y-1.5">
                  {agent.knowledge.frameworks.map((fw, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="text-emerald-500 font-mono">0{idx + 1}.</span>
                      <span>{fw}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Principles */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-xs font-medium text-cyan-400 uppercase tracking-wider font-mono">
                  Guiding Principles
                </div>
                <ul className="space-y-1.5">
                  {agent.knowledge.principles.map((pr, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="text-cyan-500 font-mono">•</span>
                      <span className="italic">"{pr}"</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sample Deliverables */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-xs font-medium text-amber-400 uppercase tracking-wider font-mono">
                  Core Department Deliverables
                </div>
                <ul className="space-y-1.5">
                  {agent.knowledge.sampleDeliverables.map((del, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="text-amber-500 font-mono">✓</span>
                      <span>{del}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Voice Engineering Specification</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Parameters for Gemini 3.8 Flash TTS & Browser Synthesis</p>
                </div>
                <button
                  onClick={() => handleCopy(JSON.stringify(agent.voiceConfig, null, 2), 'voice')}
                  className="flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200 bg-amber-950/60 border border-amber-800 px-2.5 py-1 rounded-md transition-colors"
                >
                  {copiedKey === 'voice' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'voice' ? 'Copied!' : 'Copy Voice Spec'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-mono">ElevenLabs Voice</div>
                  <div className="text-sm font-semibold text-amber-300 mt-1">{agent.voiceConfig.voiceName}</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-mono">Accent / Dialect Target</div>
                  <div className="text-sm font-semibold text-cyan-300 mt-1">{agent.voiceConfig.accent}</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-mono">Synthesis Pitch</div>
                  <div className="text-sm font-semibold text-white mt-1">{agent.voiceConfig.pitch}x</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-mono">Synthesis Cadence / Rate</div>
                  <div className="text-sm font-semibold text-white mt-1">{agent.voiceConfig.rate}x</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-xs font-medium text-slate-400 font-mono">
                  Voice style guidance:
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-amber-200 font-mono">
                  "{agent.voiceConfig.style}"
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-xs font-medium text-slate-400 font-mono">Signature Sample Phrase:</div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 italic">
                  "{agent.voiceConfig.samplePhrase}"
                </div>
              </div>
            </div>
          )}

          {activeTab === 'crewai' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Python CrewAI Agent Class Definition</span>
                <button
                  onClick={() => handleCopy(agent.crewAiPython, 'crewai')}
                  className="flex items-center gap-1 text-xs text-indigo-300 hover:text-indigo-200 bg-indigo-950/60 border border-indigo-800 px-2.5 py-1 rounded-md transition-colors"
                >
                  {copiedKey === 'crewai' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'crewai' ? 'Copied!' : 'Copy CrewAI Code'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-indigo-200 font-mono whitespace-pre-wrap overflow-x-auto">
                {agent.crewAiPython}
              </pre>
            </div>
          )}

          {activeTab === 'autogen' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Microsoft AutoGen AssistantAgent Definition</span>
                <button
                  onClick={() => handleCopy(agent.autogenPython, 'autogen')}
                  className="flex items-center gap-1 text-xs text-rose-300 hover:text-rose-200 bg-rose-950/60 border border-rose-800 px-2.5 py-1 rounded-md transition-colors"
                >
                  {copiedKey === 'autogen' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'autogen' ? 'Copied!' : 'Copy AutoGen Code'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-rose-200 font-mono whitespace-pre-wrap overflow-x-auto">
                {agent.autogenPython}
              </pre>
            </div>
          )}

          {activeTab === 'json' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Full JSON Agent Specification</span>
                <button
                  onClick={() => handleCopy(jsonConfig, 'json')}
                  className="flex items-center gap-1 text-xs text-violet-300 hover:text-violet-200 bg-violet-950/60 border border-violet-800 px-2.5 py-1 rounded-md transition-colors"
                >
                  {copiedKey === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'json' ? 'Copied!' : 'Copy JSON'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-violet-200 font-mono whitespace-pre-wrap overflow-x-auto">
                {jsonConfig}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
