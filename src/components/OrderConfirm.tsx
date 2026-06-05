"use client";

import React, { useState } from "react";
import { CheckCircle2, Clipboard, CreditCard, Timer } from "lucide-react";
import { OrderResponse } from "@/lib/types";

interface OrderConfirmProps {
  order: OrderResponse;
}

export default function OrderConfirm({ order }: OrderConfirmProps) {
  const [copied, setCopied] = useState(false);

  const formatPrice = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: currency || "LKR",
      minimumFractionDigits: 0,
    }).format(amount);

  const expiryTime = order.expires_at
    ? new Date(order.expires_at).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Colombo",
      })
    : null;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(order.order_ref);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="order-confirm-card glass animate-fade-in-up">
      {/* Confetti / celebration header */}
      <div className="order-confirm-header">
        <div className="order-success-icon"><CheckCircle2 size={36} /></div>
        <h3 className="order-confirm-title">Order Created!</h3>
        <p className="order-confirm-subtitle">
          Your order has been placed successfully
        </p>
      </div>

      {/* Order reference */}
      <div className="order-ref-row">
        <span className="order-ref-label">Order Reference</span>
        <button className="order-ref-value" onClick={handleCopyRef} type="button" title="Click to copy">
          {order.order_ref}
          <span className="copy-indicator">{copied ? "Copied" : <Clipboard size={14} />}</span>
        </button>
      </div>

      {/* Order summary */}
      <div className="order-summary">
        <div className="summary-row">
          <span>Items Total</span>
          <span>{formatPrice(order.summary.items_total, order.summary.currency)}</span>
        </div>
        <div className="summary-row">
          <span>Delivery Fee</span>
          <span>{formatPrice(order.summary.delivery_fee, order.summary.currency)}</span>
        </div>
        {order.summary.addons_total > 0 && (
          <div className="summary-row">
            <span>Add-ons</span>
            <span>{formatPrice(order.summary.addons_total, order.summary.currency)}</span>
          </div>
        )}
        <div className="summary-row total">
          <span>Grand Total</span>
          <span className="grand-total">
            {formatPrice(order.summary.grand_total, order.summary.currency)}
          </span>
        </div>
      </div>

      {/* Pay button */}
      <a
        href={order.checkout_url}
        target="_blank"
        rel="noopener noreferrer"
        className="order-pay-btn"
      >
        <span className="pay-icon"><CreditCard size={18} /></span>
        Pay Now
      </a>

      {/* Expiry notice */}
      {expiryTime && (
        <p className="order-expiry-notice">
          <Timer size={14} /> This payment link expires at <strong>{expiryTime}</strong> (Sri Lanka time)
        </p>
      )}
    </div>
  );
}
