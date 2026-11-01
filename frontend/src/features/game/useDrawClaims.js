import { useEffect, useRef, useState } from "react";

import { getDrawClaimOptions, submitDrawClaim } from "../../api/games.js";

// A claim belongs to one position; ignore responses after the board changes.
export function useDrawClaims({ gameId, fen, gameStatus, revisionRef, setGame, setError, setInfo }) {
  const requestRef = useRef(0);
  const [options, setOptions] = useState(null);
  const [selectedMove, setSelectedMove] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    requestRef.current += 1;
    setOptions(null);
    setBusy(false);
    return () => { requestRef.current += 1; };
  }, [gameId, fen, gameStatus]);

  async function checkClaim() {
    const request = ++requestRef.current;
    setError("");
    setBusy(true);
    try {
      const result = await getDrawClaimOptions(gameId);
      if (request !== requestRef.current) return;
      setOptions(result);
      setSelectedMove(result.current_reasons.length ? "" : result.moves[0]?.uci ?? "");
    } catch (err) {
      if (request === requestRef.current) setError(err.message);
    } finally {
      if (request === requestRef.current) setBusy(false);
    }
  }

  async function claimDraw() {
    if (!options || busy) return;
    const request = ++requestRef.current;
    setError("");
    setBusy(true);
    try {
      const result = await submitDrawClaim(gameId, selectedMove || null);
      if (request !== requestRef.current) return;
      revisionRef.current += 1;
      setGame(result);
      setOptions(null);
      setInfo("Draw claimed");
    } catch (err) {
      if (request === requestRef.current) setError(err.message);
    } finally {
      if (request === requestRef.current) setBusy(false);
    }
  }

  return { options, selectedMove, setSelectedMove, busy, checkClaim, claimDraw, closeClaim: () => setOptions(null) };
}
