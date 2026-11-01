// History and live events can arrive in either order during reconnection.
export function mergeChatMessages(current, incoming) {
  const byId = new Map();
  for (const message of [...current, ...incoming]) {
    if (Number.isSafeInteger(message?.id) && message.id > 0) byId.set(message.id, message);
  }
  return [...byId.values()].sort((a, b) => a.id - b.id).slice(-100);
}

// Keep the current view if the server has no earlier messages.
export function olderChatPage(currentPage, incoming) {
  const page = mergeChatMessages([], incoming);
  return { page: page.length ? page : currentPage, hasOlder: page.length === 100 };
}
