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

test('client voice uses the zero-cost browser Web Speech registry',()=>{
  const audio=read('src/utils/audio.ts');
  const warRoom=read('src/components/CoreWarRoomV2.tsx');
  const speak=read('api/agent/speak.ts');
  const registry=read('lib/agent-voice-registry.ts');
  assert.match(audio,/window\.speechSynthesis\.speak/);
  assert.match(audio,/getAgentVoiceConfig/);
  assert.match(audio,/selectAgentSpeechVoice/);
  assert.equal(audio.includes('/api/agent/speak'),false);
  assert.equal(warRoom.includes('/api/agent/speak'),false);
  assert.equal(audio.includes('api.elevenlabs.io'),false);
  assert.equal(audio.includes('api.openai.com'),false);
  assert.equal(speak.includes('api.elevenlabs.io'),false);
  assert.equal(speak.includes('api.openai.com'),false);
  assert.equal(fs.existsSync(path.join(ROOT,'api/tts.js')),false);
  assert.equal(fs.existsSync(path.join(ROOT,'api/elevenLabsVoiceMap.js')),false);

  const agents=['Simon','Marie','IRIS','Mark','Cammy','Evan','Tube','Lucy','Snake','Alice','Echo','Booker'];
  for(const id of agents)assert.match(registry,new RegExp(`\\b${id}:\\s*\\{`),`Missing voice registry entry: ${id}`);
});
