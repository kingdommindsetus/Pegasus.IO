import type { SpeechResult } from "../types";

export interface SpeechRequest {
  text: string;
  agentId: string;
  voiceId?: string;
  emotion?: string;
}

export interface SpeechProvider {
  synthesize(input: SpeechRequest): Promise<SpeechResult>;
}

/**
 * Production adapters should return audio plus native phoneme/viseme timing
 * whenever the provider supports it. If a provider does not, normalize timing
 * through a forced-alignment service before handing the result to the renderer.
 */
