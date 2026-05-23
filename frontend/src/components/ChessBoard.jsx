import { Chessboard } from "react-chessboard";

export default function ChessBoard({ fen, onMove }) {
  return (
    <div className="board-wrap">
      <Chessboard
        position={fen}
        onPieceDrop={(sourceSquare, targetSquare) => {
          onMove(`${sourceSquare}${targetSquare}`);
          return false;
        }}
      />
    </div>
  );
}
