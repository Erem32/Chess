import { useEffect } from "react";

import { getGame } from "../../api/games.js";
import { createGameRefresh } from "./gamePolling.js";

// HTTP game actions still rely on polling until they publish live events.
export function useGamePolling({ gameId, loadedGameId, isGameOver, revisionRef, setGame }) {
  useEffect(() => {
    if (!loadedGameId || isGameOver) return undefined;

    const poll = createGameRefresh({ gameId, getGame, revisionRef, setGame });
    const intervalId = window.setInterval(poll.refresh, 2000);
    return () => {
      poll.dispose();
      window.clearInterval(intervalId);
    };
  }, [loadedGameId, gameId, isGameOver, revisionRef, setGame]);
}
