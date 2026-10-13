import {draftWithAstra} from '../core/runtime/execution/astraDraftBridge.js';
const t=Date.now();
try {
 const result=await draftWithAstra({
  agentId:'simon',taskId:'astra_local_pilot_001',
  question:'What information is established about the synthetic course?',
  evidence:[{id:'synthetic_course_01',text:'Synthetic fixture only: Example airway education course with 12 CE hours. It is not a real KMCE listing and has no scheduled date.'}],
  draftOnly:true,externalActionsAllowed:false
 });
 console.log('ASTRA_LIVE_DRAFT_RESULT',JSON.stringify({status:result.status,taskId:result.taskId,model:result.model,
  evidenceIds:result.evidenceIds,answer:result.answer.slice(0,900),elapsedMs:Date.now()-t}));
}catch(error){console.error('ASTRA_LIVE_DRAFT_ERROR',error instanceof Error?error.message:String(error));process.exitCode=1;}
