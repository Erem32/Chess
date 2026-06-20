import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getGame, getGameMoves, resignGame } from "../api/games.js";
import { getAuthToken } from "../api/session.js";
import { createGameSocket } from "../api/websocket.js";
import ChatBox from "../components/ChatBox.jsx";
import ChessBoard from "../components/ChessBoard.jsx";
import MoveHistory from "../components/MoveHistory.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export default function GamePage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const [fen, setFen] = useState(STARTING_FEN);
  const [game, setGame] = useState(null);
  const [moves, setMoves] = useState([]);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [socketStatus, setSocketStatus] = useState("idle");
  const [socketAttempt, setSocketAttempt] = useState(0);
  const isGameOver = game && game.status !== "active" && game.status !== "waiting";
  const socketToken = token ?? getAuthToken();
  const currentUserId = user?.id ?? getUserIdFromToken(socketToken);
  const playerColor = resolvePlayerColor(game, currentUserId);
  const canConnect = Boolean(socketToken);
  const canMove = !isGameOver && Boolean(playerColor) && socketStatus === "connected";

  useEffect(() => {
    let active = true;

    async function loadGame() {
      setIsLoading(true);
      setError("");
      try {
        const [gameData, movesData] = await Promise.all([
          getGame(gameId),
          getGameMoves(gameId)
        ]);
        if (!active) return;
        setGame(gameData);
        setFen(resolveFen(gameData));
        setMoves(resolveMoves(movesData));
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadGame();

    return () => {
      active = false;
    };
  }, [gameId]);

  useEffect(() => {
    if (!canConnect) return undefined;

    let active = true;
    if (!socketToken) {
      setSocketStatus("disconnected");
      setError("No active login session. Log in again before opening the game.");
      return undefined;
    }

    setSocketStatus("connecting");
    const ws = createGameSocket(gameId, socketToken);
    socketRef.current = ws;
    ws.onopen = () => {
      if (active && socketRef.current === ws) {
        setSocketStatus("connected");
        setInfo("Connected");
        setError("");
      }
    };
    ws.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      const payload = data.payload ?? data;
      if (data.type === "game_state" || data.type === "game_updated") {
        const nextGame = payload.game ?? (payload.current_fen || payload.fen ? payload : null);
        const nextMove = payload.move ?? nextGame?.move ?? null;
        if (nextGame) setGame((current) => ({ ...(current ?? {}), ...nextGame }));
        const nextFen = resolveFen(nextGame ?? payload, null);
        if (nextFen) setFen(nextFen);
        if (Array.isArray(payload.moves) || Array.isArray(nextGame?.moves)) {
          setMoves(resolveMoves(payload.moves ?? nextGame.moves));
        }
        if (nextMove) {
          setMoves((current) => appendMove(current, nextMove));
        }
        setError("");
      }
      if (data.type === "move" || data.type === "move_made") {
        const move = payload.move ?? payload;
        if (move?.fen_after_move || move?.fen) setFen(move.fen_after_move ?? move.fen);
        setMoves((current) => appendMove(current, move));
        setError("");
      }
      if (data.type === "chat") {
        setMessages((current) => [...current, payload]);
      }
      if (data.type === "info") {
        setInfo(payload.message ?? "Connected");
      }
      if (data.type === "error") {
        setError(payload.message ?? "WebSocket error");
      }
    };
    ws.onerror = () => {
      if (active && socketRef.current === ws) {
        setSocketStatus("disconnected");
        setError("Game connection failed. Retrying...");
      }
    };
    ws.onclose = (event) => {
      if (!active || socketRef.current !== ws) return;
      setSocketStatus("disconnected");
      setInfo("Disconnected");
      if (event.code === 1008) {
        setError("This browser is not authorized for this game. Log out and sign in with the account that joined it.");
        return;
      }
      reconnectTimerRef.current = window.setTimeout(() => {
        setSocketAttempt((current) => current + 1);
      }, 1200);
    };
    return () => {
      active = false;
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (socketRef.current === ws) {
        socketRef.current = null;
      }
      ws.close();
    };
  }, [canConnect, gameId, socketAttempt, socketToken]);

  function sendMove(move) {
    if (isGameOver) {
      setError("This game is over.");
      return;
    }
    const activeSocket = socketRef.current;
    if (!activeSocket || activeSocket.readyState !== WebSocket.OPEN) {
      setError("Game connection is still opening. Try again in a moment.");
      return;
    }
    setError("");
    activeSocket.send(JSON.stringify({ type: "move", payload: { move_uci: move } }));
  }

  function sendChat(message) {
    const activeSocket = socketRef.current;
    if (!activeSocket || activeSocket.readyState !== WebSocket.OPEN) return;
    activeSocket.send(JSON.stringify({ type: "chat", payload: { message } }));
  }

  async function handleReload() {
    setError("");
    try {
      const [gameData, movesData] = await Promise.all([
        getGame(gameId),
        getGameMoves(gameId)
      ]);
      setGame(gameData);
      setFen(resolveFen(gameData));
      setMoves(resolveMoves(movesData));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleResign() {
    setError("");
    try {
      const data = await resignGame(gameId);
      setGame(data);
      setFen(resolveFen(data, fen));
      setInfo(data?.result ?? data?.message ?? "Game resigned");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="game-layout">
      <div>
        <h1>Game #{gameId}</h1>
        <div className="game-toolbar">
          <span className="muted">
            {isLoading ? "Loading..." : game?.status ?? info}
            {game?.turn_color ? `, ${game.turn_color} to move` : ""}
            {playerColor ? `, you are ${playerColor}` : ""}
            {playerColor ? `, connection ${socketStatus}` : ""}
          </span>
          <button type="button" className="secondary-button" onClick={handleReload}>Reload</button>
          <button type="button" className="danger-button" onClick={handleResign}>Resign</button>
        </div>
        {error && <p className="error">{error}</p>}
        {isGameOver && (
          <section className="game-over-panel">
            <h2>Game over</h2>
            <p>{formatGameResult(game)}</p>
            <button type="button" onClick={() => navigate("/dashboard")}>
              Back to dashboard
            </button>
          </section>
        )}
        {!playerColor && currentUserId && !isLoading && (
          <p className="error">This account is not one of the players in this game.</p>
        )}
        {playerColor && socketStatus !== "connected" && !isGameOver && (
          <p className="muted">Waiting for live game connection...</p>
        )}
        <ChessBoard fen={fen} onMove={sendMove} playerColor={playerColor} isInteractive={canMove} />
      </div>
      <aside className="side-stack">
        <MoveHistory moves={moves} />
        <ChatBox messages={messages} onSend={sendChat} />
      </aside>
    </section>
  );
}

function appendMove(current, move) {
  if (!move) return current;
  if (move.id && current.some((item) => item.id === move.id)) return current;
  if (
    move.move_number &&
    current.some((item) => item.move_number === move.move_number && item.move_uci === move.move_uci)
  ) {
    return current;
  }
  return [...current, move];
}

function resolveFen(source, fallback = STARTING_FEN) {
  return source?.current_fen ?? source?.fen ?? source?.fen_after_move ?? fallback;
}

function resolveMoves(source) {
  if (Array.isArray(source)) return source;
  if (Array.isArray(source?.moves)) return source.moves;
  return [];
}

function formatGameResult(game) {
  if (game?.status === "aborted") return "Game aborted.";
  if (game?.status === "resigned") return game.result ?? "A player resigned.";
  if (game?.status === "white_win") return "White wins.";
  if (game?.status === "black_win") return "Black wins.";
  if (game?.status === "draw") return "Draw.";
  return game?.result ?? "Game finished.";
}

function resolvePlayerColor(game, userId) {
  if (!game?.players || !userId) return null;
  const player = game.players.find((item) => Number(item.user_id) === Number(userId));
  return player?.color ?? null;
}

function getUserIdFromToken(token) {
  if (!token) return null;
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(window.atob(normalized));
    return decoded.sub ? Number(decoded.sub) : null;
  } catch {
    return null;
  }
}
