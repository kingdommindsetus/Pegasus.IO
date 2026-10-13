import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {computeJarvisView,jarvisDevelopmentHandler} from '../core/runtime/jarvisDevelopment.js';
import {JarvisStatusBadge} from '../src/components/JarvisStatusBadge.js';
const now=Date.now();
const make=(status:string,age=10)=>JSON.stringify({scope:'windows-isolated-development',overall:status,timestamp:new Date(now-age*1000).toISOString(),signals:{database:{status:'healthy',detail:'test'}},alerts:status==='healthy'?[]:[{signal:'queue',severity:status,detail:'simulated'}]});
test('Jarvis states are visible in UI status badge',()=>{
 for(const status of ['healthy','stale','offline','blocked']){
  const view=computeJarvisView(make(status==='stale'?'healthy':status,status==='stale'?400:10),now);
  assert.equal(view.status,status);
  const html=renderToStaticMarkup(React.createElement(JarvisStatusBadge,{status:view.status}));
  assert.match(html,new RegExp('>'+status.toUpperCase()+'<'));
  assert.match(html,/data-testid="jarvis-status"/);
 }
});
test('Missing, corrupt, future and expired readings fail closed as stale',()=>{
 for(const raw of [undefined,'invalid',make('healthy',400),JSON.stringify({scope:'windows-isolated-development',overall:'healthy',timestamp:new Date(now+60000).toISOString()})]){
  assert.equal(computeJarvisView(raw,now).status,'stale');
 }
});
test('Local bridge requires token and rejects foreign site origins',async()=>{
 const base=process.env.PEGASUS_JARVIS_TEST_URL;
 if(!base)throw Error('Local isolated test server URL required');
 const noauth=await fetch(base);assert.equal(noauth.status,401);
 const token=readFileSync('C:/Users/info/PegasusVoiceEngine/acceptance-isolated/.jarvis-local-ui-token','utf8').trim();
 const authorized=await fetch(base+'?history=1',{headers:{authorization:'Bearer '+token}});
 assert.equal(authorized.status,200);
 assert.equal(authorized.headers.get('cache-control'),'no-store, private');
 const json=await authorized.json() as {scope:string;status:string;history:unknown[]};
 assert.equal(json.scope,'windows-isolated-development');
 assert.ok(['healthy','offline','blocked','degraded','stale'].includes(json.status));
 assert.ok(Array.isArray(json.history));
 const foreign=await fetch(base,{headers:{authorization:'Bearer '+token,origin:'https://example.com'}});
 assert.equal(foreign.status,403);
 const method=await fetch(base,{method:'POST',headers:{authorization:'Bearer '+token}});
 assert.equal(method.status,405);
});

test('Production handler does not expose Jarvis route',()=>{
 const prev=process.env.NODE_ENV;
 try{process.env.NODE_ENV='production';let status=0;let ended=false;const response={status(n:number){status=n;return this;},end(){ended=true;}};jarvisDevelopmentHandler({} as any,response as any);assert.equal(status,404);assert.equal(ended,true);}
 finally{if(prev===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=prev;}
});
