import { getPegasusAgentVoice } from '../pegasusVoiceRegistry.js';
import { db } from '../../core/database/client.js';


function validUuid(value:string){
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function recordVoiceTelemetry(agentId:string,jobId:string|undefined,meta:{provider:string;voiceName?:string|null;fallback:boolean}){
  if(!jobId||!validUuid(jobId))return;
  const sql=db();
  const rows=await sql`
    SELECT j.id,j.agent_id,t.project_id
    FROM pegasus_core.jobs j
    JOIN pegasus_core.tasks t ON t.id=j.task_id
    WHERE j.id=${jobId} AND j.agent_id=${agentId}
    LIMIT 1
  `;
  if(!rows.length)return;
  const row=rows[0];
  await sql`
    INSERT INTO pegasus_core.events(project_id,agent_id,event_type,entity_type,entity_id,payload)
    VALUES(
      ${row.project_id},
      ${agentId},
      'voice_telemetry',
      'job',
      ${jobId},
      ${sql.json({
        provider:meta.provider,
        voiceName:meta.voiceName||null,
        fallback:meta.fallback,
        recordedAt:new Date().toISOString()
      } as any)}
    )
  `;
}

async function elevenLabsTts(agentId: string, text: string) {
  const apiKey = String(process.env.ELEVENLABS_API_KEY || '').trim();
  if (!apiKey) return null;

  const profile = getPegasusAgentVoice(agentId);
  const modelId = process.env.ELEVENLABS_TTS_MODEL || 'eleven_flash_v2_5';

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${profile.voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        stability: 0.48,
        similarity_boost: 0.82,
        style: 0.18,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    const error: any = new Error('ElevenLabs TTS failed');
    error.status = response.status;
    error.detail = detail.slice(0, 500);
    throw error;
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  return {
    audioUrl: `data:audio/mpeg;base64,${bytes.toString('base64')}`,
    provider: 'ELEVENLABS',
    agentId,
    voice: profile.voiceId,
    voiceName: profile.name,
    aiGeneratedVoice: true,
    fallbackToWebSpeech: false,
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const agentId = String(req.body?.agentId || 'simon').toLowerCase();
  const jobId = typeof req.body?.jobId==='string' ? req.body.jobId : undefined;
  const text = String(req.body?.text || 'Pegasus voice system online.')
    .replace(/[*_#`\[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1000);

  if (!text) return res.status(400).json({ error: 'Text is required.' });

  try {
    try {
      const eleven = await elevenLabsTts(agentId, text);
      if (eleven) { await recordVoiceTelemetry(agentId,jobId,{provider:'ElevenLabs',voiceName:eleven.voiceName||eleven.voice,fallback:false}); return res.status(200).json(eleven); }
    } catch (error: any) {
      const status = Number(error?.status || 0);
      const quotaLike = status === 429 || status === 401 || status === 403;
      if (!quotaLike) {
        console.warn('ElevenLabs TTS error', error?.detail || error?.message || error);
      }
    }

    await recordVoiceTelemetry(agentId,jobId,{provider:'Browser Speech',voiceName:null,fallback:true});
    return res.status(200).json({
      provider: 'WEB_SPEECH_FALLBACK',
      agentId,
      fallbackToWebSpeech: true,
      quotaCooldown: false,
    });
  } catch (error: any) {
    await recordVoiceTelemetry(agentId,jobId,{provider:'Browser Speech',voiceName:null,fallback:true}).catch(()=>{});
    return res.status(200).json({
      provider: 'WEB_SPEECH_FALLBACK',
      agentId,
      fallbackToWebSpeech: true,
      detail: error?.message || 'Voice provider unavailable',
    });
  }
}
