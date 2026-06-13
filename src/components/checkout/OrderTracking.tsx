"use client";

import React from "react";
import { Camera, Gift, MapPinned, Package, Video } from "lucide-react";
import { OrderTracking as OrderTrackingType } from "@/lib/types";

interface OrderTrackingProps {
  tracking: OrderTrackingType;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusColor(status: string) {
  const s = status?.toLowerCase() || "";
  if (s.includes("deliver")) return "var(--success)";
  if (s.includes("ship") || s.includes("transit")) return "var(--info)";
  if (s.includes("cancel") || s.includes("fail")) return "var(--danger)";
  if (s.includes("process") || s.includes("confirm")) return "var(--warning)";
  return "var(--accent-primary)";
}

export default function OrderTrackingCard({ tracking }: OrderTrackingProps) {
  return (
    <div className="order-tracking-card glass animate-fade-in-up">
      <div className="tracking-header">
        <span className="tracking-icon">
          <Package size={24} />
        </span>
        <div>
          <h3 className="tracking-title">Order #{tracking.order_number}</h3>
          <span
            className="tracking-status-badge"
            style={{ background: statusColor(tracking.status) }}
          >
            {tracking.status_display || tracking.status}
          </span>
        </div>
      </div>

      <div className="tracking-details">
        {[
          ["Order Date", formatDate(tracking.order_date)],
          ["Delivery Date", formatDate(tracking.delivery_date)],
          ...(tracking.shipped_date
            ? [["Shipped", formatDate(tracking.shipped_date)]]
            : []),
          ["Amount", tracking.amount],
          ["Payment", tracking.payment_method],
        ].map(([label, value]) => (
          <div key={label} className="tracking-detail-row">
            <span className="detail-label">{label}</span>
            <span className="detail-value">{value}</span>
          </div>
        ))}
      </div>

      <div className="tracking-section">
        <h4 className="tracking-section-title">Recipient</h4>
        <p className="tracking-recipient-name">{tracking.recipient.name}</p>
        <p className="tracking-recipient-detail">
          {tracking.recipient.address}
        </p>
        <p className="tracking-recipient-detail">{tracking.recipient.city}</p>
      </div>

      {tracking.progress?.length > 0 && (
        <div className="tracking-section">
          <h4 className="tracking-section-title">Progress</h4>
          <div className="tracking-timeline">
            {tracking.progress.map((step, idx) => (
              <div
                key={idx}
                className={`timeline-step ${idx === tracking.progress.length - 1 ? "active" : ""}`}
              >
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <span className="timeline-step-name">{step.step}</span>
                  <span className="timeline-step-time">
                    {formatDate(step.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tracking.items?.length > 0 && (
        <div className="tracking-section">
          <h4 className="tracking-section-title">Items</h4>
          {tracking.items.map((item, idx) => (
            <div key={idx} className="tracking-item-row">
              <span className="tracking-item-name">{item.name}</span>
              <span className="tracking-item-qty">×{item.quantity}</span>
              <span className="tracking-item-price">
                Rs. {item.selling_price.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {tracking.greeting_message && (
        <div className="tracking-greeting">
          <span>
            <Gift size={16} />
          </span>
          <p>{tracking.greeting_message}</p>
        </div>
      )}

      <div className="tracking-media">
        {tracking.has_delivery_photo && (
          <span className="media-badge">
            <Camera size={13} /> Delivery Photo Available
          </span>
        )}
        {tracking.has_delivery_video && (
          <span className="media-badge">
            <Video size={13} /> Delivery Video Available
          </span>
        )}
        {tracking.live_tracking_available && (
          <span className="media-badge live">
            <MapPinned size={13} /> Live Tracking Available
          </span>
        )}
      </div>
    </div>
  );
}
