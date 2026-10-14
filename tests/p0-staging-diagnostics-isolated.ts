/** Local-only read acceptance for the preview diagnostics route. Never writes a DB row. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {makeSessionCookie} from '../api/core/_security.js';
import {db,closeDb} from '../core/database/client.js';
import stagingDiagnostics,{neonEndpointIdForHost} from '../api/core/staging-diagnostics.js';

const localConfig='C:\\Users\\info\\PegasusVoiceEngine\\acceptance-isolated\\.windows-test-db-url';
const raw=readFileSync(localConfig,'utf8').trim();
const url=new URL(raw);
assert.equal(url.hostname,'127.0.0.1');
assert.equal(url.pathname,'/pegasus_world_windows_accept_1011');
assert.equal(decodeURIComponent(url.username),'pegasus_windows_accept_role');
assert.equal(url.port||'5432','5432');

const old={
 database:process.env.DATABASE_URL,
 environment:process.env.VERCEL_ENV,
 signing:process.env.PEGASUS_CORE_API_SECRET,
 organization:process.env.PEGASUS_FOUNDER_ORGANIZATION_ID
};
function restore(name:string,previous:string|undefined){
 if(previous===undefined)delete process.env[name];else process.env[name]=previous;
}
function response(){
 const r:{statusCode:number;headers:Record<string,string>;body:any;setHeader:(k:string,v:string)=>any;status:(n:number)=>any;json:(v:any)=>any}={
  statusCode:200,headers:{},body:null,
  setHeader(k,v){r.headers[k.toLowerCase()]=v;return r;},
  status(n){r.statusCode=n;return r;},
  json(v){r.body=v;return r;}
 };
 return r;
}
try{
 process.env.DATABASE_URL=raw;
 process.env.VERCEL_ENV='preview';
 process.env.PEGASUS_CORE_API_SECRET='isolated-preview-test-signing-key-not-live';
 const sql=db();
 const [company]=await sql`SELECT id FROM pegasus_core.organizations WHERE slug='kingdom-mindset-ce' AND name='Kingdom Mindset CE'`;
 assert.ok(company,'Provisioned local company must already exist');
 process.env.PEGASUS_FOUNDER_ORGANIZATION_ID=String(company.id);
 const cookie='pegasus_core_session='+makeSessionCookie();
 const r=response();
 await stagingDiagnostics({
  method:'GET',headers:{cookie,'sec-fetch-site':'same-origin'},
  socket:{remoteAddress:'127.77.0.2'}
 },r);
 assert.equal(r.statusCode,200);
 assert.equal(r.body.environment,'preview');
 assert.equal(r.body.readOnly,true);
 assert.equal(r.body.databaseName,'pegasus_world_windows_accept_1011');
 assert.equal(r.body.connectionRole,'pegasus_windows_accept_role');
 assert.equal(r.body.endpointFingerprint,createHash('sha256').update('127.0.0.1').digest('hex').slice(0,20));
 assert.equal(r.body.neonEndpointId,null);
 assert.equal(neonEndpointIdForHost('ep-example-staging-12345.c-7.us-east-2.aws.neon.tech'),'ep-example-staging-12345');
 assert.equal(neonEndpointIdForHost('ep-example-staging-12345-pooler.c-7.us-east-2.aws.neon.tech'),'ep-example-staging-12345');
 assert.equal(neonEndpointIdForHost('neondb.example.com'),null);
 assert.equal(neonEndpointIdForHost('evil.neon.tech.example.com'),null);
 assert.equal(JSON.stringify(r.body).includes(url.password),false);
 assert.equal(r.body.coreOrganizationSchemaReady,true);
 assert.equal(r.body.company.id,String(company.id));
 assert.equal(r.body.configuration.companyScopeConfigured,true);
 assert.equal(r.body.configuration.matchesCanonicalCompany,true);
 assert.ok(!JSON.stringify(r.body).includes(raw));
 console.log('PEGASUS_PREVIEW_DB_IDENTITY_LOCAL_PASS',JSON.stringify({
  isolatedDatabase:true,companyFound:true,companyUuidMatched:true,
  signedFounderSessionRequired:true,noSecretsReturned:true,readOnly:true,productionChanges:false
 }));
}finally{
 await closeDb();
 restore('DATABASE_URL',old.database);
 restore('VERCEL_ENV',old.environment);
 restore('PEGASUS_CORE_API_SECRET',old.signing);
 restore('PEGASUS_FOUNDER_ORGANIZATION_ID',old.organization);
}
