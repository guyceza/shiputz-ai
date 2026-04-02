"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
function FaqItem({ q, a }: { q: string; a: string }) { return (<details className="border border-gray-200 rounded-xl p-4 group"><summary className="font-semibold text-gray-900 cursor-pointer group-open:mb-2">{q}</summary><p className="text-gray-600 leading-relaxed">{a}</p></details>); }
export default function BedroomDesignAI() {
  useEffect(() => { document.title = "עיצוב חדר שינה — 6 סגנונות פופולריים להדמיה בAI | ShiputzAI"; }, []);
  const s1 = {"@context":"https://schema.org","@type":"Article","headline":"עיצוב חדר שינה — 6 סגנונות פופולריים להדמיה בAI","author":{"@type":"Organization","name":"ShiputzAI"},"datePublished":"2026-04-02"};
  const s2 = {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"מה הסגנון הפופולרי לחדר שינה 2026?","acceptedAnswer":{"@type":"Answer","text":"Japandi (שילוב יפני-סקנדינבי) הוא הטרנד המוביל: קווים נקיים, עץ כהה, טקסטילים טבעיים, ותחושת שלווה."}},{"@type":"Question","name":"כמה עולה לעצב חדר שינה?","acceptedAnswer":{"@type":"Answer","text":"מ-₪5,000 לרענון ועד ₪40,000+ לעיצוב מלא כולל מיטה, ארון מובנה ותאורה."}}]};
  return (
    <div dir="rtl" className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s1) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s2) }} />
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50"><div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between"><Link href="/" className="text-xl font-bold text-gray-900">ShiputzAI</Link><div className="flex items-center gap-4"><Link href="/tips" className="text-gray-600 hover:text-gray-900 text-sm">טיפים</Link><Link href="/signup" className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600">התחילו בחינם</Link></div></div></nav>
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-4 text-sm text-gray-500"><Link href="/tips" className="hover:text-amber-600">טיפים</Link> / עיצוב חדר שינה</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-6">עיצוב חדר שינה — 6 סגנונות פופולריים להדמיה בAI</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-10"><p className="text-lg text-gray-800"><strong>חדר שינה טוב = שינה טובה.</strong> הסגנון, הצבעים והתאורה משפיעים ישירות על איכות השינה. ShiputzAI מאפשר להדמות 6 סגנונות שונים על חדר השינה שלכם — ולבחור לפני שמתחילים.</p></div>
        <article className="prose prose-lg max-w-none">
          {[
            { icon: "🇯🇵", name: "Japandi", desc: "שילוב יפני-סקנדינבי. עץ כהה (אגוז), מצעי פשתן, ראש מיטה עץ, שידות נמוכות. צבעים: שמנת, ירוק זית, חום עמוק. תאורה: מנורות נייר (Noguchi style). התחושה: שלווה, פשטות, טבע.", cost: "₪15,000-35,000" },
            { icon: "🌿", name: "בוהו-שיק", desc: "שכבות טקסטיל: שמיכת מקרמה, כריות רקומות, שטיח ווינטג'. צמחים (הרבה). מאקרמה על הקיר. צבעים: חום, קרם, ירוק, זהב. אור: שרשרת נורות. התחושה: חמימות, אישיות, בלתי-מושלם-בכוונה.", cost: "₪8,000-20,000" },
            { icon: "🏢", name: "מודרני-מינימליסטי", desc: "מיטת platform נמוכה. ארון מובנה flush. 2 צבעים מקסימום. ללא עיטורים. תאורה מוסתרת (LED strips). התחושה: מלון 5 כוכבים.", cost: "₪20,000-45,000" },
            { icon: "🌊", name: "קוסטל/ים-תיכוני", desc: "לבן + כחול. עץ בהיר, פשתן, חבלים. תריסי עץ. מצעים לבנים עם כריות כחולות. תמונת ים. התחושה: חופשה.", cost: "₪10,000-25,000" },
            { icon: "🏭", name: "תעשייתי", desc: "קיר בריקים חשוף (או טפט בריקים). מתכת שחורה (מנורות, מסגרת מיטה). עץ ממוחזר. צבעים: אפור, שחור, חום. התחושה: לופט ניו-יורקי.", cost: "₪12,000-30,000" },
            { icon: "👑", name: "קלאסי-מודרני", desc: "ראש מיטה מרופד (קטיפה). שידות עם ידיות זהב. מנורת קריסטל מודרנית. צבעים: כחול כהה, ירוק אמרלד, זהב. התחושה: יוקרה מרוסנת.", cost: "₪18,000-40,000" },
          ].map((style, i) => (
            <div key={i} className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">{style.icon} {style.name}</h2>
              <p className="text-gray-700 leading-relaxed mb-2">{style.desc}</p>
              <p className="text-sm text-gray-500">עלות משוערת: <strong>{style.cost}</strong></p>
            </div>
          ))}
          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">4 טיפים לשינה טובה יותר (מעיצוב)</h2>
          <p className="text-gray-700 leading-relaxed mb-4"><strong>1. תאורה חמה (2700K)</strong> — לא לבנה. נורות LED חמות. <strong>2. האפלה מלאה</strong> — וילונות blackout. <strong>3. ללא מסכים</strong> — מותר טלוויזיה, אבל טלפון לא ליד המיטה. <strong>4. צבעי קיר רגועים</strong> — מחקרים מראים: כחול ותכלת = הכי טוב לשינה. אדום = הכי גרוע.</p>
          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">הדמיה עם ShiputzAI</h2>
          <p className="text-gray-700 leading-relaxed mb-4">צלמו את חדר השינה, <Link href="/visualize" className="text-amber-600 font-medium">העלו ל-ShiputzAI</Link>, וכתבו &quot;חדר שינה Japandi עם עץ אגוז ומצעי פשתן&quot;. נסו כמה סגנונות ובחרו.</p>
        </article>
        <section className="mt-12"><h2 className="text-2xl font-bold text-gray-900 mb-4">שאלות נפוצות</h2><div className="space-y-3">
          <FaqItem q="מה הסגנון הפופולרי 2026?" a="Japandi — שילוב יפני-סקנדינבי. קווים נקיים, עץ כהה, שלווה." />
          <FaqItem q="כמה עולה לעצב חדר שינה?" a="מ-₪5,000 לרענון ועד ₪40,000+ לעיצוב מלא." />
        </div></section>
        <div className="mt-12 text-center"><Link href="/visualize" className="bg-amber-500 text-white px-8 py-3 rounded-xl font-medium text-lg hover:bg-amber-600 inline-block">הדמיית חדר שינה — חינם</Link></div>
        <div className="mt-8 flex flex-wrap gap-3 text-sm"><Link href="/tips/scandinavian-design-israel" className="text-amber-600">סקנדינבי →</Link><Link href="/tips/minimalist-design-guide" className="text-amber-600">מינימליסטי →</Link></div>
      </main>
      <Footer />
    </div>
  );
}
