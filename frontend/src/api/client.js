import { getAuthToken } from "./session.js";

export const API_URL = import.meta.env?.VITE_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

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
    throw new ApiError(message, response.status);
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
