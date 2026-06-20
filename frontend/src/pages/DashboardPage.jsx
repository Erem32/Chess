import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getCurrentUser, getMyStats } from "../api/auth.js";
import {
  abortMyActiveGames,
  getMatchmakingStatus,
  getMyActiveGame,
  getMyHistory,
  joinMatchmaking,
  leaveMatchmaking
} from "../api/games.js";
import { useAuth } from "../context/AuthContext.jsx";

const EMPTY_STATS = {
  wins: 0,
  losses: 0,
  draws: 0,
  games_played: 0
};

const MATCHMAKING_PENDING_KEY = "matchmaking_pending";

function resolveGameId(data) {
  return data?.game_id ?? data?.game?.id ?? data?.id ?? null;
}

function isMatchmakingPending() {
  return sessionStorage.getItem(MATCHMAKING_PENDING_KEY) === "true";
}

function setMatchmakingPending(value) {
  if (value) {
    sessionStorage.setItem(MATCHMAKING_PENDING_KEY, "true");
    return;
  }
  sessionStorage.removeItem(MATCHMAKING_PENDING_KEY);
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [stats, setStats] = useState(EMPTY_STATS);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [activeGame, setActiveGame] = useState(null);
  const [recentGames, setRecentGames] = useState([]);
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    let active = true;

    getCurrentUser()
      .then((data) => {
        if (!active) return;
        if (data && !data.message) {
          setUser(data);
        }
      })
      .catch(() => {});

    getMyStats()
      .then((data) => {
        if (active) setStats({ ...EMPTY_STATS, ...(data ?? {}) });
      })
      .catch((err) => {
        if (active) setError(err.message);
      });

    getMyActiveGame()
      .then((data) => {
        if (!active) return;
        if (data?.id && isMatchmakingPending()) {
          setMatchmakingPending(false);
          navigate(`/games/${data.id}`);
          return;
        }
        setActiveGame(data?.id ? data : null);
      })
      .catch(() => {});

    getMatchmakingStatus()
      .then((data) => {
        if (!active) return;
        const gameId = resolveGameId(data);
        if (gameId && isMatchmakingPending()) {
          setMatchmakingPending(false);
          setIsWaiting(false);
          navigate(`/games/${gameId}`);
          return;
        }
        if (data?.status === "waiting" && isMatchmakingPending()) {
          setIsWaiting(true);
          setStatus("Waiting for another player");
        }
      })
      .catch(() => {});

    getMyHistory()
      .then((data) => {
        if (active) setRecentGames(data?.games ?? []);
      })
      .catch((err) => {
        if (active) setHistoryError(err.message);
      });

    return () => {
      active = false;
    };
  }, [navigate, setUser]);

  useEffect(() => {
    if (!isWaiting && !isMatchmakingPending()) return undefined;

    let active = true;

    async function checkMatchmakingStatus() {
      try {
        const data = await getMatchmakingStatus();
        if (!active) return;
        const gameId = resolveGameId(data);
        if (gameId) {
          setMatchmakingPending(false);
          setIsWaiting(false);
          setActiveGame(data.game ?? { id: gameId });
          navigate(`/games/${gameId}`);
          return;
        }
        if (data?.status === "idle") {
          setMatchmakingPending(false);
          setIsWaiting(false);
          setStatus("");
          return;
        }
        setStatus(data?.message ?? "Waiting for another player");
      } catch (err) {
        if (active) setError(err.message);
      }
    }

    checkMatchmakingStatus();
    const intervalId = window.setInterval(checkMatchmakingStatus, 1500);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [isWaiting, navigate]);

  async function handleJoinQueue() {
    setIsJoining(true);
    setStatus("");
    setError("");
    if (activeGame?.id) {
      setIsJoining(false);
      setError("End or resume your active game before joining matchmaking.");
      return;
    }
    try {
      setMatchmakingPending(true);
      const data = await joinMatchmaking();
      const gameId = resolveGameId(data);
      if (gameId) {
        setMatchmakingPending(false);
        navigate(`/games/${gameId}`);
        return;
      }
      const nextStatus = data?.status ?? data?.message ?? "Waiting for another player";
      const normalizedStatus = String(data?.status ?? nextStatus).toLowerCase();
      const waiting = normalizedStatus.includes("waiting") || normalizedStatus.includes("queued");
      setIsWaiting(waiting);
      setStatus(nextStatus);
    } catch (err) {
      setMatchmakingPending(false);
      setError(err.message);
    } finally {
      setIsJoining(false);
    }
  }

  async function handleCheckStatus() {
    setError("");
    try {
      const active = await getMyActiveGame();
      if (active?.id) {
        setActiveGame(active);
        setIsWaiting(false);
        if (isMatchmakingPending()) {
          setMatchmakingPending(false);
          navigate(`/games/${active.id}`);
          return;
        }
        setStatus("Active game found");
        return;
      }
      const data = await getMatchmakingStatus();
      const gameId = resolveGameId(data);
      if (gameId) {
        setMatchmakingPending(false);
        setIsWaiting(false);
        navigate(`/games/${gameId}`);
        return;
      }
      const nextStatus = data?.status ?? "idle";
      setIsWaiting(nextStatus === "waiting");
      setMatchmakingPending(nextStatus === "waiting");
      setStatus(nextStatus === "idle" ? "Not currently queued" : nextStatus);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleLeaveQueue() {
    setError("");
    try {
      const data = await leaveMatchmaking();
      setMatchmakingPending(false);
      setIsWaiting(false);
      setStatus(data?.message ?? "Left matchmaking");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEndActiveGame() {
    setError("");
    try {
      const data = await abortMyActiveGames();
      setMatchmakingPending(false);
      setActiveGame(null);
      if (data?.games) {
        setRecentGames((currentGames) => {
          const updatedGameIds = new Set(data.games.map((game) => game.id));
          return [...data.games, ...currentGames.filter((game) => !updatedGameIds.has(game.id))];
        });
      }
      setStatus("Active game ended");
    } catch (err) {
      setError(err.message);
    }
  }

  const totalGames = Number(stats.games_played ?? 0);
  const wins = Number(stats.wins ?? 0);
  const losses = Number(stats.losses ?? 0);
  const draws = Number(stats.draws ?? 0);
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
  const latestGames = recentGames.slice(0, 5);
  const statCards = [
    { label: "Games played", value: totalGames },
    { label: "Wins", value: wins },
    { label: "Losses", value: losses },
    { label: "Draws", value: draws },
    { label: "Win rate", value: `${winRate}%` }
  ];

  return (
    <section className="dashboard-page">
      <header className="panel dashboard-hero">
        <div>
          <p className="dashboard-eyebrow">Dashboard</p>
          <h1>{user?.username ? `Welcome, ${user.username}` : "Ready for a game"}</h1>
        </div>
        {activeGame?.id && (
          <button type="button" onClick={() => navigate(`/games/${activeGame.id}`)}>
            Resume game #{activeGame.id}
          </button>
        )}
      </header>

      <div className="dashboard-grid">
        <div className="dashboard-main">
          {activeGame?.id && (
            <section className="active-game-panel dashboard-active-game">
              <div>
                <h2>Active game</h2>
                <p className="muted">Game #{activeGame.id} is still open.</p>
              </div>
              <div className="actions dashboard-actions">
                <button type="button" onClick={() => navigate(`/games/${activeGame.id}`)}>
                  Resume game
                </button>
                <button type="button" className="danger-button" onClick={handleEndActiveGame}>
                  End active game
                </button>
              </div>
            </section>
          )}

          <section className="panel dashboard-card">
            <div className="dashboard-section-heading">
              <div>
                <h2>Find a game</h2>
              </div>
            </div>

            {isWaiting && (
              <div className="dashboard-searching">
                <strong>Searching for another player</strong>
                <p className="muted">We are checking for a match every few seconds.</p>
              </div>
            )}

            <div className="actions dashboard-actions">
              <button type="button" onClick={handleJoinQueue} disabled={isJoining || isWaiting}>
                {isJoining ? "Joining..." : isWaiting ? "Searching..." : "Join matchmaking"}
              </button>
              {isWaiting && (
                <button type="button" className="secondary-button" onClick={handleLeaveQueue}>
                  Leave queue
                </button>
              )}
              <button type="button" className="secondary-button" onClick={handleCheckStatus}>
                Check status
              </button>
            </div>
            {status && <p className="dashboard-status">{status}</p>}
            {error && <p className="error">{error}</p>}
          </section>

          <section className="panel dashboard-card">
            <div className="dashboard-section-heading">
              <div>
                <h2>Latest games</h2>
                <p className="muted">Your newest games from the existing game history.</p>
              </div>
              <button type="button" className="secondary-button" onClick={() => navigate("/history")}>
                View history
              </button>
            </div>

            {historyError ? (
              <p className="error">Could not load recent games: {historyError}</p>
            ) : latestGames.length === 0 ? (
              <p className="muted dashboard-empty-state">
                No games yet. Your active and completed games will appear here.
              </p>
            ) : (
              <div className="latest-games-list">
                {latestGames.map((game) => (
                  <article key={game.id} className="latest-game-row">
                    <div className="latest-game-copy">
                      <div className="latest-game-title">
                        <strong>Game #{game.id}</strong>
                        <span className={resolveLatestGameStatusClass(game, user?.id)}>
                          {formatLatestGameStatus(game, user?.id)}
                        </span>
                      </div>
                      <p className="muted latest-game-meta">
                        <span>{formatPlayerColor(game, user?.id)}</span>
                        <span>{formatGameDuration(game)}</span>
                        {game.started_at && <span>{formatGameDate(game.started_at)}</span>}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="secondary-button latest-game-action"
                      onClick={() => navigate(`/games/${game.id}`)}
                    >
                      Open
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="dashboard-sidebar">
          <section className="panel dashboard-card dashboard-stats-panel">
            <div className="dashboard-section-heading">
              <div>
                <h2>Stats</h2>
                <p className="muted">Based on completed games.</p>
              </div>
            </div>
            <div className="dashboard-stat-grid">
              {statCards.map((item) => (
                <div key={item.label} className="dashboard-stat-card">
                  <span className="muted">{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}

function formatLatestGameStatus(game, userId) {
  const status = game?.status ?? "";
  const playerResult = resolvePlayerResult(game, userId);

  if (status === "waiting") return "Waiting";
  if (status === "active") return "Active";
  if (status === "aborted") return "Aborted";
  if (playerResult === "win") return "Won";
  if (playerResult === "loss") return "Lost";
  if (playerResult === "draw") return "Draw";

  return humanizeDashboardValue(game?.result || status || "Unknown");
}

function resolveLatestGameStatusClass(game, userId) {
  const playerResult = resolvePlayerResult(game, userId);

  if (playerResult === "win") return "history-status history-status--win";
  if (playerResult === "loss") return "history-status history-status--loss";
  if (playerResult === "draw") return "history-status history-status--draw";
  if (game?.status === "active" || game?.status === "waiting") {
    return "history-status history-status--active";
  }
  if (game?.status === "aborted") return "history-status history-status--loss";
  return "history-status";
}

function resolvePlayerResult(game, userId) {
  if (!game?.players || !userId) return null;
  return game.players.find((player) => Number(player.user_id) === Number(userId))?.result ?? null;
}

function formatPlayerColor(game, userId) {
  if (!game?.players || !userId) return "Unknown color";
  const color = game.players.find((player) => Number(player.user_id) === Number(userId))?.color;
  if (color === "white") return "White";
  if (color === "black") return "Black";
  return humanizeDashboardValue(color || "Unknown color");
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

function formatGameDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short"
  });
}

function humanizeDashboardValue(value) {
  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}
