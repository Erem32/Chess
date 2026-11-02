import assert from "node:assert/strict";
import test from "node:test";

import { loadPuzzleProgress, savePuzzleProgress } from "./puzzleProgress.js";

function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test("solved puzzles persist without duplicates and remain separate for each account", () => {
  const storage = memoryStorage();
  assert.equal(savePuzzleProgress(storage, 1, ["one", "two", "one"]), true);
  assert.deepEqual(loadPuzzleProgress(storage, 1), { userId: "1", completed: ["one", "two"], persistent: true });
  assert.deepEqual(loadPuzzleProgress(storage, 2), { userId: "2", completed: [], persistent: true });
  savePuzzleProgress(storage, 2, ["three"]);
  assert.deepEqual(loadPuzzleProgress(storage, 1).completed, ["one", "two"]);
});

test("unavailable or malformed storage is reported without losing the page", () => {
  const blocked = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  assert.deepEqual(loadPuzzleProgress(blocked, 1), { userId: "1", completed: [], persistent: false });
  assert.equal(savePuzzleProgress(blocked, 1, ["one"]), false);
  assert.equal(loadPuzzleProgress({ getItem: () => "{}" }, 1).persistent, false);
  assert.equal(savePuzzleProgress(memoryStorage(), null, ["one"]), false);
});
