"use client";

import React, { useRef, useEffect } from "react";
import { UIMessage } from "ai";
import MessageBubble, { TypingBubble, ErrorBubble } from "./MessageBubble";

function parseErrorMessage(error: Error): string {
  let msg = "";
  try {
    msg = JSON.parse(error.message)?.error ?? error.message;
  } catch {
    msg = error.message;
  }
  if (
    msg?.includes("429") ||
    msg?.includes("quota") ||
    msg?.includes("limit") ||
    msg?.includes("RESOURCE_EXHAUSTED")
  ) {
    return "I'm a bit overwhelmed right now — my AI quota has been temporarily exceeded. Please wait a moment and try again.";
  }
  return msg || "Something went wrong. Please try again.";
}

interface ChatMessagesProps {
  messages: UIMessage[];
  isLoading: boolean;
  error: Error | undefined;
  onViewDetails: (productId: string, productName: string) => void;
}

export default function ChatMessages({
  messages,
  isLoading,
  error,
  onViewDetails,
}: ChatMessagesProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="chat-messages-container">
      {messages.map((message, idx) => (
        <MessageBubble
          key={message.id ?? `msg-${idx}`}
          message={message}
          allMessages={messages}
          onViewDetails={onViewDetails}
        />
      ))}

      {error && <ErrorBubble message={parseErrorMessage(error)} />}

      {isLoading && messages.at(-1)?.role === "user" && <TypingBubble />}

      <div ref={endRef} />
    </div>
  );
}
