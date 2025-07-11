"use client";

import { useEffect } from 'react';

type MessageProps = {
  role: string;
  content: string;
  index: number;
};

export function Message({ role, content, index }: MessageProps) {
  const isUser = role === 'user';

  // Debug log when a message component renders
  useEffect(() => {
    console.log(`Message component rendered: ${role} at index ${index}`);
  }, [role, content, index]);
  
  // Ensure the content is always a string
  const messageContent = typeof content === 'string' ? content : JSON.stringify(content);
  
  if (!messageContent) {
    console.warn(`Empty content for message ${index} with role ${role}`);
  }

  return (
    <div
      style={{
        textAlign: isUser ? "right" : "left",
        marginBottom: "1rem",
        padding: "12px 16px",
        backgroundColor: isUser ? "#b3e5fc" : "#c8e6c9",
        borderRadius: "8px",
        maxWidth: "80%",
        marginLeft: isUser ? "auto" : "0",
        marginRight: isUser ? "0" : "auto",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        border: "1px solid " + (isUser ? "#81d4fa" : "#a5d6a7"),
        color: "#37474f"
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
        {isUser ? "You" : "AI"}
      </div>
      <div style={{ whiteSpace: 'pre-wrap' }}>{messageContent}</div>
    </div>
  );
}
