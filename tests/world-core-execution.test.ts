import test from 'node:test';
import assert from 'node:assert/strict';
import {runJob, type JobStore} from '../core/work/workers/runJob.js';
import {executeAgentTask} from '../core/runtime/execution/executeAgentTask.js';
import type {PegasusJob} from '../core/work/jobs/stateMachine.js';

test('Core worker: one harmless draft produces durable-store calls and completion event',async()=>{
 const events:string[]=[]; const saves:string[]=[];const evidence:unknown[]=[];let memory:Record<string,unknown>|null=null;
 const store:JobStore={
   async save(j){saves.push(j.status)},
   async recordEvent(_j,e){events.push(e)},
   async recordEvidence(_j,e){evidence.push(...e)},
   async writeMemory(_j,r){memory=r}
 };
 const job:PegasusJob={id:'test-job-001',taskId:'test-task-001',agentId:'mark',skillKey:'draft_email',status:'claimed',attempts:0,maxAttempts:2,input:{}};
 const context:any={agent:{id:'mark',mission:'Draft only',role:'Marketing Director'},projectId:'test-project',relevantMemories:[],project:{},objectiveContext:{}};
 const finished=await runJob(job,store,async()=>{
   const result=await executeAgentTask({
     context,
     reasoner:{async decide(){return {skillKey:'draft_email',rationale:'Safe local smoke test',input:{target:'internal-review',task:'Produce a sample internal outreach draft'}}}},
     permissions:{async permission(){return 'allow' as const}},
     skills:{async execute(_skill,input){return {output:{emailDraft:{target:input.target,body:'Example draft for review only',status:'draft_only'}},evidence:[{source:'local_test',valid:true}]}}}
   });
   return {status:result.status,output:result.output,evidence:result.evidence};
 });
 assert.equal(finished.status,'completed');
 assert.deepEqual(saves,['running','completed']);
 assert.deepEqual(events,['job_completed']);
 assert.equal(evidence.length,1);
 assert.equal((memory as any)?.emailDraft?.status,'draft_only');
 console.log('EXECUTION_EVIDENCE',JSON.stringify({jobId:job.id,agentId:job.agentId,status:finished.status,events,saves,output:memory}));
});
test('Approval-required permission never invokes the skill executor',async()=>{
 let executed=false;
 const result=await executeAgentTask({
   context:{agent:{id:'echo'}} as any,
   reasoner:{async decide(){return {skillKey:'publish_campaign',rationale:'Requires review',input:{}}}},
   permissions:{async permission(){return 'approval_required' as const}},
   skills:{async execute(){executed=true;return {output:{}}}}
 });
 assert.equal(result.status,'waiting_approval');
 assert.equal(executed,false);
});
