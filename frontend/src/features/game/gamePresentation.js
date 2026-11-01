export function resolveGameStatusClass(game, userId) {
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

export function resolvePlayerResult(game, userId) {
  if (!game?.players || !userId) return null;
  return game.players.find((player) => Number(player.user_id) === Number(userId))?.result ?? null;
}

export function formatPlayerColor(game, userId, fallback = "Unknown") {
  if (!game?.players || !userId) return fallback;
  const color = game.players.find((player) => Number(player.user_id) === Number(userId))?.color;
  if (color === "white") return "White";
  if (color === "black") return "Black";
  return humanizeGameValue(color || fallback);
}

export function formatGameDuration(game) {
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

export function humanizeGameValue(value) {
  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}
