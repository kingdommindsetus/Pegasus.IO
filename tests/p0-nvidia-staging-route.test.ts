import assert from 'node:assert/strict';
import test from 'node:test';
import {generateNvidiaStageText} from '../core/runtime/agents/nvidiaStageRoute.js';

const restore=(oldKey:string|undefined,oldFetch:typeof fetch)=>{
  if(oldKey===undefined)delete process.env.NVIDIA_API_KEY;
  else process.env.NVIDIA_API_KEY=oldKey;
  globalThis.fetch=oldFetch;
};
test('NVIDIA staging without credential rejects instead of faking live reasoning',async()=>{
 const old=process.env.NVIDIA_API_KEY;
 try{
  delete process.env.NVIDIA_API_KEY;
  await assert.rejects(generateNvidiaStageText({system:'test',prompt:'test'}),/not configured/);
 }finally{if(old===undefined)delete process.env.NVIDIA_API_KEY;else process.env.NVIDIA_API_KEY=old;}
});
test('NVIDIA staging reads a real provider-shaped response and records provenance',async()=>{
 const old=process.env.NVIDIA_API_KEY, oldFetch=globalThis.fetch;
 try{
  process.env.NVIDIA_API_KEY='nonsecret-synthetic-test-key';
  globalThis.fetch=(async(url:any,options:any)=>{
   assert.equal(url,'https://integrate.api.nvidia.com/v1/chat/completions');
   assert.equal(options.headers.Authorization,'Bearer nonsecret-synthetic-test-key');
   assert.equal(JSON.parse(options.body).stream,false);
   return {ok:true,json:async()=>({choices:[{message:{content:'{"skillKey":"handoff_task"}'}}]})} as any;
  }) as unknown as unknown as typeof fetch;
  const result=await generateNvidiaStageText({system:'test',prompt:'test'});
  assert.equal(result.runtime.reasoningProvider,'NVIDIA NIM');
  assert.equal(result.runtime.fallback,false);
  assert.match(result.text,/handoff_task/);
 }finally{restore(old,oldFetch);}
});
test('NVIDIA errors and empty outputs fail closed',async()=>{
 const old=process.env.NVIDIA_API_KEY, oldFetch=globalThis.fetch;
 try{
  process.env.NVIDIA_API_KEY='synthetic';
  globalThis.fetch=(async()=>({ok:false,status:429})) as unknown as typeof fetch;
  await assert.rejects(generateNvidiaStageText({system:'x',prompt:'y'}),/HTTP 429/);
  globalThis.fetch=(async()=>({ok:true,json:async()=>({choices:[{message:{content:''}}]})})) as unknown as typeof fetch;
  await assert.rejects(generateNvidiaStageText({system:'x',prompt:'y'}),/empty answer/);
 }finally{restore(old,oldFetch);}
});