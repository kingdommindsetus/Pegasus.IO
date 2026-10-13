import assert from 'node:assert/strict';
import {test} from 'node:test';
import {
 PEGASUS_BUILD_MILESTONES,validateBuildBoard,buildBoardSnapshot,BOARD_STATES
} from '../core/integrations/pegasusBuildBoard.js';

test('engineering board tracks all milestones and explicitly refuses production launch claim',()=>{
 const report=buildBoardSnapshot();
 assert.equal(report.mode,'engineering_tracking_not_live');
 assert.equal(report.productionGoLiveVerified,false);
 assert.equal(report.total,PEGASUS_BUILD_MILESTONES.length);
 assert.ok(report.total>=10);
 assert.equal(BOARD_STATES.reduce((sum,state)=>sum+report.counts[state],0),report.total);
});
test('the required P0 end-to-end task, KMCE verification, and Gods Eye reader are not marked complete',()=>{
 const byId=Object.fromEntries(PEGASUS_BUILD_MILESTONES.map(x=>[x.id,x]));
 assert.equal(byId['real-job'].status,'blocked');
 assert.equal(byId['godseye'].status,'in_progress');
 assert.equal(byId['kmce'].status,'existing_unverified');
 assert.equal(byId['foundation'].status,'existing_unverified');
 for(const x of PEGASUS_BUILD_MILESTONES.filter(x=>x.priority==='P0'))
  assert.notEqual(x.status,'verified_lab');
});
test('Paperclip is included but does not replace core or claim an installation',()=>{
 const paperclip=PEGASUS_BUILD_MILESTONES.find(x=>x.id==='paperclip');
 const redis=PEGASUS_BUILD_MILESTONES.find(x=>x.id==='redis');
 assert.equal(paperclip?.priority,'P2');
 assert.equal(paperclip?.status,'queued');
 assert.match(paperclip!.acceptance,/correlation ID/);
 assert.equal(redis?.status,'deferred');
});
test('only proven synthetic lab milestones are lab-verified with explicit proof',()=>{
 for(const x of PEGASUS_BUILD_MILESTONES.filter(x=>x.status==='verified_lab')){
  assert.ok(x.proof);
  assert.equal(x.customerFacing,false);
 }
 assert.equal(validateBuildBoard(),true);
});
test('tracking fails closed on duplicate IDs, missing evidence and ungrounded blocked status',()=>{
 const a=PEGASUS_BUILD_MILESTONES[0];
 assert.throws(()=>validateBuildBoard([a,a]),/BUILD_BOARD_INVALID/);
 assert.throws(()=>validateBuildBoard([{...a,status:'verified_lab',proof:null}]),/BUILD_BOARD_INVALID/);
 assert.throws(()=>validateBuildBoard([{...a,status:'blocked',blocker:null}]),/BUILD_BOARD_INVALID/);
 assert.throws(()=>validateBuildBoard([{...a,status:'done'} as never]),/BUILD_BOARD_INVALID/);
});
