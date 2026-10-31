const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export function reconnectDelay(attempt, random = Math.random) {
  const ceiling = Math.min(15000, 500 * 2 ** Math.min(attempt, 5));
  return Math.round(ceiling * (0.5 + 0.5 * random()));
}

// The API exposes game and moves separately. Do not apply a mixed snapshot if a
// move committed between those reads; reconnect and try again instead.
export async function fetchStableGameSnapshot(gameId, getGame, getMoves) {
  const before = (await getMoves(gameId)).moves;
  const game = await getGame(gameId);
  const after = (await getMoves(gameId)).moves;
  if (!Array.isArray(before) || !Array.isArray(after)) throw new Error("Invalid move history");
  const sameMoves = before.length === after.length && before.every((move, i) => move.id === after[i].id);
  const latestFen = after.length ? after[after.length - 1].fen_after_move : INITIAL_FEN;
  if (!sameMoves || game.current_fen !== latestFen) throw new Error("Game changed while synchronizing");
  return { game, moves: after };
}

export function classifyMove(move, lastMoveNumber) {
  const number = Number(move?.move_number);
  if (!Number.isInteger(number) || number < 1) return "gap";
  if (number <= lastMoveNumber) return "duplicate";
  return number === lastMoveNumber + 1 ? "next" : "gap";
}
