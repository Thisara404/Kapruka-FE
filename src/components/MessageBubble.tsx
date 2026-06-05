"use client";

import React from "react";
import { UIMessage } from "ai";
import ProductGrid from "./ProductGrid";

interface MessageBubbleProps {
  message: UIMessage;
  allMessages: UIMessage[];
  onSelectProduct?: (productId: string, productName: string) => void;
  onViewDetails?: (productId: string, productName: string) => void;
  createdAt?: Date | string;
}

export default function MessageBubble({
  message,
  allMessages,
  onSelectProduct,
  onViewDetails,
  createdAt,
}: MessageBubbleProps) {
  if (!message || !message.role || message.role === "tool" || message.role === "system") {
    return null;
  }

  const isAssistant = message.role === "assistant";

  const content = message.parts
    ? (message.parts as any[])
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("")
    : "";

  // Find tool call output from the other messages in the chat
  const findToolResult = (toolCallId: string) => {
    const toolMsg = allMessages?.find(
      (m) =>
        m.role === "tool" &&
        (m.parts as any[])?.some(
          (p) => p.type === "tool-result" && p.toolCallId === toolCallId
        )
    );
    if (!toolMsg) return null;

    const part = (toolMsg.parts as any[])?.find(
      (p) => p.type === "tool-result" && p.toolCallId === toolCallId
    );

    if (part && part.output) {
      let outputStr = "";
      if (typeof part.output === "object" && part.output !== null) {
        outputStr = part.output.value || JSON.stringify(part.output);
      } else {
        outputStr = String(part.output);
      }

      try {
        return JSON.parse(outputStr);
      } catch (e) {
        // Fallback if not valid JSON
        return outputStr;
      }
    }
    return null;
  };

  // Render tool outputs if this assistant message initiated them
  const renderToolOutputs = () => {
    if (!isAssistant || !message.parts) return null;

    return (message.parts as any[]).map((part) => {
      // We only render results for completed tool calls
      if (part.type?.startsWith("tool-") || part.type === "tool-call") {
        const toolCallId = part.toolCallId;
        const toolName = part.toolName || part.type.replace("tool-", "");

        // Find matching output
        const result = findToolResult(toolCallId);
        if (!result) return null;

        // Render based on tool name
        if (toolName === "kapruka_search_products") {
          const products = result.results || [];
          return (
            <ProductGrid
              key={toolCallId}
              products={products}
              onSelectProduct={onSelectProduct!}
              onViewDetails={onViewDetails!}
            />
          );
        }
      }
      return null;
    });
  };

  // Simple parser to handle newlines and bold (**) text without external markdown libraries
  const renderContent = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, lineIdx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const parsedLine = parts.map((part, partIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={partIdx}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return (
        <React.Fragment key={lineIdx}>
          {parsedLine}
          {lineIdx < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  const formattedTime = createdAt
    ? new Date(createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className={`message-row ${isAssistant ? "assistant" : "user"} animate-fade-in`}>
      {isAssistant && (
        <div className="message-avatar-container">
          <div className="message-avatar">ති</div>
        </div>
      )}

      <div className="message-bubble-wrapper">
        {isAssistant && <div className="message-author">Thisari</div>}
        <div className="message-bubble">
          {content && <div className="message-text">{renderContent(content)}</div>}
          {renderToolOutputs()}
          {formattedTime && <div className="message-time">{formattedTime}</div>}
        </div>
      </div>
    </div>
  );
}
