"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Clipboard, CreditCard, Timer } from "lucide-react";
import { OrderResponse } from "@/lib/types";

interface OrderConfirmProps {
  order: OrderResponse;
}

export default function OrderConfirm({ order }: OrderConfirmProps) {
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);

  const formatPrice = (amount: number, currency: string) =>
    new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: currency || "LKR",
      minimumFractionDigits: 0,
    }).format(amount);

  useEffect(() => {
    if (!order.expires_at) return;
    const update = () => {
      const diff = new Date(order.expires_at).getTime() - Date.now();
      if (diff <= 0) {
        setTimeRemaining("Expired");
        setIsExpired(true);
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(
        mins >= 60
          ? `${Math.floor(mins / 60)}h ${mins % 60}m`
          : `${mins}m ${secs}s`,
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [order.expires_at]);

  const handleCopyRef = () => {
    navigator.clipboard.writeText(order.order_ref);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="order-confirm-card glass animate-fade-in-up">
      <div className="order-confirm-header">
        <div className="order-success-icon">
          <CheckCircle2 size={36} />
        </div>
        <h3 className="order-confirm-title">Order Created!</h3>
        <p className="order-confirm-subtitle">
          Your order has been placed successfully
        </p>
      </div>

      <div className="order-ref-row">
        <span className="order-ref-label">Order Reference</span>
        <button
          className="order-ref-value"
          onClick={handleCopyRef}
          type="button"
          title="Click to copy"
        >
          {order.order_ref}
          <span className="copy-indicator">
            {copied ? "✓ Copied" : <Clipboard size={14} />}
          </span>
        </button>
      </div>

      <div className="order-summary">
        <div className="summary-row">
          <span>Items Total</span>
          <span>
            {formatPrice(order.summary.items_total, order.summary.currency)}
          </span>
        </div>
        <div className="summary-row">
          <span>Delivery Fee</span>
          <span>
            {formatPrice(order.summary.delivery_fee, order.summary.currency)}
          </span>
        </div>
        {order.summary.addons_total > 0 && (
          <div className="summary-row">
            <span>Add-ons</span>
            <span>
              {formatPrice(order.summary.addons_total, order.summary.currency)}
            </span>
          </div>
        )}
        <div className="summary-row total">
          <span>Grand Total</span>
          <span className="grand-total">
            {formatPrice(order.summary.grand_total, order.summary.currency)}
          </span>
        </div>
      </div>

      <a
        href={isExpired ? undefined : order.checkout_url}
        target="_blank"
        rel="noopener noreferrer"
        className={`order-pay-btn${isExpired ? " expired" : ""}`}
        aria-disabled={isExpired}
        onClick={isExpired ? (e) => e.preventDefault() : undefined}
      >
        <span className="pay-icon">
          <CreditCard size={18} />
        </span>
        {isExpired ? "Payment Link Expired" : "Pay Now — Secure Checkout"}
      </a>

      {timeRemaining && (
        <p
          className={`order-expiry-notice${isExpired ? " expired-notice" : ""}`}
        >
          <Timer size={13} />
          {isExpired ? (
            "This payment link has expired"
          ) : (
            <>
              Payment link expires in <strong>{timeRemaining}</strong>
            </>
          )}
        </p>
      )}
    </div>
  );
}
