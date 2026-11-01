import assert from "node:assert/strict";
import test from "node:test";
import { normalizeGameEvent } from "./gameEvent.js";

test("normalizes the server's game_state move and rejects stale or incomplete events", () => {
  const game = { current_fen: "position", status: "active" };
  const move = { id: 1, move_number: 1, move_uci: "e2e4", fen_after_move: "position" };
  const event = { type: "game_state", payload: { game, move } };
  assert.deepEqual(normalizeGameEvent(event, 0), { kind: "next", game, move, fen: "position" });
  assert.deepEqual(normalizeGameEvent(event, 1), { kind: "duplicate" });
  assert.deepEqual(normalizeGameEvent({ type: "game_state", payload: { game } }, 0), { kind: "snapshot" });
  assert.deepEqual(normalizeGameEvent({ type: "game_state", payload: { game, move: { move_number: 3 } } }, 1), { kind: "gap" });
});

test("normalizes legacy move envelopes and falls back to game position", () => {
  const move = { move_number: 2, fen_after_move: "after" };
  assert.deepEqual(normalizeGameEvent({ type: "move", payload: move }, 1), { kind: "next", game: null, move, fen: "after" });
  const game = { current_fen: "position", move: { move_number: 1 } };
  assert.deepEqual(normalizeGameEvent({ type: "game_updated", payload: { game } }, 0), { kind: "next", game, move: game.move, fen: "position" });
});
