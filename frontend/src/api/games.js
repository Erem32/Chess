import { apiRequest } from "./client.js";

export function joinMatchmaking() {
  return apiRequest("/api/v1/matchmaking/join", { method: "POST" });
}

export function getGame(gameId) {
  return apiRequest(`/api/v1/games/${gameId}`);
}

export function getGameMoves(gameId) {
  return apiRequest(`/api/v1/games/${gameId}/moves`);
}

export function getMyHistory() {
  return apiRequest("/api/v1/games/my-history");
}
