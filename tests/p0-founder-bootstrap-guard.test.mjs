/** Negative security checks, using fake credentials and zero database/network access. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const fake={
 DATABASE_URL:'postgresql://fake:fake@127.0.0.1:5432/pegasus_world_windows_accept_1011',
 PEGASUS_BOOTSTRAP_ENV:'isolated',
 PEGASUS_BOOTSTRAP_EXPECTED_HOST:'127.0.0.1',
 PEGASUS_BOOTSTRAP_EXPECTED_DB:'pegasus_world_windows_accept_1011',
 PEGASUS_BOOTSTRAP_EXPECTED_ROLE:'fake'
};
test('founder bootstrap refuses production, target mismatch and unconfirmed writes',()=>{
 const cases=[
  {label:'production prohibited',env:{PEGASUS_BOOTSTRAP_ENV:'production'},args:[]},
  {label:'staging on local host prohibited',env:{PEGASUS_BOOTSTRAP_ENV:'staging'},args:[]},
  {label:'wrong host denied',env:{PEGASUS_BOOTSTRAP_EXPECTED_HOST:'other.example.org'},args:[]},
  {label:'wrong database denied',env:{PEGASUS_BOOTSTRAP_EXPECTED_DB:'other_db'},args:[]},
  {label:'write must be acknowledged',env:{},args:['--apply']},
  {label:'unsupported argument denied',env:{},args:['--force']}
 ];
 for(const c of cases){
  const result=spawnSync(process.execPath,
   ['node_modules/tsx/dist/cli.mjs','core/database/provisionFounderOrganization.ts',...c.args],
   {cwd:root,env:{...process.env,...fake,...c.env},encoding:'utf8',timeout:10000});
  assert.notEqual(result.status,0,c.label);
  assert.ok(!result.stdout.includes('PEGASUS_COMPANY_BOOTSTRAP'),c.label+' must not reach DB');
 }
 console.log('PEGASUS_BOOTSTRAP_GUARD_PASS',JSON.stringify({denials:cases.length,
  productionDenied:true,wrongDatabaseDenied:true,writeWithoutApprovalDenied:true,dbConnections:0}));
});
