"use client";

import React from "react";
import { UIMessage } from "ai";
import ProductGrid from "./ProductGrid";
import DeliveryInfo from "./DeliveryInfo";
import OrderConfirm from "./OrderConfirm";
import OrderTrackingCard from "./OrderTracking";

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
  const role = message?.role as string;
  if (!message || !role || role === "tool" || role === "system") {
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
    // First check within the same message (tool-invocation parts contain result)
    const sameMsgPart = (message.parts as any[])?.find(
      (p) => (p.type === "tool-invocation" || p.type === "tool-result") && p.toolCallId === toolCallId && p.state === "result"
    );
    if (sameMsgPart?.result) {
      const raw = sameMsgPart.result;
      if (typeof raw === "string") {
        try { return JSON.parse(raw); } catch { return raw; }
      }
      return raw;
    }

    // Then look across all messages
    for (const m of allMessages || []) {
      if ((m.role as string) !== "tool") continue;
      const part = (m.parts as any[])?.find(
        (p) => p.type === "tool-result" && p.toolCallId === toolCallId
      );
      if (part?.output) {
        let outputStr = "";
        if (typeof part.output === "object" && part.output !== null) {
          outputStr = part.output.value || JSON.stringify(part.output);
        } else {
          outputStr = String(part.output);
        }
        try { return JSON.parse(outputStr); } catch { return outputStr; }
      }
    }
    return null;
  };

  // Render tool outputs if this assistant message initiated them
  const renderToolOutputs = () => {
    if (!isAssistant || !message.parts) return null;

    return (message.parts as any[]).map((part) => {
      const isToolPart =
        part.type === "tool-call" ||
        part.type === "tool-invocation" ||
        part.type?.startsWith("tool-");

      if (!isToolPart) return null;

      const toolCallId = part.toolCallId;
      const toolName = part.toolName || "";
      const result = findToolResult(toolCallId);
      if (!result) return null;

      // ─── Product Search Results ──────────────────────
      if (toolName === "kapruka_search_products") {
        const products = result.results || [];
        if (products.length === 0) return null;
        return (
          <ProductGrid
            key={toolCallId}
            products={products}
            onSelectProduct={onSelectProduct!}
            onViewDetails={onViewDetails!}
          />
        );
      }

      // ─── Delivery Check Result ──────────────────────
      if (toolName === "kapruka_check_delivery") {
        return (
          <DeliveryInfo
            key={toolCallId}
            delivery={result}
          />
        );
      }

      // ─── Order Creation Result ──────────────────────
      if (toolName === "kapruka_create_order") {
        if (result.checkout_url) {
          return (
            <OrderConfirm key={toolCallId} order={result} />
          );
        }
      }

      // ─── Order Tracking Result ──────────────────────
      if (toolName === "kapruka_track_order") {
        if (result.order_number) {
          return (
            <OrderTrackingCard key={toolCallId} tracking={result} />
          );
        }
      }

      return null;
    });
  };

  // Rich markdown-like text rendering (bold, lists, links)
  const renderContent = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, lineIdx) => {
      // Handle list items (bullet points)
      const listMatch = line.match(/^(\s*)[*-]\s+(.*)$/);
      if (listMatch) {
        const indent = Math.floor(listMatch[1].length / 2);
        return (
          <div key={lineIdx} className="message-list-item" style={{ paddingLeft: `${indent * 16 + 8}px` }}>
            <span className="list-bullet">•</span>
            <span>{renderInline(listMatch[2])}</span>
          </div>
        );
      }

      // Regular line
      return (
        <React.Fragment key={lineIdx}>
          {renderInline(line)}
          {lineIdx < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  // Inline rendering: bold, links, code
  const renderInline = (text: string) => {
    // Split by bold markers, links, and inline code
    const parts = text.split(/(\*\*.*?\*\*|`[^`]+`|\[.*?\]\(.*?\))/g);
    return parts.map((part, idx) => {
      // Bold
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={idx}>{part.slice(2, -2)}</strong>;
      }
      // Inline code
      if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={idx} className="message-inline-code">{part.slice(1, -1)}</code>;
      }
      // Links [text](url)
      const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        return (
          <a key={idx} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="message-link">
            {linkMatch[1]}
          </a>
        );
      }
      return part;
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
