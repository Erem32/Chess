import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getMyHistory } from "../api/games.js";
import LoadingPlaceholder from "../components/LoadingPlaceholder.jsx";
import StudyHeader from "../components/StudyHeader.jsx";
import UiIcon from "../components/UiIcon.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { formatGameDuration, formatPlayerColor, resolveGameStatusClass } from "../features/game/gamePresentation.js";
import { historyDate, historyOpponent, historyStatus } from "../features/game/historyPresentation.js";
import "./LessonsPage.css";
import "./HistoryPage.css";

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
      .catch((err) => { if (active) setError(err.message); });
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

  return <section className="study-page history-page">
    <StudyHeader eyebrow="YOUR GAMES" title="Game history" description="Your games, from the most recent onward." />
    <div className="history-archive">
      <div className="history-archive-header"><h2>All games</h2><span className="muted">Most recent first</span></div>
      {error && <p className="error" role="alert">Could not load game history: {error}</p>}
      {error && games === null && <button type="button" className="secondary-button" onClick={() => { setError(""); setAttempt((value) => value + 1); }}>Retry</button>}
      {games === null && !error ? <LoadingPlaceholder label="Loading game history" count={2} /> :
        games === null ? null : games.length === 0 ? <div className="history-empty">
          <span className="history-empty-icon"><UiIcon name="board" /></span>
          <h3>No games yet</h3><p className="muted">Your games will appear here after you play.</p>
          <Link to="/dashboard" className="history-empty-link">Find a game <UiIcon name="arrow" /></Link>
        </div> : <div className="history-list">
          {games.map((game) => {
            const color = formatPlayerColor(game, user?.id);
            const opponent = historyOpponent(game, user?.id);
            return <article key={game.id} className="history-row">
            <div className="history-game-icon" aria-hidden="true">{color === "Black" ? "♟" : color === "White" ? "♙" : <UiIcon name="board" />}</div>
            <div className="history-game-main"><strong>Game #{game.id}</strong><span className="history-opponent">{opponent === "Opponent unavailable" ? opponent : `vs ${opponent}`}</span></div>
            <span className={resolveGameStatusClass(game, user?.id)}>{historyStatus(game, user?.id)}</span>
            <div className="history-game-details"><span>{color === "Unknown" ? "Color unavailable" : `${color} pieces`}</span><span>{historyDate(game.started_at)}</span>{game.status !== "active" && game.status !== "waiting" && <span>{game.finished_at ? formatGameDuration(game) : "Unknown duration"}</span>}</div>
            <Link className="history-open" to={`/games/${game.id}`} aria-label={`${game.status === "active" || game.status === "waiting" ? "Resume" : "Open"} game ${game.id}`}>
              {game.status === "active" || game.status === "waiting" ? "Resume" : "Open"} <UiIcon name="arrow" />
            </Link>
          </article>;
          })}
        </div>}
      {games !== null && nextBeforeId != null && <div className="history-more"><button type="button" className="secondary-button" disabled={loadingMore} onClick={loadMore}>
        {loadingMore ? "Loading..." : error ? "Retry loading more" : "Load more"}
      </button></div>}
    </div>
  </section>;
}
