import { mergeGameUpdate } from "../../api/gameSync.js";

// Ignore a response if a newer poll or live game event has superseded it.
export function createGameRefresh({ gameId, getGame, revisionRef, setGame }) {
  let active = true;
  let latestRequest = 0;

  async function refresh() {
    const revision = revisionRef.current;
    const request = ++latestRequest;
    try {
      const gameData = await getGame(gameId);
      if (active && request === latestRequest && revision === revisionRef.current) {
        setGame((current) => mergeGameUpdate(current, gameData));
      }
    } catch {
      // Keep current state on background refresh failures.
    }
  }

  return { refresh, dispose: () => { active = false; } };
}
