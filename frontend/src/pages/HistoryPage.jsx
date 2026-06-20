import { useEffect, useState } from "react";

import { getMyHistory } from "../api/games.js";

export default function HistoryPage() {
  const [games, setGames] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyHistory()
      .then((data) => setGames(data?.games ?? []))
      .catch((err) => {
        setError(err.message);
        setGames([]);
      });
  }, []);

  return (
    <section>
      <h1>Game History</h1>
      <div className="panel">
        {error && <p className="error">{error}</p>}
        {games.length === 0 ? (
          <p className="muted">No games yet.</p>
        ) : (
          <div className="history-list">
            {games.map((game) => (
              <article key={game.id} className="history-row">
                <strong>Game #{game.id}</strong>
                <span>{game.result ?? game.status ?? "Unknown result"}</span>
                {game.started_at && <span className="muted">{new Date(game.started_at).toLocaleString()}</span>}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
