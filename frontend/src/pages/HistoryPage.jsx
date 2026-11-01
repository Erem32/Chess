import { useEffect, useState } from "react";

import { getMyHistory } from "../api/games.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function HistoryPage() {
  const { user } = useAuth();
  const [games, setGames] = useState(null);
  const [error, setError] = useState("");
  const [nextBeforeId, setNextBeforeId] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    getMyHistory()
      .then((data) => {
        if (!active) return;
        setGames(data?.games ?? []);
        setNextBeforeId(data?.next_before_id ?? null);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => { active = false; };
  }, [attempt]);

  async function loadMore() {
    if (loadingMore || nextBeforeId == null) return;
    setLoadingMore(true);
    setError("");
    try {
      const data = await getMyHistory({ beforeId: nextBeforeId });
      setGames((current) => [...current, ...(data?.games ?? [])]);
      setNextBeforeId(data?.next_before_id ?? null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <section>
      <h1>Game History</h1>
      <div className="panel history-panel">
        {error && <p className="error" role="alert">Could not load game history: {error}</p>}
        {error && games === null && (
          <button type="button" className="secondary-button" onClick={() => { setError(""); setAttempt((value) => value + 1); }}>
            Retry
          </button>
        )}
        {games === null && !error ? (
          <p className="muted" role="status">Loading game history...</p>
        ) : games === null ? null : games.length === 0 ? (
          <p className="muted">No games yet.</p>
        ) : (
          <div className="history-list panel-scroll">
            {games.map((game) => (
              <article key={game.id} className="history-row">
                <strong>Game #{game.id}</strong>
                <span className="history-side">{formatPlayerColor(game, user?.id)}</span>
                <span className={resolveHistoryStatusClass(game, user?.id)}>
                  {formatHistoryStatus(game, user?.id)}
                </span>
                <span className="muted">{formatGameDuration(game)}</span>
                {game.started_at && <span className="muted">{new Date(game.started_at).toLocaleString()}</span>}
              </article>
            ))}
          </div>
        )}
        {games !== null && nextBeforeId != null && (
          <button type="button" className="secondary-button" disabled={loadingMore} onClick={loadMore}>
            {loadingMore ? "Loading..." : error ? "Retry loading more" : "Load more"}
          </button>
        )}
      </div>
    </section>
  );
}

function formatHistoryStatus(game, userId) {
  const result = game?.result ?? "";
  const status = game?.status ?? "";
  const playerResult = resolvePlayerResult(game, userId);

  if (status === "waiting") return "Waiting for opponent";
  if (status === "active") return "Active";
  if (status === "aborted") return "Aborted";
  if (status === "resigned") {
    if (result === "white_wins_by_resignation" || result === "black_wins_by_resignation") {
      return playerResult === "win" ? "Won by resignation" : "Lost by resignation";
    }
    return "Resigned";
  }
  if (status === "white_win" || status === "black_win") {
    return playerResult === "win" ? "Won by checkmate" : "Lost by checkmate";
  }
  if (status === "draw") {
    if (result === "draw_agreed") return "Draw agreed";
    if (result === "draw_claimed_threefold") return "Draw claimed by repetition";
    if (result === "draw_claimed_fifty_move") return "Draw claimed under 50-move rule";
    if (result === "1/2-1/2") return "Draw on board";
    return "Draw";
  }

  return humanizeHistoryValue(result || status || "Unknown result");
}

function resolveHistoryStatusClass(game, userId) {
  if (game?.status === "aborted") return "history-status";
  const playerResult = resolvePlayerResult(game, userId);
  if (playerResult === "win") return "history-status history-status--win";
  if (playerResult === "loss") return "history-status history-status--loss";
  if (playerResult === "draw") return "history-status history-status--draw";
  if (game?.status === "active" || game?.status === "waiting") {
    return "history-status history-status--active";
  }
  return "history-status";
}

function resolvePlayerResult(game, userId) {
  if (!game?.players || !userId) return null;
  return game.players.find((player) => Number(player.user_id) === Number(userId))?.result ?? null;
}

function formatPlayerColor(game, userId) {
  if (!game?.players || !userId) return "Unknown";
  const color = game.players.find((player) => Number(player.user_id) === Number(userId))?.color;
  if (color === "white") return "White";
  if (color === "black") return "Black";
  return humanizeHistoryValue(color || "Unknown");
}

function formatGameDuration(game) {
  if (!game?.started_at) return "Unknown duration";

  const startedAt = new Date(game.started_at);
  const endedAt = game.finished_at ? new Date(game.finished_at) : null;
  if (Number.isNaN(startedAt.getTime())) return "Unknown duration";
  if (!endedAt || Number.isNaN(endedAt.getTime())) return "In progress";

  const totalSeconds = Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function humanizeHistoryValue(value) {
  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}
