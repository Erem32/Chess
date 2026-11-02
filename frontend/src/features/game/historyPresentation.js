import { humanizeGameValue, resolvePlayerResult } from "./gamePresentation.js";

export function historyOpponent(game, userId) {
  if (!userId || !Array.isArray(game?.players)) return "Opponent unavailable";
  const opponent = game.players.find((player) => Number(player.user_id) !== Number(userId));
  if (!opponent) return "Opponent unavailable";
  return opponent.username || (opponent.user_id != null ? `Player #${opponent.user_id}` : "Opponent unavailable");
}

export function historyDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function historyStatus(game, userId) {
  const result = game?.result ?? "";
  const status = game?.status ?? "";
  const playerResult = resolvePlayerResult(game, userId);
  if (status === "waiting") return "Waiting for opponent";
  if (status === "active") return "In progress";
  if (status === "aborted") return "Aborted";
  if (status === "resigned") {
    if (result === "white_wins_by_resignation" || result === "black_wins_by_resignation") {
      return playerResult === "win" ? "Won by resignation" : playerResult === "loss" ? "Lost by resignation" : "Resigned";
    }
    return "Resigned";
  }
  if (status === "white_win" || status === "black_win") {
    return playerResult === "win" ? "Won by checkmate" : playerResult === "loss" ? "Lost by checkmate" : "Checkmate";
  }
  if (status === "draw") {
    if (result === "draw_agreed") return "Draw agreed";
    if (result === "draw_claimed_threefold") return "Draw by repetition";
    if (result === "draw_claimed_fifty_move") return "Draw by 50-move rule";
    return "Draw";
  }
  return humanizeGameValue(result || status || "Unknown result");
}
