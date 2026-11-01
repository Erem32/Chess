import { useState } from "react";
import { createRoot } from "react-dom/client";
import ChessBoard from "../src/components/ChessBoard.jsx";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const CAPTURE = "7k/8/8/3p4/4P3/8/8/7K w - - 0 1";
const PROMOTION = "7k/P7/8/8/8/8/8/7K w - - 0 1";
const BLACK = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1";
window.boardEvents = [];

function Fixture() {
  const [mode, setMode] = useState("practice");
  const fen = mode === "capture" ? CAPTURE : mode === "promotion" ? PROMOTION : mode === "black" ? BLACK : START;
  return <>
    <span data-testid="board-mode">{mode}</span>
    {["practice", "online", "disabled", "capture", "promotion", "black"].map((name) => (
      <button key={name} type="button" onClick={() => { window.boardEvents = []; setMode(name); }}>{name}</button>
    ))}
    <div style={{ width: 480, margin: "40px auto" }}>
      <ChessBoard key={mode} fen={fen} playerColor={mode === "black" ? "black" : "white"} isInteractive={mode !== "disabled"}
        onMove={(move) => window.boardEvents.push({ type: "move", move })}
        onInvalidAttempt={mode === "online" ? undefined : (attempt) => window.boardEvents.push({ type: "invalid", ...attempt })} />
    </div>
  </>;
}

createRoot(document.getElementById("root")).render(<Fixture />);
