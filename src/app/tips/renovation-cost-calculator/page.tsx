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

export default function RenovationCostCalculatorPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    document.title = "מחשבון עלות שיפוץ — כמה באמת עולה שיפוץ דירה בישראל 2026 | ShiputzAI";
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
    "headline": "מחשבון עלות שיפוץ — כמה באמת עולה שיפוץ דירה בישראל 2026",
    "description": "שיפוץ דירה 4 חדרים בישראל עולה בממוצע ₪120,000-₪250,000 ב-2026. מדריך מחירים מפורט לפי חדר, עם טיפים לחיסכון.",
    "author": { "@type": "Organization", "name": "ShiputzAI" },
    "publisher": { "@type": "Organization", "name": "ShiputzAI", "url": "https://shipazti.com" },
    "mainEntityOfPage": { "@type": "WebPage", "@id": "https://shipazti.com/tips/renovation-cost-calculator" },
    "datePublished": "2026-04-02",
    "dateModified": "2026-04-02"
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "כמה עולה שיפוץ דירה 4 חדרים?",
        "acceptedAnswer": { "@type": "Answer", "text": "שיפוץ דירה 4 חדרים בישראל עולה בממוצע ₪120,000-₪250,000 ב-2026. שיפוץ בסיסי (צביעה, ריצוף) עולה פחות, שיפוץ כולל (מטבח, אמבטיה, חשמל) עולה יותר." }
      },
      {
        "@type": "Question",
        "name": "כמה עולה שיפוץ מטבח?",
        "acceptedAnswer": { "@type": "Answer", "text": "שיפוץ מטבח מלא בישראל ב-2026 עולה ₪40,000-₪80,000. זה כולל פירוק, אינסטלציה, חשמל, ריצוף, ארונות, משטח עבודה, וברז. מטבח יוקרה יכול להגיע ל-₪120,000+." }
      },
      {
        "@type": "Question",
        "name": "כמה עולה שיפוץ חדר אמבטיה?",
        "acceptedAnswer": { "@type": "Answer", "text": "שיפוץ חדר אמבטיה בישראל ב-2026 עולה ₪25,000-₪50,000. כולל פירוק, איטום, אינסטלציה, ריצוף וחיפוי, כלים סניטריים, וברזים." }
      },
      {
        "@type": "Question",
        "name": "איך אפשר לחסוך בשיפוץ?",
        "acceptedAnswer": { "@type": "Answer", "text": "טיפים לחיסכון: השוו לפחות 3 הצעות מחיר, השתמשו בכתב כמויות AI לביסוס המשא ומתן, שפצו בעונות שקטות (חורף), בחרו חומרים ישראליים, והימנעו משינויים באמצע העבודה." }
      },
      {
        "@type": "Question",
        "name": "כמה עולה צביעת דירה?",
        "acceptedAnswer": { "@type": "Answer", "text": "צביעת דירה 4 חדרים (כ-100 מ\"ר) עולה ₪8,000-₪15,000 בישראל ב-2026. המחיר תלוי בסוג הצבע, מספר שכבות, ומצב הקירות." }
      },
      {
        "@type": "Question",
        "name": "כמה זמן לוקח שיפוץ דירה?",
        "acceptedAnswer": { "@type": "Answer", "text": "שיפוץ דירה 4 חדרים לוקח 6-12 שבועות בממוצע. שיפוץ מטבח בלבד: 3-5 שבועות. חדר אמבטיה: 2-4 שבועות. צביעה בלבד: 3-5 ימים." }
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
          <span className="text-xs px-3 py-1 rounded-full bg-red-50 text-red-700">עלויות שיפוץ</span>
          <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700">מדריך מחירים 2026</span>
          <span className="text-xs text-gray-400">זמן קריאה: 9 דקות</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 leading-tight">
          מחשבון עלות שיפוץ — כמה באמת עולה שיפוץ דירה בישראל 2026
        </h1>
      </header>

      <div className="max-w-3xl mx-auto px-6"><div className="h-px bg-gray-100"></div></div>

      <article className="max-w-3xl mx-auto px-6 py-8">
        <div className="prose prose-gray max-w-none">
          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            <strong>שיפוץ דירה 4 חדרים בישראל עולה בממוצע ₪120,000-₪250,000 ב-2026. שיפוץ מטבח: ₪40,000-₪80,000. חדר אמבטיה: ₪25,000-₪50,000.</strong> בShiputzAI תוכלו לקבל הערכת עלות AI מדויקת תוך שניות.
          </p>

          <p className="text-gray-700 leading-relaxed mb-8">
            מחירי שיפוץ בישראל עלו ב-15-20% בשנתיים האחרונות בגלל עליית מחירי חומרי גלם ועלויות עבודה. המדריך הזה מרכז את כל המחירים העדכניים ל-2026, כדי שתוכלו לתכנן תקציב ריאלי.
          </p>

          {/* Cost by room */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">עלויות שיפוץ לפי חדר</h2>
          <div className="overflow-x-auto mb-8">
            <table dir="rtl" className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 border-b">חדר</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 border-b">שיפוץ בסיסי</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 border-b">שיפוץ סטנדרטי</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 border-b">שיפוץ יוקרה</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">🍳 מטבח</td>
                  <td className="py-3 px-4">₪25,000-₪40,000</td>
                  <td className="py-3 px-4">₪40,000-₪80,000</td>
                  <td className="py-3 px-4">₪80,000-₪150,000</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">🚿 חדר אמבטיה</td>
                  <td className="py-3 px-4">₪15,000-₪25,000</td>
                  <td className="py-3 px-4">₪25,000-₪50,000</td>
                  <td className="py-3 px-4">₪50,000-₪80,000</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">🛋️ סלון (30 מ&quot;ר)</td>
                  <td className="py-3 px-4">₪10,000-₪20,000</td>
                  <td className="py-3 px-4">₪20,000-₪40,000</td>
                  <td className="py-3 px-4">₪40,000-₪70,000</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">🛏️ חדר שינה</td>
                  <td className="py-3 px-4">₪5,000-₪10,000</td>
                  <td className="py-3 px-4">₪10,000-₪25,000</td>
                  <td className="py-3 px-4">₪25,000-₪45,000</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">🏠 מרפסת (12 מ&quot;ר)</td>
                  <td className="py-3 px-4">₪8,000-₪15,000</td>
                  <td className="py-3 px-4">₪15,000-₪30,000</td>
                  <td className="py-3 px-4">₪30,000-₪50,000</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-gray-900">🎨 צביעה (דירה שלמה)</td>
                  <td className="py-3 px-4">₪5,000-₪8,000</td>
                  <td className="py-3 px-4">₪8,000-₪15,000</td>
                  <td className="py-3 px-4">₪15,000-₪25,000</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Full apartment costs */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">עלות שיפוץ דירה שלמה</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">דירה 3 חדרים (75-85 מ&quot;ר)</h3>
              <p className="text-gray-600 text-sm mb-2">שיפוץ בסיסי: ₪80,000-₪120,000</p>
              <p className="text-gray-600 text-sm mb-2">שיפוץ סטנדרטי: ₪120,000-₪180,000</p>
              <p className="text-gray-600 text-sm">שיפוץ יוקרה: ₪180,000-₪300,000</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">דירה 4 חדרים (90-110 מ&quot;ר)</h3>
              <p className="text-gray-600 text-sm mb-2">שיפוץ בסיסי: ₪100,000-₪150,000</p>
              <p className="text-gray-600 text-sm mb-2">שיפוץ סטנדרטי: ₪150,000-₪250,000</p>
              <p className="text-gray-600 text-sm">שיפוץ יוקרה: ₪250,000-₪400,000</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">דירה 5 חדרים (120-140 מ&quot;ר)</h3>
              <p className="text-gray-600 text-sm mb-2">שיפוץ בסיסי: ₪130,000-₪200,000</p>
              <p className="text-gray-600 text-sm mb-2">שיפוץ סטנדרטי: ₪200,000-₪350,000</p>
              <p className="text-gray-600 text-sm">שיפוץ יוקרה: ₪350,000-₪550,000</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">פנטהאוז / קוטג&apos; (160+ מ&quot;ר)</h3>
              <p className="text-gray-600 text-sm mb-2">שיפוץ בסיסי: ₪180,000-₪280,000</p>
              <p className="text-gray-600 text-sm mb-2">שיפוץ סטנדרטי: ₪280,000-₪500,000</p>
              <p className="text-gray-600 text-sm">שיפוץ יוקרה: ₪500,000-₪1,000,000+</p>
            </div>
          </div>

          {/* Cost factors */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">מה משפיע על מחיר השיפוץ?</h2>
          <div className="space-y-4 mb-8">
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">📐 גודל הדירה</h3>
              <p className="text-gray-600 text-sm">ככל שהדירה גדולה יותר, העלות עולה — אך המחיר למ&quot;ר בדרך כלל יורד. דירה גדולה = יותר חומרים, אבל פחות עלות יחסית למ&quot;ר.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">🧱 רמת החומרים</h3>
              <p className="text-gray-600 text-sm">אריחי פורצלן בסיסיים: ₪80-₪150/מ&quot;ר. אריחים מעוצבים: ₪200-₪500/מ&quot;ר. שיש טבעי: ₪800-₪2,000/מ&quot;ר. ההבדל במחיר בין חומרים בסיסיים ליוקרה יכול להכפיל את העלות.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">📍 מיקום</h3>
              <p className="text-gray-600 text-sm">מחירי עבודה בתל אביב גבוהים ב-20-30% מהפריפריה. בירושלים המחירים גבוהים ב-10-20%. בדרום ובצפון — המחירים נמוכים יותר.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">🔧 היקף העבודה</h3>
              <p className="text-gray-600 text-sm">צביעה בלבד? ₪8,000-₪15,000. שיפוץ כולל כולל הזזת קירות, חשמל חדש, אינסטלציה חדשה? ₪150,000+. ההיקף הוא הגורם המרכזי.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">📅 עונה</h3>
              <p className="text-gray-600 text-sm">קיץ ואביב — עונת שיא. קבלנים עמוסים ומחירים גבוהים ב-10-15%. חורף — עונה שקטה, אפשר לקבל מחירים טובים יותר.</p>
            </div>
          </div>

          {/* Budget tips */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">10 טיפים לחיסכון בשיפוץ</h2>
          <ul className="space-y-3 text-gray-700 mb-8">
            <li className="flex items-start gap-2"><span className="font-semibold text-gray-900">1.</span> <span><strong>השוו הצעות:</strong> קבלו לפחות 3 הצעות מחיר מקבלנים שונים. ההבדל יכול להגיע ל-30%.</span></li>
            <li className="flex items-start gap-2"><span className="font-semibold text-gray-900">2.</span> <span><strong>כתב כמויות:</strong> השתמשו בכתב כמויות AI של ShiputzAI כדי לדעת מה הגיוני ומה מנופח.</span></li>
            <li className="flex items-start gap-2"><span className="font-semibold text-gray-900">3.</span> <span><strong>שפצו בחורף:</strong> קבלנים פנויים יותר ונותנים הנחות של 10-15%.</span></li>
            <li className="flex items-start gap-2"><span className="font-semibold text-gray-900">4.</span> <span><strong>חומרים ישראליים:</strong> אריחים ישראליים (כמו של חלמיש) זולים ב-30-50% מיובא.</span></li>
            <li className="flex items-start gap-2"><span className="font-semibold text-gray-900">5.</span> <span><strong>אל תשנו באמצע:</strong> שינויים תוך כדי עבודה עולים כסף — תכננו הכל מראש.</span></li>
            <li className="flex items-start gap-2"><span className="font-semibold text-gray-900">6.</span> <span><strong>הדמיה לפני שיפוץ:</strong> השתמשו בShiputzAI לראות את התוצאה לפני שמשקיעים. חוסך טעויות יקרות.</span></li>
            <li className="flex items-start gap-2"><span className="font-semibold text-gray-900">7.</span> <span><strong>קנו חומרים בעצמכם:</strong> ברזים, כלים סניטריים, ותאורה — קנו ישירות ולא דרך הקבלן. חיסכון של 20-40%.</span></li>
            <li className="flex items-start gap-2"><span className="font-semibold text-gray-900">8.</span> <span><strong>שמרו על גמישות:</strong> אם הקבלן מציע חומר חלופי זול יותר באותה איכות — שקלו.</span></li>
            <li className="flex items-start gap-2"><span className="font-semibold text-gray-900">9.</span> <span><strong>רזרבה של 15%:</strong> תמיד שמרו 15% מהתקציב כרזרבה — תמיד יש הפתעות.</span></li>
            <li className="flex items-start gap-2"><span className="font-semibold text-gray-900">10.</span> <span><strong>ניתוח הצעת מחיר:</strong> העלו את ההצעה לShiputzAI וה-AI יגיד לכם אם המחירים סבירים.</span></li>
          </ul>

          {/* AI cost estimation */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">הערכת עלות AI — איך ShiputzAI עוזר?</h2>
          <p className="text-gray-700 leading-relaxed mb-4">ShiputzAI מציע שני כלים שעוזרים לתכנן תקציב שיפוץ:</p>
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">📋 כתב כמויות AI</h3>
              <p className="text-gray-700 text-sm mb-2">מעלים תמונה של החדר → מקבלים כתב כמויות מפורט עם חומרים, כמויות, ועלויות משוערות.</p>
              <p className="text-emerald-700 text-sm font-medium">₪3-15 | 30 שניות | חוסך ₪3,000-₪8,000</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">💰 ניתוח הצעת מחיר</h3>
              <p className="text-gray-700 text-sm mb-2">מעלים הצעת מחיר מקבלן → ה-AI בודק אם המחירים סבירים ומציין איפה אפשר לחסוך.</p>
              <p className="text-emerald-700 text-sm font-medium">₪3-15 | 30 שניות | יכול לחסוך אלפי ₪</p>
            </div>
          </div>

          {/* Detailed work costs */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">מחירון עבודות שיפוץ מפורט 2026</h2>
          <div className="overflow-x-auto mb-8">
            <table dir="rtl" className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 border-b">עבודה</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 border-b">מחיר</th>
                  <th className="py-3 px-4 text-right font-semibold text-gray-900 border-b">הערות</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">ריצוף (חומר + עבודה)</td>
                  <td className="py-3 px-4">₪250-₪600/מ&quot;ר</td>
                  <td className="py-3 px-4 text-gray-500">תלוי בסוג האריח</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">צביעה</td>
                  <td className="py-3 px-4">₪35-₪65/מ&quot;ר</td>
                  <td className="py-3 px-4 text-gray-500">2-3 שכבות</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">גבס + שפכטל</td>
                  <td className="py-3 px-4">₪120-₪200/מ&quot;ר</td>
                  <td className="py-3 px-4 text-gray-500">כולל חומר ועבודה</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">נקודת חשמל</td>
                  <td className="py-3 px-4">₪250-₪450/נקודה</td>
                  <td className="py-3 px-4 text-gray-500">שקע/מפסק/תאורה</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">נקודת אינסטלציה</td>
                  <td className="py-3 px-4">₪400-₪800/נקודה</td>
                  <td className="py-3 px-4 text-gray-500">מים חמים/קרים/ביוב</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">איטום חדר רחצה</td>
                  <td className="py-3 px-4">₪3,000-₪6,000</td>
                  <td className="py-3 px-4 text-gray-500">חובה לפני ריצוף</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-gray-900">הריסת קיר (לא נושא)</td>
                  <td className="py-3 px-4">₪2,000-₪5,000</td>
                  <td className="py-3 px-4 text-gray-500">כולל פינוי</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center my-10">
          <Link
            href="/signup"
            className="inline-block bg-gray-900 text-white px-10 py-4 rounded-full text-base font-medium hover:bg-gray-800 transition-colors"
          >
            קבלו הערכת עלות AI לשיפוץ שלכם →
          </Link>
          <p className="text-sm text-gray-400 mt-3">10 קרדיטים חינם — כולל כתב כמויות וניתוח הצעת מחיר</p>
        </div>

        {/* FAQ */}
        <div className="mt-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">שאלות נפוצות</h2>
          <div className="space-y-4">
            <FaqItem question="כמה עולה שיפוץ דירה 4 חדרים?" answer="שיפוץ דירה 4 חדרים בישראל עולה בממוצע ₪120,000-₪250,000 ב-2026. שיפוץ בסיסי (צביעה, ריצוף) עולה פחות, שיפוץ כולל (מטבח, אמבטיה, חשמל) עולה יותר." />
            <FaqItem question="כמה עולה שיפוץ מטבח?" answer="שיפוץ מטבח מלא בישראל ב-2026 עולה ₪40,000-₪80,000. זה כולל פירוק, אינסטלציה, חשמל, ריצוף, ארונות, משטח עבודה, וברז. מטבח יוקרה יכול להגיע ל-₪120,000+." />
            <FaqItem question="כמה עולה שיפוץ חדר אמבטיה?" answer="שיפוץ חדר אמבטיה בישראל ב-2026 עולה ₪25,000-₪50,000. כולל פירוק, איטום, אינסטלציה, ריצוף וחיפוי, כלים סניטריים, וברזים." />
            <FaqItem question="איך אפשר לחסוך בשיפוץ?" answer="טיפים לחיסכון: השוו לפחות 3 הצעות מחיר, השתמשו בכתב כמויות AI לביסוס המשא ומתן, שפצו בעונות שקטות (חורף), בחרו חומרים ישראליים, והימנעו משינויים באמצע העבודה." />
            <FaqItem question="כמה עולה צביעת דירה?" answer='צביעת דירה 4 חדרים (כ-100 מ"ר) עולה ₪8,000-₪15,000 בישראל ב-2026. המחיר תלוי בסוג הצבע, מספר שכבות, ומצב הקירות.' />
            <FaqItem question="כמה זמן לוקח שיפוץ דירה?" answer="שיפוץ דירה 4 חדרים לוקח 6-12 שבועות בממוצע. שיפוץ מטבח בלבד: 3-5 שבועות. חדר אמבטיה: 2-4 שבועות. צביעה בלבד: 3-5 ימים." />
          </div>
        </div>

        {/* Related */}
        <div className="mt-10 p-6 bg-gray-50 rounded-2xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">קרא גם</h3>
          <ul className="space-y-3">
            <li><Link href="/tips/bill-of-quantities-ai" className="text-gray-700 hover:text-gray-900 hover:underline">כתב כמויות אוטומטי בAI — חסכו אלפי שקלים</Link></li>
            <li><Link href="/tips/ai-kitchen-visualization" className="text-gray-700 hover:text-gray-900 hover:underline">הדמיית שיפוץ מטבח בAI — ראו את המטבח החדש תוך 30 שניות</Link></li>
            <li><Link href="/tips/ai-interior-design-israel" className="text-gray-700 hover:text-gray-900 hover:underline">עיצוב פנים בAI בישראל — המדריך המלא 2026</Link></li>
            <li><Link href="/tips/how-much-renovation-visualization" className="text-gray-700 hover:text-gray-900 hover:underline">כמה עולה הדמיית שיפוץ בAI? — מדריך מחירים 2026</Link></li>
            <li><Link href="/tips/ai-living-room-design" className="text-gray-700 hover:text-gray-900 hover:underline">עיצוב סלון בAI — 7 סגנונות עיצוב פופולריים להדמיה</Link></li>
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
