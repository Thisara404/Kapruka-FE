"use client";

import React, { useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useChatHistory, makeWelcomeMessage } from "@/hooks/useChatHistory";
import ChatMessages from "./ChatMessages";
import ChatSuggestions from "./ChatSuggestions";
import ChatInput from "./ChatInput";

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ── Inner component (receives resolved sessionId + language) ─────────────────

interface ChatWindowInnerProps {
  sessionId: string;
  initialLanguage: "en" | "si";
  session: any;
}

function ChatWindowInner({
  sessionId,
  initialLanguage,
  session,
}: ChatWindowInnerProps) {
  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
  const [language, setLanguage] = useState<"en" | "si">(initialLanguage);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [input, setInput] = useState("");

  const { messages, setMessages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: `${BACKEND_URL}/api/chat`,
      headers: {
        Authorization: session?.accessToken
          ? `Bearer ${session.accessToken}`
          : "",
      } as any,
      body: { sessionId },
    }),
  });

  useChatHistory({
    sessionId,
    userId: session?.user?.id,
    language,
    accessToken: session?.accessToken,
    setMessages,
    setHistoryLoaded,
  });

  const handleLanguageChange = (lang: "en" | "si") => {
    setLanguage(lang);
    localStorage.setItem("thisari_language", lang);
    if (messages.length === 1 && messages[0].id === "welcome") {
      setMessages([makeWelcomeMessage(lang) as any]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setInput(e.target.value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && status === "ready") {
      sendMessage({ text: input });
      setInput("");
    }
  };

  const handleSend = (text: string) => {
    if (status === "ready") sendMessage({ text });
  };

  const handleViewDetails = (productId: string, productName: string) =>
    handleSend(`Show me more details for ${productName} (ID: ${productId}).`);

  const isLoading = status === "submitted" || status === "streaming";
  const showSuggestions = messages.length <= 1;

  if (!historyLoaded) {
    return (
      <div className="chat-loading-screen animate-fade-in">
        <div className="chat-loading-spinner" />
        <p>Loading your conversation with Thisari...</p>
      </div>
    );
  }

  return (
    <div className="chat-window-container">
      <ChatMessages
        messages={messages}
        isLoading={isLoading}
        error={error}
        onViewDetails={handleViewDetails}
      />

      {showSuggestions && (
        <ChatSuggestions language={language} onSelect={handleSend} />
      )}

      <div className="chat-input-sticky-bottom">
        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          language={language}
          setLanguage={handleLanguageChange}
        />
      </div>
    </div>
  );
}

// ── Outer component (handles localStorage init) ──────────────────────────────

interface ChatWindowProps {
  session?: any;
}

export default function ChatWindow({ session }: ChatWindowProps) {
  const [sessionId, setSessionId] = useState("");
  const [language, setLanguage] = useState<"en" | "si">("en");

  useEffect(() => {
    let sid = localStorage.getItem("thisari_session_id");
    if (!sid) {
      sid = generateUUID();
      localStorage.setItem("thisari_session_id", sid);
    }
    setSessionId(sid);
    const lang = localStorage.getItem("thisari_language") as "en" | "si";
    if (lang) setLanguage(lang);
  }, []);

  if (!sessionId) {
    return (
      <div className="chat-loading-screen animate-fade-in">
        <div className="chat-loading-spinner" />
        <p>Loading your conversation with Thisari...</p>
      </div>
    );
  }

  return (
    <ChatWindowInner
      sessionId={sessionId}
      initialLanguage={language}
      session={session}
    />
  );
}
