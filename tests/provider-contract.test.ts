import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const ROOT=process.cwd();
const read=(p:string)=>fs.readFileSync(path.join(ROOT,p),'utf8');

test('reasoning uses the canonical Google AI Studio reasoner only',()=>{
  const reasoner=read('core/runtime/agents/pegasusReasoner.ts');
  const work=read('core/runtime/execution/realAgentWork.ts');
  assert.match(reasoner,/@google\/genai/);
  assert.match(work,/pegasusReasoner/);
  for(const forbidden of ['@ai-sdk/gateway','inclusionai/ling','OpenAIReasoner','api.openai.com']){
    assert.equal(reasoner.includes(forbidden),false,`Legacy reasoning reference found: ${forbidden}`);
  }
  assert.equal(fs.existsSync(path.join(ROOT,'core/runtime/agents/openaiReasoner.ts')),false);
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
