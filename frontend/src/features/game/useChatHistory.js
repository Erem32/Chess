import { useEffect, useRef, useState } from "react";

import { getGameChat } from "../../api/games.js";
import { olderChatPage } from "../../api/chatMessages.js";

// Keep older pages separate from the bounded live-message window.
export function useChatHistory(gameId, messages) {
  const requestRef = useRef(0);
  const currentGameRef = useRef(gameId);
  currentGameRef.current = gameId;
  const [olderMessages, setOlderMessages] = useState(null);
  const [olderAvailable, setOlderAvailable] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    // A live message can push an earlier message out of the latest window.
    if (olderMessages === null) setOlderAvailable(true);
  }, [messages[0]?.id, olderMessages]);

  useEffect(() => () => { requestRef.current += 1; }, []);

  function showLatest() {
    requestRef.current += 1;
    setOlderMessages(null);
    setOlderAvailable(true);
    setLoadingOlder(false);
    setHistoryError("");
  }

  async function loadOlder() {
    const displayed = olderMessages ?? messages;
    if (loadingOlder || !displayed.length || !olderAvailable) return;
    const gameAtRequest = gameId;
    const request = ++requestRef.current;
    setLoadingOlder(true);
    setHistoryError("");
    try {
      const data = await getGameChat(gameId, { beforeId: displayed[0].id });
      if (currentGameRef.current !== gameAtRequest || request !== requestRef.current) return;
      const result = olderChatPage(olderMessages, data.messages ?? []);
      setOlderMessages(result.page);
      setOlderAvailable(result.hasOlder);
    } catch {
      if (currentGameRef.current === gameAtRequest && request === requestRef.current) {
        setHistoryError("Could not load older messages. Try again.");
      }
    } finally {
      if (currentGameRef.current === gameAtRequest && request === requestRef.current) setLoadingOlder(false);
    }
  }

  return { olderMessages, olderAvailable, loadingOlder, historyError, loadOlder, showLatest };
}
