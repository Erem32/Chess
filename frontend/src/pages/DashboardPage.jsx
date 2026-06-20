import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getCurrentUser, getMyStats } from "../api/auth.js";
import {
  abortMyActiveGames,
  getMatchmakingStatus,
  getMyActiveGame,
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
      await abortMyActiveGames();
      setMatchmakingPending(false);
      setActiveGame(null);
      setStatus("Active game ended");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="dashboard-grid">
      <div>
        <h1>Dashboard</h1>
        <p className="muted">
          {user?.username ? `Signed in as ${user.username}` : "Ready for a game."}
        </p>
        {activeGame?.id && (
          <div className="panel active-game-panel">
            <h2>Active game</h2>
            <p className="muted">Game #{activeGame.id} is still open.</p>
            <div className="actions">
              <button type="button" onClick={() => navigate(`/games/${activeGame.id}`)}>
                Resume game
              </button>
              <button type="button" className="danger-button" onClick={handleEndActiveGame}>
                End active game
              </button>
            </div>
          </div>
        )}
        <div className="actions">
          <button type="button" onClick={handleJoinQueue} disabled={isJoining}>
            {isJoining ? "Joining..." : "Join matchmaking"}
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
        {status && <p>{status}</p>}
        {error && <p className="error">{error}</p>}
      </div>
      <div className="panel stats-panel">
        <h2>Stats</h2>
        <dl>
          <dt>Wins</dt><dd>{stats.wins}</dd>
          <dt>Losses</dt><dd>{stats.losses}</dd>
          <dt>Draws</dt><dd>{stats.draws}</dd>
          <dt>Games</dt><dd>{stats.games_played}</dd>
        </dl>
      </div>
    </section>
  );
}
