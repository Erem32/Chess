import { Chess } from "chess.js";
import { useState } from "react";
import { Chessboard } from "react-chessboard";

export default function ChessBoard({ fen, onMove, playerColor, isInteractive = true }) {
  const [selectedSquare, setSelectedSquare] = useState(null);

  function buildMove(piece, sourceSquare, targetSquare) {
    if (!sourceSquare || !targetSquare) return null;

    const board = new Chess(fen);
    const sourcePiece = board.get(sourceSquare);
    const normalizedPieceType = piece?.pieceType ?? "";
    const isWhitePiece =
      sourcePiece?.color === "w" || normalizedPieceType.startsWith("w") || normalizedPieceType === normalizedPieceType.toUpperCase();
    const isBlackPiece =
      sourcePiece?.color === "b" || normalizedPieceType.startsWith("b") || normalizedPieceType === normalizedPieceType.toLowerCase();
    const isPromotion =
      sourcePiece?.type === "p" &&
      ((isWhitePiece && targetSquare.endsWith("8")) || (isBlackPiece && targetSquare.endsWith("1")));

    return `${sourceSquare}${targetSquare}${isPromotion ? "q" : ""}`;
  }

  function isOwnPiece(piece) {
    if (!piece?.pieceType || !playerColor) return false;
    if (playerColor === "white") {
      return piece.pieceType.startsWith("w") || piece.pieceType === piece.pieceType.toUpperCase();
    }
    return piece.pieceType.startsWith("b") || piece.pieceType === piece.pieceType.toLowerCase();
  }

  function handlePieceClick({ piece, square }) {
    if (!isInteractive || !square || !isOwnPiece(piece)) return;
    setSelectedSquare(square);
  }

  function handleSquareClick({ square }) {
    if (!isInteractive || !selectedSquare || !square) return;
    const board = new Chess(fen);
    const piece = board.get(selectedSquare);
    const move = buildMove(
      piece ? { pieceType: piece.color === "w" ? piece.type.toUpperCase() : piece.type } : null,
      selectedSquare,
      square
    );
    setSelectedSquare(null);
    if (move) onMove(move);
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
            if (!isInteractive) return false;
            return isOwnPiece(piece);
          },
          onPieceClick: handlePieceClick,
          onPieceDrop: ({ piece, sourceSquare, targetSquare }) => {
            setSelectedSquare(null);
            const move = buildMove(piece, sourceSquare, targetSquare);
            if (move) {
              onMove(move);
              return true;
            }
            return false;
          },
          onSquareClick: handleSquareClick
        }}
      />
    </div>
  );
}
