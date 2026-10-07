export default function handler(req: any, res: any) {
  res.status(200).json({
    status: 'ok',
    product: 'Pegasus.io',
    reasoningProvider: 'Google AI Studio',
    reasoningConfigured: Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY),
    voiceProvider: 'Browser Web Speech',
    voiceConfigured: true,
    voiceFallback: null,
    totalAgents: 12,
    timestamp: new Date().toISOString(),
  });
}
