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

export function notationMove(fen, text, playerColor, isInteractive = true) {
  if (!fen || !text?.trim() || !playerColor || !isInteractive) return null;
  try {
    const board = new Chess(fen);
    if (board.turn() !== (playerColor === "white" ? "w" : "b")) return null;
    const input = text.trim();
    const coordinate = /^([a-h][1-8])([a-h][1-8])([qrbn])?$/i.exec(input);
    const move = coordinate
      ? board.move({ from: coordinate[1].toLowerCase(), to: coordinate[2].toLowerCase(), promotion: coordinate[3]?.toLowerCase() })
      : board.move(input);
    return `${move.from}${move.to}${move.promotion ?? ""}`;
  } catch {
    return null;
  }
}
