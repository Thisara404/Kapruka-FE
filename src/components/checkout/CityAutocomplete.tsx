"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { fetchCities } from "@/lib/api";

interface CityAutocompleteProps {
  value: string;
  onChange: (cityInput: string, selectedCity: string) => void;
  accessToken?: string;
  error?: string;
}

export default function CityAutocomplete({
  value,
  onChange,
  accessToken,
  error,
}: CityAutocompleteProps) {
  const [cities, setCities] = useState<{ name: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setCities([]);
        return;
      }
      const results = await fetchCities(q, accessToken);
      setCities(results);
    },
    [accessToken],
  );

  useEffect(() => {
    const t = setTimeout(() => search(value), 250);
    return () => clearTimeout(t);
  }, [value, search]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      )
        setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div className="checkout-field">
      <label htmlFor="co-city">City</label>
      <div className="checkout-city-dropdown" ref={containerRef}>
        <input
          id="co-city"
          type="text"
          placeholder="Type city name…"
          value={value}
          autoComplete="off"
          onChange={(e) => {
            onChange(e.target.value, "");
            setShowSuggestions(true);
          }}
          onFocus={() => value.length >= 2 && setShowSuggestions(true)}
        />
        {showSuggestions && cities.length > 0 && (
          <div className="checkout-city-suggestions">
            {cities.map((c) => (
              <div
                key={c.name}
                className="checkout-city-option"
                onMouseDown={() => {
                  onChange(c.name, c.name);
                  setShowSuggestions(false);
                }}
              >
                {c.name}
              </div>
            ))}
          </div>
        )}
      </div>
      {error && <span className="checkout-field-error">{error}</span>}
    </div>
  );
}
