import {db,closeDb} from '../core/database/client.js';
import {claimNextJobForObjective,postgresJobStore,closeJobRun,unlockDependents} from '../core/work/jobs/repository.js';
import {runJob} from '../core/work/workers/runJob.js';
const u=new URL(process.env.DATABASE_URL||'http://invalid');
if(u.hostname!=='127.0.0.1'||u.pathname!=='/pegasus_world_accept_1011')throw Error('Isolated database only');
const sql=db(),model='qwen3:1.7b';
try{
 const [who]=await sql`SELECT current_database() db,current_user role`;
 if(who.db!=='pegasus_world_accept_1011'||who.role!=='pegasus_world_test_1011')throw Error('Wrong database');
 const [project]=await sql`INSERT INTO pegasus_core.projects(name,objective) VALUES('Ollama local reasoning acceptance','Internal-only model output') RETURNING id`;
 const [objective]=await sql`INSERT INTO pegasus_core.objectives(project_id,title) VALUES(${project.id},'Generate a harmless internal draft using Ollama') RETURNING id`;
 const [task]=await sql`INSERT INTO pegasus_core.tasks(project_id,objective_id,assigned_agent_id,title,instructions,input) VALUES(${project.id},${objective.id},'simon','Internal QA checklist draft','Draft three points; no external actions',${sql.json({draftOnly:true})}) RETURNING id`;
 const [seed]=await sql`INSERT INTO pegasus_core.jobs(task_id,agent_id,skill_key,input,idempotency_key) VALUES(${task.id},'simon','generate_content',${sql.json({draftOnly:true,externalActionsAllowed:false})},${'ollama-test-'+task.id}) RETURNING id`;
 const job=await claimNextJobForObjective(objective.id,'ollama-local-acceptance',90);
 if(!job||job.id!==seed.id)throw Error('Job was not correctly claimed');
 await postgresJobStore.recordEvent(job,'job_claimed',{workerId:'ollama-local-acceptance'});
 const finished=await runJob(job,postgresJobStore,async()=>{
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),90000);
  let data:any;
  try{
   const r=await fetch('http://127.0.0.1:11434/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,prompt:'Produce exactly three brief checklist items for internal testing of a draft-only company workflow. Do not assert tests were run or contact anyone.',stream:false,think:false,options:{num_predict:240,temperature:0.1}}),signal:controller.signal});
   if(!r.ok)throw Error('Local Ollama HTTP '+r.status);
   data=await r.json();
  }finally{clearTimeout(timer)}
  const text=String(data.response||'').trim();if(!text)throw Error('Model returned empty text');
  return {status:'completed' as const,output:{type:'ai_generated_draft',provider:'ollama_local',model,content:text,externalActionsExecuted:false,source:'local_model_generation'},evidence:[{source:'ollama_local',model,generated:true,eval_count:data.eval_count||null}]};
 });
 await closeJobRun(finished,'ollama-local-acceptance');finished.leaseExpiresAt=undefined;await postgresJobStore.save(finished);await unlockDependents(finished);
 const [persisted]=await sql`SELECT status,result,attempts FROM pegasus_core.jobs WHERE id=${seed.id}`;
 const [count]=await sql`SELECT count(*)::int n FROM pegasus_core.evidence WHERE job_id=${seed.id}`;
 console.log('OLLAMA_CORE_TEST',JSON.stringify({jobId:seed.id,status:persisted.status,attempts:persisted.attempts,model:persisted.result?.model,provider:persisted.result?.provider,evidenceCount:count.n,content:String(persisted.result?.content||'').slice(0,400),lastError:finished.lastError||null}));
}finally{await closeDb()}
