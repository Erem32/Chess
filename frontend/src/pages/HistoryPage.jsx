import { useEffect, useState } from "react";

import { getMyHistory } from "../api/games.js";

export default function HistoryPage() {
  const [games, setGames] = useState([]);

  useEffect(() => {
    getMyHistory().then((data) => setGames(data.games ?? [])).catch(() => setGames([]));
  }, []);

  return (
    <section>
      <h1>Game History</h1>
      <div className="panel">
        {games.length === 0 ? (
          <p className="muted">No games yet.</p>
        ) : (
          games.map((game) => <p key={game.id}>Game #{game.id}: {game.result ?? game.status}</p>)
        )}
      </div>
    </section>
  );
}
