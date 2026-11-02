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

function puzzleRequest(id, action, body) {
  return apiRequest(`/api/v1/practice/puzzles/${encodeURIComponent(id)}/${action}`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function submitPuzzleMove(id, moves, moveUci) {
  return puzzleRequest(id, "attempt", { moves, move_uci: moveUci });
}

export function getPuzzleHint(id, moves) {
  return puzzleRequest(id, "hint", { moves });
}

export function getPuzzleSolution(id, moves) {
  return puzzleRequest(id, "solution", { moves });
}
