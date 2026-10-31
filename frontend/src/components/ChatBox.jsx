import { useLayoutEffect, useRef } from "react";

export default function ChatBox({ messages = [], onSend, getAuthorLabel, message, onMessageChange, isSending, error }) {
  const scrollRef = useRef(null);

  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const frameId = window.requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [messages.length]);

  function handleSubmit(event) {
    event.preventDefault();
    if (message.trim() && !isSending) onSend(message.trim());
  }

  return (
    <section className="panel chat-panel">
      <h2>Chat</h2>
      <div className="panel-scroll chat-messages" ref={scrollRef}>
        {messages.length === 0 ? (
          <p className="muted">No messages yet.</p>
        ) : (
          messages.map((item, index) => (
            <p key={item.id ?? index}>
              {item.user_id && <span className="chat-author">{getAuthorLabel?.(item) ?? `#${item.user_id}`}: </span>}
              {item.message}
            </p>
          ))
        )}
      </div>
      <form onSubmit={handleSubmit} className="inline-form chat-form">
        <input aria-label="Chat message" value={message} onChange={(event) => onMessageChange(event.target.value)} placeholder="Message" disabled={isSending} />
        <button type="submit" disabled={isSending || !message.trim()}>{isSending ? "Sending..." : "Send"}</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}
