"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
function FaqItem({ q, a }: { q: string; a: string }) { return (<details className="border border-gray-200 rounded-xl p-4 group"><summary className="font-semibold text-gray-900 cursor-pointer group-open:mb-2">{q}</summary><p className="text-gray-600 leading-relaxed">{a}</p></details>); }
export default function IndustrialDesignStyle() {
  useEffect(() => { document.title = "עיצוב תעשייתי — לופט, בטון חשוף וברזל בבית הישראלי | ShiputzAI"; }, []);
  const s1 = {"@context":"https://schema.org","@type":"Article","headline":"עיצוב תעשייתי — לופט, בטון חשוף וברזל בבית הישראלי","author":{"@type":"Organization","name":"ShiputzAI"},"datePublished":"2026-04-02"};
  const s2 = {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"מה זה עיצוב תעשייתי?","acceptedAnswer":{"@type":"Answer","text":"סגנון שמבוסס על אסתטיקה של מפעלים ומחסנים: בטון חשוף, מתכת, צנרת גלויה, בריקים ועץ ממוחזר. תחושת לופט ניו-יורקי."}},{"@type":"Question","name":"כמה עולה עיצוב תעשייתי?","acceptedAnswer":{"@type":"Answer","text":"בטון חשוף: ₪80-150 למ\"ר. קיר בריקים: ₪200-500 למ\"ר. מנורות תעשייתיות: ₪300-2,000 ליח'. סלון מלא: ₪15,000-40,000."}}]};
  return (
    <div dir="rtl" className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s1) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s2) }} />
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50"><div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between"><Link href="/" className="text-xl font-bold text-gray-900">ShiputzAI</Link><div className="flex items-center gap-4"><Link href="/tips" className="text-gray-600 hover:text-gray-900 text-sm">טיפים</Link><Link href="/signup" className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600">התחילו בחינם</Link></div></div></nav>
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-4 text-sm text-gray-500"><Link href="/tips" className="hover:text-amber-600">טיפים</Link> / עיצוב תעשייתי</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-6">עיצוב תעשייתי — לופט, בטון חשוף וברזל בבית הישראלי</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-10"><p className="text-lg text-gray-800"><strong>עיצוב תעשייתי הפך מטרנד ללקוחות נישה למיינסטרים ישראלי.</strong> בטון חשוף, צנרת גלויה, מנורות מתכת ועץ ממוחזר — הסגנון שאומר &quot;אני לא מתאמץ&quot; (אבל דורש תכנון מדויק). ShiputzAI מאפשר להדמות לופט תעשייתי על הדירה שלכם.</p></div>
        <article className="prose prose-lg max-w-none">
          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">5 חומרים מפתח</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {[
              { icon: "🧱", name: "בריקים חשופים", desc: "קיר בריקים אחד = סטייטמנט. אפשר אמיתי (חשיפת קיר קיים) או חיפוי בריקים. ₪200-500 למ\"ר." },
              { icon: "⬛", name: "בטון חשוף", desc: "רצפה או קיר בטון מוחלק (מיקרוטופינג). מראה גולמי ומרשים. ₪80-150 למ\"ר." },
              { icon: "⚙️", name: "מתכת שחורה", desc: "מנורות, מסגרות, מדפים, רגלי שולחן. ברזל שחור הוא ה-DNA של הסגנון." },
              { icon: "🪵", name: "עץ ממוחזר", desc: "שולחן מעץ ישן, מדפים מקורות, אלמנטים עם היסטוריה. מחמם את הבטון." },
              { icon: "💡", name: "תאורה גלויה", desc: "נורות אדיסון, צנרת מתכת, ספוטים על מסילה. התאורה היא אלמנט עיצובי, לא מוסתרת." },
            ].map((m, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4"><div className="flex items-center gap-2 mb-2"><span className="text-xl">{m.icon}</span><h3 className="font-bold text-gray-900">{m.name}</h3></div><p className="text-gray-600 text-sm">{m.desc}</p></div>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">סלון תעשייתי</h2>
          <p className="text-gray-700 leading-relaxed mb-4">ספת עור (חום/קוניאק) + שולחן עץ ממוחזר עם רגלי מתכת + מדפי צנרת על הקיר + שטיח ג&apos;וט + מנורת רצפה תעשייתית. קיר אחד בריקים או בטון. צבעים: אפור, שחור, חום, ירוק צבאי כאקסנט.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">מטבח תעשייתי</h2>
          <p className="text-gray-700 leading-relaxed mb-4">ארונות בשחור/אפור כהה + משטח בטון או נירוסטה + מדפים פתוחים ממתכת + ברזים בסגנון תעשייתי. ספלשבק: מתכת או אריחי מטרו שחורים. אי מטבח עם בסיס מתכת.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">הטעות הנפוצה: &quot;תעשייתי = קר ומרוחק&quot;</h2>
          <p className="text-gray-700 leading-relaxed mb-4">תעשייתי טוב הוא חם. האיזון: <strong>60% גולמי</strong> (בטון, מתכת) + <strong>40% חם</strong> (עץ, עור, שטיחים, צמחים). בלי העץ והטקסטיל — זה מחסן, לא בית.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">מחירים</h2>
          <div className="bg-gray-50 rounded-xl p-6 space-y-3">
            <div className="flex justify-between"><span className="text-gray-700">קיר בריקים (חיפוי)</span><span className="font-bold">₪2,000-5,000</span></div>
            <div className="flex justify-between"><span className="text-gray-700">רצפת בטון מוחלק</span><span className="font-bold">₪5,000-15,000</span></div>
            <div className="flex justify-between"><span className="text-gray-700">ריהוט תעשייתי (סלון)</span><span className="font-bold">₪10,000-30,000</span></div>
            <div className="flex justify-between"><span className="text-gray-700">תאורה תעשייתית</span><span className="font-bold">₪2,000-8,000</span></div>
            <div className="flex justify-between"><span className="text-gray-700">הדמיית AI</span><span className="font-bold text-amber-600">₪10-25</span></div>
          </div>

          <p className="text-gray-700 leading-relaxed mt-6 mb-4"><Link href="/visualize" className="text-amber-600 font-medium">העלו תמונה ל-ShiputzAI</Link> וכתבו &quot;סלון תעשייתי עם קיר בריקים וספת עור&quot;. 30 שניות להדמיה.</p>
        </article>
        <section className="mt-12"><h2 className="text-2xl font-bold text-gray-900 mb-4">שאלות נפוצות</h2><div className="space-y-3">
          <FaqItem q="מה זה עיצוב תעשייתי?" a="בטון חשוף, מתכת, צנרת גלויה, בריקים ועץ ממוחזר. תחושת לופט." />
          <FaqItem q="כמה עולה?" a='קיר בריקים: ₪2,000-5,000. רצפת בטון: ₪5,000-15,000. סלון מלא: ₪15,000-40,000.' />
        </div></section>
        <div className="mt-12 text-center"><Link href="/visualize" className="bg-amber-500 text-white px-8 py-3 rounded-xl font-medium text-lg hover:bg-amber-600 inline-block">הדמיה תעשייתית — חינם</Link></div>
        <div className="mt-8 flex flex-wrap gap-3 text-sm"><Link href="/tips/modern-living-room-ideas" className="text-amber-600">סלון מודרני →</Link><Link href="/tips/minimalist-design-guide" className="text-amber-600">מינימליסטי →</Link><Link href="/tips/bedroom-design-ai" className="text-amber-600">חדר שינה →</Link></div>
      </main>
      <Footer />
    </div>
  );
}
