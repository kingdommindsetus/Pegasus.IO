import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const ROOT=process.cwd();
const read=(p:string)=>fs.readFileSync(path.join(ROOT,p),'utf8');

test('staging uses a fail-closed NVIDIA reasoner with governed skill selection',()=>{
  const reasoner=read('core/runtime/agents/pegasusReasoner.ts');
  const route=read('core/runtime/agents/nvidiaStageRoute.ts');
  const work=read('core/runtime/execution/realAgentWork.ts');
  const mission=read('api/core/mission.ts');
  assert.match(reasoner,/generateNvidiaStageText/);
  assert.match(reasoner,/unauthorized agent skill/);
  assert.match(route,/NVIDIA_API_KEY/);
  assert.ok(route.includes('https://integrate.api.nvidia.com/v1/chat/completions'));
  assert.match(route,/fallback:false/);
  assert.match(work,/pegasusReasoner/);
  assert.match(mission,/generatePegasusText/);
  assert.equal(reasoner.includes('governed-fallback'),false);
  assert.equal(mission.includes('GoogleGenAI'),false);
});

test('voice uses the canonical Pegasus ElevenLabs registry with browser fallback',()=>{
  const speak=read('api/agent/speak.ts');
  const registry=read('api/pegasusVoiceRegistry.js');
  assert.match(speak,/getPegasusAgentVoice/);
  assert.match(speak,/api\.elevenlabs\.io/);
  assert.match(speak,/WEB_SPEECH_FALLBACK/);
  assert.equal(speak.includes('api.openai.com'),false);
  assert.equal(fs.existsSync(path.join(ROOT,'api/tts.js')),false);
  assert.equal(fs.existsSync(path.join(ROOT,'api/elevenLabsVoiceMap.js')),false);

  const agents=['simon','marie','iris','mark','cammy','evan','tube','lucy','snake','alice','echo','booker'];
  for(const id of agents)assert.match(registry,new RegExp(`\\b${id}:\\s*\\{`),`Missing voice registry entry: ${id}`);
});