import { db } from '../../core/database/client.js';
import { requireCoreAuth, enforceRateLimit } from './_security.js';

/** Read-only event stream. Core credentials never enter browser JavaScript. */
export default async function handler(req:any,res:any) {
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  if(!enforceRateLimit(req,res,30,60_000)||!requireCoreAuth(req,res))return;
  const sinceRaw=String(req.query?.after||'0');
  if(!/^[0-9]{1,18}$/.test(sinceRaw))return res.status(400).json({error:'Invalid cursor'});
  const cursor=BigInt(sinceRaw);
  try {
    const sql=db();
    const rows=await sql`SELECT id,agent_id,event_type,entity_type,entity_id,created_at FROM pegasus_core.events WHERE id>${String(cursor)}::bigint ORDER BY id ASC LIMIT 100`;
    return res.status(200).json({source:'pegasus_core.events',readOnly:true,events:rows.map(r=>({id:String(r.id),agentId:r.agent_id,eventType:r.event_type,entityType:r.entity_type,entityId:r.entity_id,createdAt:r.created_at})),nextCursor:rows.length?String(rows[rows.length-1].id):sinceRaw});
  }catch{return res.status(503).json({error:'Authoritative events unavailable'});}
}
