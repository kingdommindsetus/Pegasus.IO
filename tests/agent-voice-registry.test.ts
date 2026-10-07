import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AGENT_VOICE_REGISTRY,
  getAgentVoiceConfig,
  selectAgentSpeechVoice
} from '../lib/agent-voice-registry.ts';

function voice(name:string,lang:string):SpeechSynthesisVoice{
  return {name,lang,voiceURI:name,localService:true,default:false} as SpeechSynthesisVoice;
}

test('all 12 agents have deterministic browser voice settings',()=>{
  assert.deepEqual(Object.keys(AGENT_VOICE_REGISTRY),[
    'Simon','Marie','IRIS','Mark','Cammy','Evan','Tube','Lucy','Snake','Alice','Echo','Booker'
  ]);
  for(const [agent,config] of Object.entries(AGENT_VOICE_REGISTRY)){
    assert.ok(config.preferredVoices.length>0,`${agent} needs preferred voices`);
    assert.match(config.lang,/^en-(US|GB)$/);
    assert.ok(config.pitch>=0.1&&config.pitch<=2.0,`${agent} pitch out of range`);
    assert.ok(config.rate>=0.1&&config.rate<=10.0,`${agent} rate out of range`);
  }
});

test('agent IDs and display names resolve to the same registry entries',()=>{
  assert.equal(getAgentVoiceConfig('simon'),AGENT_VOICE_REGISTRY.Simon);
  assert.equal(getAgentVoiceConfig('IRIS'),AGENT_VOICE_REGISTRY.IRIS);
  assert.equal(getAgentVoiceConfig('booker'),AGENT_VOICE_REGISTRY.Booker);
  assert.equal(getAgentVoiceConfig('unknown'),AGENT_VOICE_REGISTRY.Simon);
});

test('voice selection honors priority by exact name, partial name, then language',()=>{
  const voices=[
    voice('Microsoft Zira Desktop','en-US'),
    voice('Daniel','en-GB'),
    voice('Google US English Female','en-US')
  ];

  assert.equal(selectAgentSpeechVoice(voices,AGENT_VOICE_REGISTRY.Simon)?.name,'Daniel');
  assert.equal(selectAgentSpeechVoice(voices,AGENT_VOICE_REGISTRY.Marie)?.name,'Google US English Female');

  const fallback=selectAgentSpeechVoice([voice('Generic British Voice','en-GB')],AGENT_VOICE_REGISTRY.Lucy);
  assert.equal(fallback?.name,'Generic British Voice');
});
