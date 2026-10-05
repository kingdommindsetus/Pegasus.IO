export type AgentState =
  | "IDLE"
  | "LISTENING"
  | "THINKING"
  | "SPEAKING"
  | "ERROR"
  | "OFFLINE";

export type Viseme =
  | "REST"
  | "AA"
  | "AE"
  | "AH"
  | "EE"
  | "IH"
  | "OH"
  | "OU"
  | "MBP"
  | "FV"
  | "L"
  | "SZ"
  | "TH"
  | "CH"
  | "R"
  | "WQ";

export interface VisemeCue {
  start: number;
  end: number;
  viseme: Viseme;
  weight?: number;
}

export interface SpeechResult {
  audioUrl?: string;
  audioBuffer?: ArrayBuffer;
  duration: number;
  visemes: VisemeCue[];
  transcript: string;
  provider?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentVisualConfig {
  id: string;
  displayName: string;
  role: string;
  modelUrl?: string;
  voiceId?: string;
  hologramColor: string;
  idleExpression: string;
  speakingIntensity: number;
}

export interface HolographicAgentProps {
  agentId: string;
  state: AgentState;
  speech?: SpeechResult | null;
  audioElement?: HTMLAudioElement | null;
  intensity?: number;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
}