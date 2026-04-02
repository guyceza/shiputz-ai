"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
function FaqItem({ q, a }: { q: string; a: string }) { return (<details className="border border-gray-200 rounded-xl p-4 group"><summary className="font-semibold text-gray-900 cursor-pointer group-open:mb-2">{q}</summary><p className="text-gray-600 leading-relaxed">{a}</p></details>); }
export default function BalconyDesignIdeas() {
  useEffect(() => { document.title = "עיצוב מרפסת — 10 רעיונות להפוך את המרפסת לחדר נוסף | ShiputzAI"; }, []);
  const s1 = {"@context":"https://schema.org","@type":"Article","headline":"עיצוב מרפסת — 10 רעיונות להפוך את המרפסת לחדר נוסף","author":{"@type":"Organization","name":"ShiputzAI"},"datePublished":"2026-04-02"};
  const s2 = {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"האם מותר לסגור מרפסת?","acceptedAnswer":{"@type":"Answer","text":"סגירת מרפסת דורשת היתר בנייה. בלעדיו — זו בנייה לא חוקית שעלולה לגרום לקנסות ולדרישת הריסה. בדקו מול הוועדה המקומית."}},{"@type":"Question","name":"כמה עולה לעצב מרפסת?","acceptedAnswer":{"@type":"Answer","text":"עיצוב מרפסת פתוחה: ₪3,000-15,000. סגירת מרפסת מלאה: ₪25,000-80,000+."}}]};
  return (
    <div dir="rtl" className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s1) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s2) }} />
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50"><div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between"><Link href="/" className="text-xl font-bold text-gray-900">ShiputzAI</Link><div className="flex items-center gap-4"><Link href="/tips" className="text-gray-600 hover:text-gray-900 text-sm">טיפים</Link><Link href="/signup" className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600">התחילו בחינם</Link></div></div></nav>
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-4 text-sm text-gray-500"><Link href="/tips" className="hover:text-amber-600">טיפים</Link> / עיצוב מרפסת</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-6">עיצוב מרפסת — 10 רעיונות להפוך את המרפסת לחדר נוסף</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-10"><p className="text-lg text-gray-800"><strong>המרפסת הישראלית הממוצעת (6-12 מ&quot;ר) היא פוטנציאל לא ממומש.</strong> עם עיצוב נכון היא הופכת לפינת ישיבה, משרד ביתי, או חדר ילדים. ShiputzAI מאפשר להדמות את המרפסת המעוצבת לפני שמשקיעים.</p></div>
        <article className="prose prose-lg max-w-none">
          {[
            { n: "1", title: "פינת ישיבה חיצונית", text: "ספסל עץ + כריות חיצוניות + שולחן קפה קטן. שטיח חיצוני. תאורה: שרשרת נורות (string lights). תקציב: ₪3,000-8,000." },
            { n: "2", title: "משרד ביתי", text: "שולחן צר לאורך המעקה + כיסא נוח + הצללה. מושלם לימי עבודה מהבית. תקציב: ₪2,000-5,000." },
            { n: "3", title: "גינה ורטיקלית", text: "קיר ירוק עם עציצים תלויים + צמחייה מטפסת. מספק פרטיות + ירוק. תקציב: ₪1,500-5,000." },
            { n: "4", title: "פינת אוכל", text: "שולחן מתקפל/נפתח + 2-4 כיסאות. ארוחת ערב בחוץ. תקציב: ₪2,000-6,000." },
            { n: "5", title: "חדר משחקים לילדים", text: "דשא סינתטי + ארגז חול קטן + אחסון צעצועים. גדר ביטחון חובה! תקציב: ₪3,000-8,000." },
            { n: "6", title: "סגירת מרפסת — חדר שמש", text: "ויטרינות אלומיניום/זכוכית. הופך 8 מ\"ר ל-8 מ\"ר מגורים. דורש היתר בנייה! תקציב: ₪25,000-60,000." },
            { n: "7", title: "פינת ספא מיני", text: "ג'קוזי מתנפח/קטן + נרות + עציצי במבוק. בדקו עומס מרפסת! תקציב: ₪5,000-15,000." },
            { n: "8", title: "פינת ברביקיו", text: "גריל גז/פחם קומפקטי + משטח הכנה + כיסאות בר. וודאו שמותר (תקנון בניין). תקציב: ₪3,000-10,000." },
            { n: "9", title: "חדר כביסה", text: "ארון שירות עם מכונת כביסה + מייבש + מתלה. חוסך מקום בדירה. תקציב: ₪4,000-12,000." },
            { n: "10", title: "פינת מדיטציה/יוגה", text: "ריצוף עץ/דק + מזרן יוגה + צמחים + רמקול. הצללה חובה. תקציב: ₪2,000-6,000." },
          ].map((idea) => (
            <div key={idea.n} className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">{idea.n}. {idea.title}</h2>
              <p className="text-gray-700 leading-relaxed">{idea.text}</p>
            </div>
          ))}
          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">⚖️ חוקי — מה מותר ומה לא</h2>
          <div className="bg-yellow-50 rounded-xl p-6 space-y-2">
            <p className="text-gray-700">✅ ריהוט, עציצים, הצללה ניידת — <strong>לא צריך היתר</strong></p>
            <p className="text-gray-700">✅ פרגולה פתוחה (פחות מ-50% הצללה) — <strong>לרוב לא צריך</strong></p>
            <p className="text-gray-700">⚠️ סגירת מרפסת עם ויטרינות — <strong>חייב היתר בנייה</strong></p>
            <p className="text-gray-700">⚠️ שינוי מעקה — <strong>צריך אישור ועד בית</strong></p>
            <p className="text-gray-700">❌ בנייה על מרפסת — <strong>אסור ללא היתר</strong></p>
          </div>
          <p className="text-gray-700 leading-relaxed mt-6 mb-4">רוצים לראות איך המרפסת תיראה? <Link href="/visualize" className="text-amber-600 font-medium">העלו תמונה ל-ShiputzAI</Link> ונסו כמה רעיונות.</p>
        </article>
        <section className="mt-12"><h2 className="text-2xl font-bold text-gray-900 mb-4">שאלות נפוצות</h2><div className="space-y-3">
          <FaqItem q="מותר לסגור מרפסת?" a="דורש היתר בנייה. בלעדיו — בנייה לא חוקית." />
          <FaqItem q="כמה עולה לעצב מרפסת?" a="פתוחה: ₪3,000-15,000. סגירה מלאה: ₪25,000-80,000+." />
        </div></section>
        <div className="mt-12 text-center"><Link href="/visualize" className="bg-amber-500 text-white px-8 py-3 rounded-xl font-medium text-lg hover:bg-amber-600 inline-block">הדמיית מרפסת — חינם</Link></div>
        <div className="mt-8 flex flex-wrap gap-3 text-sm"><Link href="/tips/apartment-renovation-guide" className="text-amber-600">מדריך שיפוץ →</Link><Link href="/tips/modern-living-room-ideas" className="text-amber-600">סלון מודרני →</Link></div>
      </main>
      <Footer />
    </div>
  );
}
