"use client";

import React, { useRef, useEffect, useState } from "react";

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  language: "en" | "si";
  setLanguage: (lang: "en" | "si") => void;
}

export default function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  language,
  setLanguage,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) handleSubmit(e);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) handleSubmit(e);
  };

  const placeholder =
    language === "si"
      ? "තිසරි වෙත පණිවිඩයක් ලියන්න... (උදා: කේක් එකක් සොයන්න)"
      : "Ask Thisari... (e.g., 'search for chocolates' or 'check delivery')";

  return (
    <form className="chat-input-form" onSubmit={onSubmit}>
      <div className={`chat-input-wrapper ${isFocused ? "focused" : ""}`}>
        <button
          type="button"
          className="lang-toggle-btn"
          onClick={() => setLanguage(language === "en" ? "si" : "en")}
          title={language === "si" ? "Switch to English" : "Switch to Sinhala"}
        >
          {language === "si" ? "සිං" : "EN"}
        </button>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          rows={1}
          disabled={isLoading}
          className="chat-textarea"
        />

        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="send-button"
          aria-label="Send message"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="send-icon"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </form>
  );
}
