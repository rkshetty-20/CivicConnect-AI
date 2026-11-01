import React from 'react';

export function HighlightText({ text, term, className = '' }) {
  if (!text) return null;
  if (!term?.trim()) return <span className={className}>{text}</span>;

  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.toLowerCase() === term.toLowerCase() ? (
          <mark key={i} className="bg-warning-50 text-ink rounded px-0.5 font-medium">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}

export default HighlightText;
