import {db,closeDb} from '../core/database/client.js';
const u=new URL(process.env.DATABASE_URL||'http://invalid');
if(u.hostname!=='127.0.0.1'||u.pathname!=='/pegasus_world_accept_1011')throw Error('Refuse non-test DB');
const sql=db();
const cases=[{id:'56cc1179-55bf-41f2-b691-3b370b9512c0',decision:'approved'},{id:'9dc328dc-4385-41c3-a93e-72550e9e3250',decision:'rejected'}] as const;
try{
 for(const c of cases){
  const out=await sql.begin(async tx=>{
   const [a]=await tx`SELECT a.id,a.job_id,a.status,a.action_type,j.status job_status FROM pegasus_core.approvals a JOIN pegasus_core.jobs j ON j.id=a.job_id WHERE a.id=${c.id} FOR UPDATE OF a,j`;
   if(!a||a.status!=='pending'||a.action_type!=='founder_review_draft'||a.job_status!=='waiting_approval')throw Error('Not eligible for test decision');
   await tx`UPDATE pegasus_core.approvals SET status=${c.decision}::pegasus_core.approval_status,decided_by='acceptance-test-runner',decision_reason=${'Isolated '+c.decision+' transaction acceptance test'},decided_at=now() WHERE id=${c.id}`;
   await tx`INSERT INTO pegasus_core.audit_log(actor_type,actor_id,action,entity_type,entity_id,before_state,after_state) VALUES('test_runner','acceptance-test-runner',${'review_'+c.decision},'approval',${c.id},${tx.json({status:'pending'})},${tx.json({status:c.decision})})`;
   await tx`INSERT INTO pegasus_core.events(agent_id,event_type,entity_type,entity_id,payload) VALUES('gatekeeper',${'founder_draft_'+c.decision},'job',${a.job_id},${tx.json({approvalId:c.id,draftOnly:true})})`;
   return a.job_id;
  });
  const [a]=await sql`SELECT status,decided_by FROM pegasus_core.approvals WHERE id=${c.id}`;
  const [j]=await sql`SELECT status FROM pegasus_core.jobs WHERE id=${out}`;
  const [audit]=await sql`SELECT count(*)::int n FROM pegasus_core.audit_log WHERE entity_id=${c.id} AND action=${'review_'+c.decision}`;
  if(a.status!==c.decision||j.status!=='waiting_approval'||audit.n!==1)throw Error('Verification failed');
  console.log('VERIFIED_TEST_DECISION',JSON.stringify({approvalId:c.id,decision:c.decision,jobStatus:j.status,auditCount:audit.n,actor:a.decided_by}));
 }
 const [original]=await sql`SELECT status FROM pegasus_core.approvals WHERE id='4586df0d-5e2b-444a-9233-048733d79304'`;
 if(original.status!=='pending')throw Error('Original request changed');
 console.log('ORIGINAL_APPROVAL_UNTOUCHED',original.status);
}finally{await closeDb()}
