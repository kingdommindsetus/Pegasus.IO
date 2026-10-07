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
    await recordVoiceTelemetry(agentId,jobId,{provider:'Browser Web Speech',voiceName:null,fallback:false});
    return res.status(200).json({
      provider: 'WEB_SPEECH_FALLBACK',
      agentId,
      fallbackToWebSpeech: true,
      quotaCooldown: false,
    });
  } catch (error: any) {
    await recordVoiceTelemetry(agentId,jobId,{provider:'Browser Web Speech',voiceName:null,fallback:false}).catch(()=>{});
    return res.status(200).json({
      provider: 'WEB_SPEECH_FALLBACK',
      agentId,
      fallbackToWebSpeech: true,
      detail: error?.message || 'Voice provider unavailable',
    });
  }
}
