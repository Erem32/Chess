const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:8000";

export function createGameSocket(gameId, token) {
  const query = token ? `?token=${encodeURIComponent(token)}` : "";
  const url = `${WS_URL}/ws/games/${gameId}${query}`;
  console.debug("createGameSocket", { gameId, url, hasToken: Boolean(token) });
  return new WebSocket(url);
}
