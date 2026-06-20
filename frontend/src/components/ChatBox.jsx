import { useLayoutEffect, useRef, useState } from "react";

export default function ChatBox({ messages = [], onSend, getAuthorLabel }) {
  const [message, setMessage] = useState("");
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
    if (!message.trim()) return;
    onSend(message.trim());
    setMessage("");
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
      <form onSubmit={handleSubmit} className="inline-form">
        <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Message" />
        <button type="submit">Send</button>
      </form>
    </section>
  );
}
