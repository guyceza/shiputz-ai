"use client";
export const dynamic = "force-static";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getArticle, getRelatedArticles } from "../articles";
import { notFound } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

const categoryColors: Record<string, string> = {
  "תקציב": "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  "טיפים": "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "קבלנים": "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "חדרים": "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "תכנון": "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  "תשתיות": "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};

function formatInlineText(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch && boldMatch.index !== undefined) {
      if (boldMatch.index > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, boldMatch.index)}</span>);
      }
      parts.push(
        <strong key={key++} className="font-semibold text-gray-900 dark:text-white">
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      continue;
    }
    parts.push(<span key={key++}>{remaining}</span>);
    break;
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.trim().split('\n');
  const elements: React.ReactElement[] = [];
  let inTable = false;
  let tableRows: string[][] = [];
  let tableHeader: string[] = [];
  let listItems: { text: string; checked?: boolean }[] = [];
  let listType: 'ul' | 'ol' | 'check' | null = null;

  const flushList = () => {
    if (listItems.length > 0) {
      if (listType === 'check') {
        elements.push(
          <div key={`list-${elements.length}`} className="space-y-2 my-4">
            {listItems.map((item, i) => (
              <label key={i} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={item.checked}
                  className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-gray-900 dark:focus:ring-gray-500 bg-white dark:bg-gray-800"
                />
                <span className="text-gray-700 dark:text-gray-300">{item.text}</span>
              </label>
            ))}
          </div>
        );
      } else {
        const ListTag = listType === 'ol' ? 'ol' : 'ul';
        elements.push(
          <ListTag key={`list-${elements.length}`} className={`my-4 space-y-2 ${listType === 'ol' ? 'list-decimal' : 'list-disc'} list-inside text-gray-700 dark:text-gray-300`}>
            {listItems.map((item, i) => (
              <li key={i} className="leading-relaxed">{formatInlineText(item.text)}</li>
            ))}
          </ListTag>
        );
      }
      listItems = [];
      listType = null;
    }
  };

  const flushTable = () => {
    if (tableRows.length > 0) {
      elements.push(
        <div key={`table-${elements.length}`} className="my-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                {tableHeader.map((cell, i) => (
                  <th key={i} className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                  {row.map((cell, j) => (
                    <td key={j} className="py-3 px-4 text-gray-700 dark:text-gray-300">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      tableHeader = [];
      inTable = false;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    if (!trimmed) {
      flushList();
      return;
    }

    // Table handling
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      const cells = trimmed.slice(1, -1).split('|').map(c => c.trim());
      
      if (cells.every(c => /^[-:]+$/.test(c))) {
        return;
      }
      
      if (!inTable) {
        inTable = true;
        tableHeader = cells;
      } else {
        tableRows.push(cells);
      }
      return;
    } else if (inTable) {
      flushTable();
    }

    // Headings
    if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h1 key={index} className="text-3xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">
          {trimmed.slice(2)}
        </h1>
      );
      return;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={index} className="text-2xl font-semibold text-gray-900 dark:text-white mt-10 mb-4">
          {trimmed.slice(3)}
        </h2>
      );
      return;
    }
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={index} className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">
          {trimmed.slice(4)}
        </h3>
      );
      return;
    }

    // Checklist items
    if (trimmed.startsWith('- [ ]') || trimmed.startsWith('- [x]') || trimmed.startsWith('- [X]')) {
      if (listType !== 'check') {
        flushList();
        listType = 'check';
      }
      const checked = trimmed.startsWith('- [x]') || trimmed.startsWith('- [X]');
      const text = trimmed.slice(6).trim();
      listItems.push({ text, checked });
      return;
    }

    // Unordered list
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      listItems.push({ text: trimmed.slice(2) });
      return;
    }

    // Ordered list
    const olMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      listItems.push({ text: olMatch[1] });
      return;
    }

    flushList();

    // Paragraphs
    elements.push(
      <p key={index} className="text-gray-700 dark:text-gray-300 leading-relaxed my-4">
        {formatInlineText(trimmed)}
      </p>
    );
  });

  flushList();
  flushTable();

  return <>{elements}</>;
}

export default function ArticlePage() {
  const params = useParams();
  const slug = params.slug as string;
  const article = getArticle(slug);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = localStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          if (user.id) {
            setIsLoggedIn(true);
            return;
          }
        }
        const { getSession } = await import("@/lib/auth");
        const session = await getSession();
        if (session?.user) {
          setIsLoggedIn(true);
        }
      } catch {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        setIsLoggedIn(!!user.id);
      }
    };
    checkAuth();
  }, []);

  if (!article) {
    notFound();
  }

  const relatedArticles = getRelatedArticles(article.relatedSlugs);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navigation */}
      <nav className="h-11 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl z-50">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="text-base font-semibold text-gray-900 dark:text-white">
            ShiputzAI
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/tips" className="text-xs text-gray-900 dark:text-white font-medium">
              מאמרים וטיפים
            </Link>
            {isLoggedIn ? (
              <Link href="/dashboard" className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                לאזור האישי
              </Link>
            ) : (
              <Link href="/login" className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                כניסה
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Back Link */}
      <div className="max-w-3xl mx-auto px-6 pt-8">
        <Link 
          href="/tips" 
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          חזרה למאמרים
        </Link>
      </div>

      {/* Article Header */}
      <header className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className={`text-xs px-3 py-1 rounded-full ${categoryColors[article.category] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
            {article.category}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            זמן קריאה: {article.readingTime} דקות
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white leading-tight">
          {article.title}
        </h1>
        <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
          {article.excerpt}
        </p>
      </header>

      {/* Divider */}
      <div className="max-w-3xl mx-auto px-6">
        <div className="h-px bg-gray-100 dark:bg-gray-800"></div>
      </div>

      {/* Article Content */}
      <article className="max-w-3xl mx-auto px-6 py-8">
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <MarkdownContent content={article.content} />
        </div>
      </article>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="max-w-3xl mx-auto px-6 py-12 border-t border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            מאמרים נוספים שיעניינו אותך
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {relatedArticles.map((related) => (
              <Link
                key={related.slug}
                href={`/tips/${related.slug}`}
                className="group block border border-gray-100 dark:border-gray-800 rounded-xl p-5 hover:border-gray-300 dark:hover:border-gray-600 transition-all bg-white dark:bg-gray-900/50"
              >
                <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[related.category] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                  {related.category}
                </span>
                <h3 className="mt-3 font-semibold text-gray-900 dark:text-white group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                  {related.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  {related.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 px-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            רוצה לנהל את השיפוץ בצורה חכמה?
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            ShiputzAI יעזור לך לעקוב אחרי התקציב, לנתח הצעות מחיר ולהימנע מהפתעות.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-4 rounded-full text-base hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            התחל בחינם
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">© 2026 ShiputzAI</p>
          <div className="flex gap-6 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/tips" className="hover:text-gray-900 dark:hover:text-white">מאמרים</Link>
            <Link href="#" className="hover:text-gray-900 dark:hover:text-white">תנאי שימוש</Link>
            <Link href="#" className="hover:text-gray-900 dark:hover:text-white">צור קשר</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
