"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { AuthStatus } from "./components/auth-status";
import { Message } from "./components/message";

// Define message type for chat
type ChatMessage = {
  id?: string;
  role: string;
  content: string;
  createdAt?: Date;
  isPending?: boolean;
};

type Conversation = {
  id: string;
  title: string;
  createdAt: Date;
};

export default function Home() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  
  // State management
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "system", content: "You are a helpful assistant." },
  ]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMemoryNotice, setShowMemoryNotice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load conversations when component mounts or authentication status changes
  useEffect(() => {
    console.log("Auth status changed:", status);
    console.log("Current messages:", messages);
    
    if (isAuthenticated) {
      loadConversations();
    } else if (status === "unauthenticated") {
      // Reset state if not authenticated
      setConversations([]);
      
      // Initialize with a fresh system message
      if (messages.length <= 1) {
        console.log("Initializing messages for unauthenticated user");
        setMessages([{ role: "system", content: "You are a helpful assistant." }]);
      }
      
      // Show memory notice if they have messages
      if (messages.length > 1) {
        setShowMemoryNotice(true);
      }
    }
  }, [isAuthenticated, status]);

  // Load past conversations for the current user
  const loadConversations = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await fetch(`/api/conversations`);
      if (!response.ok) {
        console.error("Failed to load conversations:", response.status);
        return;
      }
      
      const data = await response.json();
      setConversations(data.conversations);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  };

  // Load a specific conversation
  const loadConversation = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/conversations/${id}`);
      if (!response.ok) return;
      
      const data = await response.json();
      setMessages(data.messages);
      setConversationId(id);
    } catch (error) {
      console.error("Failed to load conversation:", error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll to bottom of chat container when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Create a new conversation
  const newConversation = () => {
    setMessages([{ role: "system", content: "You are a helpful assistant." }]);
    setConversationId(null);
  };

  // Send a message and handle the response
  const sendMessage = async () => {
    // Don't process empty messages
    if (!input.trim()) return;
    
    // Clear any previous errors
    setError(null);
    
    // Store the current input before clearing it
    const userInput = input;
    setInput(""); // Clear input immediately
    
    // Create a user message object
    const userMessage: ChatMessage = { 
      role: "user", 
      content: userInput 
    };
    
    // Make a copy of the current messages to work with
    let currentMessages = [...messages];
    
    try {
      console.log("Starting with messages:", currentMessages.length);
      
      // 1. Add user message to our working copy and update UI
      currentMessages.push(userMessage);
      console.log("Added user message, now have:", currentMessages.length);
      
      // Update UI with the user message immediately
      setMessages([...currentMessages]);
      console.log("Updated UI with user message");
      
      // 2. Show loading state
      setLoading(true);
      
      // 3. Send request to API
      console.log("Sending to API:", currentMessages.map(m => ({ role: m.role, content: m.content?.substring(0, 20) })));
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: currentMessages,
          conversationId,
        }),
      });
      
      // 4. Process API response
      const data = await response.json();
      console.log("API response received:", data);
      
      if (!response.ok) {
        throw new Error(data.error || "Server error");
      }
      
      // 5. Create AI message from response
      if (!data.reply?.content) {
        throw new Error("Empty response from AI");
      }
      
      const aiMessage: ChatMessage = {
        role: "assistant",
        content: data.reply.content
      };
      console.log("Created AI message:", aiMessage.role, aiMessage.content?.substring(0, 20));
      
      // 6. Add AI message to working copy and update UI
      currentMessages.push(aiMessage);
      console.log("Final message count:", currentMessages.length);
      
      // IMPORTANT: Force a completely new array reference to trigger React re-render
      setMessages([...currentMessages]);
      console.log("UI updated with AI response");
      
      // 7. Save conversation ID if we got one
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
        if (isAuthenticated) loadConversations();
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Chat error:", errorMessage);
      setError(`Error: ${errorMessage}`);
      
      // Remove failed AI message if it was added
      setMessages(currentMessages => 
        currentMessages.filter(m => !(m.role === "assistant" && m.isPending))
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: "900px", 
      margin: "auto", 
      padding: "1.5rem",
      background: "linear-gradient(145deg,rgb(255, 255, 255) 0%,rgb(255, 255, 255) 100%)",
      borderRadius: "15px",
      boxShadow: "0 4px 16px rgba(44, 62, 80, 0.07)",
      position: "relative",
      color: "#2c3e50"
    }}>

      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "0.75rem",
        borderBottom: "1px solid #bcdffb",
        paddingBottom: "0.5rem"
      }}>
        <div>
          <h1 style={{
            fontSize: "3rem",
            fontWeight: "700",
            marginBottom: "0.2rem",
            background: "linear-gradient(90deg, #4db6ac 0%, #80cbc4 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: "0 2px 8px rgba(59, 130, 246, 0.08)"
          }}>AI Chatbot</h1>
          {!isAuthenticated && (
            <p style={{
              fontSize: "1.2rem",
              color: "#3b82f6",
              fontStyle: "italic"
            }}>
              Sign in to save your conversation history
            </p>
          )}
        </div>
        <AuthStatus />
      </div>
      
      {showMemoryNotice && !isAuthenticated && (
        <div style={{
          marginBottom: "1rem",
          padding: "0.8rem",
          background: "linear-gradient(145deg, #f7fafc 0%, #e3eaf6 100%)",
          border: "1px solid #80cbc4",
          borderRadius: "10px",
          boxShadow: "0 2px 8px rgba(44, 62, 80, 0.07)",
          position: "relative",
          overflow: "hidden"
        }}>
          <p style={{ fontSize: "0.95rem", color: "#2d3748" }}>Your conversation won't be saved unless you sign in.</p>
          <button 
            onClick={() => setShowMemoryNotice(false)}
            style={{
              fontSize: "0.8rem",
              color: "#26a69a",
              background: "transparent",
              border: "none",
              padding: "4px 8px",
              marginLeft: "8px",
              cursor: "pointer",
              textDecoration: "underline"
            }}
          >
            Dismiss
          </button>
        </div>
      )}
      
      {loading && (
        <div style={{
          textAlign: "center",
          padding: "0.5rem 1.2rem",
          background: "linear-gradient(90deg, #3f51b5 0%, #5c6bc0 100%)",
          color: "white",
          borderRadius: "20px",
          fontSize: "0.9rem",
          fontWeight: "bold",
          boxShadow: "0 2px 8px rgba(44, 62, 80, 0.07)",
          marginBottom: "1rem",
          animation: "pulse 1.5s infinite",
          display: "inline-block",
          position: "relative",
          left: "50%",
          transform: "translateX(-50%)"
        }}>
          Thinking...
        </div>
      )}
            <div style={{ display: "flex", gap: "1.5rem" }}>
        {/* Sidebar with conversation history - only shown for authenticated users */}
        {isAuthenticated && (
          <div style={{ 
            width: "250px", 
            borderRight: "none", 
            padding: "0.8rem",
            background: "rgba(255, 255, 255, 0.5)",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(44, 62, 80, 0.07)"
          }}>
            <button 
              onClick={newConversation}
              style={{
                width: "100%",
                padding: "0.7rem",
                marginBottom: "1.2rem",
                background: "linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                color: "#222e3a",
                fontWeight: "bold",
                fontSize: "1rem",
                boxShadow: "0 2px 8px rgba(44, 62, 80, 0.07)",
                transition: "all 0.2s ease"
              }}
            >
              New Chat
            </button>
            
            <div style={{ 
              overflowY: "auto", 
              maxHeight: "500px", 
              paddingRight: "5px"
            }}>
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  style={{
                    padding: "0.8rem",
                    margin: "0.5rem 0",
                    borderRadius: "10px",
                    background: conversationId === conv.id ? 
                      "linear-gradient(135deg, #e3eaf6 0%, #bcdffb 100%)" : 
                      "#fff",
                    cursor: "pointer",
                    border: conversationId === conv.id ? 
                      "1px solid #3b82f6" : 
                      "1px solid #e5e7eb",
                    boxShadow: conversationId === conv.id ? 
                      "0 2px 8px rgba(44, 62, 80, 0.07)" : 
                      "0 1px 2px rgba(44, 62, 80, 0.03)",
                    transition: "all 0.2s ease"
                  }}
                >
                  {conv.title || "Untitled"}
                  <div style={{ 
                    fontSize: "0.75rem", 
                    color: conversationId === conv.id ? "#2563eb" : "#64748b",
                    marginTop: "4px"
                  }}>
                    {new Date(conv.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Main chat area - flex grows to fill space when sidebar is not present */}
        <div style={{ flex: 1 }}>
          <div
            ref={chatContainerRef}
            style={{
              background: "#fff",
              border: "none",
              borderRadius: "15px",
              padding: "1.5rem",
              height: "400px",
              overflowY: "auto",
              marginBottom: "1.5rem",
              position: "relative",
              boxShadow: "0 5px 15px rgba(77, 182, 172, 0.15)",
              backgroundImage: "none"
            }}
          >
            {error && (
              <div style={{
                position: "absolute",
                top: "15px",
                right: "15px",
                background: "linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)",
                color: "#b71c1c",
                padding: "0.5rem 1rem",
                borderRadius: "10px",
                fontSize: "0.9rem",
                fontWeight: "500",
                boxShadow: "0 4px 10px rgba(239, 154, 154, 0.3)",
                border: "1px solid #bcdffb",
                maxWidth: "80%",
              }}>
                {error}
              </div>
            )}
            
          
            {/* Different message display approaches based on authentication */}
            {isAuthenticated ? (
              /* Standard component approach for authenticated users */
              <div className="authenticated-messages" style={{ padding: "0.5rem" }}>
                {messages
                  .filter((msg) => msg.role !== "system")
                  .map((msg, idx) => (
                    <Message 
                      key={`msg-${idx}`} 
                      role={msg.role} 
                      content={typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)} 
                      index={idx} 
                    />
                  ))
                }
              </div>
            ) : (
              /* Direct HTML rendering for unauthenticated users */
              <div className="unauthenticated-messages" style={{ padding: "0.5rem" }}>
                {messages
                  .filter(msg => msg.role !== "system")
                  .map((msg, idx) => {
                    const isUser = msg.role === "user";
                    return (
                      <div 
                        key={`simple-msg-${idx}`}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: isUser ? "flex-end" : "flex-start",
                          marginBottom: "1.5rem",
                          width: "100%",
                          position: "relative",
                        }}
                      >
                        <div style={{ 
                          padding: "14px 20px",
                          background: isUser ? 
                            "linear-gradient(135deg, #bcdffb 0%, #e3eaf6 100%)" : 
                            "#fff",
                          color: isUser ? "#222e3a" : "#374151",
                          borderRadius: isUser ? "18px 18px 0 18px" : "18px 18px 18px 0",
                          maxWidth: "85%",
                          boxShadow: isUser ? 
                            "0 2px 8px rgba(44, 62, 80, 0.07)" : 
                            "0 1px 2px rgba(44, 62, 80, 0.03)",
                          border: isUser ? 
                            "1px solid #3b82f6" : 
                            "1px solid #e5e7eb",
                          position: "relative"
                        }}>
                          <div style={{ 
                            fontWeight: 'bold', 
                            marginBottom: '6px', 
                            color: isUser ? "#2563eb" : "#64748b",
                            fontSize: '0.9rem'
                          }}>
                            {isUser ? "You" : "AI Assistant"}
                          </div>
                          <div style={{ 
                            whiteSpace: 'pre-wrap',
                            lineHeight: '1.5',
                            fontSize: '1rem'
                          }}>
                            {typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}
                          </div>
                        </div>
                        <div style={{ 
                          fontSize: '0.7rem', 
                          color: '#64748b', 
                          marginTop: '4px',
                          marginLeft: isUser ? '0' : '10px',
                          marginRight: isUser ? '10px' : '0'
                        }}>
                          {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            )}
            

          </div>
          <div style={{ 
            display: 'flex',
            position: 'relative',
            alignItems: 'center',
            marginTop: '1rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            borderRadius: '25px',
            backgroundColor: '#f7fafc',
            padding: '5px'
          }}>
            <input
              type="text"
              value={input}
              placeholder="Type your message..."
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage()}
              style={{ 
                width: "100%", 
                padding: "0.9rem 1.2rem",
                fontSize: '1rem',
                border: 'none',
                outline: 'none',
                borderRadius: '25px',
                backgroundColor: 'transparent'
              }}
              disabled={loading}
            />
            <button 
              onClick={sendMessage} 
              style={{ 
                padding: "0.8rem 1.5rem",
                background: loading ? 
                  "linear-gradient(90deg, #e5e7eb 0%, #f3f4f6 100%)" : 
                  "linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)",
                color: "white",
                border: "none",
                borderRadius: "20px",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "bold",
                fontSize: "1rem",
                marginRight: '5px',
                boxShadow: loading ? "none" : "0 2px 8px rgba(44, 62, 80, 0.07)",
                transition: "all 0.2s ease"
              }}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </div>
          <style jsx global>{`
            @keyframes pulse {
              0% {
                opacity: 0.6;
                transform: translateX(-50%) scale(0.98);
              }
              50% {
                opacity: 1;
                transform: translateX(-50%) scale(1);
              }
              100% {
                opacity: 0.6;
                transform: translateX(-50%) scale(0.98);
              }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}
