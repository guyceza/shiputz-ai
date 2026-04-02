"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="border border-gray-200 rounded-xl p-4 group">
      <summary className="font-semibold text-gray-900 cursor-pointer group-open:mb-2">{q}</summary>
      <p className="text-gray-600 leading-relaxed">{a}</p>
    </details>
  );
}

export default function SmallKitchenDesignAI() {
  useEffect(() => {
    document.title = "עיצוב מטבח קטן — 8 רעיונות חכמים עם AI | ShiputzAI";
  }, []);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "עיצוב מטבח קטן — 8 רעיונות חכמים עם AI",
    "author": { "@type": "Organization", "name": "ShiputzAI" },
    "publisher": { "@type": "Organization", "name": "ShiputzAI", "url": "https://shipazti.com" },
    "datePublished": "2026-04-02",
    "description": "8 רעיונות חכמים לעיצוב מטבח קטן בעזרת AI: ארונות גבוהים, צבעים בהירים, אי מתקפל ועוד. כולל טיפים להדמיה.",
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "איך מעצבים מטבח קטן כדי שייראה גדול?", "acceptedAnswer": { "@type": "Answer", "text": "שימוש בצבעים בהירים, ארונות עד התקרה, מראות, תאורה טובה ומשטחים נקיים. AI יכול להדמות את כל האפשרויות על תמונה אמיתית של המטבח." } },
      { "@type": "Question", "name": "כמה עולה שיפוץ מטבח קטן בישראל?", "acceptedAnswer": { "@type": "Answer", "text": "שיפוץ מטבח קטן (עד 8 מ\"ר) עולה בין ₪15,000 ל-₪60,000 תלוי ברמת הגימור, החומרים וסוג הארונות." } },
      { "@type": "Question", "name": "האם AI יכול לעצב מטבח קטן?", "acceptedAnswer": { "@type": "Answer", "text": "כן. ShiputzAI מאפשר להעלות תמונה של המטבח הקיים ולקבל הדמיה של השיפוץ תוך 30 שניות — כולל סגנונות שונים." } },
    ],
  };

  return (
    <div dir="rtl" className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">ShiputzAI</Link>
          <div className="flex items-center gap-4">
            <Link href="/tips" className="text-gray-600 hover:text-gray-900 text-sm">טיפים</Link>
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900 text-sm">מחירים</Link>
            <Link href="/signup" className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors">התחילו בחינם</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-4 text-sm text-gray-500"><Link href="/tips" className="hover:text-amber-600">טיפים</Link> / עיצוב מטבח קטן</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-6">עיצוב מטבח קטן — 8 רעיונות חכמים עם AI</h1>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-10">
          <p className="text-lg text-gray-800 leading-relaxed">
            <strong>מטבח קטן לא חייב להרגיש קטן.</strong> עם תכנון נכון — ארונות גבוהים, צבעים בהירים, ואי מתקפל — אפשר להפוך מטבח של 6 מ&quot;ר למרחב עבודה נוח ואסתטי. ShiputzAI מאפשר להדמות כל רעיון על המטבח שלכם תוך 30 שניות.
          </p>
        </div>

        <article className="prose prose-lg max-w-none">
          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">1. ארונות עד התקרה</h2>
          <p className="text-gray-700 leading-relaxed mb-4">זה הטיפ הכי משמעותי למטבח קטן. ארונות שמגיעים עד התקרה מכפילים את שטח האחסון בלי לגזול רצפה. בחלק העליון אפשר לאחסן כלים שמשתמשים בהם לעיתים רחוקות. העלות: ₪3,000-8,000 יותר מארונות סטנדרטיים, אבל ההשקעה שווה כל שקל.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">2. צבעים בהירים — לבן, שמנת, אפור בהיר</h2>
          <p className="text-gray-700 leading-relaxed mb-4">צבעים בהירים מרחיבים את החלל אופטית. שילוב של ארונות לבנים עם משטח עבודה בגוון עץ טבעי יוצר מטבח שנראה גדול ומזמין. הימנעו מצבעים כהים בארונות עליונים — הם ״מכבידים״ על החלל.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">3. אי מתקפל או נשלף</h2>
          <p className="text-gray-700 leading-relaxed mb-4">אם אין מקום לאי קבוע, אי מתקפל שמתחבר לקיר הוא פתרון גאוני. ברגע שצריך — פותחים אותו כמשטח עבודה נוסף או בר ארוחת בוקר. כשלא צריך — מקפלים וזה לא תופס מקום. עלות: ₪1,500-4,000.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">4. תאורה שכבתית</h2>
          <p className="text-gray-700 leading-relaxed mb-4">תאורה מתחת לארונות עליונים (LED strip) מאירה את משטח העבודה ויוצרת עומק. תוסיפו ספוט תקרה מעל האי ותאורה אמביינטית — והמטבח הקטן יהפוך לחלל מוקפד ומקצועי.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">5. ידיות שקועות או push-to-open</h2>
          <p className="text-gray-700 leading-relaxed mb-4">ידיות בולטות במטבח קטן מפריעות לתנועה ומסרבלות את המראה. ידיות שקועות (profile) או מערכת push-to-open נותנות מראה נקי ומודרני. הסתכלו על מטבחי IKEA Method — הם מציעים את שתי האופציות במחירים נגישים.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">6. מראה או חיפוי זכוכית</h2>
          <p className="text-gray-700 leading-relaxed mb-4">חיפוי קיר מזכוכית (ספלשבק) במקום אריחים מרחיב את החלל — במיוחד אם הוא בגוון בהיר. מראה קטנה בפינה גם יוצרת אשליה של מרחב. עלות חיפוי זכוכית: ₪200-500 למ&quot;ר.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">7. מדפים פתוחים במקום ארונות עליונים</h2>
          <p className="text-gray-700 leading-relaxed mb-4">אלטרנטיבה לארונות עליונים: 2-3 מדפים פתוחים מעץ. זה מקל על החלל ונותן תחושה של ״מטבח בוטיק״. החיסרון: דורש סדר קפדני. היתרון: חוסך ₪3,000-8,000 בארונות ונותן לוק עדכני.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">8. שימוש ב-AI לפני ההחלטה</h2>
          <p className="text-gray-700 leading-relaxed mb-4">לפני שמתחייבים לסגנון, צבע או פריסה — העלו תמונה של המטבח ל-<Link href="/visualize" className="text-amber-600 hover:text-amber-700 font-medium">ShiputzAI</Link> ונסו כמה גרסאות. הדמיה עולה פחות מ-₪10 ויכולה לחסוך אלפי שקלים בהחלטה לא נכונה.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">כמה עולה שיפוץ מטבח קטן?</h2>
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-gray-700">שיפוץ קוסמטי (צבע + ידיות + תאורה)</span><span className="font-bold text-gray-900">₪5,000-15,000</span></div>
              <div className="flex justify-between"><span className="text-gray-700">החלפת ארונות בלבד</span><span className="font-bold text-gray-900">₪15,000-35,000</span></div>
              <div className="flex justify-between"><span className="text-gray-700">שיפוץ קומפלט (כולל אינסטלציה וחשמל)</span><span className="font-bold text-gray-900">₪30,000-60,000</span></div>
              <div className="flex justify-between"><span className="text-gray-700">הדמיית AI (לפני שמתחילים)</span><span className="font-bold text-amber-600">₪10-25</span></div>
            </div>
          </div>
        </article>

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">שאלות נפוצות</h2>
          <div className="space-y-3">
            <FaqItem q="איך מעצבים מטבח קטן כדי שייראה גדול?" a="שימוש בצבעים בהירים, ארונות עד התקרה, מראות, תאורה טובה ומשטחים נקיים. AI יכול להדמות את כל האפשרויות על תמונה אמיתית של המטבח." />
            <FaqItem q="כמה עולה שיפוץ מטבח קטן בישראל?" a='שיפוץ מטבח קטן (עד 8 מ"ר) עולה בין ₪15,000 ל-₪60,000 תלוי ברמת הגימור, החומרים וסוג הארונות.' />
            <FaqItem q="האם AI יכול לעצב מטבח קטן?" a="כן. ShiputzAI מאפשר להעלות תמונה של המטבח הקיים ולקבל הדמיה של השיפוץ תוך 30 שניות — כולל סגנונות שונים." />
          </div>
        </section>

        <div className="mt-12 text-center">
          <Link href="/visualize" className="bg-amber-500 text-white px-8 py-3 rounded-xl font-medium text-lg hover:bg-amber-600 transition-colors inline-block">
            נסו הדמיית מטבח עכשיו — חינם
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <Link href="/tips/ai-kitchen-visualization" className="text-amber-600 hover:text-amber-700">הדמיית מטבח AI →</Link>
          <Link href="/tips/renovation-cost-calculator" className="text-amber-600 hover:text-amber-700">מחשבון עלות שיפוץ →</Link>
          <Link href="/tips/ai-interior-design-israel" className="text-amber-600 hover:text-amber-700">עיצוב פנים AI בישראל →</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
