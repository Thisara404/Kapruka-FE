"use client";

import React, { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Product } from "@/lib/types";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import CheckoutModal from "./CheckoutModal";

// Simple UUID generator to avoid dependencies
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const DEFAULT_GREETING_EN = `Hello! I'm **Thisari** — your Kapruka shopping assistant. Whether you're looking for the perfect birthday cake, a beautiful flower bouquet, or a thoughtful gift, I'm here to help!

What can I find for you today?`;

const DEFAULT_GREETING_SI = `ආයුබෝවන්! මම **තිසරි** — ඔබේ කප්රුක සාප්පු සහායක. උපන්දින කේක්, මල් කැකුළු, හෝ ලස්සන තෑග්ගක් සොයන්නේ නම්, මම මෙහි ඉන්නේ ඔබට උදව් කරන්න!

අද ඔබට මොනවද සොයන්නේ?`;

interface ChatWindowInnerProps {
  sessionId: string;
  initialLanguage: "en" | "si";
  session: any;
}

function ChatWindowInner({ sessionId, initialLanguage, session }: ChatWindowInnerProps) {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
  const [language, setLanguage] = useState<"en" | "si">(initialLanguage);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSetLanguage = (lang: "en" | "si") => {
    setLanguage(lang);
    localStorage.setItem("thisari_language", lang);

    // If the chat is completely fresh (only contains default welcome), update the welcome message language
    if (messages.length === 1 && messages[0].id === "welcome") {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          parts: [
            {
              type: "text",
              text: lang === "si" ? DEFAULT_GREETING_SI : DEFAULT_GREETING_EN,
            },
          ] as any,
        },
      ]);
    }
  };

  const [input, setInput] = useState("");

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    error,
  } = useChat({
    transport: new DefaultChatTransport({
      api: `${BACKEND_URL}/api/chat`,
      headers: {
        Authorization: session?.accessToken ? `Bearer ${session.accessToken}` : "",
      } as any,
      body: { sessionId },
    }),
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && status === "ready") {
      sendMessage({ text: input });
      setInput("");
    }
  };

  const isLoading = status === "submitted" || status === "streaming";

  // Load message history from DB on sessionId or user login set
  useEffect(() => {
    if (!sessionId) return;

    const fetchHistory = async () => {
      try {
        const url = `${BACKEND_URL}/api/chat/history?sessionId=${sessionId}`;
        const reqHeaders: Record<string, string> = {};
        if (session?.accessToken) {
          reqHeaders["Authorization"] = `Bearer ${session.accessToken}`;
        }
        const res = await fetch(url, { headers: reqHeaders });
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages);
          } else {
            // Prepopulate with welcome message
            setMessages([
              {
                id: "welcome",
                role: "assistant",
                parts: [
                  {
                    type: "text",
                    text: language === "si" ? DEFAULT_GREETING_SI : DEFAULT_GREETING_EN,
                  },
                ] as any,
              },
            ]);
          }
        }
      } catch (fetchError) {
        console.error("Failed to load chat history:", fetchError);
        // Still show welcome on failure
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            parts: [
              {
                type: "text",
                text: language === "si" ? DEFAULT_GREETING_SI : DEFAULT_GREETING_EN,
              },
            ] as any,
          },
        ]);
      } finally {
        setHistoryLoaded(true);
      }
    };

    fetchHistory();
  }, [sessionId, session?.user?.id, setMessages, language]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSuggestionClick = (text: string) => {
    if (status === "ready") {
      sendMessage({ text });
    }
  };

  const handleSelectProduct = (productId: string, productName: string) => {
    if (status === "ready") {
      sendMessage({ text: `I'd like to select ${productName} (ID: ${productId}). Can you check delivery options?` });
    }
  };

  const handleViewDetails = (productId: string, productName: string) => {
    if (status === "ready") {
      sendMessage({ text: `Show me more details for ${productName} (ID: ${productId}).` });
    }
  };

  const handleBuyNow = (product: Product) => {
    setCheckoutProduct(product);
  };

  const handleQuickOrderSuccess = (orderResult: any) => {
    setCheckoutProduct(null);
    // Insert a synthetic assistant message containing the order confirmation
    const toolCallId = `quick-order-${Date.now()}`;
    const confirmMsg: any = {
      id: toolCallId,
      role: "assistant",
      parts: [
        {
          type: "text",
          text: `Your order has been placed. Here are the details:`,
        },
        {
          type: "tool-invocation",
          toolCallId,
          toolName: "kapruka_create_order",
          state: "result",
          result: orderResult,
        },
      ],
    };
    setMessages((prev: any[]) => [...prev, confirmMsg]);
    // Open Kapruka payment portal in new tab
    if (orderResult?.checkout_url) {
      window.open(orderResult.checkout_url, "_blank", "noopener,noreferrer");
    }
  };

  const suggestions =
    language === "si"
      ? [
          { text: "චොකලට් තෑගි කූඩ සොයන්න", query: "search for chocolate gift basket" },
          { text: "කොළඹට මල් යවන්න", query: "I want to send flowers to Colombo" },
          { text: "උපන්දින කේක් තෝරන්න", query: "search for birthday cake" },
          { text: "ඇණවුම ලුහුබඳින්න", query: "I want to track my order" },
        ]
      : [
          { text: "Find a chocolate basket", query: "I'm looking for a chocolate gift basket" },
          { text: "Send flowers to Colombo", query: "I want to send flowers to someone in Colombo" },
          { text: "View birthday cakes", query: "Show me birthday cakes" },
          { text: "Track an order", query: "I want to track my order" },
        ];

  if (!historyLoaded) {
    return (
      <div className="chat-loading-screen animate-fade-in">
        <div className="chat-loading-spinner" />
        <p>Loading your conversation with Thisari...</p>
      </div>
    );
  }

  // Check if we only have the greeting message
  const showSuggestions = messages.length <= 1;

  // Custom UI friendly error message extractor
  let displayErrorMsg = "";
  if (error) {
    try {
      const parsed = JSON.parse(error.message);
      displayErrorMsg = parsed.error;
    } catch {
      displayErrorMsg = error.message;
    }
    if (displayErrorMsg?.includes("429") || displayErrorMsg?.includes("quota") || displayErrorMsg?.includes("limit") || displayErrorMsg?.includes("RESOURCE_EXHAUSTED")) {
      displayErrorMsg = "I'm a bit overwhelmed right now. My AI service quota has been temporarily exceeded. Please wait a moment and try again.";
    }
  }

  return (
    <div className="chat-window-container">
      <div className="chat-messages-container">
        {messages.map((message, idx) => (
          <MessageBubble
            key={message.id || `msg-${idx}`}
            message={message}
            allMessages={messages}
            onSelectProduct={handleSelectProduct}
            onViewDetails={handleViewDetails}
            onBuyNow={handleBuyNow}
          />
        ))}

        {/* Error display */}
        {error && (
          <div className="message-row assistant animate-fade-in">
            <div className="message-avatar-container">
              <div className="message-avatar">ති</div>
            </div>
            <div className="message-bubble-wrapper">
              <div className="message-author">Thisari</div>
              <div className="error-message-card">
                <span>!</span>
                <p>{displayErrorMsg || "Something went wrong. Please try sending your message again."}</p>
              </div>
            </div>
          </div>
        )}

        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="message-row assistant animate-fade-in">
            <div className="message-avatar-container">
              <div className="message-avatar">ති</div>
            </div>
            <div className="message-bubble-wrapper">
              <div className="message-author">Thisari</div>
              <TypingIndicator />
            </div>
          </div>
        )}

        {showSuggestions && (
          <div className="chat-suggestions-container animate-fade-in-up">
            <p className="suggestions-title">
              {language === "si" ? "මෙන්න අදහස් කිහිපයක්:" : "Here are some ideas to get started:"}
            </p>
            <div className="suggestions-grid">
              {suggestions.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(sug.query)}
                  className="suggestion-chip glass"
                >
                  {sug.text}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-sticky-bottom">
        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          language={language}
          setLanguage={handleSetLanguage}
        />
      </div>

      {checkoutProduct && (
        <CheckoutModal
          product={checkoutProduct}
          senderName={session?.user?.name || ""}
          accessToken={session?.accessToken}
          onClose={() => setCheckoutProduct(null)}
          onSuccess={handleQuickOrderSuccess}
        />
      )}
    </div>
  );
}

interface ChatWindowProps {
  session?: any;
}

export default function ChatWindow({ session }: ChatWindowProps) {
  const [sessionId, setSessionId] = useState<string>("");
  const [language, setLanguage] = useState<"en" | "si">("en");

  // Initialize or fetch sessionId
  useEffect(() => {
    let sid = localStorage.getItem("thisari_session_id");
    if (!sid) {
      sid = generateUUID();
      localStorage.setItem("thisari_session_id", sid);
    }
    setSessionId(sid);

    // Load language preference
    const lang = localStorage.getItem("thisari_language") as "en" | "si";
    if (lang) {
      setLanguage(lang);
    }
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
