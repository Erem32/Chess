import assert from "node:assert/strict";
import test from "node:test";

import { formatGameDuration, formatPlayerColor, resolveGameStatusClass, resolvePlayerResult } from "./gamePresentation.js";

test("game presentation resolves each player's color and result while keeping aborted games neutral", () => {
  const game = { status: "resigned", players: [{ user_id: 1, color: "white", result: "win" }, { user_id: 2, color: "black", result: "loss" }] };
  assert.equal(formatPlayerColor(game, "1"), "White");
  assert.equal(resolvePlayerResult(game, 2), "loss");
  assert.equal(resolveGameStatusClass(game, 2), "history-status history-status--loss");
  assert.equal(resolveGameStatusClass({ ...game, status: "aborted" }, 1), "history-status");
  assert.equal(formatPlayerColor(game, 99), "Unknown");
  assert.equal(formatPlayerColor(game, 99, "Unknown color"), "Unknown Color");
  assert.equal(formatPlayerColor(null, 99, "Unknown color"), "Unknown color");
});

test("game durations handle missing, active and completed games", () => {
  assert.equal(formatGameDuration({}), "Unknown duration");
  assert.equal(formatGameDuration({ started_at: "invalid" }), "Unknown duration");
  assert.equal(formatGameDuration({ started_at: "2026-01-01T00:00:00Z" }), "In progress");
  assert.equal(formatGameDuration({ started_at: "2026-01-01T00:00:00Z", finished_at: "2026-01-01T01:01:20Z" }), "1h 1m");
  assert.equal(formatGameDuration({ started_at: "2026-01-01T00:00:00Z", finished_at: "2026-01-01T00:01:20Z" }), "1m 20s");
  assert.equal(formatGameDuration({ started_at: "2026-01-01T00:00:00Z", finished_at: "2025-12-31T23:59:59Z" }), "0s");
});
