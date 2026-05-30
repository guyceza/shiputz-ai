"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { articles } from "./articles";

const categoryColors: Record<string, string> = {
  "AI": "bg-gray-900 text-white",
  "תקציב": "bg-gray-900 text-white",
  "טיפים": "bg-gray-900 text-white",
  "קבלנים": "bg-gray-900 text-white",
  "חדרים": "bg-gray-900 text-white",
  "תכנון": "bg-gray-900 text-white",
  "תשתיות": "bg-gray-900 text-white",
};

export default function TipsPage() {
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

  const featuredArticle = articles[0];
  const otherArticles = articles.slice(1);

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader isLoggedIn={isLoggedIn} position="sticky" authHref="/login?redirect=/tips" />

      {/* Hero */}
      <section className="py-16 px-6 border-b border-gray-100">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-4">
            מאמרים וטיפים
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl">
            כל מה שצריך לדעת לפני, במהלך ואחרי שיפוץ. 
            מידע מקצועי ומעשי שיעזור לכם לקבל החלטות חכמות.
          </p>
        </div>
      </section>

      {/* Featured Article */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <Link 
            href={`/tips/${featuredArticle.slug}`}
            className="block group"
          >
            <div className="border border-gray-100 rounded-3xl p-8 md:p-12 hover:border-gray-300 transition-all hover:shadow-sm">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className={`text-xs px-3 py-1 rounded-full ${categoryColors[featuredArticle.category] || 'bg-gray-100 text-gray-700'}`}>
                  {featuredArticle.category}
                </span>
                <span className="text-xs text-gray-400">
                  זמן קריאה: {featuredArticle.readingTime} דקות
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3 group-hover:text-gray-600 transition-colors">
                {featuredArticle.title}
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed max-w-3xl">
                {featuredArticle.excerpt}
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-gray-900 font-medium">
                קרא את המאמר
                <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Category Pills */}
      <section className="px-6 pb-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap gap-2">
            {Object.entries(categoryColors).map(([category, colors]) => (
              <span
                key={category}
                className={`text-xs px-4 py-2 rounded-full cursor-default ${colors}`}
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-8 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherArticles.map((article) => (
              <Link
                key={article.slug}
                href={`/tips/${article.slug}`}
                className="group block"
              >
                <article className="h-full border border-gray-100 rounded-2xl p-6 hover:border-gray-300 transition-all hover:shadow-sm flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`text-xs px-3 py-1 rounded-full ${categoryColors[article.category] || 'bg-gray-100 text-gray-700'}`}>
                      {article.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-gray-600 transition-colors leading-snug">
                    {article.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed flex-grow">
                    {article.excerpt}
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      זמן קריאה: {article.readingTime} דקות
                    </span>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-900 group-hover:-translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Navigation - Internal Links */}
      <section className="py-8 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">מדריכים פופולריים</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/tips/renovation-costs-2026" className="text-sm text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-full border border-gray-200 hover:border-gray-400 transition-all">
              עלויות שיפוץ 2026
            </Link>
            <Link href="/tips/room-visualization-ai" className="text-sm text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-full border border-gray-200 hover:border-gray-400 transition-all">
              הדמיית חדרים
            </Link>
            <Link href="/tips/ai-renovation-from-photo" className="text-sm text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-full border border-gray-200 hover:border-gray-400 transition-all">
              הדמיית שיפוץ מתמונה
            </Link>
            <Link href="/tips/hebrew-ai-interior-design" className="text-sm text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-full border border-gray-200 hover:border-gray-400 transition-all">
              עיצוב פנים AI בעברית
            </Link>
            <Link href="/tips/interiorai-alternative-israel" className="text-sm text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-full border border-gray-200 hover:border-gray-400 transition-all">
              חלופה ישראלית ל-InteriorAI
            </Link>
            <Link href="/tips/choosing-contractor" className="text-sm text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-full border border-gray-200 hover:border-gray-400 transition-all">
              בחירת קבלן
            </Link>
            <Link href="/tips/ai-kitchen-renovation" className="text-sm text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-full border border-gray-200 hover:border-gray-400 transition-all">
              הדמיית מטבח AI
            </Link>
            <Link href="/tips/living-room-before-after-ai" className="text-sm text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-full border border-gray-200 hover:border-gray-400 transition-all">
              סלון לפני ואחרי
            </Link>
            <Link href="/tips/floor-plan-ai-israel" className="text-sm text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-full border border-gray-200 hover:border-gray-400 transition-all">
              תוכנית דירה ל-AI
            </Link>
            <Link href="/tips/common-mistakes" className="text-sm text-gray-600 hover:text-gray-900 bg-white px-4 py-2 rounded-full border border-gray-200 hover:border-gray-400 transition-all">
              טעויות נפוצות
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section - hide when logged in */}
      {!isLoggedIn && (
        <section className="py-16 px-6 bg-gray-50 mt-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">
              מוכנים להתחיל לתכנן?
            </h2>
            <p className="text-gray-500 mb-8">
              ShiputzAI יעזור לכם לנהל את התקציב, לנתח הצעות מחיר ולהישאר בשליטה.
            </p>
            <Link
              href="/signup"
              className="inline-block bg-gray-900 text-white px-8 py-4 rounded-full text-base hover:bg-gray-800 transition-colors"
            >
              התחל בחינם
            </Link>
          </div>
        </section>
      )}

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
