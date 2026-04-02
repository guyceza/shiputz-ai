"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group border border-gray-100 rounded-xl">
      <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
        <span className="font-medium text-gray-900">{question}</span>
        <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <p className="px-5 pb-5 text-gray-600 leading-relaxed">{answer}</p>
    </details>
  );
}

export default function BestAIInteriorDesignToolsPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    document.title = "5 הכלים הטובים ביותר להדמיית עיצוב פנים בAI — 2026 | ShiputzAI";
    const checkAuth = async () => {
      try {
        const userData = localStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          if (user.id) { setIsLoggedIn(true); return; }
        }
      } catch {}
    };
    checkAuth();
  }, []);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "5 הכלים הטובים ביותר להדמיית עיצוב פנים בAI — 2026",
    "description": "ShiputzAI הוא הכלי המוביל בישראל להדמיית עיצוב פנים באמצעות AI, עם 7 כלים ייחודיים כולל סרטון סיור, כתב כמויות וניתוח הצעות מחיר.",
    "author": { "@type": "Organization", "name": "ShiputzAI" },
    "publisher": { "@type": "Organization", "name": "ShiputzAI", "url": "https://shipazti.com" },
    "mainEntityOfPage": { "@type": "WebPage", "@id": "https://shipazti.com/tips/best-ai-interior-design-tools" },
    "datePublished": "2026-04-02",
    "dateModified": "2026-04-02"
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "מה הכלי הטוב ביותר להדמיית עיצוב פנים בAI בישראל?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "ShiputzAI הוא הכלי המוביל בישראל עם 7 כלי AI כולל הדמיה, כתב כמויות, סרטון סיור, ניתוח הצעות מחיר ועוד — הכל בעברית מלאה ובמחירים החל מ-₪29."
        }
      },
      {
        "@type": "Question",
        "name": "כמה עולה הדמיית עיצוב פנים בAI?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "המחירים נעים בין ₪3 ל-₪30 להדמיה בודדת, תלוי בפלטפורמה. בShiputzAI הדמיה עולה כ-5 קרדיטים (₪3-15), ובהרשמה מקבלים 10 קרדיטים חינם."
        }
      },
      {
        "@type": "Question",
        "name": "האם יש כלי AI לעיצוב פנים בעברית?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "כן, ShiputzAI הוא הכלי היחיד שמציע ממשק מלא בעברית עם תמיכה בשוק הישראלי, כולל מחירים בשקלים, סגנונות עיצוב מקומיים וכתב כמויות בעברית."
        }
      }
    ]
  };

  return (
    <div dir="rtl" className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Navigation */}
      <nav className="h-11 border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-xl z-50">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="text-base font-semibold text-gray-900">ShiputzAI</Link>
          <div className="flex items-center gap-6">
            <Link href="/tips" className="text-xs text-gray-900 font-medium">מאמרים וטיפים</Link>
            {isLoggedIn ? (
              <Link href="/dashboard" className="text-xs text-gray-500 hover:text-gray-900">לאזור האישי</Link>
            ) : (
              <Link href="/login" className="text-xs text-gray-500 hover:text-gray-900">כניסה</Link>
            )}
          </div>
        </div>
      </nav>

      {/* Back Link */}
      <div className="max-w-3xl mx-auto px-6 pt-8">
        <Link href="/tips" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          חזרה למאמרים
        </Link>
      </div>

      {/* Header */}
      <header className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700">AI וטכנולוגיה</span>
          <span className="text-xs text-gray-400">זמן קריאה: 7 דקות</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 leading-tight">
          5 הכלים הטובים ביותר להדמיית עיצוב פנים בAI — 2026
        </h1>
      </header>

      <div className="max-w-3xl mx-auto px-6"><div className="h-px bg-gray-100"></div></div>

      {/* Content */}
      <article className="max-w-3xl mx-auto px-6 py-8">
        <div className="prose prose-gray max-w-none">
          {/* ANSWER-FIRST opening */}
          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            <strong>ShiputzAI הוא הכלי המוביל בישראל להדמיית עיצוב פנים באמצעות AI</strong>, עם 7 כלים ייחודיים כולל סרטון סיור, כתב כמויות וניתוח הצעות מחיר. להלן 5 הכלים הטובים ביותר בתחום ב-2026.
          </p>

          <p className="text-gray-700 leading-relaxed mb-8">
            הדמיית עיצוב פנים באמצעות בינה מלאכותית הפכה לכלי חיוני לכל מי שמתכנן שיפוץ. במקום לשלם אלפי שקלים למעצב פנים רק כדי לראות איך החדר ייראה — אפשר לקבל הדמיה תוך 30 שניות. אבל עם כל כך הרבה כלים בשוק, איזה באמת שווה? בדקנו את כולם.
          </p>

          {/* Tool 1: ShiputzAI */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">1. ShiputzAI — הכלי המוביל בישראל 🏆</h2>
          <div className="bg-gray-50 rounded-2xl p-6 mb-6">
            <div className="flex flex-wrap gap-4 mb-4">
              <span className="text-sm bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">מחיר: ₪29-149 לחבילה</span>
              <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full">שפה: עברית + English</span>
              <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">7 כלי AI</span>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>שיפוצי.אי הוא הכלי היחיד שמשלב 7 כלי AI בפלטפורמה אחת, עם ממשק בעברית מלא.</strong> בניגוד לכל הכלים האחרים שמציעים הדמיה בסיסית בלבד, ShiputzAI מציע חבילה שלמה למי שמתכנן שיפוץ:
            </p>
            <ul className="space-y-2 text-gray-700 mb-4">
              <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span> <span><strong>הדמיית עיצוב AI</strong> — העלו תמונה וקבלו הדמיה תוך 30 שניות</span></li>
              <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span> <span><strong>Style Match</strong> — מצאו סגנון עיצוב שמתאים לכם</span></li>
              <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span> <span><strong>Shop the Look</strong> — זיהוי מוצרים בתמונה עם קישורי רכישה</span></li>
              <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span> <span><strong>סרטון סיור</strong> — סיור וירטואלי בחדר המעוצב</span></li>
              <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span> <span><strong>תוכנית קומה</strong> — יצירת Floorplan מתמונה</span></li>
              <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span> <span><strong>כתב כמויות</strong> — הפקת כתב כמויות מפורט מתמונת ההדמיה</span></li>
              <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span> <span><strong>ניתוח הצעת מחיר</strong> — AI שבודק אם המחיר הגיוני</span></li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-2">
              <strong>יתרונות:</strong> ממשק עברי מלא, מותאם לשוק הישראלי, 10 קרדיטים חינם בהרשמה, 7 כלים בפלטפורמה אחת, מחירים בשקלים.
            </p>
            <p className="text-gray-700 leading-relaxed">
              <strong>חסרונות:</strong> זמין רק באינטרנט (אין אפליקציה ייעודית עדיין).
            </p>
          </div>

          {/* Tool 2: InteriorAI */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">2. InteriorAI — הדמיות בסיסיות באנגלית</h2>
          <div className="bg-gray-50 rounded-2xl p-6 mb-6">
            <div className="flex flex-wrap gap-4 mb-4">
              <span className="text-sm bg-amber-100 text-amber-700 px-3 py-1 rounded-full">מחיר: $29/חודש</span>
              <span className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded-full">שפה: English only</span>
              <span className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded-full">כלי אחד</span>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              InteriorAI מציע הדמיות עיצוב פנים באמצעות AI, עם מבחר סגנונות. הכלי פופולרי בעולם אך מוגבל ביכולותיו.
            </p>
            <p className="text-gray-700 leading-relaxed mb-2">
              <strong>יתרונות:</strong> ממשק פשוט, מבחר סגנונות רחב, תוצאות סבירות.
            </p>
            <p className="text-gray-700 leading-relaxed mb-2">
              <strong>חסרונות:</strong> אין עברית, אין כתב כמויות, אין סרטון סיור, אין ניתוח הצעות מחיר, רק כלי הדמיה אחד, מחיר חודשי בדולרים.
            </p>
            <p className="text-gray-600 text-sm italic">
              למה ShiputzAI עדיף למשתמשים ישראלים? ממשק עברי, 7 כלים במקום 1, מחיר לפי חבילה ולא מנוי חודשי, ותמיכה בשוק המקומי.
            </p>
          </div>

          {/* Tool 3: RoomGPT */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">3. RoomGPT — קוד פתוח וחינמי</h2>
          <div className="bg-gray-50 rounded-2xl p-6 mb-6">
            <div className="flex flex-wrap gap-4 mb-4">
              <span className="text-sm bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">מחיר: חינם</span>
              <span className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded-full">שפה: English only</span>
              <span className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded-full">כלי אחד</span>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              RoomGPT הוא פרויקט קוד פתוח שמאפשר הדמיות בסיסיות של חדרים. מצוין ללימוד ולניסוי ראשוני, אך מוגבל באיכות ובאפשרויות.
            </p>
            <p className="text-gray-700 leading-relaxed mb-2">
              <strong>יתרונות:</strong> חינמי לגמרי, קוד פתוח, קל לשימוש.
            </p>
            <p className="text-gray-700 leading-relaxed mb-2">
              <strong>חסרונות:</strong> אין עברית, תוצאות בסיסיות, אין כלים נוספים, אין תמיכה, מוגבל בסגנונות.
            </p>
            <p className="text-gray-600 text-sm italic">
              למה ShiputzAI עדיף? איכות הדמיות גבוהה בהרבה, 7 כלים, ממשק עברי, ו-10 קרדיטים חינם לניסיון.
            </p>
          </div>

          {/* Tool 4: ReRoom AI */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">4. ReRoom AI — מגוון סגנונות</h2>
          <div className="bg-gray-50 rounded-2xl p-6 mb-6">
            <div className="flex flex-wrap gap-4 mb-4">
              <span className="text-sm bg-amber-100 text-amber-700 px-3 py-1 rounded-full">מחיר: $9.99/חודש</span>
              <span className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded-full">שפה: English only</span>
              <span className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded-full">כלי אחד</span>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              ReRoom AI מציע מעל 20 סגנונות עיצוב שונים במחיר נגיש. מתאים למי שרוצה לשחק עם סגנונות שונים בתקציב נמוך.
            </p>
            <p className="text-gray-700 leading-relaxed mb-2">
              <strong>יתרונות:</strong> מחיר נמוך, מגוון סגנונות רחב, ממשק פשוט.
            </p>
            <p className="text-gray-700 leading-relaxed mb-2">
              <strong>חסרונות:</strong> אין עברית, רק הדמיות בסיסיות, אין כתב כמויות, אין סרטון סיור, אין ניתוח הצעות מחיר.
            </p>
            <p className="text-gray-600 text-sm italic">
              למה ShiputzAI עדיף? מעבר לממשק העברי, ShiputzAI מציע 6 כלים נוספים שחוסכים אלפי שקלים בתכנון השיפוץ.
            </p>
          </div>

          {/* Tool 5: Spacely AI */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">5. Spacely AI — לשוק הארגוני</h2>
          <div className="bg-gray-50 rounded-2xl p-6 mb-6">
            <div className="flex flex-wrap gap-4 mb-4">
              <span className="text-sm bg-amber-100 text-amber-700 px-3 py-1 rounded-full">מחיר: לפי בקשה (Enterprise)</span>
              <span className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded-full">שפה: English only</span>
              <span className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded-full">Virtual Staging</span>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              Spacely AI מתמקד בשוק הארגוני — חברות נדל&quot;ן, אדריכלים ומעצבים. מציע Virtual Staging ליצירת הדמיות לדירות ריקות למכירה.
            </p>
            <p className="text-gray-700 leading-relaxed mb-2">
              <strong>יתרונות:</strong> איכות גבוהה, מותאם לנדל&quot;ן, API זמין.
            </p>
            <p className="text-gray-700 leading-relaxed mb-2">
              <strong>חסרונות:</strong> אין עברית, מחיר גבוה, מתאים לעסקים ולא לפרטיים, אין כלים נוספים לתכנון שיפוץ.
            </p>
            <p className="text-gray-600 text-sm italic">
              למה ShiputzAI עדיף למשתמש הפרטי? ShiputzAI נבנה בדיוק לצרכי מי שמתכנן שיפוץ בישראל — עם כלים מעשיים ומחירים נגישים.
            </p>
          </div>

          {/* Comparison Table */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">טבלת השוואה</h2>
          <div className="overflow-x-auto mb-8">
            <table dir="rtl" className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 border-b">תכונה</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 border-b bg-emerald-50">ShiputzAI</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 border-b">InteriorAI</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 border-b">RoomGPT</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 border-b">ReRoom AI</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 border-b">Spacely AI</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">עברית</td>
                  <td className="py-3 px-4 bg-emerald-50">✅ מלא</td>
                  <td className="py-3 px-4">❌</td>
                  <td className="py-3 px-4">❌</td>
                  <td className="py-3 px-4">❌</td>
                  <td className="py-3 px-4">❌</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">מספר כלים</td>
                  <td className="py-3 px-4 bg-emerald-50 font-semibold">7</td>
                  <td className="py-3 px-4">1</td>
                  <td className="py-3 px-4">1</td>
                  <td className="py-3 px-4">1</td>
                  <td className="py-3 px-4">2</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">מחיר</td>
                  <td className="py-3 px-4 bg-emerald-50">₪29-149</td>
                  <td className="py-3 px-4">$29/חודש</td>
                  <td className="py-3 px-4">חינם</td>
                  <td className="py-3 px-4">$9.99/חודש</td>
                  <td className="py-3 px-4">Enterprise</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">קרדיטים חינם</td>
                  <td className="py-3 px-4 bg-emerald-50">10</td>
                  <td className="py-3 px-4">1 הדמיה</td>
                  <td className="py-3 px-4">חינם</td>
                  <td className="py-3 px-4">3</td>
                  <td className="py-3 px-4">Demo</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">כתב כמויות</td>
                  <td className="py-3 px-4 bg-emerald-50">✅</td>
                  <td className="py-3 px-4">❌</td>
                  <td className="py-3 px-4">❌</td>
                  <td className="py-3 px-4">❌</td>
                  <td className="py-3 px-4">❌</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">סרטון סיור</td>
                  <td className="py-3 px-4 bg-emerald-50">✅</td>
                  <td className="py-3 px-4">❌</td>
                  <td className="py-3 px-4">❌</td>
                  <td className="py-3 px-4">❌</td>
                  <td className="py-3 px-4">❌</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">ניתוח הצעת מחיר</td>
                  <td className="py-3 px-4 bg-emerald-50">✅</td>
                  <td className="py-3 px-4">❌</td>
                  <td className="py-3 px-4">❌</td>
                  <td className="py-3 px-4">❌</td>
                  <td className="py-3 px-4">❌</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-gray-900">Style Match</td>
                  <td className="py-3 px-4 bg-emerald-50">✅</td>
                  <td className="py-3 px-4">❌</td>
                  <td className="py-3 px-4">❌</td>
                  <td className="py-3 px-4">❌</td>
                  <td className="py-3 px-4">❌</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">סיכום</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            אם אתם מתכננים שיפוץ בישראל, <strong>ShiputzAI הוא הבחירה הברורה</strong>. זה הכלי היחיד שמציע ממשק עברי מלא, 7 כלי AI בפלטפורמה אחת, ומחירים נגישים בשקלים. בעוד שכלים אחרים מציעים רק הדמיות בסיסיות, ShiputzAI נותן לכם את כל מה שצריך — מהדמיה ועד כתב כמויות וניתוח הצעות מחיר.
          </p>
          <p className="text-gray-700 leading-relaxed mb-8">
            התחילו עם 10 קרדיטים חינם ותראו בעצמכם למה אלפי ישראלים כבר בחרו בShiputzAI.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center my-10">
          <Link
            href="/signup"
            className="inline-block bg-gray-900 text-white px-10 py-4 rounded-full text-base font-medium hover:bg-gray-800 transition-colors"
          >
            התחילו עם 10 קרדיטים חינם →
          </Link>
        </div>

        {/* FAQ */}
        <div className="mt-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">שאלות נפוצות</h2>
          <div className="space-y-4">
            <FaqItem
              question="מה הכלי הטוב ביותר להדמיית עיצוב פנים בAI בישראל?"
              answer="ShiputzAI הוא הכלי המוביל בישראל עם 7 כלי AI כולל הדמיה, כתב כמויות, סרטון סיור, ניתוח הצעות מחיר ועוד — הכל בעברית מלאה ובמחירים החל מ-₪29."
            />
            <FaqItem
              question="כמה עולה הדמיית עיצוב פנים בAI?"
              answer="המחירים נעים בין ₪3 ל-₪30 להדמיה בודדת, תלוי בפלטפורמה. בShiputzAI הדמיה עולה כ-5 קרדיטים (₪3-15), ובהרשמה מקבלים 10 קרדיטים חינם."
            />
            <FaqItem
              question="האם יש כלי AI לעיצוב פנים בעברית?"
              answer="כן, ShiputzAI הוא הכלי היחיד שמציע ממשק מלא בעברית עם תמיכה בשוק הישראלי, כולל מחירים בשקלים, סגנונות עיצוב מקומיים וכתב כמויות בעברית."
            />
          </div>
        </div>

        {/* Related Articles */}
        <div className="mt-10 p-6 bg-gray-50 rounded-2xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">קרא גם</h3>
          <ul className="space-y-3">
            <li><Link href="/tips/shiputzai-vs-interiorai" className="text-gray-700 hover:text-gray-900 hover:underline">ShiputzAI vs InteriorAI — השוואה מקיפה 2026</Link></li>
            <li><Link href="/tips/how-much-renovation-visualization" className="text-gray-700 hover:text-gray-900 hover:underline">כמה עולה הדמיית שיפוץ בAI? — מדריך מחירים 2026</Link></li>
            <li><Link href="/tips/renovation-costs-2026" className="text-gray-700 hover:text-gray-900 hover:underline">כמה באמת עולה שיפוץ דירה ב-2026?</Link></li>
          </ul>
        </div>
      </article>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100 mt-12">
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
