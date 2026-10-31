import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { acceptDraw, declineDraw, getGame, getGameChat, getGameMoves, offerDraw, resignGame } from "../api/games.js";
import { getAuthToken } from "../api/session.js";
import { mergeChatMessages } from "../api/chatMessages.js";
import { classifyMove, fetchStableGameSnapshot, reconnectDelay } from "../api/gameSync.js";
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
  const retryCountRef = useRef(0);
  const lastMoveNumberRef = useRef(0);
  const revisionRef = useRef(0);
  const refreshRequestRef = useRef(0);
  const pendingChatRef = useRef(new Map());
  const currentGameRef = useRef(gameId);
  currentGameRef.current = gameId;
  const [fen, setFen] = useState(STARTING_FEN);
  const [game, setGame] = useState(null);
  const [moves, setMoves] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatDraft, setChatDraft] = useState("");
  const [chatError, setChatError] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);
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
  const canOpenSocket = canConnect && String(game?.id) === String(gameId);
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
      setGame(null);
      setFen(STARTING_FEN);
      setMoves([]);
      setMessages([]);
      setChatDraft("");
      setChatError("");
      setChatSending(false);
      lastMoveNumberRef.current = 0;
      retryCountRef.current = 0;
      revisionRef.current += 1;
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
  }, [gameId, loadAttempt]);

  useEffect(() => {
    if (!game?.id || isGameOver) return undefined;

    let active = true;

    async function refreshGameOnly() {
      const revision = revisionRef.current;
      const request = ++refreshRequestRef.current;
      try {
        const gameData = await getGame(gameId);
        if (active && request === refreshRequestRef.current && revision === revisionRef.current) setGame(gameData);
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
    let synchronized = false;
    let authorized = true;
    let stableSince = 0;
    const queuedGameMessages = [];
    setSocketStatus("connecting");
    const ws = createGameSocket(gameId, socketToken);
    socketRef.current = ws;

    function applyGameMessage(data) {
      const payload = data.payload ?? data;
      const nextGame = payload.game ?? (payload.current_fen || payload.fen ? payload : null);
      const nextMove = data.type === "move" || data.type === "move_made"
        ? payload.move ?? payload : payload.move ?? nextGame?.move;
      // The server's initial unversioned game_state can predate our REST snapshot.
      if (!nextMove) return;
      const classification = classifyMove(nextMove, lastMoveNumberRef.current);
      if (classification === "duplicate") return;
      if (classification === "gap") {
        setError("Game updates were missed. Reconnecting to synchronize...");
        ws.close();
        return;
      }
      lastMoveNumberRef.current = Number(nextMove.move_number);
      revisionRef.current += 1;
      if (nextGame) setGame((current) => ({ ...(current ?? {}), ...nextGame }));
      const nextFen = resolveFen(nextMove, resolveFen(nextGame, null));
      if (nextFen) setFen(nextFen);
      setMoves((current) => appendMove(current, nextMove));
      setError("");
    }

    ws.onopen = async () => {
      if (!active || socketRef.current !== ws) return;
      setSocketStatus("syncing");
      setInfo("Synchronizing game...");
      getGameChat(gameId).then((data) => {
        if (active && socketRef.current === ws) {
          setMessages((current) => mergeChatMessages(current, data.messages ?? []));
        }
      }).catch(() => {
        if (active && socketRef.current === ws) setChatError("Could not load chat history. Reconnect to try again.");
      });
      try {
        const snapshot = await fetchStableGameSnapshot(gameId, getGame, getGameMoves);
        if (!active || socketRef.current !== ws || ws.readyState !== WebSocket.OPEN) return;
        lastMoveNumberRef.current = snapshot.moves.length
          ? Number(snapshot.moves[snapshot.moves.length - 1].move_number) : 0;
        revisionRef.current += 1;
        setGame(snapshot.game);
        setFen(resolveFen(snapshot.game));
        setMoves(snapshot.moves);
        synchronized = true;
        for (const message of queuedGameMessages) {
          if (ws.readyState !== WebSocket.OPEN) return;
          applyGameMessage(message);
        }
        if (ws.readyState !== WebSocket.OPEN) return;
        stableSince = Date.now();
        setSocketStatus("connected");
        setInfo("Connected");
        setError("");
      } catch (err) {
        if (!active || socketRef.current !== ws) return;
        if (err.status === 401 || err.status === 403) {
          authorized = false;
          setError("Your session is not authorized for this game. Sign in again.");
        } else {
          setError("Could not synchronize game. Retrying...");
        }
        ws.close();
      }
    };
    ws.onmessage = (event) => {
      if (!active || socketRef.current !== ws) return;
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      const payload = data.payload ?? data;
      if (["game_state", "game_updated", "move", "move_made"].includes(data.type)) {
        if (synchronized) applyGameMessage(data);
        else queuedGameMessages.push(data);
      } else if (data.type === "chat") {
        setMessages((current) => mergeChatMessages(current, [payload]));
        if (Number(payload.user_id) === Number(currentUserId)) settleChat(payload.client_message_id, null);
      } else if (data.type === "info") {
        setInfo(payload.message ?? "Connected");
      } else if (data.type === "error") {
        if (!settleChat(payload.client_message_id, payload.message ?? "Message rejected")) {
          setError(payload.message ?? "WebSocket error");
        }
      }
    };
    ws.onerror = () => {
      if (active && socketRef.current === ws) setSocketStatus("disconnected");
    };
    ws.onclose = (event) => {
      if (!active || socketRef.current !== ws) return;
      rejectPendingChat();
      setSocketStatus("disconnected");
      setInfo("Disconnected");
      if (event.code === 1008 || !authorized) {
        setError("This browser is not authorized for this game. Log out and sign in with the account that joined it.");
        return;
      }
      if (stableSince && Date.now() - stableSince >= 30000) retryCountRef.current = 0;
      const delay = reconnectDelay(retryCountRef.current++);
      setError("Game connection lost. Retrying...");
      reconnectTimerRef.current = window.setTimeout(() => {
        setSocketAttempt((current) => current + 1);
      }, delay);
    };
    return () => {
      active = false;
      rejectPendingChat();
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (socketRef.current === ws) socketRef.current = null;
      ws.close();
    };
  }, [canOpenSocket, gameId, socketAttempt, socketToken]);

  function sendMove(move) {
    if (isGameOver) {
      setError("This game is over.");
      return;
    }
    const activeSocket = socketRef.current;
    if (socketStatus !== "connected" || !activeSocket || activeSocket.readyState !== WebSocket.OPEN) {
      setError("Game connection is still opening. Try again in a moment.");
      return;
    }
    setError("");
    activeSocket.send(JSON.stringify({ type: "move", payload: { move_uci: move } }));
  }

  function settleChat(id, error) {
    const pending = pendingChatRef.current.get(id);
    if (!pending) return false;
    pendingChatRef.current.delete(id);
    window.clearTimeout(pending.timer);
    if (error) pending.reject(new Error(error));
    else pending.resolve();
    return true;
  }

  function rejectPendingChat() {
    for (const id of pendingChatRef.current.keys()) {
      settleChat(id, "Connection lost before confirmation. The message may have been delivered; check history before retrying.");
    }
  }

  async function sendChat(message) {
    if (chatSending) return;
    if (Array.from(message).length > 1000 || message.includes("\0")) {
      setChatError("Messages must be at most 1000 characters and cannot contain null bytes.");
      return;
    }
    const activeSocket = socketRef.current;
    if (!activeSocket || activeSocket.readyState !== WebSocket.OPEN) {
      setChatError("Chat is disconnected. Your message has been kept.");
      return;
    }
    const gameAtSend = gameId;
    const id = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setChatError("");
    setChatSending(true);
    try {
      await new Promise((resolve, reject) => {
        const timer = window.setTimeout(() => {
          settleChat(id, "Message was not confirmed. It may have been delivered; check history before retrying.");
        }, 10000);
        pendingChatRef.current.set(id, { resolve, reject, timer });
        try {
          activeSocket.send(JSON.stringify({ type: "chat", payload: { message, client_message_id: id } }));
        } catch {
          settleChat(id, "Could not send message. Your draft has been kept.");
        }
      });
      if (currentGameRef.current === gameAtSend) setChatDraft("");
    } catch (err) {
      if (currentGameRef.current === gameAtSend) setChatError(err.message);
    } finally {
      if (currentGameRef.current === gameAtSend) setChatSending(false);
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
          message={chatDraft}
          onMessageChange={setChatDraft}
          isSending={chatSending}
          error={chatError}
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
          {!isLoading && !game && error && (
            <button type="button" onClick={() => setLoadAttempt((current) => current + 1)}>Retry loading game</button>
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
              message={chatDraft}
              onMessageChange={setChatDraft}
              isSending={chatSending}
              error={chatError}
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
  if (game?.status === "resigned") {
    if (game.result === "white_wins_by_resignation") return "White wins by resignation.";
    if (game.result === "black_wins_by_resignation") return "Black wins by resignation.";
    return "A player resigned.";
  }
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
    name: player.username ?? player.color ?? `Player ${player.user_id}`
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
