"use client";

import { useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    { role: "system", content: "You are a helpful assistant." },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages }),
    });

    const data = await response.json();
    setMessages([...newMessages, data.reply]);
  };

  return (
    <div style={{ maxWidth: "600px", margin: "auto", padding: "1rem" }}>
      <div
        style={{
          border: "1px solid #ccc",
          padding: "1rem",
          height: "400px",
          overflowY: "auto",
          marginBottom: "1rem",
        }}
      >
        {messages
          .filter((msg) => msg.role !== "system")
          .map((msg, idx) => (
            <div
              key={idx}
              style={{
                textAlign: msg.role === "user" ? "right" : "left",
                marginBottom: "0.5rem",
              }}
            >
              <b>{msg.role}:</b> {msg.content}
            </div>
          ))}
      </div>
      <input
        type="text"
        value={input}
        placeholder="Type your message..."
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        style={{ width: "100%", padding: "0.5rem" }}
      />
      <button onClick={sendMessage} style={{ marginTop: "0.5rem" }}>
        Send
      </button>
    </div>
  );
}
