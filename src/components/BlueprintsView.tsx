import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  FileCode,
  Sparkles,
  BookOpen,
  Volume2,
  Terminal,
  Cpu,
  Layers,
} from 'lucide-react';
import { AGENTS, AgentDefinition } from '../data/agents';

interface BlueprintsViewProps {
  onOpen1on1: (agent: AgentDefinition) => void;
  onSelectAgentDrawer: (agent: AgentDefinition) => void;
}

export const BlueprintsView: React.FC<BlueprintsViewProps> = ({
  onOpen1on1,
  onSelectAgentDrawer,
}) => {
  const [selectedAgent, setSelectedAgent] = useState<AgentDefinition>(AGENTS[0]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [codeFormat, setCodeFormat] = useState<'systemPrompt' | 'crewai' | 'autogen' | 'json'>('systemPrompt');

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadAll = () => {
    const fullBlueprint = {
      project: 'Pegasus.io - Complete 12-Agent System Blueprints',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
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
    link.download = 'Pegasus-io-Complete-Blueprints.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const currentSnippet =
    codeFormat === 'systemPrompt'
      ? selectedAgent.systemPrompt
      : codeFormat === 'crewai'
      ? selectedAgent.crewAiPython
      : codeFormat === 'autogen'
      ? selectedAgent.autogenPython
      : JSON.stringify(
          {
            name: selectedAgent.name,
            step: selectedAgent.step,
            role: selectedAgent.tagline,
            department: selectedAgent.department,
            personality: selectedAgent.personality,
            voiceConfig: selectedAgent.voiceConfig,
            knowledge: selectedAgent.knowledge,
            systemPrompt: selectedAgent.systemPrompt,
          },
          null,
          2
        );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <FileCode className="w-5 h-5 text-cyan-400" />
            <span>Agent Blueprint & Knowledge Exporter</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Copy and export fully engineered prompts, specialized departmental knowledge bases, and multi-agent code snippets (CrewAI, AutoGen, OpenAI/Claude/Gemini) to deploy into your own agent stacks.
          </p>
        </div>

        <button
          onClick={handleDownloadAll}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-lg shadow-cyan-950/40 transition-all shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Download All 12 Agents (JSON)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 12 Agents Selector List */}
        <div className="lg:col-span-4 space-y-2 max-h-[750px] overflow-y-auto pr-1 no-scrollbar">
          {AGENTS.map((agent) => {
            const isSelected = selectedAgent.id === agent.id;
            return (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all border ${
                  isSelected
                    ? 'bg-slate-850 border-cyan-400/80 shadow-md ring-1 ring-cyan-400/20'
                    : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border shrink-0 ${agent.themeColor.avatarBg}`}
                >
                  {agent.name.slice(0, 2).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white tracking-tight">{agent.name}</span>
                    <span className="text-[11px] text-cyan-400 font-mono">Stage {agent.step}</span>
                  </div>
                  <p className="text-xs text-slate-300 truncate mt-0.5">{agent.tagline}</p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{agent.department}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Code & Knowledge Inspector */}
        <div className="lg:col-span-8 space-y-5">
          {/* Agent Overview Bar */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border ${selectedAgent.themeColor.avatarBg}`}
                >
                  {selectedAgent.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <span>{selectedAgent.name}</span>
                    <span className="text-xs font-normal text-slate-400">({selectedAgent.callsign})</span>
                  </h3>
                  <p className="text-xs font-medium text-cyan-300">{selectedAgent.tagline}</p>
                  <p className="text-[11px] text-slate-400">{selectedAgent.department}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpen1on1(selectedAgent)}
                  className="py-1.5 px-3 rounded-lg text-xs font-medium text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 transition-colors"
                >
                  Voice Test
                </button>
                <button
                  onClick={() => handleCopy(currentSnippet, 'code')}
                  className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                >
                  {copiedKey === 'code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'code' ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
            </div>

            {/* Persona Summary */}
            <div className="pt-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong className="text-white font-medium">Persona & Vocal Vibe:</strong> {selectedAgent.personality}
              </p>
            </div>
          </div>

          {/* Departmental Knowledge Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 font-mono uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Mastered Frameworks</span>
                </span>
              </div>
              <ul className="space-y-1 text-xs text-slate-300">
                {selectedAgent.knowledge.frameworks.map((fw, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-mono text-[10px]">0{idx + 1}.</span>
                    <span>{fw}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-400 font-mono uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Voice & Speech Parameters</span>
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Browser Voice Target:</span>
                  <span className="font-mono text-amber-300">{selectedAgent.voiceConfig.voiceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Accent:</span>
                  <span className="font-mono text-cyan-300">{selectedAgent.voiceConfig.accent}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pitch / Cadence:</span>
                  <span className="font-mono text-slate-200">
                    {selectedAgent.voiceConfig.pitch}x / {selectedAgent.voiceConfig.rate}x
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800">
                  "{selectedAgent.voiceConfig.style}"
                </p>
              </div>
            </div>
          </div>

          {/* Export Code Switcher */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              {/* Format Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
                <button
                  onClick={() => setCodeFormat('systemPrompt')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    codeFormat === 'systemPrompt'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  System Prompt
                </button>
                <button
                  onClick={() => setCodeFormat('crewai')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    codeFormat === 'crewai' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  CrewAI (Python)
                </button>
                <button
                  onClick={() => setCodeFormat('autogen')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    codeFormat === 'autogen' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  AutoGen (Python)
                </button>
                <button
                  onClick={() => setCodeFormat('json')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    codeFormat === 'json' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  JSON Spec
                </button>
              </div>

              <button
                onClick={() => handleCopy(currentSnippet, 'code2')}
                className="flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-medium text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 transition-colors"
              >
                {copiedKey === 'code2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'code2' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Code Box */}
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 whitespace-pre-wrap overflow-x-auto max-h-[360px] leading-relaxed">
              {currentSnippet}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
