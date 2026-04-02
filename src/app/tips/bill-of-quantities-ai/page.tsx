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

export default function BillOfQuantitiesAIPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    document.title = "כתב כמויות אוטומטי בAI — חסכו אלפי שקלים | ShiputzAI";
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        if (user.id) setIsLoggedIn(true);
      }
    } catch {}
  }, []);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "כתב כמויות אוטומטי בAI — חסכו אלפי שקלים",
    "description": "כתב כמויות מקצועי עולה ₪3,000-₪8,000 ולוקח 1-2 שבועות. בShiputzAI, כתב כמויות AI נוצר תוך 30 שניות מתמונה של החדר.",
    "author": { "@type": "Organization", "name": "ShiputzAI" },
    "publisher": { "@type": "Organization", "name": "ShiputzAI", "url": "https://shipazti.com" },
    "mainEntityOfPage": { "@type": "WebPage", "@id": "https://shipazti.com/tips/bill-of-quantities-ai" },
    "datePublished": "2026-04-02",
    "dateModified": "2026-04-02"
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "מה זה כתב כמויות?",
        "acceptedAnswer": { "@type": "Answer", "text": "כתב כמויות הוא מסמך מפורט שמפרט את כל החומרים, העבודות והעלויות הנדרשות לפרויקט שיפוץ. הוא הבסיס להשוואת הצעות מחיר מקבלנים ולתכנון תקציב." }
      },
      {
        "@type": "Question",
        "name": "כמה עולה כתב כמויות מקצועי?",
        "acceptedAnswer": { "@type": "Answer", "text": "כתב כמויות מקצועי מאיש מקצוע עולה ₪3,000-₪8,000 ולוקח 1-2 שבועות. כתב כמויות AI בShiputzAI עולה ₪3-15 ומוכן תוך 30 שניות." }
      },
      {
        "@type": "Question",
        "name": "האם כתב כמויות AI מדויק?",
        "acceptedAnswer": { "@type": "Answer", "text": "כתב כמויות AI נותן הערכה טובה של 80-90% מהפריטים והעלויות. הוא מצוין כנקודת התחלה ולהשוואת הצעות מחיר, אך לפרויקטים גדולים מומלץ לאמת עם איש מקצוע." }
      },
      {
        "@type": "Question",
        "name": "איך יוצרים כתב כמויות בShiputzAI?",
        "acceptedAnswer": { "@type": "Answer", "text": "מעלים תמונה של החדר או הדמיית AI שיצרתם, לוחצים על 'כתב כמויות', וה-AI מייצר מסמך מפורט עם חומרים, כמויות, ועלויות משוערות תוך 30 שניות." }
      },
      {
        "@type": "Question",
        "name": "מה כולל כתב הכמויות?",
        "acceptedAnswer": { "@type": "Answer", "text": "כתב הכמויות כולל פירוט חומרים (ריצוף, צבע, חשמל, אינסטלציה), כמויות משוערות, עלויות חומרים, עלויות עבודה, וסיכום כולל. הכל בעברית ובמחירי שוק ישראלי." }
      }
    ]
  };

  return (
    <div dir="rtl" className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

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

      <div className="max-w-3xl mx-auto px-6 pt-8">
        <Link href="/tips" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          חזרה למאמרים
        </Link>
      </div>

      <header className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="text-xs px-3 py-1 rounded-full bg-amber-50 text-amber-700">כתב כמויות</span>
          <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700">AI וטכנולוגיה</span>
          <span className="text-xs text-gray-400">זמן קריאה: 7 דקות</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 leading-tight">
          כתב כמויות אוטומטי בAI — חסכו אלפי שקלים
        </h1>
      </header>

      <div className="max-w-3xl mx-auto px-6"><div className="h-px bg-gray-100"></div></div>

      <article className="max-w-3xl mx-auto px-6 py-8">
        <div className="prose prose-gray max-w-none">
          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            <strong>כתב כמויות מקצועי עולה ₪3,000-₪8,000 ולוקח 1-2 שבועות.</strong> בShiputzAI, כתב כמויות AI נוצר תוך 30 שניות מתמונה של החדר — עם פירוט חומרים, עבודה, ועלויות משוערות.
          </p>

          <p className="text-gray-700 leading-relaxed mb-8">
            כתב כמויות הוא אחד המסמכים החשובים ביותר בפרויקט שיפוץ. בלעדיו, אתם טסים בלי מכשירים — לא יודעים כמה חומרים צריך, כמה העבודה תעלה, ואם הצעת המחיר של הקבלן הגיונית. עד היום, רק איש מקצוע יכול היה להכין כתב כמויות. היום, AI עושה את זה תוך חצי דקה.
          </p>

          {/* What is BOQ */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">מה זה כתב כמויות ולמה זה חשוב?</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            כתב כמויות (Bill of Quantities) הוא מסמך מפורט שמפרט:
          </p>
          <ul className="space-y-2 text-gray-700 mb-8">
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">📋</span> <span><strong>חומרים:</strong> סוג וכמות של כל חומר — ריצוף, צבע, גבס, חשמל, אינסטלציה</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">👷</span> <span><strong>עבודה:</strong> פירוט שעות עבודה לכל מקצוע — חשמלאי, אינסטלטור, צבעי, רצף</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">💰</span> <span><strong>עלויות:</strong> מחיר משוער לכל פריט ועלות כוללת של הפרויקט</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">📊</span> <span><strong>השוואה:</strong> בסיס להשוואת הצעות מחיר מקבלנים שונים</span></li>
          </ul>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
            <p className="text-amber-900 font-medium mb-2">💡 למה חייבים כתב כמויות?</p>
            <p className="text-amber-800 text-sm">בלי כתב כמויות, הצעת מחיר מקבלן היא &quot;קופסה שחורה&quot;. אתם לא יודעים מה כלול, מה לא, ואם המחיר הגיוני. כתב כמויות מאפשר להשוות תפוחים לתפוחים.</p>
          </div>

          {/* Traditional vs AI */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">כתב כמויות מסורתי מול AI</h2>
          <div className="overflow-x-auto mb-8">
            <table dir="rtl" className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 border-b">פרמטר</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 border-b">כתב כמויות מסורתי</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 border-b bg-emerald-50">כתב כמויות AI (ShiputzAI)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">עלות</td>
                  <td className="py-3 px-4">₪3,000-₪8,000</td>
                  <td className="py-3 px-4 bg-emerald-50">₪3-15</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">זמן הכנה</td>
                  <td className="py-3 px-4">1-2 שבועות</td>
                  <td className="py-3 px-4 bg-emerald-50">30 שניות</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">דיוק</td>
                  <td className="py-3 px-4">95-100%</td>
                  <td className="py-3 px-4 bg-emerald-50">80-90%</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">ביקור באתר</td>
                  <td className="py-3 px-4">נדרש</td>
                  <td className="py-3 px-4 bg-emerald-50">לא נדרש (תמונה)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-gray-900">שפה</td>
                  <td className="py-3 px-4">עברית</td>
                  <td className="py-3 px-4 bg-emerald-50">עברית</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* How ShiputzAI BOQ works */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">איך כתב כמויות AI עובד בShiputzAI?</h2>
          <div className="space-y-4 mb-8">
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <span className="flex-shrink-0 w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-semibold">1</span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">מעלים תמונה</h3>
                  <p className="text-gray-600">תמונה של החדר הקיים, או הדמיית AI שיצרתם בShiputzAI. ה-AI מנתח את החדר — גודל משוער, חומרים קיימים, ומצב כללי.</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <span className="flex-shrink-0 w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-semibold">2</span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">ה-AI מייצר כתב כמויות</h3>
                  <p className="text-gray-600">תוך 30 שניות מקבלים מסמך מפורט עם כל החומרים, הכמויות, ועלויות משוערות לפי מחירי שוק ישראלי.</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <span className="flex-shrink-0 w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-semibold">3</span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">משתמשים להשוואה ומשא ומתן</h3>
                  <p className="text-gray-600">שולחים את כתב הכמויות לקבלנים ומבקשים הצעות מחיר. עכשיו אפשר להשוות בין הצעות על אותו בסיס.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sample BOQ */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">דוגמה: כתב כמויות למטבח</h2>
          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">כתב כמויות — שיפוץ מטבח 12 מ&quot;ר</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700">פירוק מטבח ישן + פינוי</span>
                <span className="text-gray-900 font-medium">₪3,500</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700">אינסטלציה — העברת נקודות מים וביוב</span>
                <span className="text-gray-900 font-medium">₪4,500</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700">חשמל — הוספת נקודות + לוח חשמל</span>
                <span className="text-gray-900 font-medium">₪5,000</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700">ריצוף פורצלן 60×60 (12 מ&quot;ר)</span>
                <span className="text-gray-900 font-medium">₪6,000</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700">חיפוי קירות — Backsplash</span>
                <span className="text-gray-900 font-medium">₪3,200</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700">ארונות מטבח תחתונים + עליונים</span>
                <span className="text-gray-900 font-medium">₪22,000</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700">משטח עבודה קוורץ</span>
                <span className="text-gray-900 font-medium">₪8,000</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700">כיור + ברז</span>
                <span className="text-gray-900 font-medium">₪2,500</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700">צביעה — 40 מ&quot;ר (קירות + תקרה)</span>
                <span className="text-gray-900 font-medium">₪2,800</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-gray-100 rounded-xl px-4 mt-4">
                <span className="text-gray-900 font-semibold">סה&quot;כ משוער</span>
                <span className="text-gray-900 font-bold text-lg">₪57,500</span>
              </div>
            </div>
          </div>

          {/* Accuracy */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">כמה מדויק כתב כמויות AI?</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            כתב כמויות AI מספק הערכה של 80-90% מהפריטים והעלויות. זה מספיק טוב כדי:
          </p>
          <ul className="space-y-2 text-gray-700 mb-4">
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span> <span>לקבל תמונה ראשונית של העלות הצפויה</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span> <span>להשוות הצעות מחיר מקבלנים שונים</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span> <span>לזהות פריטים חסרים או מחירים מנופחים בהצעה</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span> <span>לתכנן תקציב ראשוני</span></li>
          </ul>
          <p className="text-gray-600 text-sm mb-8">
            💡 <strong>טיפ:</strong> לפרויקטים גדולים (מעל ₪100,000), מומלץ להשתמש בכתב כמויות AI כנקודת התחלה ולאמת עם מודד כמויות מקצועי.
          </p>

          {/* Pro tip: combine with quote analysis */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">שילוב עם ניתוח הצעות מחיר</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            בShiputzAI אפשר לשלב את כתב הכמויות עם כלי ניתוח הצעות המחיר. התהליך:
          </p>
          <ol className="space-y-2 text-gray-700 mb-8 list-decimal list-inside">
            <li>יוצרים כתב כמויות AI מתמונה של החדר</li>
            <li>שולחים לקבלנים ומקבלים הצעות מחיר</li>
            <li>מעלים את הצעת המחיר לShiputzAI — ה-AI בודק אם המחירים סבירים</li>
            <li>משתמשים בניתוח כדי לנהל משא ומתן מושכל</li>
          </ol>
        </div>

        {/* CTA */}
        <div className="text-center my-10">
          <Link
            href="/signup"
            className="inline-block bg-gray-900 text-white px-10 py-4 rounded-full text-base font-medium hover:bg-gray-800 transition-colors"
          >
            צרו כתב כמויות AI עכשיו — חינם →
          </Link>
          <p className="text-sm text-gray-400 mt-3">10 קרדיטים חינם בהרשמה</p>
        </div>

        {/* FAQ */}
        <div className="mt-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">שאלות נפוצות</h2>
          <div className="space-y-4">
            <FaqItem question="מה זה כתב כמויות?" answer="כתב כמויות הוא מסמך מפורט שמפרט את כל החומרים, העבודות והעלויות הנדרשות לפרויקט שיפוץ. הוא הבסיס להשוואת הצעות מחיר מקבלנים ולתכנון תקציב." />
            <FaqItem question="כמה עולה כתב כמויות מקצועי?" answer="כתב כמויות מקצועי מאיש מקצוע עולה ₪3,000-₪8,000 ולוקח 1-2 שבועות. כתב כמויות AI בShiputzAI עולה ₪3-15 ומוכן תוך 30 שניות." />
            <FaqItem question="האם כתב כמויות AI מדויק?" answer="כתב כמויות AI נותן הערכה טובה של 80-90% מהפריטים והעלויות. הוא מצוין כנקודת התחלה ולהשוואת הצעות מחיר, אך לפרויקטים גדולים מומלץ לאמת עם איש מקצוע." />
            <FaqItem question="איך יוצרים כתב כמויות בShiputzAI?" answer="מעלים תמונה של החדר או הדמיית AI שיצרתם, לוחצים על 'כתב כמויות', וה-AI מייצר מסמך מפורט עם חומרים, כמויות, ועלויות משוערות תוך 30 שניות." />
            <FaqItem question="מה כולל כתב הכמויות?" answer="כתב הכמויות כולל פירוט חומרים (ריצוף, צבע, חשמל, אינסטלציה), כמויות משוערות, עלויות חומרים, עלויות עבודה, וסיכום כולל. הכל בעברית ובמחירי שוק ישראלי." />
          </div>
        </div>

        {/* Related */}
        <div className="mt-10 p-6 bg-gray-50 rounded-2xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">קרא גם</h3>
          <ul className="space-y-3">
            <li><Link href="/tips/renovation-cost-calculator" className="text-gray-700 hover:text-gray-900 hover:underline">מחשבון עלות שיפוץ — כמה באמת עולה שיפוץ דירה בישראל 2026</Link></li>
            <li><Link href="/tips/ai-kitchen-visualization" className="text-gray-700 hover:text-gray-900 hover:underline">הדמיית שיפוץ מטבח בAI — ראו את המטבח החדש תוך 30 שניות</Link></li>
            <li><Link href="/tips/ai-interior-design-israel" className="text-gray-700 hover:text-gray-900 hover:underline">עיצוב פנים בAI בישראל — המדריך המלא 2026</Link></li>
            <li><Link href="/tips/how-much-renovation-visualization" className="text-gray-700 hover:text-gray-900 hover:underline">כמה עולה הדמיית שיפוץ בAI? — מדריך מחירים 2026</Link></li>
          </ul>
        </div>
      </article>

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
