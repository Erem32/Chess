import { Chess } from "chess.js";

const STARTING_COUNTS = {
  w: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 },
  b: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 }
};

const PIECE_ORDER = ["q", "r", "b", "n", "p"];
const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const PIECE_ICONS = {
  w: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
  b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" }
};

export default function CapturedPiecesPanel({ fen, playerColor }) {
  const material = buildCapturedMaterial(fen, playerColor);

  return (
    <section className="captured-panel" aria-label="Captured pieces">
      <div className="captured-side captured-side--left">
        <div className="captured-row">
          <div className="captured-icons">
            {material.myCaptures.length > 0 ? (
              material.myCaptures.map((piece, index) => (
                <span
                  key={`${piece.color}-${piece.type}-${index}`}
                  className={`captured-piece captured-piece--${piece.color}`}
                  aria-hidden="true"
                >
                  {PIECE_ICONS[piece.color][piece.type]}
                </span>
              ))
            ) : null}
          </div>
          {material.advantage > 0 && <span className="captured-score">+{material.advantage}</span>}
        </div>
      </div>
      <div className="captured-side captured-side--right">
        <div className="captured-row">
          {material.advantage < 0 && <span className="captured-score">+{Math.abs(material.advantage)}</span>}
          <div className="captured-icons">
            {material.opponentCaptures.length > 0 ? (
              material.opponentCaptures.map((piece, index) => (
                <span
                  key={`${piece.color}-${piece.type}-${index}`}
                  className={`captured-piece captured-piece--${piece.color}`}
                  aria-hidden="true"
                >
                  {PIECE_ICONS[piece.color][piece.type]}
                </span>
              ))
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function buildCapturedMaterial(fen, playerColor) {
  const currentCounts = countPiecesFromFen(fen);
  const mineColor = playerColor === "black" ? "b" : "w";
  const opponentColor = mineColor === "w" ? "b" : "w";
  const myCaptures = expandCapturedPieces(opponentColor, currentCounts);
  const opponentCaptures = expandCapturedPieces(mineColor, currentCounts);

  return {
    myCaptures,
    opponentCaptures,
    advantage: scoreCaptured(myCaptures) - scoreCaptured(opponentCaptures)
  };
}

function countPiecesFromFen(fen) {
  const board = new Chess(fen);
  const counts = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 }
  };

  for (const rank of board.board()) {
    for (const piece of rank) {
      if (!piece) continue;
      counts[piece.color][piece.type] += 1;
    }
  }

  return counts;
}

function expandCapturedPieces(color, currentCounts) {
  const captured = [];

  for (const pieceType of PIECE_ORDER) {
    const missingCount = STARTING_COUNTS[color][pieceType] - currentCounts[color][pieceType];
    for (let index = 0; index < missingCount; index += 1) {
      captured.push({ color, type: pieceType });
    }
  }

  return captured;
}

function scoreCaptured(pieces) {
  return pieces.reduce((total, piece) => total + PIECE_VALUES[piece.type], 0);
}
