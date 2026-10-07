import { AgentVoiceConfig } from '../data/agents';
import { stopTimedVisemes } from './timedVisemes';
import { getAgentVoiceConfig, selectAgentSpeechVoice } from '../../lib/agent-voice-registry';

// Global audio element reference so multiple voices don't talk over each other
let currentAudioElement: HTMLAudioElement | null = null;
let currentAudioContext: AudioContext | null = null;
let currentAnalyser: AnalyserNode | null = null;
let currentSourceNode: MediaElementAudioSourceNode | null = null;
let animationFrameId: number | null = null;

export interface AudioVisualizerCallback {
  (frequencyData: Uint8Array): void;
}

export function isVoiceProviderInCooldown(): boolean {
  return false;
}

export function getRemainingTTSCooldownSeconds(): number {
  return 0;
}

/**
 * Play audio from a base64 URL when a caller already has local/provider audio.
 * Connects to Web Audio API Analyser for visualizer updates.
 */
export async function playProviderAudio(
  audioUrl: string,
  onStart?: () => void,
  onEnd?: () => void,
  onVisualizerFrame?: AudioVisualizerCallback
): Promise<void> {
  stopAllAudio();

  return new Promise((resolve) => {
    try {
      const audio = new Audio(audioUrl);
      currentAudioElement = audio;

      // Setup audio analyzer if supported
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          if (!currentAudioContext || currentAudioContext.state === 'closed') {
            currentAudioContext = new AudioCtx();
          }
          if (currentAudioContext.state === 'suspended') {
            currentAudioContext.resume();
          }
          const analyser = currentAudioContext.createAnalyser();
          analyser.fftSize = 64;
          currentAnalyser = analyser;

          const source = currentAudioContext.createMediaElementSource(audio);
          currentSourceNode = source;
          source.connect(analyser);
          analyser.connect(currentAudioContext.destination);

          if (onVisualizerFrame) {
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const renderLoop = () => {
              if (currentAudioElement && !currentAudioElement.paused) {
                analyser.getByteFrequencyData(dataArray);
                onVisualizerFrame(new Uint8Array(dataArray));
                animationFrameId = requestAnimationFrame(renderLoop);
              } else {
                onVisualizerFrame(new Uint8Array(analyser.frequencyBinCount));
              }
            };
            audio.onplay = () => {
              if (onStart) onStart();
              renderLoop();
            };
          }
        }
      } catch (err) {
        // AudioContext error shouldn't prevent audio from playing
      }

      audio.onended = () => {
        stopVisualizerLoop();
        if (onEnd) onEnd();
        resolve();
      };

      audio.onerror = () => {
        stopVisualizerLoop();
        if (onEnd) onEnd();
        resolve();
      };

      audio.play().catch(() => {
        if (onEnd) onEnd();
        resolve();
      });
    } catch (e) {
      if (onEnd) onEnd();
      resolve();
    }
  });
}

/**
 * Fallback / Instant Speech using browser Web Speech API.
 * Accurately selects distinct voices and tunes pitch, rate, and accents for each of the 12 agents.
 */
export function speakWebSpeech(
  text: string,
  voiceConfig: AgentVoiceConfig,
  agentId?: string,
  onStart?: () => void,
  onEnd?: () => void,
  onVisualizerFrame?: AudioVisualizerCallback
): void {
  stopAllAudio();

  if (!('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const cleanText = text
    .replace(/[*_#`[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  const browserVoiceConfig = getAgentVoiceConfig(agentId);
  utterance.pitch = browserVoiceConfig.pitch || voiceConfig.pitch || 1.0;
  utterance.rate = browserVoiceConfig.rate || voiceConfig.rate || 1.0;
  utterance.lang = browserVoiceConfig.lang || voiceConfig.webSpeechLang || 'en-US';

  const voices = window.speechSynthesis.getVoices();
  utterance.voice = selectAgentSpeechVoice(voices, browserVoiceConfig);

  let syntheticWaveInterval: any = null;

  utterance.onstart = () => {
    if (onStart) onStart();
    if (onVisualizerFrame) {
      // High-resolution frequency wave simulation for Web Speech
      syntheticWaveInterval = setInterval(() => {
        const fakeData = new Uint8Array(32);
        for (let i = 0; i < fakeData.length; i++) {
          fakeData[i] = Math.floor(Math.random() * 160 + 35);
        }
        onVisualizerFrame(fakeData);
      }, 50);
    }
  };

  utterance.onend = () => {
    if (syntheticWaveInterval) clearInterval(syntheticWaveInterval);
    if (onVisualizerFrame) onVisualizerFrame(new Uint8Array(32));
    if (onEnd) onEnd();
  };

  utterance.onerror = () => {
    if (syntheticWaveInterval) clearInterval(syntheticWaveInterval);
    if (onVisualizerFrame) onVisualizerFrame(new Uint8Array(32));
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}

/**
 * Universal speech execution using the zero-cost browser Web Speech API.
 */
export async function speakAgent(
  text: string,
  agentId: string,
  voiceConfig: AgentVoiceConfig,
  preferNaturalVoice: boolean = true,
  onStart?: () => void,
  onEnd?: () => void,
  onVisualizerFrame?: AudioVisualizerCallback
): Promise<void> {
  speakWebSpeech(text, voiceConfig, agentId, onStart, onEnd, onVisualizerFrame);
}

export function stopAllAudio(): void {
  stopTimedVisemes();
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (currentAudioElement) {
    currentAudioElement.pause();
    currentAudioElement.currentTime = 0;
    currentAudioElement = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

function stopVisualizerLoop(): void {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

/**
 * Speech-to-text listener helper using Web Speech Recognition
 */
export function createSpeechRecognizer(
  onTranscript: (text: string) => void,
  onError?: (err: any) => void
): { start: () => void; stop: () => void; isSupported: boolean } {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return {
      start: () => {},
      stop: () => {},
      isSupported: false,
    };
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event: any) => {
    let finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      }
    }
    if (finalTranscript) {
      onTranscript(finalTranscript);
    }
  };

  recognition.onerror = (e: any) => {
    if (onError) onError(e);
  };

  return {
    start: () => {
      try {
        recognition.start();
      } catch {
        // Recognition start error
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch {
        // Recognition stop error
      }
    },
    isSupported: true,
  };
}
