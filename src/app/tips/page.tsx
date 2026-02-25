"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { articles } from "./articles";

const categoryColors: Record<string, string> = {
  "תקציב": "bg-gray-900 text-white dark:bg-white dark:text-gray-900",
  "טיפים": "bg-gray-900 text-white dark:bg-white dark:text-gray-900",
  "קבלנים": "bg-gray-900 text-white dark:bg-white dark:text-gray-900",
  "חדרים": "bg-gray-900 text-white dark:bg-white dark:text-gray-900",
  "תכנון": "bg-gray-900 text-white dark:bg-white dark:text-gray-900",
  "תשתיות": "bg-gray-900 text-white dark:bg-white dark:text-gray-900",
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
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Navigation */}
      <nav className="h-11 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl z-50">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="text-base font-semibold text-gray-900 dark:text-white">
            ShiputzAI
          </Link>
          <div className="flex items-center gap-6">
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
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-16 px-6 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 dark:text-white mb-4">
            מאמרים וטיפים
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl">
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
            <div className="border border-gray-100 dark:border-gray-800 rounded-3xl p-8 md:p-12 hover:border-gray-300 dark:hover:border-gray-600 transition-all hover:shadow-sm dark:hover:shadow-gray-900/50">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className={`text-xs px-3 py-1 rounded-full ${categoryColors[featuredArticle.category] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                  {featuredArticle.category}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  זמן קריאה: {featuredArticle.readingTime} דקות
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                {featuredArticle.title}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed max-w-3xl">
                {featuredArticle.excerpt}
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-gray-900 dark:text-white font-medium">
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
                <article className="h-full border border-gray-100 dark:border-gray-800 rounded-2xl p-6 hover:border-gray-300 dark:hover:border-gray-600 transition-all hover:shadow-sm dark:hover:shadow-gray-900/50 flex flex-col bg-white dark:bg-gray-900/50">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`text-xs px-3 py-1 rounded-full ${categoryColors[article.category] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                      {article.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors leading-snug">
                    {article.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed flex-grow">
                    {article.excerpt}
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      זמן קריאה: {article.readingTime} דקות
                    </span>
                    <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-900 dark:group-hover:text-white group-hover:-translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - hide when logged in */}
      {!isLoggedIn && (
        <section className="py-16 px-6 bg-gray-50 dark:bg-gray-900 mt-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white mb-4">
              מוכנים להתחיל לתכנן?
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              ShiputzAI יעזור לכם לנהל את התקציב, לנתח הצעות מחיר ולהישאר בשליטה.
            </p>
            <Link
              href="/signup"
              className="inline-block bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-4 rounded-full text-base hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              התחל בחינם
            </Link>
          </div>
        </section>
      )}

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
