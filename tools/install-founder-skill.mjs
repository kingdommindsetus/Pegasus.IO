/**
 * Founder Skill vendor installer for Pegasus (manual, offline after clone).
 * Requires Git; never runs third-party instructions or Python during installation.
 * Run from a trusted local checkout: node tools/install-founder-skill.mjs
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dest=path.join(root,'third_party','founder-skill');
const skills=['board','marketing','cfo','consumer','launch','pricing','offer',
  'competitors','brand','ops','plan'].map(name=>'founder-'+name);
const upstream='https://github.com/Jakeschincariol/founder-skill.git';
const pin=process.env.FOUNDER_SKILL_COMMIT?.trim();
if(pin&&!/^[a-f0-9]{40}$/i.test(pin))throw Error('FOUNDER_SKILL_COMMIT must be a full 40-character commit hash');
if(fs.existsSync(dest))throw Error('Destination already exists: review it before replacing');
const work=fs.mkdtempSync(path.join(os.tmpdir(),'pegasus-founder-skill-'));
const repo=path.join(work,'repo');
function git(args){
 const r=spawnSync('git',args,{encoding:'utf8',windowsHide:true,timeout:120000,
  env:{...process.env,GIT_TERMINAL_PROMPT:'0'}});
 if(r.status!==0)throw Error('Git failed: '+(r.stderr||'').slice(0,300));
 return r.stdout.trim();
}
function safeCopy(from,to){
 const stat=fs.lstatSync(from);
 if(stat.isSymbolicLink())throw Error('Symlinks are forbidden in vendored skills');
 if(stat.isDirectory()){
  fs.mkdirSync(to,{recursive:true});
  for(const name of fs.readdirSync(from)){
   if(name==='__pycache__'||name==='.git'||name==='node_modules')continue;
   safeCopy(path.join(from,name),path.join(to,name));
  }
  return;
 }
 if(!stat.isFile()||stat.size>1_000_000)throw Error('Unexpected vendor file: '+from);
 const extension=path.extname(from);
 if(!['.md','.py','.json','.txt','.csv','.yaml','.yml','.toml'].includes(extension))
  throw Error('Unexpected vendor extension: '+extension);
 fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);
}
try{
 git(['clone','--no-checkout','--depth','1','--filter=blob:none',upstream,repo]);
 if(pin){
  try{git(['-C',repo,'fetch','--depth','1','origin',pin]);}
  catch{throw Error('Could not fetch pinned commit; no files installed');}
  git(['-C',repo,'checkout','--detach',pin]);
 }else git(['-C',repo,'checkout','--detach','HEAD']);
 const sha=git(['-C',repo,'rev-parse','HEAD']);
 const license=fs.readFileSync(path.join(repo,'LICENSE'),'utf8');
 if(!/MIT License/i.test(license))throw Error('Upstream license must be reviewed; expected MIT');
 for(const name of skills){
  const dir=path.join(repo,'skills',name);
  if(!fs.existsSync(path.join(dir,'SKILL.md')))throw Error('Missing upstream skill: '+name);
 }
 const stage=path.join(work,'stage');
 fs.mkdirSync(stage);
 for(const name of skills)safeCopy(path.join(repo,'skills',name),path.join(stage,name));
 fs.copyFileSync(path.join(repo,'LICENSE'),path.join(stage,'LICENSE'));
 const fileHashes={};
 for(const name of skills){
  const walk=(dir,relative)=>{
   for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const key=path.posix.join(relative,entry.name);
    if(entry.isDirectory())walk(path.join(dir,entry.name),key);
    else fileHashes[key]=crypto.createHash('sha256').update(
      fs.readFileSync(path.join(dir,entry.name))).digest('hex');
   }
  };
  walk(path.join(stage,name),name);
 }
 fs.writeFileSync(path.join(stage,'PEGASUS_VENDOR_MANIFEST.json'),JSON.stringify({
  upstream,commit:sha,license:'MIT',installedAt:new Date().toISOString(),
  skillCount:skills.length,skills,sha256:fileHashes,
  executionPolicy:'prompt-and-data-only; no third-party scripts auto-executed'
 },null,2)+'\n');
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.renameSync(stage,dest);
 console.log(JSON.stringify({status:'vendored_for_review',destination:dest,commit:sha,
  skillCount:skills.length,commandsExecuted:'git checkout only',modelCalls:0,cloudModelCost:0}));
 console.log('NOT ACTIVATED: review the pinned files and license before mapping skills into agent permissions.');
}finally{fs.rmSync(work,{recursive:true,force:true});}
