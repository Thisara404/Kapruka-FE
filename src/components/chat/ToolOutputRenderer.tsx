"use client";

import React from "react";
import { UIMessage } from "ai";
import ProductGrid from "@/components/products/ProductGrid";
import DeliveryInfo from "@/components/delivery/DeliveryInfo";
import OrderConfirm from "@/components/checkout/OrderConfirm";
import OrderTrackingCard from "@/components/checkout/OrderTracking";

interface ToolOutputRendererProps {
  message: UIMessage;
  allMessages: UIMessage[];
  onViewDetails: (productId: string, productName: string) => void;
}

function extractToolResult(
  message: UIMessage,
  allMessages: UIMessage[],
  toolCallId: string,
): unknown {
  // 1. Check within the same message parts
  const part = (message.parts as any[])?.find(
    (p) =>
      (p.type === "tool-invocation" || p.type === "tool-result") &&
      p.toolCallId === toolCallId &&
      p.state === "result",
  );
  if (part?.result) {
    const raw = part.result;
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    }
    return raw;
  }

  // 2. Scan across all tool-role messages
  for (const m of allMessages ?? []) {
    if ((m.role as string) !== "tool") continue;
    const tp = (m.parts as any[])?.find(
      (p) => p.type === "tool-result" && p.toolCallId === toolCallId,
    );
    if (tp?.output) {
      const out =
        typeof tp.output === "object"
          ? (tp.output.value ?? JSON.stringify(tp.output))
          : String(tp.output);
      try {
        return JSON.parse(out as string);
      } catch {
        return out;
      }
    }
  }

  return null;
}

export default function ToolOutputRenderer({
  message,
  allMessages,
  onViewDetails,
}: ToolOutputRendererProps) {
  if (!message.parts) return null;

  return (
    <>
      {(message.parts as any[]).map((part) => {
        const isToolPart =
          part.type === "tool-call" ||
          part.type === "tool-invocation" ||
          part.type?.startsWith("tool-");
        if (!isToolPart) return null;

        const result = extractToolResult(message, allMessages, part.toolCallId);
        if (!result) return null;

        const name: string = part.toolName ?? "";

        if (name === "kapruka_search_products") {
          const products = (result as any).results ?? [];
          if (products.length === 0) return null;
          return (
            <ProductGrid
              key={part.toolCallId}
              products={products}
              onViewDetails={onViewDetails}
            />
          );
        }
        if (name === "kapruka_check_delivery")
          return (
            <DeliveryInfo key={part.toolCallId} delivery={result as any} />
          );

        if (name === "kapruka_create_order" && (result as any).checkout_url)
          return <OrderConfirm key={part.toolCallId} order={result as any} />;

        if (name === "kapruka_track_order" && (result as any).order_number)
          return (
            <OrderTrackingCard key={part.toolCallId} tracking={result as any} />
          );

        return null;
      })}
    </>
  );
}
