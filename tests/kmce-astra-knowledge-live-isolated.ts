import {answerKmceWithAstra} from '../core/runtime/execution/kmceAstraKnowledge.js';
const t=Date.now();
const result=await answerKmceWithAstra({
 question:'What are the AGD PACE provider identifiers written in the KMCE course certificate code?',
 taskId:'kmce_source_pilot_001',agentId:'simon',draftOnly:true,externalActionsAllowed:false
});
console.log('KMCE_ASTRA_KNOWLEDGE_PILOT',JSON.stringify({
 status:result.status,knowledgeVersion:result.knowledgeVersion,
 sourceIds:result.usedSources.map(e=>e.id),sourceRevision:result.usedSources[0]?.sourceRevision||null,
 answer:result.answer.slice(0,700),elapsedMs:Date.now()-t
}));
if(result.status!=='draft'||!result.answer.includes('441585'))process.exitCode=1;
