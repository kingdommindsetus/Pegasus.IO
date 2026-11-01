import postgres from 'postgres';
import {requireCoreAuth,requirePost,enforceRateLimit} from './_security.js';

// Loads notes a founder keeps per agent (for example Jarvis's company memory)
// into pegasus_core.memories. Re-sending the same note adds nothing.
const AGENT_ID=/^[a-z]{2,20}$/;
const MAX_ENTRIES=200;
const MAX_NOTE=4000;

const getSql=()=>{
 const u=process.env.DATABASE_URL?.trim();
 if(!u)throw Error('DATABASE_URL is not configured');
 return postgres(u,{max:1,idle_timeout:5,connect_timeout:10});
};

export default async function handler(req:any,res:any){
 if(!requirePost(req,res)||!enforceRateLimit(req,res,20,60_000)||!requireCoreAuth(req,res))return;
 const agentId=String(req.body?.agentId||'').trim().toLowerCase();
 const entries=Array.isArray(req.body?.entries)?req.body.entries:null;
 if(!AGENT_ID.test(agentId))return res.status(400).json({error:'agentId must be a lowercase agent name'});
 if(!entries||entries.length>MAX_ENTRIES)return res.status(400).json({error:`entries must be an array of at most ${MAX_ENTRIES}`});
 const notes=entries.map((entry:any)=>({
  at:String(entry?.at||'').trim().slice(0,40),
  note:String(entry?.note||'').trim(),
 }));
 if(notes.some((n:{note:string})=>!n.note||n.note.length>MAX_NOTE))return res.status(400).json({error:`every note needs text of at most ${MAX_NOTE} characters`});

 const sql=getSql();
 try{
  let inserted=0;
  await sql.begin(async (tx:any)=>{
   for(const {at,note} of notes){
    const rows=await tx`
     INSERT INTO pegasus_core.memories(id,scope,scope_id,agent_id,project_id,memory_kind,memory_partition,subject,content,source_type,authority,version,valid_from,created_at,importance,metadata)
     SELECT gen_random_uuid(),'agent',${agentId},${agentId},NULL,'handoff','agent_role_memory',${'Jarvis note '+at},${note},'jarvis_import','agent_generated',1,now(),now(),0.5,${tx.json({importedFrom:'jarvis',at})}
     WHERE NOT EXISTS (
      SELECT 1 FROM pegasus_core.memories
      WHERE scope='agent' AND agent_id=${agentId} AND metadata->>'importedFrom'='jarvis' AND metadata->>'at'=${at} AND content=${note}
     )
     RETURNING id`;
    inserted+=rows.length;
   }
  });
  return res.status(200).json({agentId,received:notes.length,inserted,skipped:notes.length-inserted});
 }catch(err:any){
  console.error('agent-memory save failed:',err?.message||err);
  return res.status(500).json({error:'Could not save agent memory'});
 }finally{
  await sql.end({timeout:5});
 }
}
