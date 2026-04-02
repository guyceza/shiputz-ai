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

export default function AILivingRoomDesignPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    document.title = "עיצוב סלון בAI — 7 סגנונות עיצוב פופולריים להדמיה | ShiputzAI";
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
    "headline": "עיצוב סלון בAI — 7 סגנונות עיצוב פופולריים להדמיה",
    "description": "עיצוב סלון בAI מאפשר לראות את הסלון שלכם ב-7 סגנונות שונים תוך דקות. מדריך מלא עם סגנונות, פלטות צבעים וטיפים.",
    "author": { "@type": "Organization", "name": "ShiputzAI" },
    "publisher": { "@type": "Organization", "name": "ShiputzAI", "url": "https://shipazti.com" },
    "mainEntityOfPage": { "@type": "WebPage", "@id": "https://shipazti.com/tips/ai-living-room-design" },
    "datePublished": "2026-04-02",
    "dateModified": "2026-04-02"
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "איך מעצבים סלון עם AI?",
        "acceptedAnswer": { "@type": "Answer", "text": "מעלים תמונה של הסלון הקיים לShiputzAI, בוחרים סגנון עיצוב (מודרני, בוהו, סקנדינבי וכו'), ומקבלים הדמיה פוטוריאליסטית תוך 30 שניות." }
      },
      {
        "@type": "Question",
        "name": "כמה עולה עיצוב סלון בAI?",
        "acceptedAnswer": { "@type": "Answer", "text": "עיצוב סלון בAI בShiputzAI עולה ₪3-15 להדמיה. בהרשמה מקבלים 10 קרדיטים חינם. לעומת מעצב פנים שגובה ₪5,000-₪15,000." }
      },
      {
        "@type": "Question",
        "name": "איזה סגנון סלון הכי פופולרי בישראל?",
        "acceptedAnswer": { "@type": "Answer", "text": "הסגנון המודרני מינימליסטי הוא הפופולרי ביותר בישראל ב-2026, אחריו סקנדינבי וים-תיכוני. בShiputzAI אפשר לנסות את כולם ולהשוות." }
      },
      {
        "@type": "Question",
        "name": "האם AI יכול להציע רהיטים לסלון?",
        "acceptedAnswer": { "@type": "Answer", "text": "כן! בShiputzAI יש כלי Shop the Look שמזהה רהיטים בהדמיה ומציע מוצרים דומים לרכישה עם קישורים ומחירים." }
      },
      {
        "@type": "Question",
        "name": "אפשר לעצב סלון קטן עם AI?",
        "acceptedAnswer": { "@type": "Answer", "text": "בהחלט! AI מצוין לסלונות קטנים — אפשר לנסות פריסות רהיטים שונות, צבעים בהירים שמרחיבים את החלל, ופתרונות אחסון חכמים." }
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
          <span className="text-xs px-3 py-1 rounded-full bg-purple-50 text-purple-700">סלון</span>
          <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700">AI וטכנולוגיה</span>
          <span className="text-xs text-gray-400">זמן קריאה: 8 דקות</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 leading-tight">
          עיצוב סלון בAI — 7 סגנונות עיצוב פופולריים להדמיה
        </h1>
      </header>

      <div className="max-w-3xl mx-auto px-6"><div className="h-px bg-gray-100"></div></div>

      <article className="max-w-3xl mx-auto px-6 py-8">
        <div className="prose prose-gray max-w-none">
          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            <strong>עיצוב סלון בAI מאפשר לראות את הסלון שלכם ב-7 סגנונות שונים תוך דקות.</strong> בShiputzAI, העלו תמונה של הסלון וקבלו הדמיות מקצועיות — מסלון מודרני מינימליסטי ועד בוהו-שיק צבעוני.
          </p>

          <p className="text-gray-700 leading-relaxed mb-8">
            הסלון הוא הלב של הבית — המקום שבו מבלים הכי הרבה זמן, מארחים אורחים ונרגעים. עיצוב סלון חדש יכול לשנות לחלוטין את האווירה בבית. עם AI, אפשר לנסות עשרות סגנונות שונים לפני שקונים רהיט אחד.
          </p>

          {/* 7 Styles */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">7 סגנונות סלון פופולריים</h2>

          <div className="space-y-6 mb-8">
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">1. 🏙️ מודרני מינימליסטי</h3>
              <p className="text-gray-600 leading-relaxed mb-2">קווים נקיים, מעט רהיטים, הרבה מרחב. צבעים: לבן, אפור, שחור עם נגיעות עץ טבעי. ספה גדולה בצבע ניטרלי, שולחן קפה פשוט, ותאורה מינימלית.</p>
              <p className="text-sm text-gray-500"><strong>פלטת צבעים:</strong> לבן, אפור בהיר, עץ אלון, שחור מט</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">2. 🌊 ים-תיכוני (Mediterranean)</h3>
              <p className="text-gray-600 leading-relaxed mb-2">השראה מהריביירה — גוונים של כחול ולבן, אריחים מעוטרים, עץ כהה. בדים טבעיים (פשתן, כותנה), צמחים ירוקים, ותחושת חופש.</p>
              <p className="text-sm text-gray-500"><strong>פלטת צבעים:</strong> כחול ים, לבן, טרקוטה, עץ זית</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">3. ❄️ סקנדינבי (Scandinavian)</h3>
              <p className="text-gray-600 leading-relaxed mb-2">פונקציונליות ומינימליזם עם חמימות. עץ בהיר, הרבה לבן, כריות רכות, שטיחים מפנקים. אור טבעי מקסימלי ותחושת היגה (Hygge).</p>
              <p className="text-sm text-gray-500"><strong>פלטת צבעים:</strong> לבן שלג, עץ ליבנה, אפור חם, ורוד מעושן</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">4. 🎨 בוהו-שיק (Boho Chic)</h3>
              <p className="text-gray-600 leading-relaxed mb-2">צבעוני, חופשי, אקלקטי. מיקס של דוגמאות, טקסטורות וצבעים. מקרמה, צמחים, שטיחים מרוקאיים, וכריות רקומות. אווירה של חום וביטוי אישי.</p>
              <p className="text-sm text-gray-500"><strong>פלטת צבעים:</strong> חרדל, טרקוטה, ירוק יער, שמנת, ורוד עתיק</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">5. ⚙️ תעשייתי (Industrial)</h3>
              <p className="text-gray-600 leading-relaxed mb-2">בטון חשוף, מתכת, לבנים. ספת עור כהה, מדפי ברזל, תאורת אדיסון. גלוי ומינימלי — מתאים לדירות לופט ולמי שאוהב אופי.</p>
              <p className="text-sm text-gray-500"><strong>פלטת צבעים:</strong> אפור בטון, שחור, חלודה, עץ גולמי</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">6. 🏛️ קלאסי מודרני (Transitional)</h3>
              <p className="text-gray-600 leading-relaxed mb-2">שילוב של קלאסי ומודרני — רהיטים אלגנטיים עם קווים פשוטים. צבעים ניטרליים עשירים, בדים איכותיים (קטיפה, משי), ופרטי עיצוב מעודנים.</p>
              <p className="text-sm text-gray-500"><strong>פלטת צבעים:</strong> שמנת, בז&apos;, זהב, כחול כהה, ירוק אזמרגד</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">7. 🌿 יפני (Japandi)</h3>
              <p className="text-gray-600 leading-relaxed mb-2">מיזוג של מינימליזם יפני עם חמימות סקנדינבית. עץ טבעי, צמחייה, קרמיקה. כל פריט במקום מדויק, הרבה אוויר. שקט ויזואלי מושלם.</p>
              <p className="text-sm text-gray-500"><strong>פלטת צבעים:</strong> לבן, בז&apos; טבעי, שחור, עץ אורן, ירוק עמום</p>
            </div>
          </div>

          {/* How it works */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">איך עובד עיצוב סלון בAI?</h2>
          <div className="space-y-4 mb-8">
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <span className="flex-shrink-0 w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-semibold">1</span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">צלמו את הסלון</h3>
                  <p className="text-gray-600">תמונה ברורה מזווית שמראה כמה שיותר מהחלל. אור טבעי עדיף.</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <span className="flex-shrink-0 w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-semibold">2</span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">בחרו סגנון</h3>
                  <p className="text-gray-600">כתבו את הסגנון הרצוי: &quot;סלון מודרני מינימליסטי&quot;, &quot;בוהו שיק צבעוני&quot;, &quot;יפנדי עם צמחים&quot; וכו&apos;.</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <span className="flex-shrink-0 w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-semibold">3</span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">קבלו הדמיה תוך 30 שניות</h3>
                  <p className="text-gray-600">ה-AI מייצר הדמיה פוטוריאליסטית. נסו כמה סגנונות ובחרו את המנצח.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Furniture tips */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">טיפים לפריסת רהיטים בסלון</h2>
          <ul className="space-y-3 text-gray-700 mb-8">
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span> <span><strong>כלל 60-30-10:</strong> 60% צבע דומיננטי (קירות), 30% צבע משני (רהיטים), 10% צבע הדגשה (כריות, אקססוריז)</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span> <span><strong>שטיח:</strong> שטיח גדול מספיק שרגלי הספה הקדמיות עומדות עליו — מאחד את החלל</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span> <span><strong>מרחק:</strong> השאירו לפחות 90 ס&quot;מ למעבר בין רהיטים</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span> <span><strong>מוקד:</strong> כל סלון צריך מוקד — טלוויזיה, אח, חלון גדול, או קיר אמנות</span></li>
            <li className="flex items-start gap-2"><span className="text-emerald-500 mt-1">✅</span> <span><strong>תאורה בשכבות:</strong> שילוב של תאורה עליונה, עמידה ושולחנית ליצירת אווירה</span></li>
          </ul>

          {/* Color guide */}
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">מדריך צבעים לסלון</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">צבעים מרחיבים חלל</h3>
              <p className="text-gray-600 text-sm">לבן, בז&apos; בהיר, תכלת, אפור בהיר. מושלמים לסלונות קטנים — יוצרים תחושת מרחב ואור.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">צבעים יוצרים אינטימיות</h3>
              <p className="text-gray-600 text-sm">כחול כהה, ירוק יער, חום שוקולד, בורדו. מתאימים לסלונות גדולים — יוצרים חמימות ואווירה.</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center my-10">
          <Link
            href="/visualize"
            className="inline-block bg-gray-900 text-white px-10 py-4 rounded-full text-base font-medium hover:bg-gray-800 transition-colors"
          >
            עצבו את הסלון שלכם עכשיו — חינם →
          </Link>
          <p className="text-sm text-gray-400 mt-3">10 קרדיטים חינם בהרשמה</p>
        </div>

        {/* FAQ */}
        <div className="mt-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">שאלות נפוצות</h2>
          <div className="space-y-4">
            <FaqItem
              question="איך מעצבים סלון עם AI?"
              answer="מעלים תמונה של הסלון הקיים לShiputzAI, בוחרים סגנון עיצוב (מודרני, בוהו, סקנדינבי וכו'), ומקבלים הדמיה פוטוריאליסטית תוך 30 שניות."
            />
            <FaqItem
              question="כמה עולה עיצוב סלון בAI?"
              answer="עיצוב סלון בAI בShiputzAI עולה ₪3-15 להדמיה. בהרשמה מקבלים 10 קרדיטים חינם. לעומת מעצב פנים שגובה ₪5,000-₪15,000."
            />
            <FaqItem
              question="איזה סגנון סלון הכי פופולרי בישראל?"
              answer="הסגנון המודרני מינימליסטי הוא הפופולרי ביותר בישראל ב-2026, אחריו סקנדינבי וים-תיכוני. בShiputzAI אפשר לנסות את כולם ולהשוות."
            />
            <FaqItem
              question="האם AI יכול להציע רהיטים לסלון?"
              answer="כן! בShiputzAI יש כלי Shop the Look שמזהה רהיטים בהדמיה ומציע מוצרים דומים לרכישה עם קישורים ומחירים."
            />
            <FaqItem
              question="אפשר לעצב סלון קטן עם AI?"
              answer="בהחלט! AI מצוין לסלונות קטנים — אפשר לנסות פריסות רהיטים שונות, צבעים בהירים שמרחיבים את החלל, ופתרונות אחסון חכמים."
            />
          </div>
        </div>

        {/* Related */}
        <div className="mt-10 p-6 bg-gray-50 rounded-2xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">קרא גם</h3>
          <ul className="space-y-3">
            <li><Link href="/tips/ai-kitchen-visualization" className="text-gray-700 hover:text-gray-900 hover:underline">הדמיית שיפוץ מטבח בAI — ראו את המטבח החדש תוך 30 שניות</Link></li>
            <li><Link href="/tips/ai-interior-design-israel" className="text-gray-700 hover:text-gray-900 hover:underline">עיצוב פנים בAI בישראל — המדריך המלא 2026</Link></li>
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
