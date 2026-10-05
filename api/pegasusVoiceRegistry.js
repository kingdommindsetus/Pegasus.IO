export const PEGASUS_VOICE_REGISTRY = {
  simon:  { voiceId: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel - Steady Broadcaster', gender: 'male', accent: 'british', profile: 'formal, steady, authoritative British executive' },
  marie:  { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah - Mature, Reassuring, Confident', gender: 'female', accent: 'american', profile: 'warm, reassuring, professional operations lead' },
  iris:   { voiceId: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda - Knowledgeable, Professional', gender: 'female', accent: 'american', profile: 'bright, articulate, upbeat intelligence analyst' },
  mark:   { voiceId: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger - Laid-Back, Casual, Resonant', gender: 'male', accent: 'american', profile: 'classy, confident, resonant marketing strategist' },
  cammy:  { voiceId: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura - Enthusiast, Quirky Attitude', gender: 'female', accent: 'american', profile: 'energetic, sharp, campaign-forward delivery' },
  evan:   { voiceId: 'iP95p4xoKVk53GoZ742B', name: 'Chris - Charming, Down-to-Earth', gender: 'male', accent: 'american', profile: 'natural, creative, relaxed content director' },
  tube:   { voiceId: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie - Deep, Confident, Energetic', gender: 'male', accent: 'australian', profile: 'deep, cinematic, energetic video producer' },
  lucy:   { voiceId: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica - Playful, Bright, Warm', gender: 'female', accent: 'american', profile: 'bright, social, warm distribution strategist' },
  snake:  { voiceId: 'nPczCjzI2devNBz1zQrb', name: 'Brian - Deep, Resonant and Comforting', gender: 'male', accent: 'american', profile: 'deep, composed, measured analytics chief' },
  alice:  { voiceId: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice - Clear, Engaging Educator', gender: 'female', accent: 'british', profile: 'crisp, professional, detail-oriented CRO specialist' },
  echo:   { voiceId: 'cjVigY5qzO86Huf0OWal', name: 'Eric - Smooth, Trustworthy', gender: 'male', accent: 'american', profile: 'smooth, trustworthy, persuasive sales specialist' },
  booker: { voiceId: 'pqHfZKP75CvOlQylNhV4', name: 'Bill - Wise, Mature, Balanced', gender: 'male', accent: 'american', profile: 'wise, calm, mature executive closer' },
};

export function getPegasusAgentVoice(agentId = 'simon') {
  return PEGASUS_VOICE_REGISTRY[String(agentId).toLowerCase()] || PEGASUS_VOICE_REGISTRY.simon;
}
