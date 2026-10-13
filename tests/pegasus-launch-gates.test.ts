import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PEGASUS_LAUNCH_GATES,launchProgress} from '../core/integrations/pegasusLaunchGates.js';
test('fixed launch denominator and audited 40% engineering gate coverage',()=>{
 const result=launchProgress();
 assert.equal(result.total,10);assert.equal(result.completed,4);assert.equal(result.percent,40);
 assert.equal(result.productionVerified,false);
 assert.equal(PEGASUS_LAUNCH_GATES.filter(x=>x.passed).length,4);
});
test('missing proof, mutated gate set and duplicates fail closed',()=>{
 const gates=PEGASUS_LAUNCH_GATES.map(x=>({...x}));
 assert.throws(()=>launchProgress(gates.slice(0,9)),/LAUNCH_GATES_INVALID/);
 assert.throws(()=>launchProgress([{...gates[0],proof:null},...gates.slice(1)]),/LAUNCH_GATES_INVALID/);
 assert.throws(()=>launchProgress([{...gates[0]},gates[0],...gates.slice(2)]),/LAUNCH_GATES_INVALID/);
});
