"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Product } from "@/lib/types";

interface CheckoutModalProps {
  product: Product;
  senderName?: string;
  accessToken?: string;
  onClose: () => void;
  onSuccess: (orderResult: any) => void;
}

interface CityOption {
  name: string;
  aliases: string[];
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

// Minimal phone validation for Sri Lankan numbers (+94 or 0 prefix, 9-10 digits)
function isValidSriLankanPhone(phone: string): boolean {
  return /^(\+94|0)[1-9]\d{8}$/.test(phone.replace(/\s/g, ""));
}

// Returns today's date as YYYY-MM-DD (client local time)
function todayStr(): string {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

// Min delivery date: tomorrow
function minDateStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

export default function CheckoutModal({
  product,
  senderName,
  accessToken,
  onClose,
  onSuccess,
}: CheckoutModalProps) {
  // ── Form state ──────────────────────────────────────────────────────────────
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(minDateStr());
  const [locationType, setLocationType] = useState<"house" | "apartment" | "office" | "other">("house");
  const [sender, setSender] = useState(senderName || "");
  const [giftMessage, setGiftMessage] = useState("");
  const [icingText, setIcingText] = useState("");

  // ── City autocomplete ────────────────────────────────────────────────────────
  const [cities, setCities] = useState<CityOption[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const cityRef = useRef<HTMLDivElement>(null);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const formattedPrice = new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: product.price.currency || "LKR",
    minimumFractionDigits: 0,
  }).format(product.price.amount);

  const imageUrl = product.image_url || "/placeholder-product.png";

  // ── City search ─────────────────────────────────────────────────────────────
  const searchCities = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setCities([]);
        return;
      }
      try {
        const headers: Record<string, string> = {};
        if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
        const res = await fetch(
          `${BACKEND_URL}/api/chat/cities?query=${encodeURIComponent(query)}&limit=20`,
          { headers }
        );
        if (res.ok) {
          const data = await res.json();
          setCities(Array.isArray(data) ? data : []);
        }
      } catch {
        // silently fail — user can still type the city manually
      }
    },
    [accessToken]
  );

  useEffect(() => {
    const timer = setTimeout(() => searchCities(cityInput), 250);
    return () => clearTimeout(timer);
  }, [cityInput, searchCities]);

  // Close city dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setShowCitySuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    const errs: Record<string, string> = {};
    if (!recipientName.trim()) errs.recipientName = "Recipient name is required.";
    if (!recipientPhone.trim()) {
      errs.recipientPhone = "Phone number is required.";
    } else if (!isValidSriLankanPhone(recipientPhone)) {
      errs.recipientPhone = "Enter a valid Sri Lankan mobile number (e.g. 077 123 4567).";
    }
    if (!deliveryAddress.trim()) errs.deliveryAddress = "Delivery address is required.";
    if (!selectedCity) errs.city = "Please select a valid city from the list.";
    if (!deliveryDate) errs.deliveryDate = "Delivery date is required.";
    if (!sender.trim()) errs.sender = "Sender name is required.";
    return errs;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

      const body = {
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
          address: deliveryAddress.trim(),
          city: selectedCity,
          location_type: locationType,
          date: deliveryDate,
        },
        sender: {
          name: sender.trim(),
          anonymous: false,
        },
        ...(giftMessage.trim() ? { gift_message: giftMessage.trim() } : {}),
      };

      const res = await fetch(`${BACKEND_URL}/api/chat/quick-order`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Order failed. Please try again.");
      }

      onSuccess(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
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
        {/* ── Header ── */}
        <div className="checkout-modal-header">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
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
            aria-label="Close checkout"
            type="button"
          >
            &times;
          </button>
        </div>

        {/* ── Body ── */}
        <form onSubmit={handleSubmit}>
          <div className="checkout-modal-body">
            {/* Recipient */}
            <div>
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
                      <span className="checkout-field-error">{fieldErrors.recipientName}</span>
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
                      <span className="checkout-field-error">{fieldErrors.recipientPhone}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <hr className="checkout-divider" />

            {/* Delivery */}
            <div>
              <div className="checkout-section-title">Delivery Details</div>
              <div className="checkout-field-group">
                <div className="checkout-field">
                  <label htmlFor="co-address">Delivery Address</label>
                  <input
                    id="co-address"
                    type="text"
                    placeholder="Street address, apartment or house number"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                  />
                  {fieldErrors.deliveryAddress && (
                    <span className="checkout-field-error">{fieldErrors.deliveryAddress}</span>
                  )}
                </div>

                <div className="checkout-field-row">
                  {/* City autocomplete */}
                  <div className="checkout-field">
                    <label htmlFor="co-city">City</label>
                    <div className="checkout-city-dropdown" ref={cityRef}>
                      <input
                        id="co-city"
                        type="text"
                        placeholder="Type city name…"
                        value={cityInput}
                        autoComplete="off"
                        onChange={(e) => {
                          setCityInput(e.target.value);
                          setSelectedCity("");
                          setShowCitySuggestions(true);
                        }}
                        onFocus={() => cityInput.length >= 2 && setShowCitySuggestions(true)}
                      />
                      {showCitySuggestions && cities.length > 0 && (
                        <div className="checkout-city-suggestions">
                          {cities.map((c) => (
                            <div
                              key={c.name}
                              className="checkout-city-option"
                              onMouseDown={() => {
                                setSelectedCity(c.name);
                                setCityInput(c.name);
                                setShowCitySuggestions(false);
                              }}
                            >
                              {c.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {fieldErrors.city && (
                      <span className="checkout-field-error">{fieldErrors.city}</span>
                    )}
                  </div>

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
                    <span className="checkout-field-error">{fieldErrors.deliveryDate}</span>
                  )}
                </div>
              </div>
            </div>

            <hr className="checkout-divider" />

            {/* Sender & Gift */}
            <div>
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
                    <span className="checkout-field-error">{fieldErrors.sender}</span>
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
                {(product.category?.name?.toLowerCase().includes("cake") ||
                  product.name?.toLowerCase().includes("cake")) && (
                  <div className="checkout-field">
                    <label htmlFor="co-icing">Icing Text (for cakes — optional)</label>
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
          </div>

          {/* ── Footer ── */}
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
