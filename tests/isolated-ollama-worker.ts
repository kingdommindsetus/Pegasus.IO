import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {db,closeDb} from '../core/database/client.js';
import {recoverExpiredIsolatedLeases} from '../core/work/jobs/isolatedLeaseRecovery.js';
import {unlockDependents} from '../core/work/jobs/repository.js';
import {claimIsolatedDraftJob,startOwnedIsolatedRun,finishOwnedIsolatedRun} from '../core/work/jobs/isolatedAtomicExecution.js';
const url=new URL(process.env.DATABASE_URL||'http://invalid');
if(url.hostname!=='127.0.0.1'||url.pathname!=='/pegasus_world_windows_accept_1011')throw Error('Isolated DB only');
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
 if(identity.db!=='pegasus_world_windows_accept_1011'||identity.role!=='pegasus_windows_accept_role')throw Error('Wrong database');
 console.log('AI_DRAFT_WORKER_READY');
 while(!stop){
  try{
   await recoverExpiredIsolatedLeases(objective);
   const job=await claimIsolatedDraftJob(objective,'isolated-ai-worker','generate_content',90);
   if(job){
      const owned=await startOwnedIsolatedRun(objective,job.id,'isolated-ai-worker');
      if(!owned){console.log('AI_OWNERSHIP_LOST',job.id);continue;}
      const result=await (async()=>{
       const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),75000);
       try{
        const response=await fetch('http://127.0.0.1:11434/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'qwen3:1.7b',system:simonSoul.slice(0,12000)+'\nYou are operating in an isolated development acceptance test. Produce drafts only; never execute external actions.',prompt:'As Simon, provide three concise draft-only QA checklist items. Identify the appropriate handoff owner and required evidence. Do not claim actual work was done.',stream:false,think:false,options:{num_predict:240,temperature:0.2}}),signal:controller.signal});
        if(!response.ok)throw Error('Ollama HTTP '+response.status);
        const data:any=await response.json();const content=String(data.response||'').trim();if(!content)throw Error('Empty model output');
        return {status:'completed' as const,output:{content,provider:'ollama_local',model:'qwen3:1.7b',generationType:'AI',brainSource:'SIMON_SOUL.md',brainHash:soulHash,draftOnly:true,externalActionsExecuted:false},evidence:[{source:'ollama_local',model:'qwen3:1.7b',generated:true,brainSource:'SIMON_SOUL.md',brainHash:soulHash}]};
       }finally{clearTimeout(timeout)}
      })();
      const committed=await finishOwnedIsolatedRun(objective,owned,result.output,result.evidence);
      if(committed){await unlockDependents({...job,status:'completed'});console.log('AI_DRAFT_JOB',job.id,'completed');}
      else console.log('AI_STALE_WORKER_REJECTED',job.id);
   }
  }catch(e){console.log('AI_WORKER_ERROR',e instanceof Error?e.message:'Unknown')}
  await sleep(5000);
 }
}finally{await closeDb()}
