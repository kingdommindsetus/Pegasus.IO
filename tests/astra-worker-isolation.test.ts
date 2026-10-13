import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {classifyAstraDraftReview,assertNoAutomaticReviewApproval} from '../core/work/jobs/astraDraftReview.js';
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
test('all draft results remain pending human review',()=>{
 for(const validationStatus of ['accepted_draft','needs_review','not_established']){
  const result=classifyAstraDraftReview({status:'draft_assessed',validationStatus,draftOnly:true,externalActionsExecuted:false});
  assert.equal(result.state,'pending_human_review');
 }
});
test('invalid results fail closed and no automatic reviewer approval exists',()=>{
 for(const r of [null,{}, {status:'draft_assessed',validationStatus:'accepted_draft',draftOnly:true,externalActionsExecuted:true}])
  assert.equal(classifyAstraDraftReview(r).state,'rejected');
 assert.throws(assertNoAutomaticReviewApproval,/DENIED/);
});
