import assert from "node:assert/strict";
import test from "node:test";
import { historyDate, historyOpponent, historyStatus } from "./historyPresentation.js";

const game = { players: [{ user_id: 1, username: "white", color: "white", result: "win" }, { user_id: 2, username: "black", color: "black", result: "loss" }] };

test("history identifies the opponent and handles missing players and dates", () => {
  assert.equal(historyOpponent(game, 1), "black");
  assert.equal(historyOpponent(game, 2), "white");
  assert.equal(historyOpponent({ players: [{ user_id: 1 }, { user_id: 2 }] }, 1), "Player #2");
  assert.equal(historyOpponent({ players: [{ user_id: 1 }] }, 1), "Opponent unavailable");
  assert.equal(historyOpponent(game, null), "Opponent unavailable");
  assert.equal(historyDate(null), "Date unavailable");
  assert.equal(historyDate("bad date"), "Date unavailable");
  assert.notEqual(historyDate("2026-01-01T12:00:00Z"), "Date unavailable");
});

test("history describes results for the current player without guessing", () => {
  assert.equal(historyStatus({ ...game, status: "resigned", result: "white_wins_by_resignation" }, 1), "Won by resignation");
  assert.equal(historyStatus({ ...game, status: "resigned", result: "white_wins_by_resignation" }, 2), "Lost by resignation");
  assert.equal(historyStatus({ ...game, status: "resigned", result: "white_wins_by_resignation" }, null), "Resigned");
  assert.equal(historyStatus({ ...game, status: "white_win" }, 2), "Lost by checkmate");
  assert.equal(historyStatus({ status: "active" }, 1), "In progress");
  assert.equal(historyStatus({ status: "aborted" }, 1), "Aborted");
  assert.equal(historyStatus({ status: "draw", result: "draw_claimed_threefold" }, 1), "Draw by repetition");
});
