'use client';

import React from 'react';

interface FormattedTextProps {
  text: string;
  className?: string;
}

/**
 * Simple markdown-like text formatter
 * Converts **text** to bold and improves paragraph structure
 */
export function FormattedText({ text, className = '' }: FormattedTextProps) {
  // Split into paragraphs (double newlines)
  const paragraphs = text.split(/\n\n+/);
  
  return (
    <div className={`space-y-4 ${className}`}>
      {paragraphs.map((paragraph, pIdx) => {
        // Check if this is a numbered list item
        const isNumberedList = /^\d+\.\s/.test(paragraph.trim());
        
        if (isNumberedList) {
          // Parse numbered list items within this paragraph
          const items = paragraph.split(/(?=\d+\.\s)/g).filter(Boolean);
          return (
            <div key={pIdx} className="space-y-3">
              {items.map((item, iIdx) => {
                const match = item.match(/^(\d+)\.\s*(.*)/s);
                if (match) {
                  const [, num, content] = match;
                  return (
                    <div key={iIdx} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-semibold">
                        {num}
                      </span>
                      <div className="flex-1 pt-0.5">
                        {formatInlineText(content.trim())}
                      </div>
                    </div>
                  );
                }
                return <p key={iIdx}>{formatInlineText(item)}</p>;
              })}
            </div>
          );
        }
        
        // Regular paragraph
        return (
          <p key={pIdx} className="leading-relaxed">
            {formatInlineText(paragraph)}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Format inline text: convert **text** to bold, handle line breaks
 */
function formatInlineText(text: string): React.ReactNode {
  // Split by bold markers
  const parts = text.split(/(\*\*.*?\*\*)/g);
  
  return parts.map((part, idx) => {
    // Check if this part is bold (**text**)
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={idx} className="font-semibold text-gray-900">
          {boldText}
        </strong>
      );
    }
    
    // Handle single line breaks within the part
    const lines = part.split('\n');
    if (lines.length === 1) {
      return <span key={idx}>{part}</span>;
    }
    
    return (
      <span key={idx}>
        {lines.map((line, lineIdx) => (
          <React.Fragment key={lineIdx}>
            {line}
            {lineIdx < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </span>
    );
  });
}
