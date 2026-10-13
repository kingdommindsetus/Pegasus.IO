/** Explicit local-only acceptance: dry run, bootstrap and idempotency. No deployed DB. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const raw=readFileSync('C:\\Users\\info\\PegasusVoiceEngine\\acceptance-isolated\\.windows-test-db-url','utf8').trim();
const url=new URL(raw);
assert.equal(url.hostname,'127.0.0.1');
assert.equal(url.pathname,'/pegasus_world_windows_accept_1011');
assert.equal(decodeURIComponent(url.username),'pegasus_windows_accept_role');
assert.equal(url.port||'5432','5432');
const env={...process.env,
 DATABASE_URL:raw,
 PEGASUS_BOOTSTRAP_ENV:'isolated',
 PEGASUS_BOOTSTRAP_EXPECTED_HOST:'127.0.0.1',
 PEGASUS_BOOTSTRAP_EXPECTED_DB:'pegasus_world_windows_accept_1011',
 PEGASUS_BOOTSTRAP_EXPECTED_ROLE:'pegasus_windows_accept_role',
 PEGASUS_BOOTSTRAP_CONFIRM:'CREATE_NONPRODUCTION_COMPANY'
};
function run(apply=false){
 const result=spawnSync(process.execPath,
  ['node_modules/tsx/dist/cli.mjs','core/database/provisionFounderOrganization.ts',...(apply?['--apply']:[])],
  {cwd:root,env,encoding:'utf8',timeout:30000});
 assert.equal(result.status,0,'Bootstrap process must pass without exposing credentials');
 const line=result.stdout.split(/\r?\n/).find(s=>s.startsWith('PEGASUS_COMPANY_BOOTSTRAP '));
 assert.ok(line,'Bootstrap result missing');
 return JSON.parse(line.slice('PEGASUS_COMPANY_BOOTSTRAP '.length));
}
const first=run();
assert.ok(['would_create','exists'].includes(first.action));
const applied=run(true);
const again=run(true);
assert.match(applied.organizationId,/^[0-9a-f-]{36}$/i);
assert.equal(applied.organizationId,again.organizationId);
assert.equal(again.action,'exists');
assert.equal(again.company,'Kingdom Mindset CE');
assert.equal(again.environment,'isolated');
console.log('PEGASUS_ISOLATED_FOUNDER_COMPANY_PASS',JSON.stringify({
 organizationId:again.organizationId,company:again.company,slug:again.slug,
 dryRun:first.action,apply:applied.action,idempotent:true,productionChanges:false
}));
