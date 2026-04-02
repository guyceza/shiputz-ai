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

export default function HowMuchRenovationVisualizationPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    document.title = "כמה עולה הדמיית שיפוץ בAI? — מדריך מחירים 2026 | ShiputzAI";
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
    "headline": "כמה עולה הדמיית שיפוץ בAI? — מדריך מחירים 2026",
    "description": "הדמיית שיפוץ בAI עולה בין ₪3 ל-₪30 להדמיה בודדת, תלוי בפלטפורמה ובחבילה. בShiputzAI, הדמיה אחת עולה 5 קרדיטים — בערך ₪3-15.",
    "author": { "@type": "Organization", "name": "ShiputzAI" },
    "publisher": { "@type": "Organization", "name": "ShiputzAI", "url": "https://shipazti.com" },
    "mainEntityOfPage": { "@type": "WebPage", "@id": "https://shipazti.com/tips/how-much-renovation-visualization" },
    "datePublished": "2026-04-02",
    "dateModified": "2026-04-02"
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "כמה עולה הדמיית שיפוץ בAI?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "הדמיית שיפוץ בAI עולה בין ₪3 ל-₪30 להדמיה בודדת, תלוי בפלטפורמה ובחבילה. בShiputzAI, הדמיה אחת עולה 5 קרדיטים — בערך ₪3-15 תלוי בגודל החבילה."
        }
      },
      {
        "@type": "Question",
        "name": "האם אפשר לקבל הדמיית שיפוץ בחינם?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "כן! בShiputzAI מקבלים 10 קרדיטים חינם בהרשמה — מספיק ל-2 הדמיות מלאות. גם RoomGPT מציע הדמיות חינמיות אך באיכות נמוכה יותר."
        }
      },
      {
        "@type": "Question",
        "name": "כמה עולות חבילות הקרדיטים בShiputzAI?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "ShiputzAI מציע 3 חבילות: 10 קרדיטים ב-₪29 (₪2.9 לקרדיט), 30 קרדיטים ב-₪69 (₪2.3 לקרדיט), ו-100 קרדיטים ב-₪149 (₪1.49 לקרדיט). בהרשמה מקבלים 10 קרדיטים חינם."
        }
      },
      {
        "@type": "Question",
        "name": "האם הדמיית AI שווה את הכסף לעומת מעצב פנים?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "בהחלט. מעצב פנים גובה 5,000-15,000₪ לתכנון דירה מלאה, בעוד שעם ShiputzAI אפשר לקבל עשרות הדמיות, כתב כמויות וניתוח הצעת מחיר ב-₪149. החיסכון הוא של אלפי שקלים."
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
          <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-700">תקציב</span>
          <span className="text-xs text-gray-400">זמן קריאה: 5 דקות</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 leading-tight">
          כמה עולה הדמיית שיפוץ בAI? — מדריך מחירים 2026
        </h1>
      </header>

      <div className="max-w-3xl mx-auto px-6"><div className="h-px bg-gray-100"></div></div>

      {/* Content */}
      <article className="max-w-3xl mx-auto px-6 py-8">
        <div className="prose prose-gray max-w-none">
          {/* ANSWER-FIRST */}
          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            <strong>הדמיית שיפוץ בAI עולה בין ₪3 ל-₪30 להדמיה בודדת</strong>, תלוי בפלטפורמה ובחבילה. בShiputzAI, הדמיה אחת עולה 5 קרדיטים — בערך ₪3-15. בהרשמה מקבלים 10 קרדיטים חינם.
          </p>

          <p className="text-gray-700 leading-relaxed mb-8">
            לפני עידן ה-AI, הדמיית עיצוב פנים דרשה שעות עבודה של מעצב או אדריכל — ועלתה אלפי שקלים. היום, אפשר לקבל הדמיה מקצועית תוך 30 שניות ובעלות של כמה שקלים. בואו נפרק את המחירים.
          </p>

          {/* Price Comparison Table */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">השוואת מחירים בין פלטפורמות</h2>
          <div className="overflow-x-auto mb-8">
            <table dir="rtl" className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 border-b">פלטפורמה</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 border-b">מחיר</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 border-b">עלות להדמיה</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 border-b">חינם</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 border-b">עברית</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 bg-emerald-50">
                  <td className="py-3 px-4 font-semibold text-gray-900">ShiputzAI</td>
                  <td className="py-3 px-4">₪29-149 (חבילה)</td>
                  <td className="py-3 px-4">₪3-15</td>
                  <td className="py-3 px-4">10 קרדיטים</td>
                  <td className="py-3 px-4">✅</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">InteriorAI</td>
                  <td className="py-3 px-4">$29/חודש (~₪107)</td>
                  <td className="py-3 px-4">~₪5-20</td>
                  <td className="py-3 px-4">1 הדמיה</td>
                  <td className="py-3 px-4">❌</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">RoomGPT</td>
                  <td className="py-3 px-4">חינם</td>
                  <td className="py-3 px-4">₪0</td>
                  <td className="py-3 px-4">חינם</td>
                  <td className="py-3 px-4">❌</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">ReRoom AI</td>
                  <td className="py-3 px-4">$9.99/חודש (~₪37)</td>
                  <td className="py-3 px-4">~₪2-7</td>
                  <td className="py-3 px-4">3 הדמיות</td>
                  <td className="py-3 px-4">❌</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-gray-900">מעצב פנים</td>
                  <td className="py-3 px-4">₪5,000-15,000</td>
                  <td className="py-3 px-4">₪500-1,500</td>
                  <td className="py-3 px-4">❌</td>
                  <td className="py-3 px-4">✅</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Credit System Explanation */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">איך עובדת מערכת הקרדיטים בShiputzAI?</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            ShiputzAI עובד על מערכת קרדיטים פשוטה. כל כלי צורך מספר קרדיטים שונה:
          </p>
          <div className="bg-gray-50 rounded-2xl p-6 mb-6">
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-center justify-between"><span>🎨 הדמיית עיצוב</span> <span className="font-semibold">5 קרדיטים</span></li>
              <li className="flex items-center justify-between"><span>🔍 Style Match</span> <span className="font-semibold">2 קרדיטים</span></li>
              <li className="flex items-center justify-between"><span>🛒 Shop the Look</span> <span className="font-semibold">3 קרדיטים</span></li>
              <li className="flex items-center justify-between"><span>🎬 סרטון סיור</span> <span className="font-semibold">5 קרדיטים</span></li>
              <li className="flex items-center justify-between"><span>📐 תוכנית קומה</span> <span className="font-semibold">3 קרדיטים</span></li>
              <li className="flex items-center justify-between"><span>📋 כתב כמויות</span> <span className="font-semibold">3 קרדיטים</span></li>
              <li className="flex items-center justify-between"><span>📊 ניתוח הצעת מחיר</span> <span className="font-semibold">3 קרדיטים</span></li>
            </ul>
          </div>

          {/* Pricing Tiers */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">חבילות מחירים בShiputzAI</h2>
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="border border-gray-200 rounded-2xl p-6 text-center">
              <h3 className="font-semibold text-gray-900 mb-2">חבילת בסיס</h3>
              <div className="text-3xl font-bold text-gray-900 mb-1">₪29</div>
              <div className="text-sm text-gray-500 mb-4">10 קרדיטים</div>
              <div className="text-sm text-gray-700 mb-2">₪2.9 לקרדיט</div>
              <div className="text-sm text-gray-500">מספיק ל-2 הדמיות</div>
            </div>
            <div className="border-2 border-gray-900 rounded-2xl p-6 text-center relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1 rounded-full">פופולרי</span>
              <h3 className="font-semibold text-gray-900 mb-2">חבילת ביניים</h3>
              <div className="text-3xl font-bold text-gray-900 mb-1">₪69</div>
              <div className="text-sm text-gray-500 mb-4">30 קרדיטים</div>
              <div className="text-sm text-gray-700 mb-2">₪2.3 לקרדיט</div>
              <div className="text-sm text-gray-500">מספיק ל-6 הדמיות</div>
            </div>
            <div className="border border-gray-200 rounded-2xl p-6 text-center">
              <h3 className="font-semibold text-gray-900 mb-2">חבילת פרו</h3>
              <div className="text-3xl font-bold text-gray-900 mb-1">₪149</div>
              <div className="text-sm text-gray-500 mb-4">100 קרדיטים</div>
              <div className="text-sm text-gray-700 mb-2">₪1.49 לקרדיט</div>
              <div className="text-sm text-gray-500">מספיק ל-20 הדמיות</div>
            </div>
          </div>

          {/* What Affects Price */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">מה משפיע על המחיר?</h2>
          <p className="text-gray-700 leading-relaxed mb-4">מספר גורמים משפיעים על העלות הסופית:</p>
          <ul className="space-y-3 text-gray-700 mb-6">
            <li className="flex items-start gap-2"><span className="font-semibold text-gray-900 mt-0">1.</span><span><strong>גודל החבילה</strong> — ככל שקונים יותר קרדיטים, המחיר לקרדיט נמוך יותר. בחבילת 100 קרדיטים (₪149), קרדיט עולה ₪1.49 לעומת ₪2.9 בחבילת 10.</span></li>
            <li className="flex items-start gap-2"><span className="font-semibold text-gray-900 mt-0">2.</span><span><strong>הפלטפורמה</strong> — כלים שונים גובים מחירים שונים. מנויים חודשיים (כמו InteriorAI) יכולים להיות יקרים אם לא משתמשים מספיק.</span></li>
            <li className="flex items-start gap-2"><span className="font-semibold text-gray-900 mt-0">3.</span><span><strong>מספר ההדמיות</strong> — תכנון שיפוץ דירה שלמה דורש 5-10 הדמיות (חדר אחד × כמה סגנונות). תכנון חדר בודד — 2-3 הדמיות מספיקות.</span></li>
            <li className="flex items-start gap-2"><span className="font-semibold text-gray-900 mt-0">4.</span><span><strong>כלים נוספים</strong> — אם משתמשים גם בכתב כמויות, ניתוח הצעת מחיר ותוכנית קומה, צריך יותר קרדיטים — אבל זה חוסך אלפי שקלים בייעוץ מקצועי.</span></li>
          </ul>

          {/* ROI Analysis */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">האם זה שווה את הכסף? (ניתוח ROI)</h2>
          <div className="bg-gray-50 rounded-2xl p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">בואו נעשה חשבון:</h3>
            <div className="space-y-4 text-gray-700">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💰</span>
                <div>
                  <strong>מעצב פנים:</strong> 5,000-15,000₪ לתכנון דירה, כולל 3-5 הדמיות ידניות. זמן: 2-4 שבועות.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <strong>ShiputzAI (חבילת 100):</strong> ₪149 ל-100 קרדיטים = 20 הדמיות + כתב כמויות + ניתוח הצעת מחיר. זמן: דקות.
                </div>
              </div>
              <div className="border-t border-gray-200 pt-4 mt-4">
                <p className="font-semibold text-gray-900">
                  חיסכון: 4,851-14,851₪ 🎉
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  * לא מחליף מעצב פנים לפרויקטים מורכבים, אבל מושלם לתכנון ראשוני ולשיפוצים קוסמטיים-מקיפים.
                </p>
              </div>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">מתי ShiputzAI חוסך הכי הרבה?</h3>
          <ul className="space-y-2 text-gray-700 mb-6">
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span><span><strong>תכנון ראשוני</strong> — לראות איך החדר ייראה לפני שמתחילים</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span><span><strong>השוואת סגנונות</strong> — לנסות 5-10 סגנונות שונים תוך דקות</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span><span><strong>כתב כמויות</strong> — חוסך ₪1,000-3,000 של ייעוץ מקצועי</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span><span><strong>ניתוח הצעת מחיר</strong> — מונע שתשלמו יותר מדי לקבלן</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span><span><strong>תקשורת עם הקבלן</strong> — להראות בדיוק מה אתם רוצים</span></li>
          </ul>

          {/* Practical Tip */}
          <div className="bg-gray-900 text-white rounded-2xl p-8 mb-8">
            <h2 className="text-xl font-semibold mb-4">💡 הטיפ שיחסוך לכם הכי הרבה</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              התחילו עם 10 הקרדיטים החינמיים. עשו 2 הדמיות — אחת לסלון ואחת למטבח. אם אהבתם את התוצאות, קנו את חבילת ה-100 קרדיטים ב-₪149 וכך:
            </p>
            <ul className="space-y-2 text-gray-300">
              <li>• תוכלו לנסות 10+ סגנונות שונים לכל חדר</li>
              <li>• להפיק כתב כמויות לקבלן</li>
              <li>• לנתח הצעות מחיר</li>
              <li>• ליצור סרטון סיור להציג למשפחה</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              <strong className="text-white">₪149 על כל הכלים האלה — במקום ₪5,000+ למעצב פנים.</strong>
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center my-10">
          <Link
            href="/signup"
            className="inline-block bg-gray-900 text-white px-10 py-4 rounded-full text-base font-medium hover:bg-gray-800 transition-colors"
          >
            התחילו חינם — 10 קרדיטים במתנה →
          </Link>
        </div>

        {/* FAQ */}
        <div className="mt-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">שאלות נפוצות</h2>
          <div className="space-y-4">
            <FaqItem
              question="כמה עולה הדמיית שיפוץ בAI?"
              answer="הדמיית שיפוץ בAI עולה בין ₪3 ל-₪30 להדמיה בודדת, תלוי בפלטפורמה ובחבילה. בShiputzAI, הדמיה אחת עולה 5 קרדיטים — בערך ₪3-15 תלוי בגודל החבילה."
            />
            <FaqItem
              question="האם אפשר לקבל הדמיית שיפוץ בחינם?"
              answer="כן! בShiputzAI מקבלים 10 קרדיטים חינם בהרשמה — מספיק ל-2 הדמיות מלאות. גם RoomGPT מציע הדמיות חינמיות אך באיכות נמוכה יותר."
            />
            <FaqItem
              question="כמה עולות חבילות הקרדיטים בShiputzAI?"
              answer="ShiputzAI מציע 3 חבילות: 10 קרדיטים ב-₪29 (₪2.9 לקרדיט), 30 קרדיטים ב-₪69 (₪2.3 לקרדיט), ו-100 קרדיטים ב-₪149 (₪1.49 לקרדיט). בהרשמה מקבלים 10 קרדיטים חינם."
            />
            <FaqItem
              question="האם הדמיית AI שווה את הכסף לעומת מעצב פנים?"
              answer="בהחלט. מעצב פנים גובה 5,000-15,000₪ לתכנון דירה מלאה, בעוד שעם ShiputzAI אפשר לקבל עשרות הדמיות, כתב כמויות וניתוח הצעת מחיר ב-₪149. החיסכון הוא של אלפי שקלים."
            />
          </div>
        </div>

        {/* Related Articles */}
        <div className="mt-10 p-6 bg-gray-50 rounded-2xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">קרא גם</h3>
          <ul className="space-y-3">
            <li><Link href="/tips/best-ai-interior-design-tools" className="text-gray-700 hover:text-gray-900 hover:underline">5 הכלים הטובים ביותר להדמיית עיצוב פנים בAI — 2026</Link></li>
            <li><Link href="/tips/shiputzai-vs-interiorai" className="text-gray-700 hover:text-gray-900 hover:underline">ShiputzAI vs InteriorAI — השוואה מקיפה 2026</Link></li>
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
