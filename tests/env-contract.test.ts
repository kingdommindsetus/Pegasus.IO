import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const ROOT=process.cwd();
const SOURCE_ROOTS=['api','core','src'];
const ROOT_FILES=['server.ts','vite.config.ts'];
const SOURCE_EXTENSIONS=new Set(['.ts','.tsx','.js','.jsx']);

function walk(dir:string):string[]{
  if(!fs.existsSync(dir))return [];
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    const full=path.join(dir,entry.name);
    if(entry.isDirectory())return walk(full);
    return SOURCE_EXTENSIONS.has(path.extname(entry.name))?[full]:[];
  });
}

function templateKeys(){
  const text=fs.readFileSync(path.join(ROOT,'.env.example'),'utf8');
  const keys=new Set<string>();
  for(const raw of text.split(/\r?\n/)){
    const line=raw.trim();
    if(!line||line.startsWith('#'))continue;
    const m=line.match(/^([A-Z0-9_]+)=(.*)$/);
    assert.ok(m,`Invalid .env.example line: ${line}`);
    assert.equal(m[2],'',`.env.example must contain empty placeholders only: ${m[1]}`);
    keys.add(m[1]);
  }
  return keys;
}

test('.env.example covers every process.env variable and contains no values',()=>{
  const files=[
    ...SOURCE_ROOTS.flatMap(root=>walk(path.join(ROOT,root))),
    ...ROOT_FILES.map(file=>path.join(ROOT,file)).filter(fs.existsSync)
  ];
  const used=new Set<string>();
  const re=/process\.env\.([A-Z0-9_]+)/g;
  for(const file of files){
    const text=fs.readFileSync(file,'utf8');
    for(const match of text.matchAll(re))used.add(match[1]);
  }

  const documented=templateKeys();
  const missing=[...used].filter(key=>!documented.has(key)).sort();
  assert.deepEqual(missing,[],`Missing .env.example entries: ${missing.join(', ')}`);
});
