"use client";
export const dynamic = "force-static";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getArticle, getRelatedArticles, generateFaqSchema, generateArticleSchema, articles } from "../articles";
import { notFound } from "next/navigation";
import Head from "next/head";

const categoryColors: Record<string, string> = {
  "תקציב": "bg-emerald-50 text-emerald-700",
  "טיפים": "bg-amber-50 text-amber-700",
  "קבלנים": "bg-blue-50 text-blue-700",
  "חדרים": "bg-purple-50 text-purple-700",
  "תכנון": "bg-rose-50 text-rose-700",
  "תשתיות": "bg-orange-50 text-orange-700",
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
        <strong key={key++} className="font-semibold text-gray-900">
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
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-gray-700">{item.text}</span>
              </label>
            ))}
          </div>
        );
      } else {
        const ListTag = listType === 'ol' ? 'ol' : 'ul';
        elements.push(
          <ListTag key={`list-${elements.length}`} className={`my-4 space-y-2 ${listType === 'ol' ? 'list-decimal' : 'list-disc'} list-inside text-gray-700`}>
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
              <tr className="border-b border-gray-200">
                {tableHeader.map((cell, i) => (
                  <th key={i} className="py-3 px-4 text-right font-semibold text-gray-900">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, i) => (
                <tr key={i} className="border-b border-gray-100">
                  {row.map((cell, j) => (
                    <td key={j} className="py-3 px-4 text-gray-700">
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
        <h1 key={index} className="text-3xl font-semibold text-gray-900 mt-8 mb-4">
          {trimmed.slice(2)}
        </h1>
      );
      return;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={index} className="text-2xl font-semibold text-gray-900 mt-10 mb-4">
          {trimmed.slice(3)}
        </h2>
      );
      return;
    }
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={index} className="text-xl font-semibold text-gray-900 mt-8 mb-3">
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
      <p key={index} className="text-gray-700 leading-relaxed my-4">
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
  // Additional articles from same category (for broader internal linking)
  const sameCategoryArticles = articles.filter(
    a => a.category === article.category && a.slug !== article.slug && !article.relatedSlugs.includes(a.slug)
  ).slice(0, 2);
  const allRelatedArticles = [...relatedArticles, ...sameCategoryArticles];
  const faqSchema = generateFaqSchema(article);
  const articleSchema = generateArticleSchema(article);

  return (
    <div className="min-h-screen bg-white">
      {/* SEO: Article structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {/* SEO: FAQ structured data for rich snippets */}
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      {/* Navigation */}
      <nav className="h-11 border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-xl z-50">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="text-base font-semibold text-gray-900">
            ShiputzAI
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/tips" className="text-xs text-gray-900 font-medium">
              מאמרים וטיפים
            </Link>
            {isLoggedIn ? (
              <Link href="/dashboard" className="text-xs text-gray-500 hover:text-gray-900">
                לאזור האישי
              </Link>
            ) : (
              <Link href="/login" className="text-xs text-gray-500 hover:text-gray-900">
                כניסה
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Back Link */}
      <div className="max-w-3xl mx-auto px-6 pt-8">
        <Link 
          href="/tips" 
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
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
          <span className={`text-xs px-3 py-1 rounded-full ${categoryColors[article.category] || 'bg-gray-100 text-gray-700'}`}>
            {article.category}
          </span>
          <span className="text-xs text-gray-400">
            זמן קריאה: {article.readingTime} דקות
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 leading-tight">
          {article.title}
        </h1>
        <p className="mt-4 text-lg text-gray-500 leading-relaxed">
          {article.excerpt}
        </p>
      </header>

      {/* Divider */}
      <div className="max-w-3xl mx-auto px-6">
        <div className="h-px bg-gray-100"></div>
      </div>

      {/* Article Content */}
      <article className="max-w-3xl mx-auto px-6 py-8">
        <div className="prose prose-gray max-w-none">
          <MarkdownContent content={article.content} />
        </div>

        {/* In-content cross-links for SEO */}
        {relatedArticles.length > 0 && (
          <div className="mt-10 p-6 bg-gray-50 rounded-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              קרא גם
            </h3>
            <ul className="space-y-3">
              {relatedArticles.map((related) => (
                <li key={related.slug}>
                  <Link
                    href={`/tips/${related.slug}`}
                    className="text-gray-700 hover:text-gray-900 transition-colors flex items-center gap-2 group"
                  >
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="group-hover:underline">{related.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* FAQ Section for users (also matches JSON-LD) */}
        {article.faq && article.faq.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">שאלות נפוצות</h2>
            <div className="space-y-4">
              {article.faq.map((faq, index) => (
                <details key={index} className="group border border-gray-100 rounded-xl">
                  <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
                    <span className="font-medium text-gray-900">{faq.question}</span>
                    <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="px-5 pb-5 text-gray-600 leading-relaxed">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Related Articles */}
      {allRelatedArticles.length > 0 && (
        <section className="max-w-3xl mx-auto px-6 py-12 border-t border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            מאמרים נוספים שיעניינו אותך
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {allRelatedArticles.map((related) => (
              <Link
                key={related.slug}
                href={`/tips/${related.slug}`}
                className="group block border border-gray-100 rounded-xl p-5 hover:border-gray-300 transition-all"
              >
                <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[related.category] || 'bg-gray-100 text-gray-700'}`}>
                  {related.category}
                </span>
                <h3 className="mt-3 font-semibold text-gray-900 group-hover:text-gray-600 transition-colors">
                  {related.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                  {related.excerpt}
                </p>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="/tips" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              ← לכל המאמרים והטיפים
            </Link>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            רוצה לנהל את השיפוץ בצורה חכמה?
          </h2>
          <p className="text-gray-500 mb-8">
            ShiputzAI יעזור לך לעקוב אחרי התקציב, לנתח הצעות מחיר ולהימנע מהפתעות.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-gray-900 text-white px-8 py-4 rounded-full text-base hover:bg-gray-800 transition-colors"
          >
            התחל בחינם
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">© 2026 ShiputzAI</p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/tips" className="hover:text-gray-900">מאמרים</Link>
            <Link href="/terms" className="hover:text-gray-900">תנאי שימוש</Link>
            <a href="/contact" className="hover:text-gray-900">צור קשר</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
