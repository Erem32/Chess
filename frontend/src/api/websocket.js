function isLocalBackendUrl(url) {
  try {
    const parsed = new URL(url);
    return ["localhost", "127.0.0.1"].includes(parsed.hostname) && parsed.port === "8000";
  } catch {
    return false;
  }
}

function normalizeWsUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "localhost") {
      parsed.hostname = "127.0.0.1";
    }
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return url;
  }
}

function resolveDefaultWsUrl() {
  if (typeof window === "undefined") {
    return "ws://127.0.0.1:8000";
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const hostname = window.location.hostname === "localhost" ? "127.0.0.1" : window.location.hostname;
  return `${protocol}//${hostname}:8000`;
}

function resolveSameOriginWsUrl() {
  if (typeof window === "undefined") {
    return "ws://127.0.0.1:5173";
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}`;
}

function resolveWsBaseUrl() {
  const configuredUrl = import.meta.env.VITE_WS_URL;
  if (import.meta.env.DEV && (!configuredUrl || isLocalBackendUrl(configuredUrl))) {
    return resolveSameOriginWsUrl();
  }

  return normalizeWsUrl(configuredUrl ?? resolveDefaultWsUrl());
}

const WS_URL = resolveWsBaseUrl();

function buildGameSocketPath(gameId, token) {
  const query = token ? `?token=${encodeURIComponent(token)}` : "";
  return `/ws/games/${gameId}${query}`;
}

export function getGameSocketUrls(gameId, token) {
  const path = buildGameSocketPath(gameId, token);
  const urls = [new URL(path, `${WS_URL}/`).toString()];

  if (import.meta.env.DEV) {
    return urls;
  }

  try {
    const primary = new URL(urls[0]);
    if (primary.hostname === "127.0.0.1") {
      primary.hostname = "localhost";
      urls.push(primary.toString());
    } else if (primary.hostname === "localhost") {
      primary.hostname = "127.0.0.1";
      urls.push(primary.toString());
    }
  } catch {
    return urls;
  }

  return [...new Set(urls)];
}

export function createGameSocket(url) {
  return new WebSocket(url);
}
