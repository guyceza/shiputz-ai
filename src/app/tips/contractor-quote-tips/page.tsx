"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
function FaqItem({ q, a }: { q: string; a: string }) { return (<details className="border border-gray-200 rounded-xl p-4 group"><summary className="font-semibold text-gray-900 cursor-pointer group-open:mb-2">{q}</summary><p className="text-gray-600 leading-relaxed">{a}</p></details>); }
export default function ContractorQuoteTips() {
  useEffect(() => { document.title = "7 טיפים לקריאת הצעת מחיר מקבלן — איך לא להיות פראייר | ShiputzAI"; }, []);
  const s1 = {"@context":"https://schema.org","@type":"Article","headline":"7 טיפים לקריאת הצעת מחיר מקבלן","author":{"@type":"Organization","name":"ShiputzAI"},"datePublished":"2026-04-02"};
  const s2 = {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"איך מזהים הצעת מחיר מנופחת?","acceptedAnswer":{"@type":"Answer","text":"סימנים: מחירים עגולים מדי, סעיפים כלליים בלי פירוט, היעדר כמויות, ומחיר כולל ללא שבירה לסעיפים."}},{"@type":"Question","name":"כמה הצעות מחיר צריך לקחת?","acceptedAnswer":{"@type":"Answer","text":"לפחות 3. השוו סעיף-סעיף, לא רק סה\"כ. ההצעה הזולה ביותר לא תמיד הטובה ביותר."}}]};
  return (
    <div dir="rtl" className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s1) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s2) }} />
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50"><div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between"><Link href="/" className="text-xl font-bold text-gray-900">ShiputzAI</Link><div className="flex items-center gap-4"><Link href="/tips" className="text-gray-600 hover:text-gray-900 text-sm">טיפים</Link><Link href="/signup" className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600">התחילו בחינם</Link></div></div></nav>
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-4 text-sm text-gray-500"><Link href="/tips" className="hover:text-amber-600">טיפים</Link> / הצעות מחיר</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-6">7 טיפים לקריאת הצעת מחיר מקבלן — איך לא להיות פראייר</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-10"><p className="text-lg text-gray-800"><strong>ההבדל בין שיפוץ מוצלח לסיוט כלכלי מתחיל בהצעת המחיר.</strong> קבלנים יודעים שרוב בעלי הדירות לא מבינים מה כתוב שם. 7 טיפים שיהפכו אתכם ללקוחות שאי אפשר לעבוד עליהם.</p></div>
        <article className="prose prose-lg max-w-none">
          {[
            { n: "1", title: "דרשו פירוט לפי סעיפים — לא מחיר כולל", text: "הצעה שכותבת \"שיפוץ אמבטיה — ₪35,000\" היא חסרת ערך. דרשו שבירה: הריסה ₪X, אינסטלציה ₪Y, ריצוף ₪Z. רק ככה אפשר להשוות." },
            { n: "2", title: "בדקו כמויות — לא רק מחירים", text: "\"ריצוף — ₪8,000\" זה לא מספיק. כמה מ\"ר? איזה סוג אריח? מה המחיר למ\"ר? בלי כמויות, הקבלן יכול לשנות חומרים בלי שתדעו." },
            { n: "3", title: "חפשו סעיפים חסרים", text: "הסעיפים ש\"נשכחים\" הכי הרבה: איטום, פינוי פסולת, חשמל (העברת נקודות), שליכט/שפכטל, וניקיון. אם חסרים — הם יתווספו כ\"עבודות נוספות\" במחיר כפול." },
            { n: "4", title: "שימו לב ל\"בלת\"מ\" (בלתי צפוי)", text: "קבלן טוב יציין מראש: \"הריסת ריצוף עלולה לחשוף בעיות איטום — עלות נוספת אפשרית: ₪2,000-5,000\". קבלן בעייתי ישאיר את זה להפתעה." },
            { n: "5", title: "השוו 3 הצעות — סעיף מול סעיף", text: "לא סה\"כ מול סה\"כ. שימו את 3 ההצעות בטבלה ובדקו כל סעיף. לפעמים הזול ביותר פשוט חסר חצי מהעבודות." },
            { n: "6", title: "וודאו תנאי תשלום", text: "לעולם לא 100% מראש. מקובל: 30% בהתחלה, 30% באמצע, 30% בסוף, 10% אחרי תקופת אחריות. אם קבלן דורש מעל 50% מראש — זה דגל אדום." },
            { n: "7", title: "תנו ל-AI לבדוק את ההצעה", text: "העלו תמונה של הצעת המחיר לShiputzAI — ה-AI ינתח כל סעיף, ישווה למחירון מקובל, ויסמן מחירים חריגים ודגלים אדומים. לוקח 30 שניות." },
          ].map((tip) => (
            <div key={tip.n} className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">{tip.n}. {tip.title}</h2>
              <p className="text-gray-700 leading-relaxed">{tip.text}</p>
            </div>
          ))}

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">דגלים אדומים בהצעת מחיר</h2>
          <div className="bg-red-50 rounded-xl p-6 space-y-2">
            <p className="text-red-800">🚩 מחיר כולל בלי שבירה לסעיפים</p>
            <p className="text-red-800">🚩 ללא כמויות (מ&quot;ר, מ&quot;א, יח&apos;)</p>
            <p className="text-red-800">🚩 דרישת תשלום מעל 50% מראש</p>
            <p className="text-red-800">🚩 ללא לוח זמנים</p>
            <p className="text-red-800">🚩 ללא אחריות בכתב</p>
            <p className="text-red-800">🚩 מחירים עגולים מדי (₪10,000, ₪20,000 — לא מפורט)</p>
          </div>
        </article>
        <section className="mt-12"><h2 className="text-2xl font-bold text-gray-900 mb-4">שאלות נפוצות</h2><div className="space-y-3">
          <FaqItem q="איך מזהים הצעה מנופחת?" a="מחירים עגולים, ללא פירוט, ללא כמויות, מחיר כולל ללא שבירה." />
          <FaqItem q='כמה הצעות צריך?' a='לפחות 3. השוו סעיף-סעיף, לא רק סה"כ.' />
        </div></section>
        <div className="mt-12 text-center"><Link href="/quote-analysis" className="bg-amber-500 text-white px-8 py-3 rounded-xl font-medium text-lg hover:bg-amber-600 inline-block">ניתוח הצעת מחיר עם AI — חינם</Link></div>
        <div className="mt-8 flex flex-wrap gap-3 text-sm"><Link href="/tips/apartment-renovation-guide" className="text-amber-600">מדריך שיפוץ →</Link><Link href="/tips/bathroom-renovation-cost" className="text-amber-600">עלות שיפוץ אמבטיה →</Link><Link href="/tips/bill-of-quantities-ai" className="text-amber-600">כתב כמויות AI →</Link></div>
      </main>
      <Footer />
    </div>
  );
}
