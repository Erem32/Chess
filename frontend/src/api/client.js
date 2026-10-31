import { getAuthToken } from "./session.js";

function isLocalBackendUrl(url) {
  try {
    const parsed = new URL(url);
    return ["localhost", "127.0.0.1"].includes(parsed.hostname) && parsed.port === "8000";
  } catch {
    return false;
  }
}

function normalizeApiUrl(url) {
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

function resolveDefaultApiUrl() {
  if (typeof window === "undefined") {
    return "http://127.0.0.1:8000";
  }

  const hostname = window.location.hostname === "localhost" ? "127.0.0.1" : window.location.hostname;
  return `${window.location.protocol}//${hostname}:8000`;
}

function resolveApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL;
  if (import.meta.env.DEV && (!configuredUrl || isLocalBackendUrl(configuredUrl))) {
    return "";
  }

  return normalizeApiUrl(configuredUrl ?? resolveDefaultApiUrl());
}

export const API_URL = resolveApiBaseUrl();

export async function apiRequest(path, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...(options.headers ?? {})
  };

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const data = await response.json();
      if (typeof data.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data.detail) && data.detail.length > 0) {
        message = data.detail.map((item) => item.msg ?? "Invalid request").join(", ");
      }
    } catch {
      // Keep the generic status message when the response is not JSON.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  return response.json();
}
