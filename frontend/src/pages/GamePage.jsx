import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getGame, getGameMoves } from "../api/games.js";
import { createGameSocket } from "../api/websocket.js";
import ChatBox from "../components/ChatBox.jsx";
import ChessBoard from "../components/ChessBoard.jsx";
import MoveHistory from "../components/MoveHistory.jsx";

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export default function GamePage() {
  const { gameId } = useParams();
  const [fen, setFen] = useState(STARTING_FEN);
  const [moves, setMoves] = useState([]);
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getGame(gameId).catch((err) => setError(err.message));
    getGameMoves(gameId).then((data) => setMoves(data.moves ?? [])).catch(() => {});

    const token = localStorage.getItem("access_token") ?? "";
    const ws = createGameSocket(gameId, token);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "game_state") setFen(data.payload.fen);
      if (data.type === "chat") setMessages((current) => [...current, data.payload]);
      if (data.type === "error") setError(data.payload.message);
    };
    setSocket(ws);

    return () => ws.close();
  }, [gameId]);

  function sendMove(move) {
    socket?.send(JSON.stringify({ type: "move", payload: { move } }));
  }

  function sendChat(message) {
    socket?.send(JSON.stringify({ type: "chat", payload: { message } }));
  }

  return (
    <section className="game-layout">
      <div>
        <h1>Game #{gameId}</h1>
        {error && <p className="error">{error}</p>}
        <ChessBoard fen={fen} onMove={sendMove} />
      </div>
      <aside className="side-stack">
        <MoveHistory moves={moves} />
        <ChatBox messages={messages} onSend={sendChat} />
      </aside>
    </section>
  );
}
