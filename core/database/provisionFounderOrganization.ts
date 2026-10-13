/**
 * Explicit, idempotent company bootstrap for isolated development / dedicated staging only.
 * Refuses production-looking database targets. Does not migrate, reparent or alter existing orgs.
 * Secrets must be supplied by environment, never by CLI arguments or committed files.
 */
import postgres from 'postgres';

const COMPANY_NAME='Kingdom Mindset CE';
const COMPANY_SLUG='kingdom-mindset-ce';
const raw=String(process.env.DATABASE_URL||'').trim();
const mode=process.argv.slice(2);
const apply=mode.length===1 && mode[0]==='--apply';
if(mode.length && !apply)throw Error('Only --apply is accepted; omit it for read-only dry run');

function required(name:string){
 const value=String(process.env[name]||'').trim();
 if(!value)throw Error(name+' is required');
 return value;
}
const stage=required('PEGASUS_BOOTSTRAP_ENV');
if(!['isolated','staging'].includes(stage))throw Error('Production bootstrap is prohibited');
if(!raw)throw Error('DATABASE_URL is required; configure it outside source control');
const url=new URL(raw);
if(!['postgres:','postgresql:'].includes(url.protocol))throw Error('PostgreSQL required');
const expectedHost=required('PEGASUS_BOOTSTRAP_EXPECTED_HOST');
const expectedDb=required('PEGASUS_BOOTSTRAP_EXPECTED_DB');
const expectedRole=required('PEGASUS_BOOTSTRAP_EXPECTED_ROLE');
const actualDb=decodeURIComponent(url.pathname.replace(/^\//,''));
const actualRole=decodeURIComponent(url.username);
const actualPort=url.port||'5432';
if(url.hostname!==expectedHost || actualDb!==expectedDb || actualRole!==expectedRole || actualPort!=='5432'){
 throw Error('Database target does not match the explicitly approved host/database/role');
}
if(stage==='isolated' && (url.hostname!=='127.0.0.1' || !actualDb.includes('accept'))){
 throw Error('Isolated bootstrap can only target loopback acceptance database');
}
if(stage==='staging' && (!/stag(e|ing)/i.test(actualDb)||url.hostname==='127.0.0.1')){
 throw Error('Staging requires a dedicated, clearly named nonlocal staging database');
}
if(apply && process.env.PEGASUS_BOOTSTRAP_CONFIRM!=='CREATE_NONPRODUCTION_COMPANY'){
 throw Error('Applying requires PEGASUS_BOOTSTRAP_CONFIRM=CREATE_NONPRODUCTION_COMPANY');
}
const sql=postgres(raw,{max:1,idle_timeout:5,connect_timeout:10});
try {
 const [identity]=await sql`SELECT current_database() AS db,current_user AS role`;
 if(identity.db!==expectedDb||identity.role!==expectedRole)throw Error('Connected DB identity mismatch');
 const [table]=await sql`SELECT to_regclass('pegasus_core.organizations') AS relation`;
 if(!table.relation)throw Error('Pegasus Core organizations schema is not installed on this database');
 const [existing]=await sql`SELECT id,name,slug FROM pegasus_core.organizations WHERE slug=${COMPANY_SLUG}`;
 if(existing && existing.name!==COMPANY_NAME)throw Error('The company slug already belongs to a different name');
 let record=existing;
 let action='exists';
 if(!record && apply){
  const [created]=await sql`
   INSERT INTO pegasus_core.organizations(name,slug,metadata)
   VALUES(${COMPANY_NAME},${COMPANY_SLUG},
    ${sql.json({workspace:'kmce',environment:stage,provisioning:'manual_nonproduction',membership:'not_yet_configured'})})
   ON CONFLICT(slug) DO NOTHING
   RETURNING id,name,slug
  `;
  const [resolved]=created?[created]:await sql`SELECT id,name,slug FROM pegasus_core.organizations WHERE slug=${COMPANY_SLUG}`;
  if(!resolved||resolved.name!==COMPANY_NAME)throw Error('Unable to resolve unique company identity');
  record=resolved;
  action=created?'created':'exists';
 }else if(!record){action='would_create';}
 console.log('PEGASUS_COMPANY_BOOTSTRAP',JSON.stringify({
  environment:stage,database:identity.db,company:COMPANY_NAME,slug:COMPANY_SLUG,
  action,organizationId:record?String(record.id):null,
  next:'Configure PEGASUS_FOUNDER_ORGANIZATION_ID only in the matching environment after ownership review',
  productionChanges:false
 }));
}finally{await sql.end({timeout:5});}
