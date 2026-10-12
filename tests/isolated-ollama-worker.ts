import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {db,closeDb} from '../core/database/client.js';
import {claimNextJobForObjective,postgresJobStore,closeJobRun,unlockDependents} from '../core/work/jobs/repository.js';
import {runJob} from '../core/work/workers/runJob.js';
const url=new URL(process.env.DATABASE_URL||'http://invalid');
if(url.hostname!=='127.0.0.1'||url.pathname!=='/pegasus_world_accept_1011')throw Error('Isolated DB only');
const objective=process.env.PEGASUS_TEST_OBJECTIVE_ID||'';
if(objective!=='cbe5f353-25de-4daa-a69e-09b326299fea')throw Error('Unexpected objective');
const soulPath='C:/Users/info/PEGASUS_OS/01-agent-brains/SIMON_SOUL.md';
const simonSoul=readFileSync(soulPath,'utf8');
if(!simonSoul.includes('CANONICAL SOUL CONTRACT')||!simonSoul.includes('No completed-action claim without proof'))throw Error('Canonical Simon soul invalid');
const soulHash=createHash('sha256').update(simonSoul).digest('hex');
const sql=db();const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));
let stop=false;process.on('SIGINT',()=>stop=true);process.on('SIGTERM',()=>stop=true);
try{
 const [identity]=await sql`SELECT current_database() db,current_user role`;
 if(identity.db!=='pegasus_world_accept_1011'||identity.role!=='pegasus_world_test_1011')throw Error('Wrong database');
 console.log('AI_DRAFT_WORKER_READY');
 while(!stop){
  try{
   const [target]=await sql`SELECT j.id,j.agent_id,j.skill_key,j.input FROM pegasus_core.jobs j JOIN pegasus_core.tasks t ON j.task_id=t.id WHERE t.objective_id=${objective} AND j.status='queued' AND j.skill_key='generate_content' ORDER BY j.created_at LIMIT 1`;
   if(target){
    if(target.agent_id!=='simon'||target.input?.draftOnly!==true||target.input?.externalActionsAllowed!==false||target.input?.reasoningProvider!=='ollama_local'){console.log('UNSAFE_JOB_SKIPPED',target.id)}
    else{
     const job=await claimNextJobForObjective(objective,'isolated-ai-worker',90);
     if(job && job.id===target.id){
      await postgresJobStore.recordEvent(job,'job_claimed',{workerId:'isolated-ai-worker'});
      const finished=await runJob(job,postgresJobStore,async()=>{
       const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),75000);
       try{
        const response=await fetch('http://127.0.0.1:11434/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'qwen3:1.7b',system:simonSoul.slice(0,12000)+'\nYou are operating in an isolated development acceptance test. Produce drafts only; never execute external actions.',prompt:'As Simon, provide three concise draft-only QA checklist items. Identify the appropriate handoff owner and required evidence. Do not claim actual work was done.',stream:false,think:false,options:{num_predict:240,temperature:0.2}}),signal:controller.signal});
        if(!response.ok)throw Error('Ollama HTTP '+response.status);
        const data:any=await response.json();const content=String(data.response||'').trim();if(!content)throw Error('Empty model output');
        return {status:'completed' as const,output:{content,provider:'ollama_local',model:'qwen3:1.7b',generationType:'AI',brainSource:'SIMON_SOUL.md',brainHash:soulHash,draftOnly:true,externalActionsExecuted:false},evidence:[{source:'ollama_local',model:'qwen3:1.7b',generated:true,brainSource:'SIMON_SOUL.md',brainHash:soulHash}]};
       }finally{clearTimeout(timeout)}
      });
      await closeJobRun(finished,'isolated-ai-worker');finished.leaseExpiresAt=undefined;await postgresJobStore.save(finished);await unlockDependents(finished);
      console.log('AI_DRAFT_JOB',finished.id,finished.status);
     }
    }
   }
  }catch(e){console.log('AI_WORKER_ERROR',e instanceof Error?e.message:'Unknown')}
  await sleep(5000);
 }
}finally{await closeDb()}
