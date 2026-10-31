import test from "node:test";
import assert from "node:assert/strict";
import { classifyMove, fetchStableGameSnapshot, reconnectDelay } from "./gameSync.js";

const initial = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const move = { id: 1, move_number: 1, fen_after_move: "after" };

test("reconnect delay grows with jitter and caps at 15 seconds", () => {
  assert.equal(reconnectDelay(0, () => 0), 250);
  assert.equal(reconnectDelay(1, () => 1), 1000);
  assert.equal(reconnectDelay(100, () => 1), 15000);
});

test("stable snapshot restores current state and moves", async () => {
  const snapshot = await fetchStableGameSnapshot(1, async () => ({ current_fen: "after" }), async () => ({ moves: [move] }));
  assert.deepEqual(snapshot.moves, [move]);
  assert.equal(snapshot.game.current_fen, "after");
  const empty = await fetchStableGameSnapshot(1, async () => ({ current_fen: initial }), async () => ({ moves: [] }));
  assert.deepEqual(empty.moves, []);
});

test("mixed snapshots are rejected for retry", async () => {
  let calls = 0;
  await assert.rejects(fetchStableGameSnapshot(1, async () => ({ current_fen: initial }), async () => ({ moves: calls++ ? [move] : [] })));
  await assert.rejects(fetchStableGameSnapshot(1, async () => ({ current_fen: initial }), async () => ({ moves: [move] })));
});

test("move sequence suppresses duplicates and detects gaps", () => {
  assert.equal(classifyMove(move, 0), "next");
  assert.equal(classifyMove(move, 1), "duplicate");
  assert.equal(classifyMove({ move_number: 3 }, 1), "gap");
  assert.equal(classifyMove({}, 1), "gap");
});
