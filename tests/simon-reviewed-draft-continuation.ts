import {db,closeDb} from '../core/database/client.js';
const uri=new URL(process.env.DATABASE_URL||'http://invalid');
if(uri.hostname!=='127.0.0.1'||uri.pathname!=='/pegasus_world_accept_1011')throw Error('Isolated DB required');
const sql=db();
async function queueSimon(approvalId:string){
 return sql.begin(async tx=>{
 const [a]=await tx`SELECT a.id,a.status,a.action_type,a.decided_by,a.decision_reason,a.job_id,j.task_id,t.project_id,t.objective_id FROM pegasus_core.approvals a JOIN pegasus_core.jobs j ON j.id=a.job_id JOIN pegasus_core.tasks t ON t.id=j.task_id WHERE a.id=${approvalId} FOR UPDATE OF a`;
 if(!a||a.status!=='approved'||a.action_type!=='founder_review_draft'||!a.decided_by||!a.decision_reason) return {queued:false,reason:'No approved draft review'};
 const key='simon-draft-review:'+a.id;
 const [existing]=await tx`SELECT id FROM pegasus_core.jobs WHERE idempotency_key=${key}`;
 if(existing)return {queued:false,reason:'Already queued',jobId:existing.id};
 const [task]=await tx`INSERT INTO pegasus_core.tasks(project_id,objective_id,assigned_agent_id,parent_task_id,title,instructions,input) VALUES(${a.project_id},${a.objective_id},'simon',${a.task_id},'Inspect reviewed internal draft','Internal inspection only. Do not email, publish, book, or pay.',${tx.json({sourceApprovalId:a.id,sourceJobId:a.job_id,draftOnly:true,externalActionsAllowed:false})}) RETURNING id`;
 const [job]=await tx`INSERT INTO pegasus_core.jobs(task_id,agent_id,skill_key,status,input,idempotency_key) VALUES(${task.id},'simon','search_company_memory','queued',${tx.json({sourceApprovalId:a.id,draftOnly:true})},${key}) RETURNING id`;
 await tx`INSERT INTO pegasus_core.events(agent_id,event_type,entity_type,entity_id,payload) VALUES('simon','approved_draft_queued_for_inspection','job',${job.id},${tx.json({approvalId:a.id,sourceJobId:a.job_id,draftOnly:true})})`;
 await tx`INSERT INTO pegasus_core.audit_log(actor_type,actor_id,action,entity_type,entity_id,after_state) VALUES('system','isolated-acceptance','queue_simon_draft_inspection','job',${job.id},${tx.json({sourceApprovalId:a.id,externalActionsAllowed:false})})`;
 return {queued:true,jobId:job.id,sourceApprovalId:a.id};
 });
}
try{
 const approved=await queueSimon('44790238-78f0-40ec-a2ab-be8f8bc5eb43');
 const duplicate=await queueSimon('44790238-78f0-40ec-a2ab-be8f8bc5eb43');
 const denied=await queueSimon('9dc328dc-4385-41c3-a93e-72550e9e3250');
 const pending=await queueSimon('4586df0d-5e2b-444a-9233-048733d79304');
 if(!approved.queued||duplicate.queued||denied.queued||pending.queued)throw Error('Gate invariant failed');
 const [j]=await sql`SELECT status,agent_id,skill_key,input FROM pegasus_core.jobs WHERE id=${approved.jobId}`;
 if(j.status!=='queued'||j.agent_id!=='simon'||j.input.externalActionsAllowed===true)throw Error('Unsafe job state');
 console.log('SIMON_CONTINUATION_PASS',JSON.stringify({approved,duplicate,denied,pending,job:{status:j.status,agent:j.agent_id,skill:j.skill_key},externalActionsExecuted:false}));
}finally{await closeDb()}
