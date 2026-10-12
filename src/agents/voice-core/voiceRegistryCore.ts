/**
 * Pegasus VoiceOS snapshot adapter. No production I/O or speech side effects.
 * Voice selections originate in Kingdom's local approved voice registry.
 * Snapshot must be explicitly synced and validated before any rollout.
 */
import profiles from "./voice-profiles.json";
import groups from "./agent-groups.json";

export type VoiceAgentId = keyof typeof profiles;
export type VoiceProfile = (typeof profiles)[VoiceAgentId];
export const huddleVoiceIds: readonly string[] = Object.freeze([...groups.huddle_agents]);
export const workforceVoiceIds: readonly string[] = Object.freeze([...groups.workforce_agents]);

export function getPegasusVoiceProfile(id: string): VoiceProfile | null {
  const normalized = id.trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(profiles, normalized)
    ? profiles[normalized as VoiceAgentId] as VoiceProfile
    : null;
}

export function getPegasusVoiceForPlayback(id: string) {
  const voice = getPegasusVoiceProfile(id);
  if (!voice) return null;
  return {
    agentId: voice.agent_id,
    engine: voice.engine,
    voiceId: voice.voice_id,
    language: voice.language,
    approved: voice.approved,
    version: voice.version,
    source: voice.source
  };
}
