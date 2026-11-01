// Track in-flight sends separately from the socket so drafts survive uncertainty.
export function createPendingChat() {
  const pending = new Map();

  function settle(id, error) {
    const entry = pending.get(id);
    if (!entry) return false;
    pending.delete(id);
    clearTimeout(entry.timer);
    if (error) entry.reject(new Error(error));
    else entry.resolve();
    return true;
  }

  function rejectAll() {
    for (const id of pending.keys()) {
      settle(id, "Connection lost before confirmation. The message may have been delivered; check history before retrying.");
    }
  }

  function send(id, sendMessage) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        settle(id, "Message was not confirmed. It may have been delivered; check history before retrying.");
      }, 10000);
      pending.set(id, { resolve, reject, timer });
      try {
        sendMessage();
      } catch {
        settle(id, "Could not send message. Your draft has been kept.");
      }
    });
  }

  return { send, settle, rejectAll };
}
