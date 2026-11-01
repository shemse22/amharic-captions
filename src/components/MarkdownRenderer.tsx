'use client';

import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];

  const flushList = () => {
    if (currentList.length > 0 && listType) {
      if (listType === 'ul') {
        elements.push(
          <ul key={`ul-${elements.length}`} className="list-disc list-inside my-3 space-y-1.5 pl-2 text-neutral-700 dark:text-neutral-300">
            {currentList.map((item, idx) => (
              <li key={idx} className="leading-relaxed text-sm sm:text-base">
                {parseInline(item)}
              </li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`ol-${elements.length}`} className="list-decimal list-inside my-3 space-y-1.5 pl-2 text-neutral-700 dark:text-neutral-300">
            {currentList.map((item, idx) => (
              <li key={idx} className="leading-relaxed text-sm sm:text-base font-semibold">
                <span className="font-normal">{parseInline(item)}</span>
              </li>
            ))}
          </ol>
        );
      }
      currentList = [];
      listType = null;
    }
  };

  const parseInline = (text: string): React.ReactNode => {
    // Parse bold, inline code, italics, links
    const parts = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*|\[.*?\]\(.*?\))/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return (
          <strong key={index} className="font-extrabold text-[#632450] dark:text-[#ECCC6E]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length >= 2 && !part.startsWith('**')) {
        return (
          <em key={index} className="italic text-neutral-800 dark:text-neutral-200">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        return (
          <code
            key={index}
            className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-[#0062FF] dark:text-[#ECCC6E] font-mono text-xs font-semibold"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        const [, linkText, href] = linkMatch;
        return (
          <a
            key={index}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0062FF] dark:text-[#60a5fa] font-bold hover:underline"
          >
            {linkText}
          </a>
        );
      }
      return part;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Code blocks ```
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        flushList();
        elements.push(
          <div key={`code-${i}`} className="my-4 rounded-2xl bg-neutral-950 border border-neutral-800 p-4 overflow-x-auto shadow-inner">
            <pre className="font-mono text-xs text-neutral-200 leading-relaxed">
              <code>{codeBlockContent.join('\n')}</code>
            </pre>
          </div>
        );
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(rawLine);
      continue;
    }

    if (!line) {
      flushList();
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      flushList();
      elements.push(
        <h1 key={i} className="text-2xl sm:text-3xl font-black text-[#632450] dark:text-white mt-8 mb-4 tracking-tight">
          {line.replace('# ', '')}
        </h1>
      );
    } else if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={i} className="text-xl sm:text-2xl font-black text-[#632450] dark:text-white mt-8 mb-4 border-b border-[#256E96]/20 pb-2 tracking-tight">
          {line.replace('## ', '')}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={i} className="text-lg sm:text-xl font-black text-[#632450] dark:text-white mt-6 mb-3 tracking-tight">
          {line.replace('### ', '')}
        </h3>
      );
    } else if (line.startsWith('#### ')) {
      flushList();
      elements.push(
        <h4 key={i} className="text-base sm:text-lg font-bold text-[#632450] dark:text-neutral-200 mt-4 mb-2">
          {line.replace('#### ', '')}
        </h4>
      );
    } else if (line.startsWith('> ')) {
      flushList();
      elements.push(
        <blockquote
          key={i}
          className="my-4 border-l-4 border-[#0062FF] pl-4 py-2 italic text-neutral-600 dark:text-neutral-400 bg-[#0062FF]/5 dark:bg-[#0062FF]/10 rounded-r-xl"
        >
          {parseInline(line.replace(/^>\s+/, ''))}
        </blockquote>
      );
    } else if (line.startsWith('* ') || line.startsWith('- ')) {
      if (listType !== 'ul') flushList();
      listType = 'ul';
      currentList.push(line.replace(/^(\*|-)\s+/, ''));
    } else if (/^\d+\.\s+/.test(line)) {
      if (listType !== 'ol') flushList();
      listType = 'ol';
      currentList.push(line.replace(/^\d+\.\s+/, ''));
    } else {
      flushList();
      elements.push(
        <p key={i} className="my-3 leading-relaxed text-sm sm:text-base text-neutral-700 dark:text-neutral-300">
          {parseInline(line)}
        </p>
      );
    }
  }

  flushList();

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
}

