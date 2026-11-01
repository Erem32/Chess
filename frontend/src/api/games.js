import { apiRequest } from "./client.js";

export function joinMatchmaking() {
  return apiRequest("/api/v1/matchmaking/join", { method: "POST" });
}

export function getMatchmakingStatus() {
  return apiRequest("/api/v1/matchmaking/status");
}

export function leaveMatchmaking() {
  return apiRequest("/api/v1/matchmaking/leave", { method: "POST" });
}

export function getGame(gameId) {
  return apiRequest(`/api/v1/games/${gameId}`);
}

export function getMyActiveGame() {
  return apiRequest("/api/v1/games/my-active");
}

export function abortMyActiveGames() {
  return apiRequest("/api/v1/games/my-active/abort", { method: "POST" });
}

export function getGameMoves(gameId) {
  return apiRequest(`/api/v1/games/${gameId}/moves`);
}

export function getGameChat(gameId, { limit = 100, beforeId } = {}) {
  const query = new URLSearchParams({ limit: String(limit) });
  if (beforeId != null) query.set("before_id", String(beforeId));
  return apiRequest(`/api/v1/games/${gameId}/chat?${query}`);
}

export function resignGame(gameId) {
  return apiRequest(`/api/v1/games/${gameId}/resign`, { method: "POST" });
}

export function offerDraw(gameId) {
  return apiRequest(`/api/v1/games/${gameId}/draw-offer`, { method: "POST" });
}

export function getDrawClaimOptions(gameId) {
  return apiRequest(`/api/v1/games/${gameId}/draw-claims`);
}

export function submitDrawClaim(gameId, moveUci = null) {
  return apiRequest(`/api/v1/games/${gameId}/draw-claims`, {
    method: "POST",
    body: JSON.stringify({ move_uci: moveUci })
  });
}

export function acceptDraw(gameId) {
  return apiRequest(`/api/v1/games/${gameId}/draw-offer/accept`, { method: "POST" });
}

export function declineDraw(gameId) {
  return apiRequest(`/api/v1/games/${gameId}/draw-offer/decline`, { method: "POST" });
}

export function getMyHistory({ limit, beforeId } = {}) {
  const query = new URLSearchParams();
  if (limit != null) query.set("limit", String(limit));
  if (beforeId != null) query.set("before_id", String(beforeId));
  const suffix = query.size ? `?${query}` : "";
  return apiRequest(`/api/v1/games/my-history${suffix}`);
}
