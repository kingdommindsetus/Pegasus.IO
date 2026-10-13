import assert from 'node:assert/strict';
import {test} from 'node:test';
import {assessOpenClawLab,type OpenClawLabConditions} from '../core/integrations/openclawLabReadiness.js';
const safe:OpenClawLabConditions={nodeVersion:'v24.16.0',freeMemoryBytes:3*1024**3,
 separateOsIdentity:true,sandboxReviewed:true,gatewayLoopbackOnly:true,
 noLiveCredentials:true,channelsDisabled:true,hostExecDenied:true};
test('lab admission is an assessment only and never starts OpenClaw',()=>{
 const result=assessOpenClawLab(safe);
 assert.equal(result.ready,true);assert.deepEqual(result.blockingReasons,[]);
 assert.equal(result.mode,'assessment_only');assert.equal(result.externalActionsExecuted,false);
});
test('KINGDOM current Node and limited free memory block isolated pilot',()=>{
 const result=assessOpenClawLab({...safe,nodeVersion:'v24.12.0',freeMemoryBytes:1.6*1024**3});
 assert.equal(result.ready,false);
 assert.ok(result.blockingReasons.includes('node_version_not_supported_by_uploaded_openclaw'));
 assert.ok(result.blockingReasons.includes('lab_free_ram_below_conservative_2_gib_floor'));
});
test('OpenClaw source Node engines allow 24.16+ and 26.1+ but not 25',()=>{
 for(const version of ['v24.16.0','v24.20.1','v26.1.0','v27.0.0'])
   assert.equal(assessOpenClawLab({...safe,nodeVersion:version}).ready,true);
 for(const version of ['v24.12.0','v25.0.0','v26.0.0','invalid'])
   assert.equal(assessOpenClawLab({...safe,nodeVersion:version}).ready,false);
});
test('all sensitive execution and gateway settings are hard stops',()=>{
 const unsafe:Partial<OpenClawLabConditions>[]=[{separateOsIdentity:false},
  {sandboxReviewed:false},{gatewayLoopbackOnly:false},{noLiveCredentials:false},
  {channelsDisabled:false},{hostExecDenied:false}];
 for(const item of unsafe)assert.equal(assessOpenClawLab({...safe,...item}).ready,false);
});
