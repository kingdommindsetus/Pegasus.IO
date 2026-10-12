import {db,closeDb} from '../core/database/client.js';
import {randomUUID} from 'node:crypto';
const url=new URL(process.env.DATABASE_URL||'http://invalid');
if(url.hostname!=='127.0.0.1'||url.pathname!=='/pegasus_world_accept_1011')throw Error('Unsafe database');
const sql=db();
try{
 const [identity]=await sql`SELECT current_database() AS db,current_user AS username`;
 if(identity.db!=='pegasus_world_accept_1011'||identity.username!=='pegasus_world_test_1011')throw Error('DB identity mismatch');
 const [project]=await sql`INSERT INTO pegasus_core.projects(name,objective) VALUES('Approval acceptance only','Review no-op test') RETURNING id`;
 const [objective]=await sql`INSERT INTO pegasus_core.objectives(project_id,title) VALUES(${project.id},'Approve/reject no-op records') RETURNING id`;
 for(const [agent,choice] of [['gatekeeper','approved'],['gatekeeper','rejected']] as const){
  const [task]=await sql`INSERT INTO pegasus_core.tasks(project_id,objective_id,assigned_agent_id,title,instructions) VALUES(${project.id},${objective.id},${agent},${'Acceptance '+choice},'No external execution') RETURNING id`;
  const [job]=await sql`INSERT INTO pegasus_core.jobs(task_id,agent_id,status,idempotency_key) VALUES(${task.id},${agent},'waiting_approval',${randomUUID()}) RETURNING id`;
  const [approval]=await sql`INSERT INTO pegasus_core.approvals(job_id,requested_by_agent_id,action_type,payload,status) VALUES(${job.id},'gatekeeper','founder_review_draft',${sql.json({draftOnly:true,externalActions:false})},'pending') RETURNING id`;
  console.log('TEST_RECORD',JSON.stringify({approvalId:approval.id,jobId:job.id,decision:choice}));
 }
}finally{await closeDb()}
