import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { acceptDraw, declineDraw, getGame, getGameMoves, offerDraw, resignGame } from "../api/games.js";
import { getAuthToken } from "../api/session.js";
import { createGameSocket } from "../api/websocket.js";
import CapturedPiecesPanel from "../components/CapturedPiecesPanel.jsx";
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
  const [mobilePanel, setMobilePanel] = useState("players");
  const isGameOver = game && game.status !== "active" && game.status !== "waiting";
  const socketToken = token ?? getAuthToken();
  const currentUserId = user?.id ?? getUserIdFromToken(socketToken);
  const playerColor = resolvePlayerColor(game, currentUserId);
  const playerNamesById = buildPlayerNamesById(game);
  const playerSummary = buildPlayerSummary(game, currentUserId);
  const canConnect = Boolean(socketToken);
  const canOpenSocket = canConnect && Boolean(game?.id);
  const canMove = !isGameOver && Boolean(playerColor) && socketStatus === "connected";
  const drawOfferByUserId = game?.draw_offer_by_user_id ?? null;
  const hasPendingDrawOffer = Boolean(drawOfferByUserId) && !isGameOver;
  const isOwnDrawOffer = hasPendingDrawOffer && Number(drawOfferByUserId) === Number(currentUserId);
  const canOfferDraw = Boolean(playerColor) && !isGameOver && !hasPendingDrawOffer;
  const canRespondToDraw = hasPendingDrawOffer && !isOwnDrawOffer;
  const feedback = resolveBoardFeedback({
    currentUserId,
    error,
    isGameOver,
    isLoading,
    playerColor,
    socketStatus
  });

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
    if (!game?.id || isGameOver) return undefined;

    let active = true;

    async function refreshGameOnly() {
      try {
        const gameData = await getGame(gameId);
        if (active) setGame(gameData);
      } catch {
        // Keep current state on background refresh failures.
      }
    }

    const intervalId = window.setInterval(refreshGameOnly, 2000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [game?.id, gameId, isGameOver]);

  useEffect(() => {
    if (!canOpenSocket) return undefined;

    let active = true;
    let opened = false;
    console.debug("GamePage websocket effect", {
      gameId,
      socketAttempt,
        socketTokenPresent: Boolean(socketToken),
        currentUserId,
        playerColor,
        canConnect,
        canOpenSocket,
      gameIdFromState: game?.id,
    });

    if (!socketToken) {
      console.warn("GamePage websocket skipped because no socket token was available", {
        gameId,
        socketAttempt,
        currentUserId,
        playerColor,
        canConnect,
      });
      setSocketStatus("disconnected");
      setError("No active login session. Log in again before opening the game.");
      return undefined;
    }

    if (socketRef.current && socketRef.current.readyState !== WebSocket.CLOSED && socketRef.current.readyState !== WebSocket.CLOSING) {
      console.debug("GamePage websocket already active, skipping duplicate connect", {
        gameId,
        socketAttempt,
        readyState: socketRef.current.readyState,
      });
      return undefined;
    }

    setSocketStatus("connecting");
    const ws = createGameSocket(gameId, socketToken);
    socketRef.current = ws;
    ws.onopen = () => {
      opened = true;
      console.info("GamePage websocket open", { gameId, socketAttempt, currentUserId, playerColor });
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
    ws.onerror = (event) => {
      console.warn("GamePage websocket error", { gameId, socketAttempt, event });
      if (active && socketRef.current === ws) {
        setSocketStatus("disconnected");
        setError("Game connection failed. Retrying...");
      }
    };
    ws.onclose = (event) => {
      console.info("GamePage websocket close", { gameId, socketAttempt, event, opened });
      if (!active || socketRef.current !== ws) return;
      setSocketStatus("disconnected");
      setInfo("Disconnected");
      if (event.code === 1008) {
        setError("This browser is not authorized for this game. Log out and sign in with the account that joined it.");
        return;
      }
      if (opened) {
        reconnectTimerRef.current = window.setTimeout(() => {
          setSocketAttempt((current) => current + 1);
        }, 1200);
      } else {
        console.warn("GamePage websocket closed before open, not attempting reconnect", {
          gameId,
          socketAttempt,
          event,
        });
      }
    };
    return () => {
      console.info("GamePage websocket cleanup", { gameId, socketAttempt, currentUserId });
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
  }, [canOpenSocket, gameId, socketAttempt, socketToken]);

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

  async function handleOfferDraw() {
    setError("");
    try {
      const data = await offerDraw(gameId);
      setGame(data);
      setInfo("Draw offer sent");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAcceptDraw() {
    setError("");
    try {
      const data = await acceptDraw(gameId);
      setGame(data);
      setInfo("Draw agreed");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeclineDraw() {
    setError("");
    try {
      const data = await declineDraw(gameId);
      setGame(data);
      setInfo("Draw offer declined");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="game-layout">
      <aside className="game-side-column desktop-game-sidebar">
        <PlayerSummaryPanel playerSummary={playerSummary} />
        <ChatBox
          messages={messages}
          onSend={sendChat}
          getAuthorLabel={(message) => playerNamesById[message.user_id] ?? resolvePlayerChatLabel(game, message.user_id)}
        />
      </aside>
      <div className="game-board-column">
        {isGameOver && (
          <section className="game-over-panel">
            <h2>Game over</h2>
            <p>{formatGameResult(game)}</p>
            <button type="button" onClick={() => navigate("/dashboard")}>
              Back to dashboard
            </button>
          </section>
        )}
        <ChessBoard fen={fen} onMove={sendMove} playerColor={playerColor} isInteractive={canMove} />
        <CapturedPiecesPanel fen={fen} playerColor={playerColor} />
        <section className={`panel board-feedback-panel ${feedback ? `is-${feedback.tone}` : "is-empty"}`}>
          {feedback ? (
            <p className={feedback.tone === "error" ? "error" : "muted"}>{feedback.message}</p>
          ) : (
            <p className="muted">Status ready.</p>
          )}
        </section>
        <section className="mobile-game-nav" aria-label="Game panels">
          <button
            type="button"
            className={`secondary-button mobile-game-nav-button ${mobilePanel === "players" ? "is-active" : ""}`}
            onClick={() => setMobilePanel("players")}
          >
            Players
          </button>
          <button
            type="button"
            className={`secondary-button mobile-game-nav-button ${mobilePanel === "moves" ? "is-active" : ""}`}
            onClick={() => setMobilePanel("moves")}
          >
            Moves
          </button>
          <button
            type="button"
            className={`secondary-button mobile-game-nav-button ${mobilePanel === "chat" ? "is-active" : ""}`}
            onClick={() => setMobilePanel("chat")}
          >
            Chat
          </button>
        </section>
        <section className="mobile-game-panel">
          {mobilePanel === "players" && (
            <>
              <PlayerSummaryPanel playerSummary={playerSummary} />
              <GameActionPanel
                canOfferDraw={canOfferDraw}
                canRespondToDraw={canRespondToDraw}
                onAcceptDraw={handleAcceptDraw}
                onDeclineDraw={handleDeclineDraw}
                onOfferDraw={handleOfferDraw}
                onResign={handleResign}
              />
              <DrawOfferPanel
                drawOfferByUserId={drawOfferByUserId}
                hasPendingDrawOffer={hasPendingDrawOffer}
                isOwnDrawOffer={isOwnDrawOffer}
                playerNamesById={playerNamesById}
              />
            </>
          )}
          {mobilePanel === "moves" && <MoveHistory moves={moves} />}
          {mobilePanel === "chat" && (
            <ChatBox
              messages={messages}
              onSend={sendChat}
              getAuthorLabel={(message) => playerNamesById[message.user_id] ?? resolvePlayerChatLabel(game, message.user_id)}
            />
          )}
        </section>
      </div>
      <aside className="game-side-column desktop-game-sidebar">
        <MoveHistory moves={moves} />
        <GameActionPanel
          canOfferDraw={canOfferDraw}
          canRespondToDraw={canRespondToDraw}
          onAcceptDraw={handleAcceptDraw}
          onDeclineDraw={handleDeclineDraw}
          onOfferDraw={handleOfferDraw}
          onResign={handleResign}
        />
        <DrawOfferPanel
          drawOfferByUserId={drawOfferByUserId}
          hasPendingDrawOffer={hasPendingDrawOffer}
          isOwnDrawOffer={isOwnDrawOffer}
          playerNamesById={playerNamesById}
        />
      </aside>
    </section>
  );
}

function PlayerSummaryPanel({ playerSummary }) {
  return (
    <section className="panel player-summary-panel">
      <h2>Players</h2>
      {playerSummary.length === 0 ? (
        <p className="muted">Player names unavailable.</p>
      ) : (
        <div className="player-summary-list">
          {playerSummary.map((player) => (
            <p key={player.user_id} className="player-summary-row">
              <span className="player-summary-name">{player.name}</span>
              <span className="player-summary-rating">({player.ratingLabel})</span>
            </p>
          ))}
        </div>
      )}
    </section>
  );
}

function GameActionPanel({
  canOfferDraw,
  canRespondToDraw,
  onAcceptDraw,
  onDeclineDraw,
  onOfferDraw,
  onResign
}) {
  return (
    <div className="panel button-panel">
      <div className="actions">
        <button type="button" className="danger-button" onClick={onResign}>
          <span aria-hidden="true">🏁</span> Resign
        </button>
      </div>
      <div className="actions">
        {canOfferDraw && (
          <button type="button" className="secondary-button" onClick={onOfferDraw}>½ Offer draw</button>
        )}
        {canRespondToDraw && (
          <>
            <button type="button" className="secondary-button" onClick={onAcceptDraw}>½ Accept draw</button>
            <button type="button" className="danger-button" onClick={onDeclineDraw}>Decline</button>
          </>
        )}
      </div>
    </div>
  );
}

function DrawOfferPanel({ drawOfferByUserId, hasPendingDrawOffer, isOwnDrawOffer, playerNamesById }) {
  if (!hasPendingDrawOffer) return null;

  return (
    <section className="panel draw-offer-panel">
      <p className="muted draw-offer-copy">
        {isOwnDrawOffer
          ? "½ Draw offered. Waiting for opponent response."
          : `½ ${playerNamesById[drawOfferByUserId] ?? "Opponent"} offered a draw.`}
      </p>
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

function buildPlayerNamesById(game) {
  if (!game?.players) return {};
  return Object.fromEntries(
    game.players
      .filter((player) => player?.user_id)
      .map((player) => [player.user_id, player.username ?? player.color ?? `Player ${player.user_id}`])
  );
}

function resolvePlayerChatLabel(game, userId) {
  if (!game?.players || !userId) return `#${userId}`;
  const player = game.players.find((item) => Number(item.user_id) === Number(userId));
  if (!player) return `#${userId}`;
  return player.username ?? player.color ?? `#${userId}`;
}

function buildPlayerSummary(game, currentUserId) {
  if (!game?.players) return [];

  const players = game.players.map((player) => ({
    user_id: player.user_id,
    isCurrentUser: Number(player.user_id) === Number(currentUserId),
    name: player.username ?? player.color ?? `Player ${player.user_id}`,
    ratingLabel: "Unrated"
  }));

  players.sort((left, right) => Number(right.isCurrentUser) - Number(left.isCurrentUser));
  return players;
}

function resolveBoardFeedback({ currentUserId, error, isGameOver, isLoading, playerColor, socketStatus }) {
  if (error) {
    return { message: error, tone: "error" };
  }
  if (!playerColor && currentUserId && !isLoading) {
    return { message: "This account is not one of the players in this game.", tone: "error" };
  }
  if (playerColor && socketStatus !== "connected" && !isGameOver) {
    return { message: "Waiting for live game connection...", tone: "muted" };
  }
  return null;
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
