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

export default function AIKitchenVisualizationPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    document.title = "הדמיית שיפוץ מטבח בAI — ראו את המטבח החדש תוך 30 שניות | ShiputzAI";
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
    "headline": "הדמיית שיפוץ מטבח בAI — ראו את המטבח החדש תוך 30 שניות",
    "description": "הדמיית שיפוץ מטבח בAI עולה ₪3-15 ותוצאה מוכנה תוך 30 שניות. מדריך מלא עם שלבים, סגנונות מטבח פופולריים ועלויות.",
    "author": { "@type": "Organization", "name": "ShiputzAI" },
    "publisher": { "@type": "Organization", "name": "ShiputzAI", "url": "https://shipazti.com" },
    "mainEntityOfPage": { "@type": "WebPage", "@id": "https://shipazti.com/tips/ai-kitchen-visualization" },
    "datePublished": "2026-04-02",
    "dateModified": "2026-04-02"
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "כמה עולה הדמיית מטבח בAI?",
        "acceptedAnswer": { "@type": "Answer", "text": "הדמיית מטבח בAI עולה בין ₪3 ל-₪15 בShiputzAI, תלוי בחבילה שרכשתם. בהרשמה מקבלים 10 קרדיטים חינם לניסיון." }
      },
      {
        "@type": "Question",
        "name": "כמה זמן לוקח לקבל הדמיית מטבח?",
        "acceptedAnswer": { "@type": "Answer", "text": "הדמיית מטבח בShiputzAI מוכנה תוך 30 שניות. מעלים תמונה, כותבים מה רוצים לשנות, ומקבלים תוצאה פוטוריאליסטית." }
      },
      {
        "@type": "Question",
        "name": "האם הדמיית AI מחליפה מעצב פנים?",
        "acceptedAnswer": { "@type": "Answer", "text": "הדמיית AI היא כלי מצוין לשלב התכנון — לראות כיוון לפני שמשקיעים אלפי שקלים. לפרויקטים מורכבים, מומלץ לשלב עם מעצב פנים מקצועי." }
      },
      {
        "@type": "Question",
        "name": "אילו סגנונות מטבח אפשר להדמות?",
        "acceptedAnswer": { "@type": "Answer", "text": "בShiputzAI אפשר להדמות כל סגנון — מודרני, כפרי, סקנדינבי, תעשייתי, מינימליסטי, קלאסי ועוד. פשוט כותבים את הסגנון הרצוי בתיאור." }
      },
      {
        "@type": "Question",
        "name": "האם אפשר להדמות שינויים ספציפיים במטבח?",
        "acceptedAnswer": { "@type": "Answer", "text": "כן! אפשר לבקש שינויים ספציפיים כמו החלפת צבע ארונות, שינוי משטח עבודה, הוספת אי, החלפת ריצוף ועוד. ה-AI מבין הוראות בעברית ובאנגלית." }
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
          <span className="text-xs px-3 py-1 rounded-full bg-orange-50 text-orange-700">מטבח</span>
          <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700">AI וטכנולוגיה</span>
          <span className="text-xs text-gray-400">זמן קריאה: 6 דקות</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 leading-tight">
          הדמיית שיפוץ מטבח בAI — ראו את המטבח החדש תוך 30 שניות
        </h1>
      </header>

      <div className="max-w-3xl mx-auto px-6"><div className="h-px bg-gray-100"></div></div>

      <article className="max-w-3xl mx-auto px-6 py-8">
        <div className="prose prose-gray max-w-none">
          {/* ANSWER-FIRST opening */}
          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            <strong>הדמיית שיפוץ מטבח בAI עולה ₪3-15 ותוצאה מוכנה תוך 30 שניות.</strong> בShiputzAI, מעלים תמונה של המטבח הקיים, כותבים מה רוצים לשנות, ומקבלים הדמיה פוטוריאליסטית של המטבח המשופץ.
          </p>

          <p className="text-gray-700 leading-relaxed mb-8">
            שיפוץ מטבח הוא אחד הפרויקטים היקרים ביותר בבית — בין ₪40,000 ל-₪80,000 בממוצע. לפני שמשקיעים סכום כזה, הדמיית AI מאפשרת לראות בדיוק איך המטבח ייראה אחרי השיפוץ. במקום לשלם ₪3,000-₪8,000 למעצב פנים רק על הדמיות, מקבלים תוצאה דומה תוך חצי דקה.
          </p>

          {/* Step by step */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">איך זה עובד? 3 שלבים פשוטים</h2>
          <div className="space-y-4 mb-8">
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <span className="flex-shrink-0 w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-semibold">1</span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">מעלים תמונה של המטבח הקיים</h3>
                  <p className="text-gray-600">צלמו את המטבח מזווית רחבה. תמונה ברורה ומוארת היטב תיתן תוצאה טובה יותר. מומלץ לצלם ממרכז החדר.</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <span className="flex-shrink-0 w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-semibold">2</span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">מתארים מה רוצים לשנות</h3>
                  <p className="text-gray-600">כתבו בעברית או באנגלית: &quot;מטבח מודרני לבן עם משטח שיש&quot;, &quot;ארונות עץ אלון בסגנון סקנדינבי&quot;, או כל שינוי שתרצו.</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <span className="flex-shrink-0 w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-semibold">3</span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">מקבלים הדמיה תוך 30 שניות</h3>
                  <p className="text-gray-600">ה-AI מייצר הדמיה פוטוריאליסטית של המטבח המשופץ. אפשר ליצור כמה גרסאות ולהשוות ביניהן.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Popular styles */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">4 סגנונות מטבח פופולריים להדמיה</h2>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">🏙️ מודרני</h3>
              <p className="text-gray-600 text-sm leading-relaxed">קווים נקיים, ארונות חלקים ללא ידיות, צבעים ניטרליים (לבן, אפור, שחור). משטחי קוורץ או קוריאן. תאורת LED מובנית. הסגנון הפופולרי ביותר בישראל ב-2026.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">🌿 כפרי (Farmhouse)</h3>
              <p className="text-gray-600 text-sm leading-relaxed">ארונות עץ טבעי, משטח עץ או שיש, ברז נחושת או ברונזה. צבעים חמים — שמנת, ירוק מרווה, כחול עמום. תחושה חמה וביתית.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">❄️ סקנדינבי</h3>
              <p className="text-gray-600 text-sm leading-relaxed">עץ בהיר (אלון, ליבנה), הרבה לבן, אור טבעי מקסימלי. מינימליזם עם חמימות. פונקציונלי ונקי. מושלם לדירות קטנות ובינוניות.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">⚙️ תעשייתי (Industrial)</h3>
              <p className="text-gray-600 text-sm leading-relaxed">מתכת חשופה, בטון, לבנים חשופות. ארונות כהים (שחור, אפור פחם). תאורה תעשייתית. מתאים ללופטים ולדירות עם תקרה גבוהה.</p>
            </div>
          </div>

          {/* Costs */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">עלויות: הדמיית AI מול מעצב פנים</h2>
          <div className="overflow-x-auto mb-8">
            <table dir="rtl" className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 border-b">פרמטר</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 border-b bg-emerald-50">הדמיית AI (ShiputzAI)</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 border-b">מעצב פנים</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">עלות להדמיה</td>
                  <td className="py-3 px-4 bg-emerald-50">₪3-15</td>
                  <td className="py-3 px-4">₪3,000-₪8,000</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">זמן</td>
                  <td className="py-3 px-4 bg-emerald-50">30 שניות</td>
                  <td className="py-3 px-4">1-3 שבועות</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">מספר גרסאות</td>
                  <td className="py-3 px-4 bg-emerald-50">ללא הגבלה</td>
                  <td className="py-3 px-4">2-3 גרסאות</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-gray-900">שינויים</td>
                  <td className="py-3 px-4 bg-emerald-50">מיידי, ללא עלות נוספת</td>
                  <td className="py-3 px-4">₪500-₪1,500 לשינוי</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Before/After */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">דוגמאות: לפני ואחרי הדמיית מטבח</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            הנה כמה דוגמאות לתוצאות שמשתמשים אמיתיים קיבלו בShiputzAI:
          </p>
          <div className="space-y-4 mb-8">
            <div className="bg-gray-50 rounded-2xl p-6">
              <p className="text-gray-700"><strong>מטבח ישן עם ארונות פורמייקה חומים</strong> → מטבח מודרני לבן עם משטח קוורץ, אי מרכזי ותאורה שקועה. המשתמש שלח את ההדמיה לקבלן וקיבל הצעת מחיר מדויקת.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <p className="text-gray-700"><strong>מטבחון קטן בדירת 3 חדרים</strong> → מטבח סקנדינבי עם ארונות עליונים עד התקרה, צבע לבן-עץ ופתרונות אחסון חכמים. ההדמיה עזרה לראות שאפשר להכניס הכל גם במרחב קטן.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <p className="text-gray-700"><strong>מטבח גדול בבית פרטי</strong> → מטבח כפרי עם אי ענק, משטח שיש קררה, וארונות ירוק מרווה. המשתמש יצר 5 גרסאות שונות והשווה ביניהן לפני ההחלטה הסופית.</p>
            </div>
          </div>

          {/* Tips */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">טיפים לתוצאה מושלמת</h2>
          <ul className="space-y-3 text-gray-700 mb-8">
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span> <span>צלמו מזווית רחבה שמראה כמה שיותר מהמטבח</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span> <span>ודאו שיש תאורה טובה בתמונה — אור טבעי עדיף</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span> <span>כתבו תיאור מפורט: &quot;ארונות לבנים, משטח עץ אלון, ברז שחור מט&quot;</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span> <span>נסו כמה סגנונות שונים — ההשוואה תעזור להחליט</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span> <span>אחרי ההדמיה, השתמשו בכלי כתב הכמויות לקבלת הערכת עלות</span></li>
          </ul>
        </div>

        {/* CTA */}
        <div className="text-center my-10">
          <Link
            href="/visualize"
            className="inline-block bg-gray-900 text-white px-10 py-4 rounded-full text-base font-medium hover:bg-gray-800 transition-colors"
          >
            נסו הדמיית מטבח עכשיו — 10 קרדיטים חינם →
          </Link>
          <p className="text-sm text-gray-400 mt-3">לא צריך כרטיס אשראי להרשמה</p>
        </div>

        {/* FAQ */}
        <div className="mt-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">שאלות נפוצות</h2>
          <div className="space-y-4">
            <FaqItem
              question="כמה עולה הדמיית מטבח בAI?"
              answer="הדמיית מטבח בAI עולה בין ₪3 ל-₪15 בShiputzAI, תלוי בחבילה שרכשתם. בהרשמה מקבלים 10 קרדיטים חינם לניסיון."
            />
            <FaqItem
              question="כמה זמן לוקח לקבל הדמיית מטבח?"
              answer="הדמיית מטבח בShiputzAI מוכנה תוך 30 שניות. מעלים תמונה, כותבים מה רוצים לשנות, ומקבלים תוצאה פוטוריאליסטית."
            />
            <FaqItem
              question="האם הדמיית AI מחליפה מעצב פנים?"
              answer="הדמיית AI היא כלי מצוין לשלב התכנון — לראות כיוון לפני שמשקיעים אלפי שקלים. לפרויקטים מורכבים, מומלץ לשלב עם מעצב פנים מקצועי."
            />
            <FaqItem
              question="אילו סגנונות מטבח אפשר להדמות?"
              answer="בShiputzAI אפשר להדמות כל סגנון — מודרני, כפרי, סקנדינבי, תעשייתי, מינימליסטי, קלאסי ועוד. פשוט כותבים את הסגנון הרצוי בתיאור."
            />
            <FaqItem
              question="האם אפשר להדמות שינויים ספציפיים במטבח?"
              answer="כן! אפשר לבקש שינויים ספציפיים כמו החלפת צבע ארונות, שינוי משטח עבודה, הוספת אי, החלפת ריצוף ועוד. ה-AI מבין הוראות בעברית ובאנגלית."
            />
          </div>
        </div>

        {/* Related */}
        <div className="mt-10 p-6 bg-gray-50 rounded-2xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">קרא גם</h3>
          <ul className="space-y-3">
            <li><Link href="/tips/ai-living-room-design" className="text-gray-700 hover:text-gray-900 hover:underline">עיצוב סלון בAI — 7 סגנונות עיצוב פופולריים להדמיה</Link></li>
            <li><Link href="/tips/ai-interior-design-israel" className="text-gray-700 hover:text-gray-900 hover:underline">עיצוב פנים בAI בישראל — המדריך המלא 2026</Link></li>
            <li><Link href="/tips/renovation-cost-calculator" className="text-gray-700 hover:text-gray-900 hover:underline">מחשבון עלות שיפוץ — כמה באמת עולה שיפוץ דירה בישראל 2026</Link></li>
            <li><Link href="/tips/bill-of-quantities-ai" className="text-gray-700 hover:text-gray-900 hover:underline">כתב כמויות אוטומטי בAI — חסכו אלפי שקלים</Link></li>
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
