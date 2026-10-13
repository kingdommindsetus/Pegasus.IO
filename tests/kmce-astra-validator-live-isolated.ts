import {answerKmceWithValidation} from '../core/runtime/execution/kmceAstraValidator.js';
const t=Date.now();
const result=await answerKmceWithValidation({question:'What are both AGD PACE provider identifiers?',taskId:'kmce_validator_001',agentId:'simon',draftOnly:true,externalActionsAllowed:false});
console.log('VALIDATION_RESULT',JSON.stringify({status:result.status,reasons:result.reasons,requiredFacts:result.requiredFacts,modelAnswer:result.modelAnswer,answer:result.answer,elapsedMs:Date.now()-t}));
