import assert from "node:assert/strict";
import test from "node:test";

import { loadOpeningProgress, saveOpeningProgress } from "./openingProgress.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
}

test("completed guides survive a reload and stay separate between accounts", () => {
  const storage = memoryStorage();
  assert.equal(saveOpeningProgress(storage, 12, ["italian-game", "sicilian-defense", "italian-game"]), true);
  assert.deepEqual(loadOpeningProgress(storage, 12), {
    userId: "12", completed: ["italian-game", "sicilian-defense"], persistent: true
  });
  assert.deepEqual(loadOpeningProgress(storage, 13), { userId: "13", completed: [], persistent: true });
  assert.equal(saveOpeningProgress(storage, 13, ["caro-kann"]), true);
  assert.deepEqual(loadOpeningProgress(storage, 12).completed, ["italian-game", "sicilian-defense"]);
});

test("blocked or invalid storage does not crash the guide or claim to persist progress", () => {
  const blocked = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  const malformed = { getItem() { return "not valid JSON"; } };
  assert.deepEqual(loadOpeningProgress(blocked, 1), { userId: "1", completed: [], persistent: false });
  assert.deepEqual(loadOpeningProgress(malformed, 1), { userId: "1", completed: [], persistent: false });
  assert.equal(saveOpeningProgress(blocked, 1, ["italian-game"]), false);
  assert.equal(saveOpeningProgress(memoryStorage(), null, ["italian-game"]), false);
});
