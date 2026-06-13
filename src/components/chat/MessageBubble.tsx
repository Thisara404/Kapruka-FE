"use client";

import React from "react";
import { UIMessage } from "ai";
import MarkdownContent from "./MarkdownContent";
import ToolOutputRenderer from "./ToolOutputRenderer";
import TypingIndicator from "./TypingIndicator";

interface MessageBubbleProps {
  message: UIMessage;
  allMessages: UIMessage[];
  onViewDetails?: (productId: string, productName: string) => void;
  createdAt?: Date | string;
}

export default function MessageBubble({
  message,
  allMessages,
  onViewDetails,
  createdAt,
}: MessageBubbleProps) {
  const role = message?.role as string;
  if (!message || !role || role === "tool" || role === "system") return null;

  const isAssistant = role === "assistant";

  const textContent =
    (message.parts as any[])
      ?.filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("") ?? "";

  const formattedTime = createdAt
    ? new Date(createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div
      className={`message-row ${isAssistant ? "assistant" : "user"} animate-fade-in`}
    >
      {isAssistant && (
        <div className="message-avatar-container">
          <div className="message-avatar">ති</div>
        </div>
      )}

      <div className="message-bubble-wrapper">
        {isAssistant && <div className="message-author">Thisari</div>}

        <div className="message-bubble">
          {textContent && (
            <div className="message-text">
              <MarkdownContent text={textContent} />
            </div>
          )}

          {isAssistant && onViewDetails && (
            <ToolOutputRenderer
              message={message}
              allMessages={allMessages}
              onViewDetails={onViewDetails}
            />
          )}
        </div>

        {formattedTime && <div className="message-time">{formattedTime}</div>}
      </div>
    </div>
  );
}

/** Standalone typing indicator row — used by ChatMessages */
export function TypingBubble() {
  return (
    <div className="message-row assistant animate-fade-in">
      <div className="message-avatar-container">
        <div className="message-avatar">ති</div>
      </div>
      <div className="message-bubble-wrapper">
        <div className="message-author">Thisari</div>
        <TypingIndicator />
      </div>
    </div>
  );
}

/** Standalone error row — used by ChatMessages */
export function ErrorBubble({ message: msg }: { message: string }) {
  return (
    <div className="message-row assistant animate-fade-in">
      <div className="message-avatar-container">
        <div className="message-avatar">ති</div>
      </div>
      <div className="message-bubble-wrapper">
        <div className="message-author">Thisari</div>
        <div className="error-message-card">
          <span>!</span>
          <p>{msg}</p>
        </div>
      </div>
    </div>
  );
}
