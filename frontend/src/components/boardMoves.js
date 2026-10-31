import { Chess } from "chess.js";

// Client-side move choices are hints only; the server validates every move.
export function legalMovesFrom(fen, square, playerColor, isInteractive = true) {
  if (!fen || !square || !playerColor || !isInteractive) return [];

  const board = new Chess(fen);
  const piece = board.get(square);
  const expectedColor = playerColor === "black" ? "b" : "w";
  if (!piece || piece.color !== expectedColor) return [];
  return board.moves({ square, verbose: true });
}

export function moveChoices(fen, sourceSquare, targetSquare, playerColor, isInteractive = true) {
  if (!targetSquare) return [];
  return legalMovesFrom(fen, sourceSquare, playerColor, isInteractive)
    .filter((move) => move.to === targetSquare)
    .map((move) => `${sourceSquare}${targetSquare}${move.promotion ?? ""}`);
}
