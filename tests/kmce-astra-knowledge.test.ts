import assert from 'node:assert/strict';
import {test} from 'node:test';
import {selectKmceKnowledge,answerKmceWithAstra,KMCE_KNOWLEDGE_VERSION,KMCE_KNOWLEDGE} from '../core/runtime/execution/kmceAstraKnowledge.js';
import type {AstraDraftResponse} from '../core/runtime/execution/astraDraftBridge.js';
test('approved source pack is versioned and has no private data',()=>{
 assert.equal(KMCE_KNOWLEDGE_VERSION,'kmce-source-31438cc1-pilot-v1');
 assert.equal(KMCE_KNOWLEDGE.length,5);
 for(const row of KMCE_KNOWLEDGE){assert.equal(row.sourceRevision,'31438cc1');assert.equal(row.verification,'source_code_only');}
});
test('relevant topic selects precise documented sources',()=>{
 const ids=selectKmceKnowledge('What are the AGD PACE provider IDs?').map(r=>r.id);
 assert.deepEqual(ids,['provider_identifiers','provider_roster']);
 assert.deepEqual(selectKmceKnowledge('What is the 2027 seminar date?'),[]);
 assert.deepEqual(selectKmceKnowledge('How many seats sold?'),[]);
});
test('unknown topic never calls model or invents answer',async()=>{
 let called=false;
 const result=await answerKmceWithAstra({question:'What is the 2027 seminar date?',taskId:'source_probe_01',agentId:'simon',draftOnly:true,externalActionsAllowed:false},async()=>{called=true;throw new Error('should not call');});
 assert.equal(result.status,'not_established');assert.equal(called,false);assert.equal(result.usedSources.length,0);
});
test('model receives selected traceable entries without live tools',async()=>{
 const result=await answerKmceWithAstra({question:'What is the AGD provider ID?',taskId:'source_probe_02',agentId:'simon',draftOnly:true,externalActionsAllowed:false},async(request)=>{
  assert.equal(request.agentId,'simon');assert.equal(request.draftOnly,true);assert.equal(request.externalActionsAllowed,false);
  assert.deepEqual(request.evidence.map(e=>e.id),['provider_identifiers','provider_roster']);
  return {status:'draft',source:'astra_local_ollama',model:'astra-main',taskId:request.taskId,answer:'The source embeds provider ID 441585.',evidenceIds:request.evidence.map(e=>e.id)} as AstraDraftResponse;
 });
 assert.equal(result.status,'draft');assert.equal(result.usedSources.length,2);
});
