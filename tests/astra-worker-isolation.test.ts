import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {classifyAstraDraftReview,assertNoAutomaticReviewApproval,createSimonAstraReceipt} from '../core/work/jobs/astraDraftReview.js';
const root=new URL('../core/work/jobs/',import.meta.url);
test('global and objective generic claim paths exclude Astra marked jobs',()=>{
 const source=readFileSync(new URL('repository.ts',root),'utf8');
 assert.match(source,/COALESCE\(input->>'bridgeKind',''\) <> 'astra_kmce_readonly_v1'/);
 assert.match(source,/COALESCE\(j.input->>'bridgeKind',''\) <> 'astra_kmce_readonly_v1'/);
});
test('isolated generic atomic claim excludes marked Astra jobs',()=>{
 const source=readFileSync(new URL('isolatedAtomicExecution.ts',root),'utf8');
 assert.match(source,/COALESCE\(j.input->>'bridgeKind',''\) <> 'astra_kmce_readonly_v1'/);
});
test('Astra leases expire without automatic retries and generic recovery stays separate',()=>{
 const source=readFileSync(new URL('isolatedLeaseRecovery.ts',root),'utf8');
 assert.match(source,/j\.skill_key='astra_knowledge_draft'/);
 assert.match(source,/j\.input->>'bridgeKind'='astra_kmce_readonly_v1'/);
 assert.match(source,/const next=astra\|\|exhausted\?'failed':'retrying'/);
 assert.match(source,/isolated_astra_lease_expired/);
 assert.match(source,/ASTRA_ISOLATED_LEASE_EXPIRED/);
});
test('all draft results remain pending human review',()=>{
 for(const validationStatus of ['accepted_draft','needs_review','not_established']){
  const result=classifyAstraDraftReview({status:'draft_assessed',validationStatus,draftOnly:true,externalActionsExecuted:false});
  assert.equal(result.state,'pending_human_review');
 }
});
test('Simons Astra receipt contains only review metadata, never approval or dispatch',()=>{
 const jobId='a1234567-b123-c123-d123-e12345678901';
 const result={status:'draft_assessed',validationStatus:'needs_review',draftOnly:true,
   externalActionsExecuted:false,sourceIds:['provider_identifiers']};
 const receipt=createSimonAstraReceipt(jobId,result);
 assert.equal(receipt.jobId,jobId);assert.equal(receipt.owner,'simon');
 assert.equal(receipt.contentStatus,'pending_human_review');
 assert.equal(receipt.externalActionsAllowed,false);assert.equal(receipt.publishAllowed,false);
 assert.equal(receipt.nextAction,'request_authenticated_human_review');
 assert.ok(!('answer' in receipt));
 assert.throws(()=>createSimonAstraReceipt(jobId,{...result,externalActionsExecuted:true}),/DENIED/);
 assert.throws(()=>createSimonAstraReceipt(jobId,{...result,sourceIds:['bad source id']}),/DENIED/);
});
test('invalid results fail closed and no automatic reviewer approval exists',()=>{
 for(const r of [null,{}, {status:'draft_assessed',validationStatus:'accepted_draft',draftOnly:true,externalActionsExecuted:true}])
  assert.equal(classifyAstraDraftReview(r).state,'rejected');
 assert.throws(assertNoAutomaticReviewApproval,/DENIED/);
});
