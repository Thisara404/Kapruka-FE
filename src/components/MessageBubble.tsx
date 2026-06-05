"use client";

import React from "react";
import { UIMessage } from "ai";
import { Product } from "@/lib/types";
import ProductGrid from "./ProductGrid";
import DeliveryInfo from "./DeliveryInfo";
import OrderConfirm from "./OrderConfirm";
import OrderTrackingCard from "./OrderTracking";

interface MessageBubbleProps {
  message: UIMessage;
  allMessages: UIMessage[];
  onSelectProduct?: (productId: string, productName: string) => void;
  onViewDetails?: (productId: string, productName: string) => void;
  onBuyNow?: (product: Product) => void;
  createdAt?: Date | string;
}

export default function MessageBubble({
  message,
  allMessages,
  onSelectProduct,
  onViewDetails,
  onBuyNow,
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
            onBuyNow={onBuyNow}
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

  // Rich markdown-like text rendering (headings, lists, bold, code, links)
  const renderContent = (text: string) => {
    const lines = text.split("\n");
    const output: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // ── Horizontal rule ──────────────────────────────────────
      if (/^---+$/.test(trimmed) || /^\*\*\*+$/.test(trimmed)) {
        output.push(<hr key={i} className="message-hr" />);
        i++;
        continue;
      }

      // ── Headings ─────────────────────────────────────────────
      const h3 = trimmed.match(/^###\s+(.*)/);
      const h2 = trimmed.match(/^##\s+(.*)/);
      const h1 = trimmed.match(/^#\s+(.*)/);
      if (h3) {
        output.push(<div key={i} className="message-h3">{renderInline(h3[1])}</div>);
        i++; continue;
      }
      if (h2) {
        output.push(<div key={i} className="message-h2">{renderInline(h2[1])}</div>);
        i++; continue;
      }
      if (h1) {
        output.push(<div key={i} className="message-h1">{renderInline(h1[1])}</div>);
        i++; continue;
      }

      // ── Numbered list items ───────────────────────────────────
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        output.push(
          <div key={i} className="message-numbered-item">
            <span className="list-number">{numMatch[1]}.</span>
            <span>{renderInline(numMatch[2])}</span>
          </div>
        );
        i++; continue;
      }

      // ── Bullet list items (*, -, •) ───────────────────────────
      const bulletMatch = line.match(/^(\s*)[*\-•]\s+(.*)/);
      if (bulletMatch) {
        const indent = Math.floor(bulletMatch[1].length / 2);
        output.push(
          <div key={i} className="message-list-item" style={{ paddingLeft: `${indent * 16 + 8}px` }}>
            <span className="list-bullet">•</span>
            <span>{renderInline(bulletMatch[2])}</span>
          </div>
        );
        i++; continue;
      }

      // ── Empty line → spacer ───────────────────────────────────
      if (trimmed === "") {
        // Only insert spacer if not at very start/end
        if (i > 0 && i < lines.length - 1) {
          output.push(<div key={i} className="message-spacer" />);
        }
        i++; continue;
      }

      // ── Regular paragraph line ────────────────────────────────
      output.push(
        <React.Fragment key={i}>
          {renderInline(line)}
          {i < lines.length - 1 && lines[i + 1]?.trim() !== "" && <br />}
        </React.Fragment>
      );
      i++;
    }

    return output;
  };

  // Inline rendering: bold, italic, code, links
  const renderInline = (text: string): React.ReactNode[] => {
    const parts = text.split(/(\*\*.*?\*\*|\*[^*]+\*|`[^`]+`|\[.*?\]\(.*?\))/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return <strong key={idx}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2 && !part.startsWith("**")) {
        return <em key={idx}>{part.slice(1, -1)}</em>;
      }
      if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
        return <code key={idx} className="message-inline-code">{part.slice(1, -1)}</code>;
      }
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
