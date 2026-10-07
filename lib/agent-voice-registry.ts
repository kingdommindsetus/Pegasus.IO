export interface AgentVoiceConfig {
  preferredVoices: string[];
  lang: string;
  pitch: number;
  rate: number;
}

export const AGENT_VOICE_REGISTRY: Record<string, AgentVoiceConfig> = {
  Simon: { preferredVoices: ["Google UK English Male", "Daniel", "Oliver", "en-GB"], lang: "en-GB", pitch: 0.88, rate: 0.95 },
  Marie: { preferredVoices: ["Google US English Female", "Samantha", "Karen", "en-US"], lang: "en-US", pitch: 1.05, rate: 1.05 },
  IRIS: { preferredVoices: ["Google UK English Female", "Serena", "Moira", "en-GB"], lang: "en-GB", pitch: 0.98, rate: 0.92 },
  Mark: { preferredVoices: ["Google US English Male", "Alex", "Fred", "en-US"], lang: "en-US", pitch: 0.95, rate: 1.00 },
  Cammy: { preferredVoices: ["Victoria", "Google US English Female", "Ava", "en-US"], lang: "en-US", pitch: 1.15, rate: 1.08 },
  Evan: { preferredVoices: ["Google US English Male", "Tom", "en-US"], lang: "en-US", pitch: 0.92, rate: 0.96 },
  Tube: { preferredVoices: ["Junior", "Google US English Male", "en-US"], lang: "en-US", pitch: 1.08, rate: 1.15 },
  Lucy: { preferredVoices: ["Google UK English Female", "Fiona", "Tessa", "en-GB"], lang: "en-GB", pitch: 1.10, rate: 1.02 },
  Snake: { preferredVoices: ["Ralph", "Google US English Male", "en-US"], lang: "en-US", pitch: 0.82, rate: 0.88 },
  Alice: { preferredVoices: ["Google US English Female", "Allison", "en-US"], lang: "en-US", pitch: 1.02, rate: 0.98 },
  Echo: { preferredVoices: ["Bruce", "Google US English Male", "en-US"], lang: "en-US", pitch: 0.96, rate: 1.02 },
  Booker: { preferredVoices: ["Susan", "Google US English Female", "en-US"], lang: "en-US", pitch: 1.00, rate: 1.00 },
};

const AGENT_ALIASES: Record<string, keyof typeof AGENT_VOICE_REGISTRY> = {
  simon: "Simon",
  marie: "Marie",
  iris: "IRIS",
  mark: "Mark",
  cammy: "Cammy",
  evan: "Evan",
  tube: "Tube",
  lucy: "Lucy",
  snake: "Snake",
  alice: "Alice",
  echo: "Echo",
  booker: "Booker",
};

export function getAgentVoiceConfig(agentIdOrName?: string): AgentVoiceConfig {
  const key = String(agentIdOrName || "Simon").trim();
  const registryKey = AGENT_ALIASES[key.toLowerCase()] || key;
  return AGENT_VOICE_REGISTRY[registryKey] || AGENT_VOICE_REGISTRY.Simon;
}

export function selectAgentSpeechVoice(
  voices: SpeechSynthesisVoice[],
  config: AgentVoiceConfig
): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  for (const preferred of config.preferredVoices) {
    const target = preferred.toLowerCase();
    const exactName = voices.find(voice => voice.name.toLowerCase() === target);
    if (exactName) return exactName;

    const exactLang = voices.find(voice => voice.lang.toLowerCase() === target);
    if (exactLang) return exactLang;

    const partialName = voices.find(voice => voice.name.toLowerCase().includes(target));
    if (partialName) return partialName;
  }

  const preferredLang = voices.find(voice => voice.lang.toLowerCase() === config.lang.toLowerCase());
  if (preferredLang) return preferredLang;

  const languageFamily = config.lang.split("-")[0].toLowerCase();
  return voices.find(voice => voice.lang.toLowerCase().startsWith(languageFamily)) || voices[0];
}
