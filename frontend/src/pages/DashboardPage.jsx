import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { joinMatchmaking } from "../api/games.js";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("");

  async function handleJoinQueue() {
    setStatus("");
    const data = await joinMatchmaking();
    if (data.game_id) {
      navigate(`/games/${data.game_id}`);
      return;
    }
    setStatus(data.message ?? "Waiting for another player");
  }

  return (
    <section className="dashboard-grid">
      <div>
        <h1>Dashboard</h1>
        <p className="muted">Profile and statistics will appear here as the backend is implemented.</p>
        <button type="button" onClick={handleJoinQueue}>Join matchmaking</button>
        {status && <p>{status}</p>}
      </div>
      <div className="panel stats-panel">
        <h2>Stats</h2>
        <dl>
          <dt>Wins</dt><dd>0</dd>
          <dt>Losses</dt><dd>0</dd>
          <dt>Draws</dt><dd>0</dd>
          <dt>Games</dt><dd>0</dd>
        </dl>
      </div>
    </section>
  );
}
