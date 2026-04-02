"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
function FaqItem({ q, a }: { q: string; a: string }) { return (<details className="border border-gray-200 rounded-xl p-4 group"><summary className="font-semibold text-gray-900 cursor-pointer group-open:mb-2">{q}</summary><p className="text-gray-600 leading-relaxed">{a}</p></details>); }
export default function ModernLivingRoomIdeas() {
  useEffect(() => { document.title = "15 רעיונות לסלון מודרני — השראה עם AI | ShiputzAI"; }, []);
  const s1 = {"@context":"https://schema.org","@type":"Article","headline":"15 רעיונות לסלון מודרני — השראה עם AI","author":{"@type":"Organization","name":"ShiputzAI"},"datePublished":"2026-04-02"};
  const s2 = {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"מה הטרנדים בסלון מודרני 2026?","acceptedAnswer":{"@type":"Answer","text":"קווים נקיים, צבעים אדמתיים, ריהוט מעוגל, תאורה שכבתית, וקירות טקסטורה. הסגנון המודרני ב-2026 משלב חמימות עם מינימליזם."}},{"@type":"Question","name":"כמה עולה לעצב סלון מודרני?","acceptedAnswer":{"@type":"Answer","text":"מ-₪10,000 לרענון (צבע + אביזרים) ועד ₪80,000+ לעיצוב מלא כולל ריהוט חדש."}}]};
  return (
    <div dir="rtl" className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s1) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s2) }} />
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50"><div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between"><Link href="/" className="text-xl font-bold text-gray-900">ShiputzAI</Link><div className="flex items-center gap-4"><Link href="/tips" className="text-gray-600 hover:text-gray-900 text-sm">טיפים</Link><Link href="/signup" className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600">התחילו בחינם</Link></div></div></nav>
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-4 text-sm text-gray-500"><Link href="/tips" className="hover:text-amber-600">טיפים</Link> / סלון מודרני</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-6">15 רעיונות לסלון מודרני — השראה עם AI</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-10"><p className="text-lg text-gray-800"><strong>סלון מודרני ב-2026 משלב חמימות עם קווים נקיים.</strong> צבעים אדמתיים, ריהוט מעוגל, ותאורה חכמה. ShiputzAI מאפשר להדמות כל רעיון על הסלון שלכם — לפני שמוציאים שקל.</p></div>
        <article className="prose prose-lg max-w-none">
          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">צבעים</h2>
          <p className="text-gray-700 leading-relaxed mb-4"><strong>1. ירוק מרווה</strong> — הצבע של 2026. קיר אחד בירוק עמוק + שאר בלבן. <strong>2. חום חמים (Warm Browns)</strong> — שוקולד, קרמל, טרקוטה על ספות וכריות. <strong>3. שחור מט</strong> — אלמנטים שחורים (מנורה, מסגרות, רגלי שולחן) יוצרים קונטרסט מודרני. <strong>4. לבן שבור (Off-White)</strong> — לא לבן חד אלא שמנת חמה — יותר מזמין. <strong>5. כחול עמוק</strong> — ספה כחולה = סטייטמנט מיידי.</p>
          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">ריהוט</h2>
          <p className="text-gray-700 leading-relaxed mb-4"><strong>6. ספה מעוגלת</strong> — הטרנד הגדול. פינות עגולות במקום חדות. <strong>7. שולחן סלון אבן</strong> — טרוורטין, שיש, או בטון — חומר טבעי כמרכז הסלון. <strong>8. כורסא מעצבים</strong> — פריט אחד יוקרתי שמעלה את כל החדר. <strong>9. מדפים צפים</strong> — במקום ספריות כבדות, מדפים נקיים על הקיר. <strong>10. שטיח גדול</strong> — שטיח שמגדיר את אזור הישיבה (לפחות 200x300).</p>
          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">תאורה ואביזרים</h2>
          <p className="text-gray-700 leading-relaxed mb-4"><strong>11. תאורה שכבתית</strong> — תקרה + קיר + רצפה + אמביינט. לפחות 3 מקורות אור. <strong>12. מנורת קשת (Arc Lamp)</strong> — מעל אזור הישיבה, יוצרת פינת קריאה. <strong>13. קיר טקסטורה</strong> — לוחות עץ, טיח ונציאני, או טפט 3D על קיר אחד. <strong>14. צמחים גדולים</strong> — מונסטרה, פיקוס, סטרליציה — 1-2 צמחים גדולים &gt; 10 קטנים. <strong>15. אמנות</strong> — הדפס גדול אחד או גלריית קיר (3-5 מסגרות) — לא יותר.</p>
          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">כמה עולה?</h2>
          <div className="bg-gray-50 rounded-xl p-6 mb-6 space-y-3">
            <div className="flex justify-between"><span className="text-gray-700">רענון (צבע + אביזרים)</span><span className="font-bold">₪5,000-15,000</span></div>
            <div className="flex justify-between"><span className="text-gray-700">שדרוג ריהוט</span><span className="font-bold">₪15,000-40,000</span></div>
            <div className="flex justify-between"><span className="text-gray-700">עיצוב מלא (כולל ריהוט)</span><span className="font-bold">₪40,000-80,000+</span></div>
            <div className="flex justify-between"><span className="text-gray-700">הדמיית AI לפני שמתחילים</span><span className="font-bold text-amber-600">₪10-25</span></div>
          </div>
          <p className="text-gray-700 leading-relaxed mb-4">רוצים לראות איך הסלון שלכם ייראה? <Link href="/visualize" className="text-amber-600 font-medium">העלו תמונה ל-ShiputzAI</Link> ונסו כמה סגנונות — מודרני, סקנדינבי, תעשייתי — תוך 30 שניות.</p>
        </article>
        <section className="mt-12"><h2 className="text-2xl font-bold text-gray-900 mb-4">שאלות נפוצות</h2><div className="space-y-3">
          <FaqItem q="מה הטרנדים בסלון מודרני 2026?" a="קווים נקיים, צבעים אדמתיים, ריהוט מעוגל, תאורה שכבתית, וקירות טקסטורה." />
          <FaqItem q="כמה עולה לעצב סלון מודרני?" a="מ-₪10,000 לרענון ועד ₪80,000+ לעיצוב מלא כולל ריהוט חדש." />
        </div></section>
        <div className="mt-12 text-center"><Link href="/visualize" className="bg-amber-500 text-white px-8 py-3 rounded-xl font-medium text-lg hover:bg-amber-600 inline-block">נסו הדמיה — חינם</Link></div>
        <div className="mt-8 flex flex-wrap gap-3 text-sm"><Link href="/tips/scandinavian-design-israel" className="text-amber-600">סקנדינבי →</Link><Link href="/tips/minimalist-design-guide" className="text-amber-600">מינימליסטי →</Link><Link href="/tips/industrial-design-style" className="text-amber-600">תעשייתי →</Link></div>
      </main>
      <Footer />
    </div>
  );
}
