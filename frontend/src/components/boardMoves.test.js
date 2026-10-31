import test from "node:test";
import assert from "node:assert/strict";
import { moveChoices, notationMove } from "./boardMoves.js";

const whitePromotion = "7k/P7/8/8/8/8/8/7K w - - 0 1";
const blackPromotion = "7k/8/8/8/8/8/p7/7K b - - 0 1";
const promotionPieces = ["q", "r", "b", "n"];

test("white and black promotion expose all four UCI choices", () => {
  assert.deepEqual(new Set(moveChoices(whitePromotion, "a7", "a8", "white")),
    new Set(promotionPieces.map((piece) => `a7a8${piece}`)));
  assert.deepEqual(new Set(moveChoices(blackPromotion, "a2", "a1", "black")),
    new Set(promotionPieces.map((piece) => `a2a1${piece}`)));
});

test("promotion by capture exposes all four choices", () => {
  const fen = "1r5k/P7/8/8/8/8/8/7K w - - 0 1";
  assert.deepEqual(new Set(moveChoices(fen, "a7", "b8", "white")),
    new Set(promotionPieces.map((piece) => `a7b8${piece}`)));
});

test("ordinary moves remain unchanged and invalid actions produce no choices", () => {
  const start = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  assert.deepEqual(moveChoices(start, "e2", "e4", "white"), ["e2e4"]);
  assert.deepEqual(moveChoices(start, "e2", "e5", "white"), []);
  assert.deepEqual(moveChoices(start, "e2", "e4", "black"), []);
  assert.deepEqual(moveChoices(start, "e2", "e4", "white", false), []);
});

test("keyboard move entry accepts legal notation and honors turn and promotion", () => {
  const start = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  assert.equal(notationMove(start, "e4", "white"), "e2e4");
  assert.equal(notationMove(start, "e2e4", "white"), "e2e4");
  assert.equal(notationMove(start, "e5", "white"), null);
  assert.equal(notationMove(start, "e4", "black"), null);
  assert.equal(notationMove(start, "e4", "white", false), null);
  assert.equal(notationMove(whitePromotion, "a8=N", "white"), "a7a8n");
  assert.equal(notationMove(whitePromotion, "a7a8n", "white"), "a7a8n");
});
