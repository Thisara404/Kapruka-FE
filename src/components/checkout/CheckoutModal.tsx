"use client";

import React, { useState } from "react";
import { Product } from "@/lib/types";
import { submitQuickOrder } from "@/lib/api";
import CityAutocomplete from "./CityAutocomplete";

interface CheckoutModalProps {
  product: Product;
  senderName?: string;
  accessToken?: string;
  onClose: () => void;
  onSuccess: (orderResult: unknown) => void;
}

function minDateStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function isValidSriLankanPhone(phone: string): boolean {
  return /^(\+94|0)[1-9]\d{8}$/.test(phone.replace(/\s/g, ""));
}

export default function CheckoutModal({
  product,
  senderName,
  accessToken,
  onClose,
  onSuccess,
}: CheckoutModalProps) {
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [address, setAddress] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(minDateStr());
  const [locationType, setLocationType] = useState<
    "house" | "apartment" | "office" | "other"
  >("house");
  const [sender, setSender] = useState(senderName || "");
  const [giftMessage, setGiftMessage] = useState("");
  const [icingText, setIcingText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isCake =
    product.category?.name?.toLowerCase().includes("cake") ||
    product.name?.toLowerCase().includes("cake");

  const formattedPrice = new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: product.price.currency || "LKR",
    minimumFractionDigits: 0,
  }).format(product.price.amount);

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!recipientName.trim()) e.recipientName = "Recipient name is required.";
    if (!recipientPhone.trim()) e.recipientPhone = "Phone number is required.";
    else if (!isValidSriLankanPhone(recipientPhone))
      e.recipientPhone =
        "Enter a valid Sri Lankan mobile number (e.g. 077 123 4567).";
    if (!address.trim()) e.address = "Delivery address is required.";
    if (!selectedCity) e.city = "Please select a valid city from the list.";
    if (!deliveryDate) e.deliveryDate = "Delivery date is required.";
    if (!sender.trim()) e.sender = "Sender name is required.";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const result = await submitQuickOrder(
        {
          cart: [
            {
              product_id: product.id,
              quantity: 1,
              ...(icingText.trim() ? { icing_text: icingText.trim() } : {}),
            },
          ],
          recipient: {
            name: recipientName.trim(),
            phone: recipientPhone.replace(/\s/g, ""),
          },
          delivery: {
            address: address.trim(),
            city: selectedCity,
            location_type: locationType,
            date: deliveryDate,
          },
          sender: { name: sender.trim(), anonymous: false },
          ...(giftMessage.trim() ? { gift_message: giftMessage.trim() } : {}),
        },
        accessToken,
      );
      onSuccess(result);
    } catch (err: any) {
      setError(
        err.message || "An unexpected error occurred. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-overlay animate-fade-in" onClick={onClose}>
      <div
        className="checkout-modal animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="checkout-modal-header">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image_url || "/placeholder-product.png"}
            alt={product.name}
            className="checkout-product-thumb"
          />
          <div className="checkout-product-info">
            <div className="checkout-product-name">{product.name}</div>
            <div className="checkout-product-price">{formattedPrice}</div>
          </div>
          <button
            className="checkout-close-btn"
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            &times;
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="checkout-modal-body">
            {/* Recipient */}
            <div className="checkout-section-title">Recipient Details</div>
            <div className="checkout-field-group">
              <div className="checkout-field-row">
                <div className="checkout-field">
                  <label htmlFor="co-rec-name">Recipient Name</label>
                  <input
                    id="co-rec-name"
                    type="text"
                    placeholder="e.g. Ayasha Perera"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    autoComplete="off"
                  />
                  {fieldErrors.recipientName && (
                    <span className="checkout-field-error">
                      {fieldErrors.recipientName}
                    </span>
                  )}
                </div>
                <div className="checkout-field">
                  <label htmlFor="co-rec-phone">Phone Number</label>
                  <input
                    id="co-rec-phone"
                    type="tel"
                    placeholder="077 123 4567"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                  />
                  {fieldErrors.recipientPhone && (
                    <span className="checkout-field-error">
                      {fieldErrors.recipientPhone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <hr className="checkout-divider" />

            {/* Delivery */}
            <div className="checkout-section-title">Delivery Details</div>
            <div className="checkout-field-group">
              <div className="checkout-field">
                <label htmlFor="co-address">Delivery Address</label>
                <input
                  id="co-address"
                  type="text"
                  placeholder="Street address, apartment or house number"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                {fieldErrors.address && (
                  <span className="checkout-field-error">
                    {fieldErrors.address}
                  </span>
                )}
              </div>

              <div className="checkout-field-row">
                <CityAutocomplete
                  value={cityInput}
                  onChange={(input, city) => {
                    setCityInput(input);
                    setSelectedCity(city);
                  }}
                  accessToken={accessToken}
                  error={fieldErrors.city}
                />
                <div className="checkout-field">
                  <label htmlFor="co-loc-type">Location Type</label>
                  <select
                    id="co-loc-type"
                    value={locationType}
                    onChange={(e) => setLocationType(e.target.value as any)}
                  >
                    <option value="house">House</option>
                    <option value="apartment">Apartment</option>
                    <option value="office">Office</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="checkout-field">
                <label htmlFor="co-date">Delivery Date</label>
                <input
                  id="co-date"
                  type="date"
                  value={deliveryDate}
                  min={minDateStr()}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
                {fieldErrors.deliveryDate && (
                  <span className="checkout-field-error">
                    {fieldErrors.deliveryDate}
                  </span>
                )}
              </div>
            </div>

            <hr className="checkout-divider" />

            {/* Sender */}
            <div className="checkout-section-title">From</div>
            <div className="checkout-field-group">
              <div className="checkout-field">
                <label htmlFor="co-sender">Your Name (Sender)</label>
                <input
                  id="co-sender"
                  type="text"
                  placeholder="e.g. Thisari"
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                />
                {fieldErrors.sender && (
                  <span className="checkout-field-error">
                    {fieldErrors.sender}
                  </span>
                )}
              </div>
              <div className="checkout-field">
                <label htmlFor="co-gift">Gift Message (optional)</label>
                <textarea
                  id="co-gift"
                  placeholder="Write a personal message for the recipient…"
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  maxLength={300}
                />
              </div>
              {isCake && (
                <div className="checkout-field">
                  <label htmlFor="co-icing">Icing Text (optional)</label>
                  <input
                    id="co-icing"
                    type="text"
                    placeholder="e.g. Happy Birthday Ayasha!"
                    value={icingText}
                    onChange={(e) => setIcingText(e.target.value)}
                    maxLength={50}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="checkout-modal-footer">
            {error && <div className="checkout-alert error">{error}</div>}
            <button
              type="submit"
              className="checkout-submit-btn"
              disabled={loading}
            >
              {loading ? "Placing Order…" : `Place Order · ${formattedPrice}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
