import test from 'node:test';
import assert from 'node:assert/strict';
import {playMissionSpeech} from '../src/utils/missionSpeech.ts';

test('missing provider audio invokes browser speech',async()=>{
  let spoke=false;
  await playMissionSpeech(null,done=>{spoke=true;done();});
  assert.equal(spoke,true);
});
test('blocked autoplay invokes browser speech and resolves',async()=>{
  let spoke=false;
  const audio={play:()=>Promise.reject(Error('autoplay blocked')),pause:()=>{},onended:null,onerror:null} as any;
  await playMissionSpeech(audio,done=>{spoke=true;done();});
  assert.equal(spoke,true);
});
test('immediately ended audio cannot lose its completion event',async()=>{
  const audio={play:()=>{audio.onended();return Promise.resolve();},pause:()=>{},onended:null,onerror:null} as any;
  await playMissionSpeech(audio,()=>{assert.fail('Unexpected fallback');});
});
test('stalled provider and stalled browser speech are bounded',async()=>{
  let paused=false;
  const audio={play:()=>Promise.resolve(),pause:()=>{paused=true;},onended:null,onerror:null} as any;
  await playMissionSpeech(audio,()=>{},10);
  assert.equal(paused,true);
  await playMissionSpeech(null,()=>{},10);
});
