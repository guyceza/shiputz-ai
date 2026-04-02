"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";

export default function AboutPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    document.title = "אודות ShiputzAI — שיפוצי.אי | הכלי המוביל בישראל להדמיית עיצוב פנים";
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        if (user.id) setIsLoggedIn(true);
      }
    } catch {}
  }, []);

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ShiputzAI",
    "alternateName": "שיפוצי.אי",
    "url": "https://shipazti.com",
    "description": "הכלי המוביל בישראל להדמיית עיצוב פנים ושיפוצים באמצעות בינה מלאכותית",
    "foundingDate": "2025",
    "founder": {
      "@type": "Person",
      "name": "Guy Cezana",
      "alternateName": "גיא צזנה"
    },
    "sameAs": [],
    "logo": "https://shipazti.com/icon-512.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "url": "https://shipazti.com/contact",
      "availableLanguage": ["Hebrew", "English"]
    }
  };

  const aboutPageSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "אודות ShiputzAI",
    "description": "ShiputzAI הוא הכלי המוביל בישראל להדמיית עיצוב פנים ושיפוצים באמצעות בינה מלאכותית.",
    "url": "https://shipazti.com/about",
    "mainEntity": organizationSchema
  };

  const tools = [
    { emoji: "🎨", name: "הדמיית חדר", desc: "העלו תמונה, תארו את השינוי, וקבלו הדמיה פוטוריאליסטית תוך שניות" },
    { emoji: "🔍", name: "Style Matcher", desc: "AI מזהה את סגנון העיצוב בתמונה ונותן המלצות מותאמות" },
    { emoji: "🛒", name: "Shop the Look", desc: "לחצו על כל פריט בתמונה ומצאו אותו לרכישה" },
    { emoji: "🎬", name: "סרטון סיור", desc: "הפכו הדמיה לסרטון סיור וירטואלי בחדר המשופץ" },
    { emoji: "📐", name: "תוכנית קומה", desc: "צלמו חדר וקבלו תוכנית קומה אדריכלית עם מידות" },
    { emoji: "📋", name: "כתב כמויות", desc: "צלמו חדר וקבלו כתב כמויות מפורט עם עלויות משוערות" },
    { emoji: "💰", name: "ניתוח הצעת מחיר", desc: "העלו הצעת מחיר מקבלן וה-AI ינתח כל סעיף מול מחירי שוק" },
  ];

  const stats = [
    { value: "אלפי", label: "הדמיות נוצרו" },
    { value: "7", label: "כלי AI מקצועיים" },
    { value: "6", label: "תפקידים מקצועיים" },
    { value: "100%", label: "ממשק בעברית" },
  ];

  const values = [
    { icon: "💡", title: "חדשנות", desc: "שימוש בטכנולוגיות AI מתקדמות ליצירת חוויה פשוטה וחכמה" },
    { icon: "🌍", title: "נגישות", desc: "כלי מקצועי שזמין לכל אחד — בעלי דירות, מעצבים וקבלנים" },
    { icon: "✨", title: "פשטות", desc: "ממשק אינטואיטיבי שלא דורש ידע טכני או ניסיון בעיצוב" },
    { icon: "🇮🇱", title: "עברית-first", desc: "נבנה מהיסוד בעברית — לא תרגום, אלא חוויה מקומית מלאה" },
  ];

  return (
    <div className="min-h-screen bg-white" dir="rtl" style={{ fontFamily: "'Heebo', sans-serif" }}>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageSchema) }}
      />

      {/* Navigation */}
      <nav className="h-11 border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-xl z-50">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="text-base font-semibold text-gray-900">
            ShiputzAI
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/tips" className="text-xs text-gray-500 hover:text-gray-900">
              מאמרים וטיפים
            </Link>
            <Link href="/guide" className="text-xs text-gray-500 hover:text-gray-900">
              מדריך שימוש
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

      {/* Hero */}
      <section className="py-16 px-6 border-b border-gray-100">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            אודות ShiputzAI — שיפוצי.אי
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            ShiputzAI הוא הכלי המוביל בישראל להדמיית עיצוב פנים ושיפוצים באמצעות בינה מלאכותית. הפלטפורמה פותחה בישראל ב-2025 כדי לפתור בעיה פשוטה: איך רואים את תוצאת השיפוץ לפני שמתחילים?
          </p>
        </div>
      </section>

      {/* The Story */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">הסיפור שלנו</h2>
          <div className="space-y-4 text-gray-600 leading-relaxed">
            <p>
              ShiputzAI נולד מתוך תסכול אמיתי. כל מי ששיפץ פעם יודע את הרגע הזה — עומדים מול הקבלן, מנסים לדמיין איך הסלון ייראה אחרי השיפוץ, ומקווים לטוב. המציאות? ברוב המקרים התוצאה לא תואמת את הדמיון.
            </p>
            <p>
              <strong>גיא צזנה</strong>, יזם טכנולוגי ישראלי, החליט שהגיע הזמן לשנות את זה. ב-2025 הוא הקים את ShiputzAI עם חזון ברור: לאפשר לכל אחד לראות את תוצאת השיפוץ לפני שמשקיעים שקל אחד.
            </p>
            <p>
              במקום להסתמך על דמיון או על הדמיות יקרות שלוקחות ימים, ShiputzAI מאפשר ליצור הדמיה פוטוריאליסטית תוך 30 שניות בלבד — פשוט מעלים תמונה, מתארים את השינוי, ומקבלים תוצאה.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">המשימה שלנו</h2>
          <p className="text-xl text-gray-700 leading-relaxed">
            &ldquo;לאפשר לכל אחד — בעל דירה, מעצב, קבלן — לראות את התוצאה לפני שמשקיעים.&rdquo;
          </p>
        </div>
      </section>

      {/* 7 Tools */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">7 כלי AI בפלטפורמה אחת</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {tools.map((tool) => (
              <div key={tool.name} className="flex gap-4 p-5 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                <span className="text-3xl flex-shrink-0">{tool.emoji}</span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{tool.name}</h3>
                  <p className="text-sm text-gray-600">{tool.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-10 text-center">ShiputzAI במספרים</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl md:text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">הצוות</h2>
          <p className="text-gray-600 leading-relaxed">
            ShiputzAI פותח על ידי <strong>גיא צזנה</strong>, יזם טכנולוגי ישראלי. הפלטפורמה נבנתה מהיסוד בישראל, עם דגש על חוויית משתמש בעברית, הבנה של שוק השיפוצים הישראלי, ומחירוני שוק מקומיים.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">הערכים שלנו</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((value) => (
              <div key={value.title} className="bg-white p-6 rounded-xl border border-gray-100">
                <span className="text-2xl mb-3 block">{value.icon}</span>
                <h3 className="font-semibold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-sm text-gray-600">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">מוכנים לראות את השיפוץ לפני שמתחילים?</h2>
          <p className="text-gray-600 mb-8">הירשמו עכשיו וקבלו קרדיטים חינם לניסיון</p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
          >
            הרשמה חינם
            <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
