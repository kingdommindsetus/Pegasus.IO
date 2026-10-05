import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  Square,
  Play,
  RotateCcw,
  Sparkles,
  X,
  FileCode,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { AgentDefinition } from '../data/agents';
import { AvatarFace } from './AvatarFace';
import { AudioWaveform } from './AudioWaveform';
import { createSpeechRecognizer, speakAgent, stopAllAudio } from '../utils/audio';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  audioUrl?: string;
}

interface VoiceStudioModalProps {
  agent: AgentDefinition;
  isOpen: boolean;
  onClose: () => void;
  onOpenBlueprint: (agent: AgentDefinition) => void;
  preferNaturalVoice: boolean;
  projectBrief: string;
}

export const VoiceStudioModal: React.FC<VoiceStudioModalProps> = ({
  agent,
  isOpen,
  onClose,
  onOpenBlueprint,
  preferNaturalVoice,
  projectBrief,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSpeechMsgId, setActiveSpeechMsgId] = useState<string | null>(null);
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(32));

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognizerRef = useRef<{ start: () => void; stop: () => void; isSupported: boolean } | null>(null);

  // Initialize welcoming greeting for agent
  useEffect(() => {
    if (isOpen && agent) {
      const greetingMsg: Message = {
        id: `msg-${Date.now()}`,
        sender: 'agent',
        text: agent.voiceConfig.samplePhrase,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([greetingMsg]);

      // Speak greeting
      handleSpeakText(agent.voiceConfig.samplePhrase, greetingMsg.id);
    }
    return () => {
      stopAllAudio();
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
    };
  }, [isOpen, agent.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Speech-to-text setup
  useEffect(() => {
    const recognizer = createSpeechRecognizer(
      (transcript) => {
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      },
      (err) => {
        console.warn('Speech recognition error:', err);
        setIsRecording(false);
      }
    );
    recognizerRef.current = recognizer;
  }, []);

  const toggleMic = () => {
    if (!recognizerRef.current?.isSupported) {
      alert('Speech Recognition is not supported in this browser. Please type your message.');
      return;
    }
    if (isRecording) {
      recognizerRef.current.stop();
      setIsRecording(false);
    } else {
      stopAllAudio();
      setIsRecording(true);
      recognizerRef.current.start();
    }
  };

  const handleSpeakText = (text: string, msgId: string) => {
    stopAllAudio();
    setIsSpeaking(true);
    setActiveSpeechMsgId(msgId);

    speakAgent(
      text,
      agent.id,
      agent.voiceConfig,
      preferNaturalVoice,
      () => setIsSpeaking(true),
      () => {
        setIsSpeaking(false);
        setActiveSpeechMsgId(null);
        setFrequencyData(new Uint8Array(32));
      },
      (freqs) => setFrequencyData(freqs)
    );
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isLoading) return;

    stopAllAudio();
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text,
      }));

      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          message: query.trim(),
          history: historyPayload,
          projectBrief,
        }),
      });

      const data = await res.json();
      const replyText = data.text || 'Directive acknowledged.';

      const agentMsg: Message = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, agentMsg]);
      setIsLoading(false);

      // Speak reply automatically
      handleSpeakText(replyText, agentMsg.id);
    } catch (err: any) {
      console.error('Chat error:', err);
      const fallbackText = `I hear you loud and clear. As ${agent.name} (${agent.tagline}), my priority remains focused on executing ${agent.department} directives.`;
      const errorMsg: Message = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
      setIsLoading(false);
      handleSpeakText(fallbackText, errorMsg.id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl h-[90vh] flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base border shadow-sm ${agent.themeColor.avatarBg}`}
            >
              {agent.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white tracking-tight">{agent.name}</h2>
                <span className="text-xs text-cyan-400 font-mono">Stage {agent.step}/12</span>
                <span className="text-xs text-slate-500">·</span>
                <span className="text-xs text-slate-300 font-medium">{agent.callsign}</span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-md">{agent.tagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenBlueprint(agent)}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-700/50 transition-colors"
              title="Copy Agent Blueprint"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Prompt Blueprint</span>
            </button>

            <button
              onClick={() => {
                stopAllAudio();
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Talking Hologram Stage */}
        <div className="px-5 py-3 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <AvatarFace
                agent={agent}
                isSpeaking={isSpeaking}
                frequencyData={frequencyData}
                size="md"
                showHud={true}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-tight">{agent.name}</span>
                <span className="text-xs text-cyan-400 font-mono">Stage {agent.step}</span>
                {isSpeaking && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-cyan-300 font-mono bg-cyan-950 border border-cyan-500/50 px-2 py-0.5 rounded-full animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    SPEAKING NOW
                  </span>
                )}
              </div>
              <p className="text-xs text-cyan-300 font-medium">{agent.tagline}</p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
                <Radio className={`w-3.5 h-3.5 ${isSpeaking ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
                <span>Voice: {agent.voiceConfig.voiceName}</span>
                <span>·</span>
                <span>{agent.accentBadge}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <AudioWaveform isSpeaking={isSpeaking} frequencyData={frequencyData} color="bg-cyan-400" barCount={20} />
            {isSpeaking && (
              <button
                onClick={() => stopAllAudio()}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60 text-xs font-medium hover:bg-rose-900"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Pause Voice</span>
              </button>
            )}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-900/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400">
                <span>{msg.sender === 'user' ? 'You' : agent.name}</span>
                <span>·</span>
                <span>{msg.timestamp}</span>
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-cyan-600 text-white rounded-tr-sm'
                    : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-tl-sm shadow-md'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {msg.sender === 'agent' && (
                  <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleSpeakText(msg.text, msg.id)}
                      className="inline-flex items-center gap-1.5 text-xs text-cyan-300 hover:text-cyan-200 transition-colors font-medium"
                    >
                      {activeSpeechMsgId === msg.id && isSpeaking ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-current text-rose-400" />
                          <span className="text-rose-400">Stop playback</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Replay voice</span>
                        </>
                      )}
                    </button>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {agent.voiceConfig.webSpeechLang}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3 p-3.5 bg-slate-800/60 rounded-xl max-w-sm border border-slate-700">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs text-cyan-300 font-medium">
                {agent.name} is synthesizing strategic response...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Starters */}
        <div className="px-5 py-2 bg-slate-950/80 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider shrink-0 font-medium">
            Ask {agent.name}:
          </span>
          {agent.knowledge.sampleDeliverables.slice(0, 3).map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(`Please formulate: ${item}`)}
              className="text-xs text-slate-300 bg-slate-900 hover:bg-slate-800 hover:text-cyan-300 px-2.5 py-1 rounded-md border border-slate-800 shrink-0 transition-colors"
            >
              {item}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={toggleMic}
              className={`p-3 rounded-xl border transition-all ${
                isRecording
                  ? 'bg-rose-500 text-white border-rose-400 animate-pulse ring-2 ring-rose-400/50'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
              }`}
              title={isRecording ? 'Stop listening' : 'Speak into microphone'}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Talk or type to ${agent.name} (${agent.tagline})...`}
              disabled={isLoading}
              className="flex-1 bg-slate-900 text-slate-100 placeholder-slate-500 text-sm px-4 py-3 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-3 bg-cyan-500 text-slate-950 font-semibold rounded-xl hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
