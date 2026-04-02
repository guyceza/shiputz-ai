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

export default function AIInteriorDesignIsraelPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    document.title = "עיצוב פנים בAI בישראל — המדריך המלא 2026 | ShiputzAI";
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
    "headline": "עיצוב פנים בAI בישראל — המדריך המלא 2026",
    "description": "עיצוב פנים בAI הוא הדרך המהירה והזולה ביותר לראות איך הבית שלכם ייראה אחרי שיפוץ. ShiputzAI הוא הכלי המוביל בישראל.",
    "author": { "@type": "Organization", "name": "ShiputzAI" },
    "publisher": { "@type": "Organization", "name": "ShiputzAI", "url": "https://shipazti.com" },
    "mainEntityOfPage": { "@type": "WebPage", "@id": "https://shipazti.com/tips/ai-interior-design-israel" },
    "datePublished": "2026-04-02",
    "dateModified": "2026-04-02"
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "מה זה עיצוב פנים בAI?",
        "acceptedAnswer": { "@type": "Answer", "text": "עיצוב פנים בAI הוא שימוש בבינה מלאכותית ליצירת הדמיות של חדרים מעוצבים. מעלים תמונה של החדר הקיים, מתארים את השינוי הרצוי, ומקבלים הדמיה פוטוריאליסטית תוך שניות." }
      },
      {
        "@type": "Question",
        "name": "האם יש כלי עיצוב פנים AI בעברית?",
        "acceptedAnswer": { "@type": "Answer", "text": "כן, ShiputzAI הוא הכלי היחיד בישראל עם ממשק בעברית מלא, מחירים בשקלים, ותמיכה בסגנונות עיצוב ישראליים. 7 כלי AI בפלטפורמה אחת." }
      },
      {
        "@type": "Question",
        "name": "כמה עולה עיצוב פנים בAI?",
        "acceptedAnswer": { "@type": "Answer", "text": "בShiputzAI, חבילת 10 קרדיטים עולה ₪29, חבילת 30 עולה ₪69, וחבילת 100 עולה ₪149. בהרשמה מקבלים 10 קרדיטים חינם. לעומת מעצב פנים שגובה ₪10,000-₪50,000." }
      },
      {
        "@type": "Question",
        "name": "למי מתאים עיצוב פנים בAI?",
        "acceptedAnswer": { "@type": "Answer", "text": "עיצוב פנים בAI מתאים לבעלי דירות שמתכננים שיפוץ, מעצבי פנים שרוצים לייצר הדמיות מהירות, קבלנים שרוצים להציג הצעות ללקוחות, ומתווכי נדל\"ן שרוצים Virtual Staging." }
      },
      {
        "@type": "Question",
        "name": "מה ההבדל בין ShiputzAI לכלים אחרים?",
        "acceptedAnswer": { "@type": "Answer", "text": "ShiputzAI הוא הכלי היחיד שמשלב 7 כלי AI — הדמיה, כתב כמויות, ניתוח הצעות מחיר, סרטון סיור, Style Match, Shop the Look ותוכנית קומה. כל הכלים האחרים מציעים רק הדמיה בסיסית." }
      },
      {
        "@type": "Question",
        "name": "האם התוצאות מדויקות?",
        "acceptedAnswer": { "@type": "Answer", "text": "הדמיות AI הן פוטוריאליסטיות ונותנות תמונה מצוינת של הכיוון העיצובי. לתכנון מדויק של מידות וחומרים, מומלץ לשלב עם מעצב פנים מקצועי." }
      },
      {
        "@type": "Question",
        "name": "איך מתחילים?",
        "acceptedAnswer": { "@type": "Answer", "text": "נרשמים בShiputzAI (חינם, 10 קרדיטים מתנה), מעלים תמונה של החדר, כותבים מה רוצים לשנות, ומקבלים הדמיה תוך 30 שניות. פשוט ככה." }
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
          <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-700">עיצוב פנים</span>
          <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700">מדריך מקיף</span>
          <span className="text-xs text-gray-400">זמן קריאה: 10 דקות</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 leading-tight">
          עיצוב פנים בAI בישראל — המדריך המלא 2026
        </h1>
      </header>

      <div className="max-w-3xl mx-auto px-6"><div className="h-px bg-gray-100"></div></div>

      <article className="max-w-3xl mx-auto px-6 py-8">
        <div className="prose prose-gray max-w-none">
          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            <strong>עיצוב פנים בAI הוא הדרך המהירה והזולה ביותר לראות איך הבית שלכם ייראה אחרי שיפוץ.</strong> ShiputzAI הוא הכלי המוביל בישראל עם ממשק בעברית, 7 כלי AI, ומחירים מ-₪29.
          </p>

          <p className="text-gray-700 leading-relaxed mb-8">
            בעבר, כדי לראות איך חדר ייראה אחרי שיפוץ, הייתם צריכים לשכור מעצב פנים (₪10,000-₪50,000), לחכות שבועות להדמיות, ולקוות שהתוצאה מתאימה לחזון שלכם. היום, בינה מלאכותית שינתה את התמונה לחלוטין.
          </p>

          {/* What is AI interior design */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">מה זה עיצוב פנים בAI?</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            עיצוב פנים בAI הוא שימוש באלגוריתמים של בינה מלאכותית ליצירת הדמיות ויזואליות של חדרים מעוצבים. התהליך פשוט:
          </p>
          <ol className="space-y-2 text-gray-700 mb-8 list-decimal list-inside">
            <li>מעלים תמונה של החדר הקיים</li>
            <li>מתארים את השינוי הרצוי (סגנון, צבעים, רהיטים)</li>
            <li>ה-AI מייצר הדמיה פוטוריאליסטית תוך 30 שניות</li>
          </ol>

          {/* How ShiputzAI works */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">7 כלי AI של ShiputzAI</h2>
          <div className="space-y-4 mb-8">
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-1">🎨 הדמיית עיצוב AI</h3>
              <p className="text-gray-600">העלו תמונה וקבלו הדמיה של החדר המשופץ תוך 30 שניות. תומך בכל סגנון — מודרני, כפרי, סקנדינבי, תעשייתי ועוד.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-1">🎯 Style Match</h3>
              <p className="text-gray-600">לא יודעים איזה סגנון אתם רוצים? העלו תמונת השראה וה-AI יזהה את הסגנון ויציע לכם וריאציות.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-1">🛋️ Shop the Look</h3>
              <p className="text-gray-600">ראיתם רהיט שאהבתם בהדמיה? ה-AI מזהה מוצרים ומציע לכם איפה לקנות אותם עם מחירים.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-1">🎬 סרטון סיור</h3>
              <p className="text-gray-600">קבלו סרטון קצר של סיור וירטואלי בחדר המעוצב — מושלם להראות לבן/בת הזוג או לקבלן.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-1">📐 תוכנית קומה</h3>
              <p className="text-gray-600">יצירת Floorplan מתמונה — פריסת רהיטים, מידות משוערות ותכנון חלל.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-1">📋 כתב כמויות AI</h3>
              <p className="text-gray-600">מהדמיה לכתב כמויות מפורט — חומרים, עבודה, ועלויות משוערות. חוסך ₪3,000-₪8,000.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-1">💰 ניתוח הצעת מחיר</h3>
              <p className="text-gray-600">קיבלתם הצעת מחיר מקבלן? העלו אותה וה-AI יבדוק אם המחירים הגיוניים ואיפה אפשר לחסוך.</p>
            </div>
          </div>

          {/* Who uses it */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">למי מתאים עיצוב פנים בAI?</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">🏠 בעלי דירות</h3>
              <p className="text-gray-600 text-sm">מתכננים שיפוץ? ראו בדיוק איך הבית ייראה לפני שמשקיעים. חסכו אלפי שקלים על הדמיות מעצב.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">🎨 מעצבי פנים</h3>
              <p className="text-gray-600 text-sm">ייצרו הדמיות מהירות ללקוחות, הציגו כמה אופציות תוך דקות, וחסכו שעות עבודה על רנדרים.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">🔨 קבלנים</h3>
              <p className="text-gray-600 text-sm">הציגו ללקוחות הדמיה של התוצאה הסופית עוד לפני שמתחילים לעבוד. מגדילים אחוזי סגירה משמעותית.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">🏢 מתווכי נדל&quot;ן</h3>
              <p className="text-gray-600 text-sm">Virtual Staging — הפכו דירה ריקה לדירה מעוצבת בתמונות. מוכר דירות מהר יותר ובמחיר גבוה יותר.</p>
            </div>
          </div>

          {/* Pricing comparison */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">השוואת מחירים: AI מול מעצב מסורתי</h2>
          <div className="overflow-x-auto mb-8">
            <table dir="rtl" className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 border-b">שירות</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 border-b bg-emerald-50">ShiputzAI</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 border-b">מעצב פנים</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">הדמיה בסיסית</td>
                  <td className="py-3 px-4 bg-emerald-50">₪3-15 (30 שניות)</td>
                  <td className="py-3 px-4">₪3,000-₪8,000 (2-3 שבועות)</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">כתב כמויות</td>
                  <td className="py-3 px-4 bg-emerald-50">₪3-15 (30 שניות)</td>
                  <td className="py-3 px-4">₪3,000-₪8,000 (1-2 שבועות)</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">ייעוץ עיצוב מלא</td>
                  <td className="py-3 px-4 bg-emerald-50">₪29-149 (ללא הגבלת ניסיונות)</td>
                  <td className="py-3 px-4">₪10,000-₪50,000</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-gray-900">סרטון סיור</td>
                  <td className="py-3 px-4 bg-emerald-50">₪3-15</td>
                  <td className="py-3 px-4">₪5,000-₪15,000 (3D rendering)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Israeli market */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">השוק הישראלי: למה צריך כלי מקומי?</h2>
          <ul className="space-y-3 text-gray-700 mb-8">
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span> <span><strong>עברית מלאה:</strong> ממשק, הוראות, כתב כמויות — הכל בעברית. לא צריך לתרגם מאנגלית.</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span> <span><strong>מחירים בשקלים:</strong> כתב הכמויות מציג עלויות בשקלים חדשים, לפי מחירי השוק הישראלי.</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span> <span><strong>סגנונות מקומיים:</strong> ים-תיכוני, באוהאוס, ישראלי מודרני — סגנונות שרלוונטיים לבתים בארץ.</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span> <span><strong>חומרים מקומיים:</strong> ה-AI מכיר חומרים נפוצים בישראל — גרניט פורצלן, שיש קיסריה, ועוד.</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span> <span><strong>תשלום מקומי:</strong> תשלום בשקלים דרך כרטיס אשראי ישראלי, ללא עמלות המרה.</span></li>
          </ul>

          {/* ShiputzAI vs alternatives */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">ShiputzAI מול החלופות</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            בשוק יש כמה כלי AI לעיצוב פנים, אבל רובם מיועדים לשוק האמריקאי ולא מותאמים לישראל:
          </p>
          <ul className="space-y-3 text-gray-700 mb-8">
            <li className="flex items-start gap-2"><span className="text-gray-400 mt-1">•</span> <span><strong>InteriorAI:</strong> הדמיות בלבד, אנגלית בלבד, $29/חודש, כלי אחד</span></li>
            <li className="flex items-start gap-2"><span className="text-gray-400 mt-1">•</span> <span><strong>RoomGPT:</strong> חינמי אך בסיסי, אנגלית בלבד, ללא כלים נוספים</span></li>
            <li className="flex items-start gap-2"><span className="text-gray-400 mt-1">•</span> <span><strong>ReRoom AI:</strong> $9.99/חודש, אנגלית בלבד, הדמיות בלבד</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">★</span> <span><strong>ShiputzAI:</strong> 7 כלי AI, עברית מלאה, ₪29-149 לחבילה, ממשק ישראלי</span></li>
          </ul>
        </div>

        {/* CTA */}
        <div className="text-center my-10">
          <Link
            href="/signup"
            className="inline-block bg-gray-900 text-white px-10 py-4 rounded-full text-base font-medium hover:bg-gray-800 transition-colors"
          >
            הירשמו חינם — 10 קרדיטים מתנה →
          </Link>
          <p className="text-sm text-gray-400 mt-3">לא צריך כרטיס אשראי</p>
        </div>

        {/* FAQ */}
        <div className="mt-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">שאלות נפוצות</h2>
          <div className="space-y-4">
            <FaqItem question="מה זה עיצוב פנים בAI?" answer="עיצוב פנים בAI הוא שימוש בבינה מלאכותית ליצירת הדמיות של חדרים מעוצבים. מעלים תמונה של החדר הקיים, מתארים את השינוי הרצוי, ומקבלים הדמיה פוטוריאליסטית תוך שניות." />
            <FaqItem question="האם יש כלי עיצוב פנים AI בעברית?" answer="כן, ShiputzAI הוא הכלי היחיד בישראל עם ממשק בעברית מלא, מחירים בשקלים, ותמיכה בסגנונות עיצוב ישראליים. 7 כלי AI בפלטפורמה אחת." />
            <FaqItem question="כמה עולה עיצוב פנים בAI?" answer="בShiputzAI, חבילת 10 קרדיטים עולה ₪29, חבילת 30 עולה ₪69, וחבילת 100 עולה ₪149. בהרשמה מקבלים 10 קרדיטים חינם. לעומת מעצב פנים שגובה ₪10,000-₪50,000." />
            <FaqItem question="למי מתאים עיצוב פנים בAI?" answer='עיצוב פנים בAI מתאים לבעלי דירות שמתכננים שיפוץ, מעצבי פנים שרוצים לייצר הדמיות מהירות, קבלנים שרוצים להציג הצעות ללקוחות, ומתווכי נדל"ן שרוצים Virtual Staging.' />
            <FaqItem question="מה ההבדל בין ShiputzAI לכלים אחרים?" answer="ShiputzAI הוא הכלי היחיד שמשלב 7 כלי AI — הדמיה, כתב כמויות, ניתוח הצעות מחיר, סרטון סיור, Style Match, Shop the Look ותוכנית קומה. כל הכלים האחרים מציעים רק הדמיה בסיסית." />
            <FaqItem question="האם התוצאות מדויקות?" answer="הדמיות AI הן פוטוריאליסטיות ונותנות תמונה מצוינת של הכיוון העיצובי. לתכנון מדויק של מידות וחומרים, מומלץ לשלב עם מעצב פנים מקצועי." />
            <FaqItem question="איך מתחילים?" answer="נרשמים בShiputzAI (חינם, 10 קרדיטים מתנה), מעלים תמונה של החדר, כותבים מה רוצים לשנות, ומקבלים הדמיה תוך 30 שניות. פשוט ככה." />
          </div>
        </div>

        {/* Related */}
        <div className="mt-10 p-6 bg-gray-50 rounded-2xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">קרא גם</h3>
          <ul className="space-y-3">
            <li><Link href="/tips/ai-kitchen-visualization" className="text-gray-700 hover:text-gray-900 hover:underline">הדמיית שיפוץ מטבח בAI — ראו את המטבח החדש תוך 30 שניות</Link></li>
            <li><Link href="/tips/ai-living-room-design" className="text-gray-700 hover:text-gray-900 hover:underline">עיצוב סלון בAI — 7 סגנונות עיצוב פופולריים להדמיה</Link></li>
            <li><Link href="/tips/bill-of-quantities-ai" className="text-gray-700 hover:text-gray-900 hover:underline">כתב כמויות אוטומטי בAI — חסכו אלפי שקלים</Link></li>
            <li><Link href="/tips/renovation-cost-calculator" className="text-gray-700 hover:text-gray-900 hover:underline">מחשבון עלות שיפוץ — כמה באמת עולה שיפוץ דירה בישראל 2026</Link></li>
            <li><Link href="/tips/best-ai-interior-design-tools" className="text-gray-700 hover:text-gray-900 hover:underline">5 הכלים הטובים ביותר להדמיית עיצוב פנים בAI — 2026</Link></li>
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
