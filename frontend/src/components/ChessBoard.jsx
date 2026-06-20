import { Chess } from "chess.js";
import { Chessboard, defaultPieces } from "react-chessboard";

const FIREFOX_SAFE_PIECES = Object.fromEntries(
  Object.entries(defaultPieces).map(([pieceType, renderPiece]) => [
    pieceType,
    (props = {}) =>
      renderPiece({
        ...props,
        fill: pieceType.startsWith("w") ? "#f8fafc" : "#111827",
        svgStyle: {
          display: "block",
          filter: pieceType.startsWith("w")
            ? "drop-shadow(0 0 1px rgba(15, 23, 42, 0.9))"
            : "drop-shadow(0 1px 1px rgba(248, 250, 252, 0.15))",
          overflow: "visible",
          ...(props.svgStyle ?? {})
        }
      })
  ])
);

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
          pieces: FIREFOX_SAFE_PIECES,
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
