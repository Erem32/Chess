import { useLayoutEffect, useRef, useState } from "react";

export default function ChatBox({ messages = [], onSend, getAuthorLabel }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef(null);

  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const frameId = window.requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [messages.length]);

  async function handleSubmit(event) {
    event.preventDefault();
    const text = message.trim();
    if (!text || isSending) return;
    if (Array.from(text).length > 1000 || text.includes("\0")) {
      setError("Messages must be at most 1000 characters and cannot contain null bytes.");
      return;
    }
    setError("");
    setIsSending(true);
    try {
      if ((await onSend(text)) !== true) throw new Error("Message could not be confirmed. Please try again.");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Message could not be sent. Please try again.");
    } finally {
      setIsSending(false);
    }
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
        <input aria-label="Chat message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Message" disabled={isSending} />
        <button type="submit" disabled={isSending || !message.trim()}>{isSending ? "Sending..." : "Send"}</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}
