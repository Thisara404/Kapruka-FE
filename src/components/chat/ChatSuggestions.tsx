"use client";

import React from "react";

const EN_SUGGESTIONS = [
  {
    label: "Find a chocolate basket",
    query: "I'm looking for a chocolate gift basket",
  },
  {
    label: "Send flowers to Colombo",
    query: "I want to send flowers to someone in Colombo",
  },
  { label: "View birthday cakes", query: "Show me birthday cakes" },
  { label: "Track an order", query: "I want to track my order" },
];

const SI_SUGGESTIONS = [
  {
    label: "චොකලට් තෑගි කූඩ සොයන්න",
    query: "search for chocolate gift basket",
  },
  { label: "කොළඹට මල් යවන්න", query: "I want to send flowers to Colombo" },
  { label: "උපන්දින කේක් තෝරන්න", query: "search for birthday cake" },
  { label: "ඇණවුම ලුහුබඳින්න", query: "I want to track my order" },
];

interface ChatSuggestionsProps {
  language: "en" | "si";
  onSelect: (query: string) => void;
}

export default function ChatSuggestions({
  language,
  onSelect,
}: ChatSuggestionsProps) {
  const suggestions = language === "si" ? SI_SUGGESTIONS : EN_SUGGESTIONS;

  return (
    <div className="chat-suggestions-container animate-fade-in-up">
      <p className="suggestions-title">
        {language === "si"
          ? "මෙන්න අදහස් කිහිපයක්:"
          : "Here are some ideas to get started:"}
      </p>
      <div className="suggestions-grid">
        {suggestions.map((s) => (
          <button
            key={s.query}
            onClick={() => onSelect(s.query)}
            className="suggestion-chip glass"
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
