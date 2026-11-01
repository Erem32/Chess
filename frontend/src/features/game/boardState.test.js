import assert from "node:assert/strict";
import test from "node:test";
import { boardMatchesGame, canPlayGameMove } from "./boardState.js";

test("the board is playable only when the displayed position matches the server game", () => {
  const game = { status: "active", turn_color: "white", current_fen: "new position" };
  assert.equal(canPlayGameMove(game, "old position", "white", "connected"), false);
  assert.equal(canPlayGameMove(game, "new position", "white", "connected"), true);
  assert.equal(canPlayGameMove(game, "new position", "black", "connected"), false);
  assert.equal(canPlayGameMove(game, "new position", "white", "syncing"), false);
  assert.equal(canPlayGameMove({ ...game, status: "draw" }, "new position", "white", "connected"), false);
  assert.equal(boardMatchesGame(null, "new position"), false);
  assert.equal(boardMatchesGame({ current_fen: null }, "new position"), false);
});
