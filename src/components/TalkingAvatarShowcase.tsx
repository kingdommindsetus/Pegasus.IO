import React, { useState } from 'react';
import { AGENTS, AgentDefinition } from '../data/agents';
import { AvatarFace } from './AvatarFace';
import { speakAgent, stopAllAudio } from '../utils/audio';

interface TalkingAvatarShowcaseProps {
  onClose?: () => void;
}

export const TalkingAvatarShowcase: React.FC<TalkingAvatarShowcaseProps> = ({
  onClose,
}) => {
  const [currentAgent, setCurrentAgent] = useState<AgentDefinition>(AGENTS[0]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [frequencyData, setFrequencyData] = useState<Uint8Array>();
  const [customText, setCustomText] = useState('');
  const [selectedTab, setSelectedTab] = useState<'sample' | 'custom' | 'conversation'>('sample');

  // Conversation mode
  const [conversationIndex, setConversationIndex] = useState(0);
  const [conversationMode, setConversationMode] = useState(false);

  // Sample conversation sequence: Simon briefs the team
  const conversationSequence: Array<{ agentId: string; text: string }> = [
    {
      agentId: 'simon',
      text: 'Team, our mission is clear. We have ninety days to launch a category-defining campaign. Zero distractions, zero vanity metrics. Marie, you have the operational blueprint ready?'
    },
    {
      agentId: 'marie',
      text: 'Absolutely Simon. I have mapped out a twelve-week execution timeline. Discovery phase: weeks one and two. Production: weeks three through eight. Launch sequence: weeks nine through twelve. Every handoff is documented.'
    },
    {
      agentId: 'iris',
      text: 'While Marie builds structure, I have completed the competitive landscape analysis. The market has three major blind spots. Our competitors are sleeping on audience sentiment. We can exploit this immediately.'
    },
    {
      agentId: 'mark',
      text: 'Fascinating intel from IRIS. I am already synthesizing this into our positioning thesis. By Thursday, we will have an irrefutable value proposition that makes the competition feel like a compromise.'
    },
    {
      agentId: 'cammy',
      text: 'Mark, pass me those positioning pillars. I am architecting a three-phase launch that hits the market with maximum impact. Teaser phase, the drop, then retargeting blitz. Let us go.'
    }
  ];

  const handlePlaySample = async () => {
    if (isSpeaking) return;

    setIsSpeaking(true);
    await speakAgent(
      currentAgent.voiceConfig.samplePhrase,
      currentAgent.id,
      currentAgent.voiceConfig,
      true,
      () => {},
      () => setIsSpeaking(false),
      (data) => setFrequencyData(data)
    );
  };

  const handlePlayCustom = async () => {
    if (isSpeaking || !customText.trim()) return;

    setIsSpeaking(true);
    await speakAgent(
      customText,
      currentAgent.id,
      currentAgent.voiceConfig,
      true,
      () => {},
      () => setIsSpeaking(false),
      (data) => setFrequencyData(data)
    );
  };

  const handlePlayConversation = async (turnIndex: number) => {
    if (isSpeaking) return;

    const turn = conversationSequence[turnIndex];
    const agent = AGENTS.find(a => a.id === turn.agentId);
    if (!agent) return;

    // Switch to speaking agent
    setCurrentAgent(agent);
    setIsSpeaking(true);

    await speakAgent(
      turn.text,
      agent.id,
      agent.voiceConfig,
      true,
      () => {},
      () => {
        setIsSpeaking(false);
      },
      (data) => setFrequencyData(data)
    );
  };

  const handleStartConversation = async () => {
    setConversationMode(true);
    setConversationIndex(0);
    await handlePlayConversation(0);
  };

  const handleNextTurn = async () => {
    if (conversationIndex < conversationSequence.length - 1) {
      const nextIndex = conversationIndex + 1;
      setConversationIndex(nextIndex);
      await handlePlayConversation(nextIndex);
    }
  };

  const handlePrevTurn = async () => {
    if (conversationIndex > 0) {
      const prevIndex = conversationIndex - 1;
      setConversationIndex(prevIndex);
      await handlePlayConversation(prevIndex);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
              Voice Studio
            </h1>
            <p className="text-slate-400 text-lg">
              Hear your 12 agents speak with unique personalities and voices
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-300 text-2xl"
            >
              ✕
            </button>
          )}
        </div>

        {/* Large Avatar Display */}
        <div className="flex justify-center mb-12">
          <div className="rounded-2xl overflow-hidden shadow-2xl">
            <AvatarFace
              agent={currentAgent}
              isSpeaking={isSpeaking}
              frequencyData={frequencyData}
              size="xl"
              showHud={true}
            />
          </div>
        </div>

        {/* Agent Info & Tabs */}
        <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-xl p-8 mb-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">
              {currentAgent.name}
            </h2>
            <p className="text-slate-300 text-lg mb-4">
              {currentAgent.personality}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-sm">
                {currentAgent.department}
              </span>
              <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-sm">
                {currentAgent.accentBadge}
              </span>
              <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-sm">
                {currentAgent.voiceConfig.voiceName}
              </span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 mb-6 border-b border-slate-700">
            <button
              onClick={() => setSelectedTab('sample')}
              className={`pb-3 px-4 font-semibold transition-colors ${
                selectedTab === 'sample'
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Sample Phrase
            </button>
            <button
              onClick={() => setSelectedTab('custom')}
              className={`pb-3 px-4 font-semibold transition-colors ${
                selectedTab === 'custom'
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Custom Text
            </button>
            <button
              onClick={() => setSelectedTab('conversation')}
              className={`pb-3 px-4 font-semibold transition-colors ${
                selectedTab === 'conversation'
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Conversation
            </button>
          </div>

          {/* Tab Content */}
          <div className="space-y-4">
            {selectedTab === 'sample' && (
              <div>
                <p className="text-slate-400 mb-4 italic">"{currentAgent.voiceConfig.samplePhrase}"</p>
                <button
                  onClick={handlePlaySample}
                  disabled={isSpeaking}
                  className={`w-full font-bold py-3 px-6 rounded-lg transition-all text-lg ${
                    isSpeaking
                      ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg hover:shadow-cyan-500/50'
                  }`}
                >
                  {isSpeaking ? '🔊 Speaking...' : '▶ Play Sample Phrase'}
                </button>
              </div>
            )}

            {selectedTab === 'custom' && (
              <div>
                <textarea
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Enter any text for this agent to speak..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-4 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 mb-4 min-h-24"
                />
                <button
                  onClick={handlePlayCustom}
                  disabled={isSpeaking || !customText.trim()}
                  className={`w-full font-bold py-3 px-6 rounded-lg transition-all text-lg ${
                    isSpeaking || !customText.trim()
                      ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg hover:shadow-cyan-500/50'
                  }`}
                >
                  {isSpeaking ? '🔊 Speaking...' : '▶ Play Custom Text'}
                </button>
              </div>
            )}

            {selectedTab === 'conversation' && (
              <div>
                {!conversationMode ? (
                  <button
                    onClick={handleStartConversation}
                    disabled={isSpeaking}
                    className={`w-full font-bold py-3 px-6 rounded-lg transition-all text-lg ${
                      isSpeaking
                        ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg hover:shadow-emerald-500/50'
                    }`}
                  >
                    🎬 Start Conversation: Team Briefing
                  </button>
                ) : (
                  <div>
                    <div className="bg-slate-800 rounded-lg p-4 mb-4 border border-slate-700">
                      <p className="text-slate-400 text-sm mb-2">
                        Turn {conversationIndex + 1} of {conversationSequence.length}
                      </p>
                      <p className="text-white leading-relaxed">
                        "{conversationSequence[conversationIndex].text}"
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handlePrevTurn}
                        disabled={conversationIndex === 0 || isSpeaking}
                        className={`flex-1 font-bold py-2 px-4 rounded-lg transition-all ${
                          conversationIndex === 0 || isSpeaking
                            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            : 'bg-slate-700 hover:bg-slate-600 text-white'
                        }`}
                      >
                        ← Previous
                      </button>
                      <button
                        onClick={() => handlePlayConversation(conversationIndex)}
                        disabled={isSpeaking}
                        className={`flex-1 font-bold py-2 px-4 rounded-lg transition-all ${
                          isSpeaking
                            ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                            : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                        }`}
                      >
                        {isSpeaking ? '🔊 Speaking...' : '▶ Replay'}
                      </button>
                      <button
                        onClick={handleNextTurn}
                        disabled={
                          conversationIndex === conversationSequence.length - 1 ||
                          isSpeaking
                        }
                        className={`flex-1 font-bold py-2 px-4 rounded-lg transition-all ${
                          conversationIndex === conversationSequence.length - 1 ||
                          isSpeaking
                            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            : 'bg-slate-700 hover:bg-slate-600 text-white'
                        }`}
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Agent Grid Selector */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Select Agent</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {AGENTS.map((agent) => (
              <button
                key={agent.id}
                onClick={() => {
                  if (!isSpeaking) {
                    setCurrentAgent(agent);
                    setConversationMode(false);
                  }
                }}
                disabled={isSpeaking}
                className={`group transition-all transform hover:scale-105 disabled:opacity-50 ${
                  currentAgent.id === agent.id
                    ? 'ring-2 ring-cyan-400'
                    : 'ring-1 ring-slate-700 hover:ring-slate-600'
                } rounded-lg overflow-hidden`}
              >
                <div className="bg-slate-900 p-2">
                  <div className="w-full aspect-square mb-2 rounded">
                    <AvatarFace
                      agent={agent}
                      isSpeaking={false}
                      size="sm"
                      showHud={false}
                    />
                  </div>
                  <p className="text-xs font-semibold text-white text-center truncate">
                    {agent.name}
                  </p>
                  <p className="text-[10px] text-slate-400 text-center truncate">
                    {agent.callsign}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Info Footer */}
        <div className="mt-12 p-6 bg-slate-900/30 border border-slate-800 rounded-lg text-slate-400 text-sm">
          <p className="mb-2">
            💡 <strong>Pro Tips:</strong>
          </p>
          <ul className="space-y-1 ml-4">
            <li>• Each agent has a distinct voice personality and speaking style</li>
            <li>• Watch how their mouth articulates with the audio (lip-sync)</li>
            <li>• Try the conversation mode to hear agents interact with each other</li>
            <li>• Enter custom text to hear any agent say anything you want</li>
            <li>• Frequency visualization shows real-time audio data</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TalkingAvatarShowcase;
