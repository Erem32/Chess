import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard, defaultPieces } from "react-chessboard";

import { legalMovesFrom, moveChoices } from "./boardMoves.js";
import "./ChessBoard.css";

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
  const boardRef = useRef(null);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [promotion, setPromotion] = useState(null);
  const isChoosingPromotion = Boolean(promotion && promotion.fen === fen && promotion.playerColor === playerColor && isInteractive);
  const boardInteractive = isInteractive && !isChoosingPromotion;
  const legalMoves = legalMovesFrom(fen, selectedSquare, playerColor, boardInteractive);
  const squareStyles = buildSquareStyles(fen, selectedSquare, legalMoves);

  useEffect(() => {
    setSelectedSquare(null);
    setPromotion(null);
  }, [fen, playerColor, isInteractive]);

  function tryMove(sourceSquare, targetSquare) {
    const choices = moveChoices(fen, sourceSquare, targetSquare, playerColor, boardInteractive);
    if (choices.length === 0) return;
    setSelectedSquare(null);
    if (choices.length > 1) {
      setPromotion({ fen, playerColor, choices });
    } else {
      onMove(choices[0]);
    }
  }

  function choosePromotion(piece) {
    if (!isChoosingPromotion) return;
    const move = promotion.choices.find((choice) => choice.endsWith(piece));
    if (!move) return;
    setPromotion(null);
    onMove(move);
  }

  function cancelPromotion() {
    setPromotion(null);
    boardRef.current?.focus();
  }

  function handleSquareSelection(square, pieceType = null) {
    if (!square || !boardInteractive || !isOwnPiece(pieceType, playerColor)) {
      setSelectedSquare(null);
      return;
    }

    setSelectedSquare((current) => (current === square ? null : square));
  }

  function handleSquareClick(square, pieceType = null) {
    if (!boardInteractive || !square) return;

    const matchingMove = legalMoves.find((move) => move.to === square);
    if (selectedSquare && matchingMove) {
      tryMove(selectedSquare, square);
      return;
    }

    if (isOwnPiece(pieceType, playerColor)) {
      handleSquareSelection(square, pieceType);
      return;
    }

    setSelectedSquare(null);
  }

  return (
    <>
    <div className="board-wrap" ref={boardRef} tabIndex={-1}>
      <Chessboard
        options={{
          id: "game-board",
          position: fen,
          pieces: FIREFOX_SAFE_PIECES,
          boardOrientation: playerColor === "black" ? "black" : "white",
          allowDragging: boardInteractive,
          squareStyles,
          canDragPiece: ({ piece }) => {
            if (!boardInteractive || !playerColor || !piece?.pieceType) return false;
            const expectedPrefix = playerColor === "white" ? "w" : "b";
            return piece.pieceType.startsWith(expectedPrefix);
          },
          onSquareClick: ({ piece, square }) => {
            handleSquareClick(square, piece?.pieceType ?? null);
          },
          onPieceDrop: ({ sourceSquare, targetSquare }) => {
            tryMove(sourceSquare, targetSquare);
            return false;
          }
        }}
      />
      {isChoosingPromotion && (
        <section className="promotion-picker" role="group" aria-labelledby="promotion-title" onKeyDown={(event) => {
          if (event.key === "Escape") cancelPromotion();
        }}>
          <h2 id="promotion-title">Choose a piece for promotion</h2>
          <div className="promotion-picker-actions">
            {[["q", "Queen"], ["r", "Rook"], ["b", "Bishop"], ["n", "Knight"]].map(([piece, label], index) => (
              <button key={piece} type="button" autoFocus={index === 0} onClick={() => choosePromotion(piece)}>
                {label}
              </button>
            ))}
            <button type="button" className="secondary-button" onClick={cancelPromotion}>Cancel</button>
          </div>
        </section>
      )}
    </div>
    </>
  );
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
