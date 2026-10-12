import test from "node:test";
import assert from "node:assert/strict";
import { getPegasusVoiceProfile, getPegasusVoiceForPlayback, huddleVoiceIds, workforceVoiceIds } from "../src/agents/voice-core/voiceRegistryCore";

test("Pegasus voice snapshot identity contract", () => {
  assert.equal(huddleVoiceIds.length, 12);
  assert.equal(workforceVoiceIds.length, 9);
  assert.equal(new Set([...huddleVoiceIds, ...workforceVoiceIds]).size, 21);
  assert.deepEqual(huddleVoiceIds, ["simon","marie","iris","mark","cammy","evan","tube","lucy","snake","alice","echo","booker"]);
  assert.equal(getPegasusVoiceProfile("mark")?.voice_id, "am_eric");
  assert.equal(getPegasusVoiceProfile("mark")?.approved, true);
  assert.equal(getPegasusVoiceForPlayback("snake")?.voiceId, "bm_daniel");
  assert.equal(getPegasusVoiceProfile("doc"), null);
  assert.equal(getPegasusVoiceProfile("__proto__"), null);
  for(const id of workforceVoiceIds) assert.equal(getPegasusVoiceForPlayback(id)?.approved, false);
});
