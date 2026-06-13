"use client";

import React from "react";

/** Renders inline markdown: **bold**, *italic*, `code`, [links](url) */
export function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*|\*[^*]+\*|`[^`]+`|\[.*?\]\(.*?\))/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4)
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    if (
      part.startsWith("*") &&
      part.endsWith("*") &&
      part.length > 2 &&
      !part.startsWith("**")
    )
      return <em key={idx}>{part.slice(1, -1)}</em>;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2)
      return (
        <code key={idx} className="message-inline-code">
          {part.slice(1, -1)}
        </code>
      );
    const link = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (link)
      return (
        <a
          key={idx}
          href={link[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="message-link"
        >
          {link[1]}
        </a>
      );
    return part;
  });
}

/** Renders block-level markdown: headings, lists, paragraphs, horizontal rules */
function renderBlocks(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const output: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (/^---+$/.test(trimmed) || /^\*\*\*+$/.test(trimmed)) {
      output.push(<hr key={i} className="message-hr" />);
      continue;
    }

    const h3 = trimmed.match(/^###\s+(.*)/);
    const h2 = trimmed.match(/^##\s+(.*)/);
    const h1 = trimmed.match(/^#\s+(.*)/);
    if (h3) {
      output.push(
        <div key={i} className="message-h3">
          {renderInline(h3[1])}
        </div>,
      );
      continue;
    }
    if (h2) {
      output.push(
        <div key={i} className="message-h2">
          {renderInline(h2[1])}
        </div>,
      );
      continue;
    }
    if (h1) {
      output.push(
        <div key={i} className="message-h1">
          {renderInline(h1[1])}
        </div>,
      );
      continue;
    }

    const num = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (num) {
      output.push(
        <div key={i} className="message-numbered-item">
          <span className="list-number">{num[1]}.</span>
          <span>{renderInline(num[2])}</span>
        </div>,
      );
      continue;
    }

    const bullet = line.match(/^(\s*)[*\-•]\s+(.*)/);
    if (bullet) {
      const indent = Math.floor(bullet[1].length / 2);
      output.push(
        <div
          key={i}
          className="message-list-item"
          style={{ paddingLeft: `${indent * 16 + 8}px` }}
        >
          <span className="list-bullet">•</span>
          <span>{renderInline(bullet[2])}</span>
        </div>,
      );
      continue;
    }

    if (trimmed === "") {
      if (i > 0 && i < lines.length - 1)
        output.push(<div key={i} className="message-spacer" />);
      continue;
    }

    output.push(
      <React.Fragment key={i}>
        {renderInline(line)}
        {i < lines.length - 1 && lines[i + 1]?.trim() !== "" && <br />}
      </React.Fragment>,
    );
  }

  return output;
}

interface MarkdownContentProps {
  text: string;
}

export default function MarkdownContent({ text }: MarkdownContentProps) {
  return <>{renderBlocks(text)}</>;
}
