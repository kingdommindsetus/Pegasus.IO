import {db,closeDb} from '../core/database/client.js';
import {randomUUID} from 'node:crypto';
const url=new URL(process.env.DATABASE_URL||'http://invalid');
if(url.hostname!=='127.0.0.1'||url.pathname!=='/pegasus_world_accept_1011')throw Error('Isolated DB only');
const sql=db();
try{
 const [p]=await sql`INSERT INTO pegasus_core.projects(name,objective) VALUES('Approval HTTP disposable','API verification only') RETURNING id`;
 const [o]=await sql`INSERT INTO pegasus_core.objectives(project_id,title) VALUES(${p.id},'Review HTTP test') RETURNING id`;
 const [t]=await sql`INSERT INTO pegasus_core.tasks(project_id,objective_id,assigned_agent_id,title,instructions) VALUES(${p.id},${o.id},'gatekeeper','Disposable founder-review smoke test','No external actions') RETURNING id`;
 const [j]=await sql`INSERT INTO pegasus_core.jobs(task_id,agent_id,status,idempotency_key) VALUES(${t.id},'gatekeeper','waiting_approval',${randomUUID()}) RETURNING id`;
 const [a]=await sql`INSERT INTO pegasus_core.approvals(job_id,requested_by_agent_id,action_type,payload,status) VALUES(${j.id},'gatekeeper','founder_review_draft',${sql.json({draftOnly:true})},'pending') RETURNING id`;
 console.log('DISPOSABLE_ID='+a.id);
}finally{await closeDb()}
