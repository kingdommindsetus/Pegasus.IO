/**
 * Fail-closed read-only preflight for the existing KINGDOM acceptance database.
 * Never print DATABASE_URL or model/provider environment values.
 */
import assert from 'node:assert/strict';
import {db,closeDb} from '../core/database/client.js';
const EXPECTED={host:'127.0.0.1',port:'5432',database:'pegasus_world_windows_accept_1011',role:'pegasus_windows_accept_role'} as const;
const url=new URL(process.env.DATABASE_URL||'http://invalid');
assert.ok(url.protocol==='postgres:'||url.protocol==='postgresql:','Isolated PostgreSQL required');
assert.equal(url.hostname,EXPECTED.host,'No remote database allowed');
assert.ok(url.port===''||url.port===EXPECTED.port,'Wrong port');
assert.equal(url.pathname,'/'+EXPECTED.database,'Wrong database');
assert.equal(decodeURIComponent(url.username),EXPECTED.role,'Wrong database role');
const sql=db();
try{
 const [identity]=await sql`SELECT current_database() AS database,current_user AS role,inet_server_addr()::text AS server_address,inet_server_port() AS server_port`;
 assert.equal(identity.database,EXPECTED.database);
 assert.equal(identity.role,EXPECTED.role);
 assert.ok(['127.0.0.1','127.0.0.1/32','::1','::1/128','::ffff:127.0.0.1'].includes(identity.server_address),'Isolated server must bind loopback');
 assert.equal(Number(identity.server_port),5432);
 const [schema]=await sql`SELECT
 (SELECT count(*)::int FROM pg_catalog.pg_tables WHERE schemaname='pegasus_core' AND tablename IN ('jobs','job_runs','tasks','events','evidence','memories')) AS present,
 (SELECT count(*)::int FROM pegasus_core.objectives WHERE id='cbe5f353-25de-4daa-a69e-09b326299fea') AS objective_count`;
 assert.equal(schema.present,6);
 assert.equal(schema.objective_count,1);
 console.log('P0_ISOLATED_POSTGRES_PREFLIGHT_PASS',JSON.stringify({database:identity.database,role:identity.role,loopback:true,tableCount:schema.present,objectiveExists:true,readOnly:true}));
}finally{await closeDb();}
