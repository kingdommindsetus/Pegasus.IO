import {db,closeDb} from '../core/database/client.js';
import {claimNextJobForObjective,postgresJobStore,closeJobRun,unlockDependents} from '../core/work/jobs/repository.js';
import {runJob} from '../core/work/workers/runJob.js';
import {coreSkills} from '../core/runtime/execution/coreSkills.js';
const u=new URL(process.env.DATABASE_URL||'http://invalid');
if(u.hostname!=='127.0.0.1'||u.pathname!=='/pegasus_world_accept_1011')throw Error('Refuse non-test database');
const sql=db();
try{
 const [ident]=await sql`SELECT current_database() db,current_user role`;
 if(ident.db!=='pegasus_world_accept_1011'||ident.role!=='pegasus_world_test_1011')throw Error('Unexpected database identity');
 await sql`INSERT INTO pegasus_core.agents(id,display_name,department,mission) VALUES('gatekeeper','Gatekeeper','Compliance','Review output and await founder decision') ON CONFLICT(id) DO NOTHING`;
 const [p]=await sql`INSERT INTO pegasus_core.projects(name,objective) VALUES('Isolated World Handoff Test','Draft and hold for review') RETURNING id`;
 const [o]=await sql`INSERT INTO pegasus_core.objectives(project_id,title) VALUES(${p.id},'Marie to Mark to Gatekeeper approval') RETURNING id`;
 const specs=[['marie','Prepare marketing brief'],['mark','Draft sample marketing copy'],['gatekeeper','Review and request founder approval']];
 let previous:string|null=null;const tasks:string[]=[];
 for(const [agent,title] of specs){
  const [t]=await sql`INSERT INTO pegasus_core.tasks(project_id,objective_id,assigned_agent_id,title,instructions,input) VALUES(${p.id},${o.id},${agent},${title},'Internal draft-only; do not send or publish',${sql.json({draftOnly:true})}) RETURNING id`;
  if(previous)await sql`INSERT INTO pegasus_core.task_dependencies(task_id,depends_on_task_id) VALUES(${t.id},${previous})`;
  tasks.push(t.id);previous=t.id;
 }
 const [start]=await sql`INSERT INTO pegasus_core.jobs(task_id,agent_id,skill_key,input,idempotency_key) VALUES(${tasks[0]},'marie','create_campaign',${sql.json({draftOnly:true})},${'world-approval-'+tasks[0]}) RETURNING id`;
 const sequence=[];
 for(const agent of ['marie','mark','gatekeeper']){
  const job=await claimNextJobForObjective(o.id,'isolated-world-approval',60);
  if(!job||job.agentId!==agent)throw Error('Unexpected agent handoff '+agent+' got '+job?.agentId);
  await postgresJobStore.recordEvent(job,'job_claimed',{workerId:'isolated-world-approval'});
  const gate=agent==='gatekeeper';
  const finished=await runJob(job,postgresJobStore,async()=>{
   if(gate)return {status:'waiting_approval' as const};
   const x=await coreSkills.execute(agent==='marie'?'create_campaign':'generate_content',{task:'sample internal campaign',target:'internal review'}, {agent:{id:agent},project:{id:p.id},objectiveContext:{id:o.id},relevantMemories:[]} as any);
   return {status:'completed' as const,output:x.output,evidence:x.evidence};
  });
  await closeJobRun(finished,'isolated-world-approval');finished.leaseExpiresAt=undefined;await postgresJobStore.save(finished);
  if(!gate)await unlockDependents(finished);
  sequence.push({agent,jobId:job.id,status:finished.status});
  if(gate){
   const [approval]=await sql`INSERT INTO pegasus_core.approvals(job_id,requested_by_agent_id,action_type,payload,status) VALUES(${job.id},'gatekeeper','founder_review_draft',${sql.json({objectiveId:o.id,draftOnly:true,externalActions:false})},'pending') RETURNING id,status`;
   const [saved]=await sql`SELECT status FROM pegasus_core.jobs WHERE id=${job.id}`;
   if(saved.status!=='waiting_approval'||approval.status!=='pending')throw Error('Gate did not persist');
   const approvals=await sql`SELECT count(*)::int n FROM pegasus_core.approvals WHERE job_id=${job.id} AND status='approved'`;
   if(approvals[0].n!==0)throw Error('Unexpected approval');
   console.log('WORKFLOW_ACCEPTANCE_PASS',JSON.stringify({objectiveId:o.id,sequence,approvalId:approval.id,approvalStatus:'pending',externalActionsExecuted:false}));
  }
 }
}finally{await closeDb()}
