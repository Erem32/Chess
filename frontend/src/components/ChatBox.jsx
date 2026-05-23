import { useState } from "react";

export default function ChatBox({ messages = [], onSend }) {
  const [message, setMessage] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    if (!message.trim()) return;
    onSend(message.trim());
    setMessage("");
  }

  return (
    <section className="panel chat-panel">
      <h2>Chat</h2>
      <div className="chat-messages">
        {messages.map((item, index) => (
          <p key={item.id ?? index}>{item.message}</p>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="inline-form">
        <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Message" />
        <button type="submit">Send</button>
      </form>
    </section>
  );
}
