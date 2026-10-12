import {db,closeDb} from '../core/database/client.js';
const u=new URL(process.env.DATABASE_URL||'http://invalid');
if(u.hostname!=='127.0.0.1'||u.pathname!=='/pegasus_world_accept_1011')throw Error('Unsafe DB');
const sql=db();
try{
const objective='cbe5f353-25de-4daa-a69e-09b326299fea';
const [o]=await sql`SELECT project_id FROM pegasus_core.objectives WHERE id=${objective}`;
if(!o)throw Error('Objective missing');
const [t]=await sql`INSERT INTO pegasus_core.tasks(project_id,objective_id,assigned_agent_id,title,instructions,input) VALUES(${o.project_id},${objective},'simon','Ollama unattended draft smoke test','No external actions',${sql.json({draftOnly:true,externalActionsAllowed:false,reasoningProvider:'ollama_local'})}) RETURNING id`;
const [j]=await sql`INSERT INTO pegasus_core.jobs(task_id,agent_id,skill_key,input,idempotency_key) VALUES(${t.id},'simon','generate_content',${sql.json({draftOnly:true,externalActionsAllowed:false,reasoningProvider:'ollama_local'})},${'unattended-ollama-'+t.id}) RETURNING id`;
console.log('QUEUED_LOCAL_AI_JOB',j.id);
}finally{await closeDb()}
