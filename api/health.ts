export default function handler(req: any, res: any) {
  res.status(200).json({
    status: 'ok',
    product: 'Pegasus.io',
    reasoningProvider: 'NVIDIA NIM',
    reasoningConfigured: Boolean(process.env.NVIDIA_API_KEY),
    voiceProvider: 'ElevenLabs',
    voiceConfigured: Boolean(process.env.ELEVENLABS_API_KEY),
    voiceFallback: 'Browser Web Speech',
    totalAgents: 12,
    timestamp: new Date().toISOString(),
  });
}