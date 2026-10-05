/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AgentCard } from './components/AgentCard';
import { WarRoomWorkflow } from './components/WarRoomWorkflow';
import { CoreWarRoomV2 } from './components/CoreWarRoomV2';
import { VoiceStudioModal } from './components/VoiceStudioModal';
import { AgentBlueprintDrawer } from './components/AgentBlueprintDrawer';
import { BlueprintsView } from './components/BlueprintsView';
import { DailyBriefingModal } from './components/DailyBriefingModal';
import { TalkingAvatarShowcase } from './components/TalkingAvatarShowcase';
import { PremiumAgentGallery } from './components/PremiumAgentGallery';
import { AgentFactoryModal, CustomAgent } from './components/AgentFactoryModal';
import { AGENTS, AgentDefinition } from './data/agents';
import { speakAgent, stopAllAudio } from './utils/audio';
import { Radio, Sparkles, Terminal, Volume2, Video } from 'lucide-react';

export default function App() {
  if (new URLSearchParams(window.location.search).get('premium-agents') === '1') {
    return <PremiumAgentGallery />;
  }
  if (new URLSearchParams(window.location.search).get('voice-studio') === '1') {
    return <TalkingAvatarShowcase />;
  }
  const [activeTab, setActiveTab] = useState<'workflow' | 'grid' | 'blueprints'>('workflow');
  const [projectBrief, setProjectBrief] = useState<string>(
    'Launch of an enterprise autonomous AI voice agent platform for healthcare clinics to handle 24/7 patient appointment scheduling with zero hold times.'
  );
  const [preferNaturalVoice, setPreferNaturalVoice] = useState<boolean>(true);
  const [activeSpeakingAgentId, setActiveSpeakingAgentId] = useState<string | null>(null);
  const [agentFactoryOpen, setAgentFactoryOpen] = useState(false);
  const [customAgents, setCustomAgents] = useState<CustomAgent[]>(() => {
    try { return JSON.parse(localStorage.getItem('pegasus.customAgents.v1') || '[]'); } catch { return []; }
  });

  // Modals / Drawers
  const [modalAgent, setModalAgent] = useState<AgentDefinition | null>(null);
  const [drawerAgent, setDrawerAgent] = useState<AgentDefinition | null>(null);
  const [dailyBriefingAgent, setDailyBriefingAgent] = useState<AgentDefinition | null>(null);

  useEffect(() => {
    localStorage.setItem('pegasus.customAgents.v1', JSON.stringify(customAgents));
  }, [customAgents]);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  const handleTestVoice = (agent: AgentDefinition) => {
    stopAllAudio();
    setActiveSpeakingAgentId(agent.id);

    speakAgent(
      agent.voiceConfig.samplePhrase,
      agent.id,
      agent.voiceConfig,
      preferNaturalVoice,
      () => setActiveSpeakingAgentId(agent.id),
      () => setActiveSpeakingAgentId(null)
    );
  };

  const handleStopVoice = () => {
    stopAllAudio();
    setActiveSpeakingAgentId(null);
  };

  const handleOpen1on1 = (agent: AgentDefinition) => {
    stopAllAudio();
    setModalAgent(agent);
  };

  const handleOpenBlueprint = (agent: AgentDefinition) => {
    setDrawerAgent(agent);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Global Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        preferNaturalVoice={preferNaturalVoice}
        setPreferNaturalVoice={setPreferNaturalVoice}
        isAnyAudioPlaying={activeSpeakingAgentId !== null}
        onStopAllAudio={handleStopVoice}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner with Workflow Sequence Overview */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Radio className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-semibold text-white">PEGASUS 12-Agent Execution Chain:</span>
            <span className="text-slate-400 hidden xl:inline">
              Simon (Decides) → Marie (Organizes) → IRIS (Intel) → Mark (Positioning) → Cammy (Campaign) → Evan (Content) → Tube (Video) → Lucy (Distributes) → Snake (Measures) → Alice (Storefront CRO) → Echo (Leads) → Booker (Calendar)
            </span>
            <span className="text-slate-400 xl:hidden">
              12 Autonomous LLM units connected in real-time vocal handoffs.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setAgentFactoryOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all">
              <Sparkles className="w-3.5 h-3.5"/><span>+ BUILD AGENT</span>
            </button>
            <button
              onClick={() => setDailyBriefingAgent(AGENTS[0])}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-cyan-300 bg-cyan-950/70 hover:bg-cyan-900/90 border border-cyan-700/60 shadow-md shadow-cyan-950/40 transition-all"
            >
              <Video className="w-3.5 h-3.5 text-cyan-400" />
              <span>Watch Update of the Day</span>
            </button>

            <button
              onClick={() => setActiveTab('workflow')}
              className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1 px-2 py-1"
            >
              <span>War Room</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        {/* Tab 1: War Room Pipeline */}
        {activeTab === 'workflow' && (
          <div className="space-y-6">
            <CoreWarRoomV2 objective={projectBrief} setObjective={setProjectBrief} />
            <details className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <summary className="cursor-pointer text-xs font-bold tracking-wider text-slate-400">LEGACY 12-STAGE WORKFLOW</summary>
              <div className="mt-4">
                <WarRoomWorkflow
                  projectBrief={projectBrief}
                  customAgents={customAgents}
                  setProjectBrief={setProjectBrief}
                  preferNaturalVoice={preferNaturalVoice}
                  onOpenAgentBlueprint={handleOpenBlueprint}
                  onOpen1on1={handleOpen1on1}
                  onOpenDailyBriefing={(agent) => setDailyBriefingAgent(agent)}
                />
              </div>
            </details>
          </div>
        )}

        {/* Tab 2: 12-Voice Command Grid */}
        {activeTab === 'grid' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-cyan-400" />
                  <span>The 12-Voice Operational Roster</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Preview any agent's live talking avatar, test their real-time mouth movement, or watch their face-to-face daily briefing.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDailyBriefingAgent(AGENTS[0])}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-950 bg-cyan-400 hover:bg-cyan-300 transition-colors"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Daily Briefings</span>
                </button>
                <div className="text-xs text-slate-400 font-mono">
                  <span>12 Active Units</span>
                </div>
              </div>
            </div>

            {customAgents.length > 0 && <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/10 p-4"><div className="mb-3 text-xs font-black tracking-[.22em] text-cyan-300">CUSTOM SPECIALISTS · {customAgents.length}</div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">{customAgents.map(a=><div key={a.id} className="rounded-xl border border-slate-800 bg-slate-900 p-3"><div className="font-bold text-white">{a.name}</div><div className="text-xs text-cyan-300">{a.role}</div><div className="mt-2 text-[10px] font-mono text-slate-500">{a.voice.toUpperCase()} · {a.color}</div></div>)}</div></div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {AGENTS.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  isSelected={modalAgent?.id === agent.id}
                  isSpeaking={activeSpeakingAgentId === agent.id}
                  onSelect={handleOpen1on1}
                  onTestVoice={handleTestVoice}
                  onStopVoice={handleStopVoice}
                  onOpenBlueprint={handleOpenBlueprint}
                  onOpenDailyBriefing={(agent) => setDailyBriefingAgent(agent)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Blueprints & Knowledge Exporter */}
        {activeTab === 'blueprints' && (
          <BlueprintsView
            onOpen1on1={handleOpen1on1}
            onSelectAgentDrawer={handleOpenBlueprint}
          />
        )}
      </main>

      <AgentFactoryModal open={agentFactoryOpen} onClose={() => setAgentFactoryOpen(false)} onCreate={(agent) => setCustomAgents(prev => [...prev, agent])} />

      {/* 1-on-1 Voice Studio Modal */}
      {modalAgent && (
        <VoiceStudioModal
          agent={modalAgent}
          isOpen={!!modalAgent}
          onClose={() => setModalAgent(null)}
          onOpenBlueprint={handleOpenBlueprint}
          preferNaturalVoice={preferNaturalVoice}
          projectBrief={projectBrief}
        />
      )}

      {/* Face-to-Face Daily Briefing Modal with Real-time Lip Movement */}
      {dailyBriefingAgent && (
        <DailyBriefingModal
          agent={dailyBriefingAgent}
          isOpen={!!dailyBriefingAgent}
          onClose={() => setDailyBriefingAgent(null)}
          preferNaturalVoice={preferNaturalVoice}
          projectBrief={projectBrief}
          onOpen1on1={handleOpen1on1}
          initialAgent={dailyBriefingAgent}
        />
      )}

      {/* Agent Prompt Blueprint Drawer */}
      {drawerAgent && (
        <AgentBlueprintDrawer
          agent={drawerAgent}
          isOpen={!!drawerAgent}
          onClose={() => setDrawerAgent(null)}
        />
      )}
    </div>
  );
}
