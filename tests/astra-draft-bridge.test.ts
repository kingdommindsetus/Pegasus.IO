import {test} from 'node:test';
import assert from 'node:assert/strict';
import {draftWithAstra,validateAstraDraft,type AstraDraftRequest} from '../core/runtime/execution/astraDraftBridge.js';
const good:AstraDraftRequest={
 agentId:'simon',taskId:'astra_pilot_001',question:'What does this KMCE test evidence establish?',
 evidence:[{id:'source_1',text:'Synthetic KMCE class evidence says 12 hours. This is a fixture, not a real course record.'}],
 draftOnly:true,externalActionsAllowed:false
};
test('valid evidence-scoped local draft succeeds with no tools',async()=>{
 let requests=0;
 const fake:typeof fetch=async(url,init)=>{
  requests++;
  assert.equal(url,'http://127.0.0.1:11434/api/generate');
  const body=JSON.parse(String(init?.body));
  assert.equal(body.model,'astra-main');assert.equal(body.stream,false);
  assert.equal(body.options.temperature,0);
  assert.equal(body.tools,undefined);
  assert.match(body.prompt,/source_1/);
  assert.match(body.prompt,/untrusted data/);
  return new Response(JSON.stringify({response:'Fixture establishes only a synthetic 12-hour class claim.'}),{status:200});
 };
 const result=await draftWithAstra(good,fake);
 assert.equal(requests,1);assert.equal(result.status,'draft');assert.deepEqual(result.evidenceIds,['source_1']);
 assert.equal(result.source,'astra_local_ollama');
});
test('all permission or side-effect bypasses are rejected before any fetch',async()=>{
 const candidates=[
  {...good,agentId:'echo'}, {...good,draftOnly:false},
  {...good,externalActionsAllowed:true}, {...good,question:'Send an email now'},
  {...good,question:'publish the website'},{...good,question:'execute a shell command'},
  {...good,evidence:[]}, {...good,evidence:[{id:'source_1',text:''}]},
  {...good,evidence:[{id:'source_1',text:'a'},{id:'source_1',text:'b'}]},
  {...good,taskId:'../secrets'}, {...good,question:'x'.repeat(1501)}
 ];
 for(const c of candidates)assert.throws(()=>validateAstraDraft(c as AstraDraftRequest),/DENIED/);
});
test('failed local model response never returns a completed draft',async()=>{
 await assert.rejects(()=>draftWithAstra(good,async()=>new Response('unavailable',{status:503})),/UNAVAILABLE/);
 await assert.rejects(()=>draftWithAstra(good,async()=>new Response(JSON.stringify({response:''}),{status:200})),/EMPTY/);
});
