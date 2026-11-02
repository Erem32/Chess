import assert from "node:assert/strict";
import test from "node:test";
import { MOVE_GUIDANCE_KEY, readPreferences, savePreference, TEXT_SIZE_KEY } from "./preferences.js";

test("preferences use defaults for missing or invalid values and persist valid choices", () => {
  const data = new Map();
  const storage = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  assert.deepEqual(readPreferences(storage), { textSize: "normal", moveGuidance: true });
  data.set(TEXT_SIZE_KEY, "invalid");
  data.set(MOVE_GUIDANCE_KEY, "invalid");
  assert.deepEqual(readPreferences(storage), { textSize: "normal", moveGuidance: true });
  savePreference(storage, TEXT_SIZE_KEY, "larger");
  savePreference(storage, MOVE_GUIDANCE_KEY, false);
  assert.deepEqual(readPreferences(storage), { textSize: "larger", moveGuidance: false });
  assert.deepEqual(readPreferences({ getItem() { throw new Error("blocked"); } }), { textSize: "normal", moveGuidance: true });
});
