import {test} from 'node:test';
import assert from 'node:assert/strict';
import {answerKmceWithValidation,validateKmceAnswer} from '../core/runtime/execution/kmceAstraValidator.js';
import {KMCE_KNOWLEDGE_VERSION,selectKmceKnowledge,type KnowledgeDraftResult} from '../core/runtime/execution/kmceAstraKnowledge.js';
import type {AstraDraftResponse} from '../core/runtime/execution/astraDraftBridge.js';
const question='What are both AGD PACE provider identifiers?';
function fixture(answer:string,mutate:(x:KnowledgeDraftResult)=>void=()=>{}):KnowledgeDraftResult{
 const usedSources=selectKmceKnowledge(question);
 const astra:AstraDraftResponse={status:'draft',taskId:'verify_001',source:'astra_local_ollama',model:'astra-main',answer,evidenceIds:usedSources.map(s=>s.id)};
 const result:KnowledgeDraftResult={status:'draft',knowledgeVersion:KMCE_KNOWLEDGE_VERSION,answer,usedSources,astra};
 mutate(result);
 return result;
}
test('both provider identifiers pass with explicit source provenance',()=>{
 const r=validateKmceAnswer(question,fixture('The certificate code embeds national ID 441585 and local ID 217702.'));
 assert.equal(r.status,'accepted_draft');assert.deepEqual(r.requiredFacts,['441585','217702']);assert.equal(r.citedSources.length,2);
});
test('omitted local provider identifier is withheld instead of declared successful',()=>{
 const r=validateKmceAnswer(question,fixture('Provider ID is 441585.'));
 assert.equal(r.status,'needs_review');assert.ok(r.reasons.includes('missing_required_fact:217702'));
 assert.match(r.answer,/withheld/);
});
test('unsupported numeric values and unverified accreditation are withheld',()=>{
 assert.ok(validateKmceAnswer(question,fixture('IDs 441585 and 217702; 990011 registrations')).reasons.some(x=>x.startsWith('unreferenced_numeric_claim')));
 assert.ok(validateKmceAnswer(question,fixture('IDs 441585 and 217702; officially accredited')).reasons.includes('unverified_external_claim'));
});
test('forged citations, stale versions or missing source IDs are withheld',()=>{
 assert.ok(validateKmceAnswer(question,fixture('IDs 441585 and 217702',r=>{r.knowledgeVersion='fake'})).reasons.includes('source_version_mismatch'));
 assert.ok(validateKmceAnswer(question,fixture('IDs 441585 and 217702',r=>{r.astra!.evidenceIds=[]})).reasons.includes('model_evidence_ids_mismatch'));
 assert.ok(validateKmceAnswer(question,fixture('IDs 441585 and 217702',r=>{r.usedSources[0]={...r.usedSources[0],source:'fake-file'}})).reasons.includes('source_provenance_mismatch'));
});
test('unanswerable dates do not call the model',async()=>{
 let calls=0;
 const r=await answerKmceWithValidation({question:'What is the event date in 2027?',taskId:'verify_002',agentId:'simon',draftOnly:true,externalActionsAllowed:false},async()=>{calls++;throw Error('unexpected');});
 assert.equal(calls,0);assert.equal(r.status,'not_established');
});
test('validator safely withholds incomplete mock-model response',async()=>{
 const r=await answerKmceWithValidation({question,taskId:'verify_003',agentId:'simon',draftOnly:true,externalActionsAllowed:false},async req=>({
  status:'draft',taskId:req.taskId,source:'astra_local_ollama',model:'astra-main',answer:'441585',evidenceIds:req.evidence.map(e=>e.id)
 }));
 assert.equal(r.status,'needs_review');assert.ok(r.requiredFacts.includes('217702'));
});
