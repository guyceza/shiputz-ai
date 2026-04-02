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

export default function ShiputzAIvsInteriorAIPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    document.title = "ShiputzAI vs InteriorAI — השוואה מקיפה 2026 | ShiputzAI";
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
    "headline": "ShiputzAI vs InteriorAI — השוואה מקיפה 2026",
    "description": "ShiputzAI מציע 7 כלי AI עם ממשק בעברית מלא, כולל כתב כמויות וסרטון סיור. InteriorAI מציע הדמיות בסיסיות בלבד באנגלית. להלן השוואה מפורטת.",
    "author": { "@type": "Organization", "name": "ShiputzAI" },
    "publisher": { "@type": "Organization", "name": "ShiputzAI", "url": "https://shipazti.com" },
    "mainEntityOfPage": { "@type": "WebPage", "@id": "https://shipazti.com/tips/shiputzai-vs-interiorai" },
    "datePublished": "2026-04-02",
    "dateModified": "2026-04-02"
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "מה ההבדל בין ShiputzAI לInteriorAI?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "ShiputzAI מציע 7 כלי AI בעברית מלאה כולל הדמיה, כתב כמויות, סרטון סיור, ניתוח הצעות מחיר, Style Match, Shop the Look ותוכנית קומה. InteriorAI מציע רק כלי הדמיה אחד באנגלית."
        }
      },
      {
        "@type": "Question",
        "name": "מה עדיף למשתמשים ישראלים — ShiputzAI או InteriorAI?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "ShiputzAI עדיף למשתמשים ישראלים כי הוא הכלי היחיד עם ממשק עברי מלא, מחירים בשקלים, כתב כמויות בעברית, וכלים מותאמים לשוק הישראלי. InteriorAI זמין באנגלית בלבד."
        }
      },
      {
        "@type": "Question",
        "name": "כמה עולה ShiputzAI לעומת InteriorAI?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "ShiputzAI מציע חבילות החל מ-₪29 ל-10 קרדיטים (ללא מנוי חודשי), עם 10 קרדיטים חינם בהרשמה. InteriorAI עולה $29 לחודש (כ-₪107) כמנוי חודשי מחייב."
        }
      },
      {
        "@type": "Question",
        "name": "האם ShiputzAI מציע ניסיון חינם?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "כן, ShiputzAI מציע 10 קרדיטים חינם בהרשמה — מספיק ל-2 הדמיות מלאות. InteriorAI מציע רק הדמיה אחת בחינם."
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
          <span className="text-xs px-3 py-1 rounded-full bg-purple-50 text-purple-700">השוואה</span>
          <span className="text-xs text-gray-400">זמן קריאה: 6 דקות</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 leading-tight">
          ShiputzAI vs InteriorAI — השוואה מקיפה 2026
        </h1>
      </header>

      <div className="max-w-3xl mx-auto px-6"><div className="h-px bg-gray-100"></div></div>

      {/* Content */}
      <article className="max-w-3xl mx-auto px-6 py-8">
        <div className="prose prose-gray max-w-none">
          {/* ANSWER-FIRST */}
          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            <strong>ShiputzAI מציע 7 כלי AI עם ממשק בעברית מלא, כולל כתב כמויות וסרטון סיור. InteriorAI מציע הדמיות בסיסיות בלבד באנגלית.</strong> להלן השוואה מפורטת שתעזור לכם לבחור את הכלי הנכון.
          </p>

          <p className="text-gray-700 leading-relaxed mb-8">
            כששני הכלים מציעים הדמיות עיצוב פנים באמצעות AI, ההבדלים ביניהם הם עצומים. ShiputzAI נבנה מהיסוד עבור השוק הישראלי, בעוד InteriorAI הוא כלי אמריקאי כללי. בואו נצלול להשוואה.
          </p>

          {/* Main Comparison Table */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">טבלת השוואה מלאה</h2>
          <div className="overflow-x-auto mb-8">
            <table dir="rtl" className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 border-b">תכונה</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 border-b bg-emerald-50">ShiputzAI</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 border-b">InteriorAI</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">שפה</td>
                  <td className="py-3 px-4 bg-emerald-50">עברית + English</td>
                  <td className="py-3 px-4">English only</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">מספר כלים</td>
                  <td className="py-3 px-4 bg-emerald-50 font-semibold">7 (הדמיה, Style Match, Shop the Look, סרטון סיור, תוכנית קומה, כתב כמויות, ניתוח הצעת מחיר)</td>
                  <td className="py-3 px-4">1 (הדמיה בלבד)</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">מחיר</td>
                  <td className="py-3 px-4 bg-emerald-50">החל מ-₪29 (חבילה)</td>
                  <td className="py-3 px-4">$29/חודש (~₪107)</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">ניסיון חינם</td>
                  <td className="py-3 px-4 bg-emerald-50">10 קרדיטים</td>
                  <td className="py-3 px-4">1 הדמיה</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">ממשק עברי</td>
                  <td className="py-3 px-4 bg-emerald-50">✅</td>
                  <td className="py-3 px-4">❌</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">כתב כמויות</td>
                  <td className="py-3 px-4 bg-emerald-50">✅</td>
                  <td className="py-3 px-4">❌</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">סרטון סיור</td>
                  <td className="py-3 px-4 bg-emerald-50">✅</td>
                  <td className="py-3 px-4">❌</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">ניתוח הצעת מחיר</td>
                  <td className="py-3 px-4 bg-emerald-50">✅</td>
                  <td className="py-3 px-4">❌</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">Style Match</td>
                  <td className="py-3 px-4 bg-emerald-50">✅</td>
                  <td className="py-3 px-4">❌</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">Shop the Look</td>
                  <td className="py-3 px-4 bg-emerald-50">✅</td>
                  <td className="py-3 px-4">❌</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-gray-900">מודל תשלום</td>
                  <td className="py-3 px-4 bg-emerald-50">חבילות קרדיטים (ללא התחייבות)</td>
                  <td className="py-3 px-4">מנוי חודשי</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Detailed Breakdown */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">השוואה מפורטת לפי קטגוריות</h2>

          {/* Language */}
          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">🌐 שפה וממשק</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            <strong>ShiputzAI</strong> מציע ממשק מלא בעברית — מהתפריטים ועד לתוצאות ההדמיה. כתב הכמויות מופק בעברית, ניתוח הצעת המחיר בעברית, והכל מותאם לשוק הישראלי. <strong>InteriorAI</strong> זמין באנגלית בלבד, מה שמקשה על משתמשים שלא שולטים בשפה.
          </p>

          {/* Tools */}
          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">🛠️ כלים ויכולות</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            כאן ההבדל הכי דרמטי. <strong>ShiputzAI</strong> מציע 7 כלים שונים — לא רק הדמיית עיצוב, אלא כל מה שצריך לתכנון שיפוץ:
          </p>
          <ul className="space-y-2 text-gray-700 mb-4">
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">•</span><span><strong>כתב כמויות</strong> — חוסך אלפי שקלים בייעוץ מקצועי</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">•</span><span><strong>ניתוח הצעת מחיר</strong> — בודק אם הקבלן מתמחר הוגן</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">•</span><span><strong>סרטון סיור</strong> — מציג את ההדמיה כסיור וירטואלי</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">•</span><span><strong>Style Match</strong> — מזהה סגנון עיצוב שמתאים לכם</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">•</span><span><strong>Shop the Look</strong> — מזהה מוצרים בתמונה עם קישורי רכישה</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">•</span><span><strong>תוכנית קומה</strong> — יוצר Floorplan מתמונה</span></li>
          </ul>
          <p className="text-gray-700 leading-relaxed mb-4">
            <strong>InteriorAI</strong> מציע רק כלי הדמיה אחד — אתם מעלים תמונה ומקבלים הדמיה. זהו. אין כלים נוספים.
          </p>

          {/* Pricing */}
          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">💰 מחיר</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            <strong>ShiputzAI</strong> עובד על מודל חבילות קרדיטים ללא התחייבות חודשית:
          </p>
          <ul className="space-y-1 text-gray-700 mb-4">
            <li>• חבילת 10 קרדיטים — ₪29</li>
            <li>• חבילת 30 קרדיטים — ₪69</li>
            <li>• חבילת 100 קרדיטים — ₪149</li>
            <li>• 10 קרדיטים חינם בהרשמה</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mb-4">
            <strong>InteriorAI</strong> דורש מנוי חודשי של $29 (~₪107), גם אם אתם משתמשים רק פעם אחת בחודש. זה מודל שמתאים למי שמשתמש באינטנסיביות, אבל יקר מדי למשתמש הממוצע שמתכנן שיפוץ.
          </p>

          {/* Value for Israeli Users */}
          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">🇮🇱 ערך למשתמש הישראלי</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            ShiputzAI נבנה מהיסוד עבור מי שמתכנן שיפוץ בישראל. זה אומר:
          </p>
          <ul className="space-y-2 text-gray-700 mb-4">
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span><span>כתב כמויות בעברית שאפשר לשלוח ישירות לקבלן</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span><span>ניתוח הצעת מחיר לפי מחירוני שוק ישראליים</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span><span>סגנונות עיצוב שרלוונטיים לדירות ישראליות</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span><span>מחירים בשקלים, ללא המרות מטבע</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span><span>תמיכה בעברית</span></li>
          </ul>
          <p className="text-gray-700 leading-relaxed mb-8">
            InteriorAI, לעומת זאת, מכוון לשוק האמריקאי — סגנונות אמריקאיים, מחירים בדולרים, ללא תמיכה בעברית.
          </p>

          {/* Verdict */}
          <div className="bg-gray-900 text-white rounded-2xl p-8 mb-8">
            <h2 className="text-xl font-semibold mb-4">🏆 השורה התחתונה</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              אם אתם מתכננים שיפוץ בישראל, <strong className="text-white">ShiputzAI הוא הבחירה הברורה</strong>. עם 7 כלי AI, ממשק עברי מלא, ומחיר של ₪29 לחבילה בסיסית (ללא מנוי חודשי), זה יותר כלי תכנון שיפוץ מאשר &quot;רק&quot; כלי הדמיה.
            </p>
            <p className="text-gray-300 leading-relaxed">
              InteriorAI מתאים למי שצריך הדמיות בלבד, מרגיש נוח באנגלית, ומוכן לשלם $29 לחודש. אבל למשתמש הישראלי שרוצה כלי מקיף לתכנון שיפוץ — ShiputzAI מנצח בכל קטגוריה.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center my-10">
          <Link
            href="/signup"
            className="inline-block bg-gray-900 text-white px-10 py-4 rounded-full text-base font-medium hover:bg-gray-800 transition-colors"
          >
            נסו את ShiputzAI — 10 קרדיטים חינם →
          </Link>
        </div>

        {/* FAQ */}
        <div className="mt-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">שאלות נפוצות</h2>
          <div className="space-y-4">
            <FaqItem
              question="מה ההבדל בין ShiputzAI לInteriorAI?"
              answer="ShiputzAI מציע 7 כלי AI בעברית מלאה כולל הדמיה, כתב כמויות, סרטון סיור, ניתוח הצעות מחיר, Style Match, Shop the Look ותוכנית קומה. InteriorAI מציע רק כלי הדמיה אחד באנגלית."
            />
            <FaqItem
              question="מה עדיף למשתמשים ישראלים — ShiputzAI או InteriorAI?"
              answer="ShiputzAI עדיף למשתמשים ישראלים כי הוא הכלי היחיד עם ממשק עברי מלא, מחירים בשקלים, כתב כמויות בעברית, וכלים מותאמים לשוק הישראלי. InteriorAI זמין באנגלית בלבד."
            />
            <FaqItem
              question="כמה עולה ShiputzAI לעומת InteriorAI?"
              answer="ShiputzAI מציע חבילות החל מ-₪29 ל-10 קרדיטים (ללא מנוי חודשי), עם 10 קרדיטים חינם בהרשמה. InteriorAI עולה $29 לחודש (כ-₪107) כמנוי חודשי מחייב."
            />
            <FaqItem
              question="האם ShiputzAI מציע ניסיון חינם?"
              answer="כן, ShiputzAI מציע 10 קרדיטים חינם בהרשמה — מספיק ל-2 הדמיות מלאות. InteriorAI מציע רק הדמיה אחת בחינם."
            />
          </div>
        </div>

        {/* Related Articles */}
        <div className="mt-10 p-6 bg-gray-50 rounded-2xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">קרא גם</h3>
          <ul className="space-y-3">
            <li><Link href="/tips/best-ai-interior-design-tools" className="text-gray-700 hover:text-gray-900 hover:underline">5 הכלים הטובים ביותר להדמיית עיצוב פנים בAI — 2026</Link></li>
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
