import { useEffect, useState } from "react";
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
  const [selectedSquare, setSelectedSquare] = useState(null);
  const legalMoves = resolveLegalMoves(fen, selectedSquare, playerColor, isInteractive);
  const squareStyles = buildSquareStyles(fen, selectedSquare, legalMoves);

  useEffect(() => {
    setSelectedSquare(null);
  }, [fen]);

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

  function handleSquareSelection(square, pieceType = null) {
    if (!square || !isInteractive || !isOwnPiece(pieceType, playerColor)) {
      setSelectedSquare(null);
      return;
    }

    setSelectedSquare((current) => (current === square ? null : square));
  }

  function handleSquareClick(square, pieceType = null) {
    if (!isInteractive || !square) return;

    const matchingMove = legalMoves.find((move) => move.to === square);
    if (selectedSquare && matchingMove) {
      const move = buildMove(selectedSquare, square);
      if (move) onMove(move);
      setSelectedSquare(null);
      return;
    }

    if (isOwnPiece(pieceType, playerColor)) {
      handleSquareSelection(square, pieceType);
      return;
    }

    setSelectedSquare(null);
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
          squareStyles,
          canDragPiece: ({ piece }) => {
            if (!isInteractive || !playerColor || !piece?.pieceType) return false;
            const expectedPrefix = playerColor === "white" ? "w" : "b";
            return piece.pieceType.startsWith(expectedPrefix);
          },
          onPieceClick: ({ piece, square }) => {
            handleSquareSelection(square, piece?.pieceType);
          },
          onPieceDrag: ({ piece, square }) => {
            handleSquareSelection(square, piece?.pieceType);
          },
          onSquareMouseDown: ({ piece, square }) => {
            if (!piece?.pieceType) return;
            handleSquareSelection(square, piece.pieceType);
          },
          onSquareClick: ({ piece, square }) => {
            handleSquareClick(square, piece?.pieceType ?? null);
          },
          onPieceDrop: ({ sourceSquare, targetSquare }) => {
            const matchingMove = resolveLegalMoves(fen, sourceSquare, playerColor, isInteractive)
              .find((move) => move.to === targetSquare);
            if (!matchingMove) return false;
            const move = buildMove(sourceSquare, targetSquare);
            if (move) {
              onMove(move);
              setSelectedSquare(null);
            }
            return false;
          }
        }}
      />
    </div>
  );
}

function resolveLegalMoves(fen, square, playerColor, isInteractive) {
  if (!fen || !square || !playerColor || !isInteractive) return [];

  const board = new Chess(fen);
  const piece = board.get(square);
  const expectedColor = playerColor === "black" ? "b" : "w";

  if (!piece || piece.color !== expectedColor) return [];
  return board.moves({ square, verbose: true });
}

function isOwnPiece(pieceType, playerColor) {
  if (!pieceType || !playerColor) return false;
  const expectedPrefix = playerColor === "white" ? "w" : "b";
  return pieceType.startsWith(expectedPrefix);
}

function buildSquareStyles(fen, selectedSquare, legalMoves) {
  if (!selectedSquare || legalMoves.length === 0) return {};

  const board = new Chess(fen);
  const styles = {
    [selectedSquare]: {
      boxShadow: "inset 0 0 0 4px rgba(59, 130, 246, 0.58)"
    }
  };

  for (const move of legalMoves) {
    const squareColor = isLightSquare(move.to) ? "rgba(17, 24, 39, 0.34)" : "rgba(248, 250, 252, 0.42)";
    const ringColor = isLightSquare(move.to) ? "rgba(17, 24, 39, 0.45)" : "rgba(248, 250, 252, 0.62)";

    styles[move.to] = move.captured
      ? {
          boxShadow: `inset 0 0 0 4px ${ringColor}`
        }
      : {
          backgroundImage: `radial-gradient(circle, ${squareColor} 0%, ${squareColor} 18%, transparent 20%)`,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        };
  }

  return styles;
}

function isLightSquare(square) {
  const file = square.charCodeAt(0) - 96;
  const rank = Number(square[1]);
  return (file + rank) % 2 === 1;
}
