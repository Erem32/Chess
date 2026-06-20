import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

export default function ChessBoard({ fen, onMove, playerColor, isInteractive = true }) {
  function buildMove(sourceSquare, targetSquare) {
    if (!sourceSquare || !targetSquare) return null;

    const board = new Chess(fen);
    const piece = board.get(sourceSquare);
    const isPromotion =
      piece?.type === "p" &&
      ((piece.color === "w" && targetSquare.endsWith("8")) ||
        (piece.color === "b" && targetSquare.endsWith("1")));

    return `${sourceSquare}${targetSquare}${isPromotion ? "q" : ""}`;
  }

  return (
    <div className="board-wrap">
      <Chessboard
        options={{
          id: "game-board",
          position: fen,
          boardOrientation: playerColor === "black" ? "black" : "white",
          allowDragging: isInteractive,
          canDragPiece: ({ piece }) => {
            if (!isInteractive || !playerColor || !piece?.pieceType) return false;
            const expectedPrefix = playerColor === "white" ? "w" : "b";
            return piece.pieceType.startsWith(expectedPrefix);
          },
          onPieceDrop: ({ sourceSquare, targetSquare }) => {
            const move = buildMove(sourceSquare, targetSquare);
            if (move) onMove(move);
            return false;
          }
        }}
      />
    </div>
  );
}
