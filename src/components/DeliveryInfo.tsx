"use client";

import React from "react";
import { DeliveryCheck } from "@/lib/types";

interface DeliveryInfoProps {
  delivery: DeliveryCheck;
  onProceed?: () => void;
}

export default function DeliveryInfo({ delivery, onProceed }: DeliveryInfoProps) {
  const formattedRate = new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: delivery.currency || "LKR",
    minimumFractionDigits: 0,
  }).format(delivery.rate);

  const formattedDate = delivery.checked_date
    ? new Date(delivery.checked_date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  return (
    <div className="delivery-info-card glass animate-fade-in-up">
      <div className="delivery-header">
        <span className="delivery-icon">🚚</span>
        <h3 className="delivery-title">Delivery Check</h3>
      </div>

      <div className="delivery-details">
        <div className="delivery-detail-row">
          <span className="detail-label">City</span>
          <span className="detail-value">{delivery.city}</span>
        </div>
        <div className="delivery-detail-row">
          <span className="detail-label">Date</span>
          <span className="detail-value">{formattedDate}</span>
        </div>
        <div className="delivery-detail-row">
          <span className="detail-label">Delivery Fee</span>
          <span className="detail-value delivery-price">{formattedRate}</span>
        </div>
        <div className="delivery-detail-row">
          <span className="detail-label">Status</span>
          <span className={`delivery-status ${delivery.available ? "available" : "unavailable"}`}>
            {delivery.available ? "✓ Available" : "✗ Unavailable"}
          </span>
        </div>
      </div>

      {delivery.perishable_warning && (
        <div className="delivery-warning">
          <span className="warning-icon">⚠️</span>
          <p>{delivery.perishable_warning}</p>
        </div>
      )}

      {!delivery.available && delivery.reason && (
        <div className="delivery-error">
          <span className="error-icon">ℹ️</span>
          <p>{delivery.reason}</p>
        </div>
      )}

      {!delivery.available && delivery.next_available_date && (
        <div className="delivery-suggestion">
          <p>
            Next available date:{" "}
            <strong>
              {new Date(delivery.next_available_date + "T00:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </strong>
          </p>
        </div>
      )}

      {delivery.available && onProceed && (
        <button className="delivery-proceed-btn" onClick={onProceed} type="button">
          Proceed to Order →
        </button>
      )}
    </div>
  );
}
