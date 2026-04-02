"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
function FaqItem({ q, a }: { q: string; a: string }) { return (<details className="border border-gray-200 rounded-xl p-4 group"><summary className="font-semibold text-gray-900 cursor-pointer group-open:mb-2">{q}</summary><p className="text-gray-600 leading-relaxed">{a}</p></details>); }
export default function ScandinavianDesignIsrael() {
  useEffect(() => { document.title = "עיצוב סקנדינבי בישראל — המדריך המלא לבית נורדי | ShiputzAI"; }, []);
  const s1 = {"@context":"https://schema.org","@type":"Article","headline":"עיצוב סקנדינבי בישראל — המדריך המלא","author":{"@type":"Organization","name":"ShiputzAI"},"datePublished":"2026-04-02"};
  const s2 = {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"מה זה עיצוב סקנדינבי?","acceptedAnswer":{"@type":"Answer","text":"סגנון המתאפיין בפשטות, צבעים בהירים, עץ טבעי ואור רב. מקורו בשוודיה, דנמרק ונורבגיה."}},{"@type":"Question","name":"האם מתאים לישראל?","acceptedAnswer":{"@type":"Answer","text":"כן, עם התאמות: פשתן במקום צמר, גוונים חמים, וילונות קלים."}}]};
  return (
    <div dir="rtl" className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s1) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s2) }} />
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50"><div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between"><Link href="/" className="text-xl font-bold text-gray-900">ShiputzAI</Link><div className="flex items-center gap-4"><Link href="/tips" className="text-gray-600 hover:text-gray-900 text-sm">טיפים</Link><Link href="/signup" className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600">התחילו בחינם</Link></div></div></nav>
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-4 text-sm text-gray-500"><Link href="/tips" className="hover:text-amber-600">טיפים</Link> / עיצוב סקנדינבי</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-6">עיצוב סקנדינבי בישראל — המדריך המלא לבית נורדי</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-10"><p className="text-lg text-gray-800"><strong>עיצוב סקנדינבי הוא הסגנון הפופולרי ביותר בישראל ב-2026.</strong> פשטות, פונקציונליות וחומרים טבעיים — ומתאים מעולה לדירות ישראליות. ShiputzAI מאפשר להדמות כל חדר בסגנון נורדי תוך 30 שניות.</p></div>
        <article className="prose prose-lg max-w-none">
          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">5 עקרונות של עיצוב סקנדינבי</h2>
          <p className="text-gray-700 leading-relaxed mb-4"><strong>1. צבעים בהירים</strong> — לבן, שמנת, אפור בהיר כבסיס. <strong>2. עץ טבעי</strong> — אלון, אורן, ליבנה בגוונים בהירים. <strong>3. פשטות</strong> — קווים נקיים, ללא עיטורים. <strong>4. אור טבעי</strong> — חלונות גדולים, וילונות קלילים. <strong>5. Hygge</strong> — חמימות וביתיות (שטיחים, כריות, נרות).</p>
          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">התאמות לאקלים הישראלי</h2>
          <p className="text-gray-700 leading-relaxed mb-4">פשתן במקום צמר. גוונים חמים (שמנת &gt; לבן קר). וילונות קלים שמסננים אור. צמחייה טרופית במקום נורדית. ריצוף בהיר — לא פרקט כהה שסופג חום.</p>
          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">סלון סקנדינבי — רשימת קניות</h2>
          <div className="bg-gray-50 rounded-xl p-6 mb-6 space-y-2">
            <p className="text-gray-700">🛋️ ספה בהירה עם רגלי עץ — ₪3,000-12,000</p>
            <p className="text-gray-700">🪵 שולחן אלון בהיר — ₪1,500-5,000</p>
            <p className="text-gray-700">🌿 צמחים בעציצי קרמיקה — ₪200-500</p>
            <p className="text-gray-700">💡 מנורת קשת/פנדנט — ₪500-3,000</p>
            <p className="text-gray-700">🧶 שטיח כותנה טבעי — ₪800-3,000</p>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">מטבח סקנדינבי</h2>
          <p className="text-gray-700 leading-relaxed mb-4">ארונות לבנים/עץ בהיר, ידיות מינימליות, משטח עץ בוצ׳ר או קוורץ. ספלשבק: אריחי מטרו לבנים. אביזרים: קומקום רטרו, צנצנות שקופות, עשבי תיבול ליד החלון.</p>
          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">איפה קונים?</h2>
          <p className="text-gray-700 leading-relaxed mb-4">IKEA (הבסיס), JYSK (דני), H&amp;M Home, Westwing, Castiel, IDdesign. טיפ: שילוב מותגים נותן מראה אותנטי יותר.</p>
          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">הדמיה סקנדינבית עם AI</h2>
          <p className="text-gray-700 leading-relaxed mb-4"><Link href="/visualize" className="text-amber-600 font-medium">העלו תמונה ל-ShiputzAI</Link> וכתבו &quot;סלון סקנדינבי עם ספה אפורה ועץ אלון&quot;. תוך 30 שניות — הדמיה פוטוריאליסטית.</p>
        </article>
        <section className="mt-12"><h2 className="text-2xl font-bold text-gray-900 mb-4">שאלות נפוצות</h2><div className="space-y-3">
          <FaqItem q="מה זה עיצוב סקנדינבי?" a="סגנון המתאפיין בפשטות, צבעים בהירים, עץ טבעי ואור רב." />
          <FaqItem q="מתאים לישראל?" a="כן, עם פשתן במקום צמר, גוונים חמים, וילונות קלים." />
        </div></section>
        <div className="mt-12 text-center"><Link href="/visualize" className="bg-amber-500 text-white px-8 py-3 rounded-xl font-medium text-lg hover:bg-amber-600 inline-block">נסו הדמיה סקנדינבית — חינם</Link></div>
        <div className="mt-8 flex flex-wrap gap-3 text-sm"><Link href="/tips/minimalist-design-guide" className="text-amber-600">מינימליסטי →</Link><Link href="/tips/ai-living-room-design" className="text-amber-600">סלון AI →</Link></div>
      </main>
      <Footer />
    </div>
  );
}
