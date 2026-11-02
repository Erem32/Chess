import { apiRequest } from "./client.js";

export function getLessons() {
  return apiRequest("/api/v1/practice/exercises?kind=lesson");
}

export function submitAttempt(id, moveUci) {
  return apiRequest(`/api/v1/practice/exercises/${encodeURIComponent(id)}/attempt`, {
    method: "POST",
    body: JSON.stringify({ move_uci: moveUci })
  });
}

export function getPuzzles() {
  return apiRequest("/api/v1/practice/exercises?kind=puzzle");
}

export function revealPuzzleSolution(id) {
  return apiRequest(`/api/v1/practice/exercises/${encodeURIComponent(id)}/solution`);
}
