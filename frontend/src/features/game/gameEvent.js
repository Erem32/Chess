import { classifyMove } from "../../api/gameSync.js";

// Compatibility shapes are normalized here until the server and client share a versioned event contract.
export function normalizeGameEvent(data, lastMoveNumber) {
  const payload = data.payload ?? data;
  const game = payload.game ?? (payload.current_fen || payload.fen ? payload : null);
  const move = data.type === "move" || data.type === "move_made"
    ? payload.move ?? payload : payload.move ?? game?.move;
  // An unversioned initial game_state can predate the REST snapshot.
  if (!move) return { kind: "snapshot" };
  const kind = classifyMove(move, lastMoveNumber);
  if (kind !== "next") return { kind };
  const fen = move.current_fen ?? move.fen ?? move.fen_after_move
    ?? game?.current_fen ?? game?.fen ?? game?.fen_after_move ?? null;
  return { kind, game, move, fen };
}
