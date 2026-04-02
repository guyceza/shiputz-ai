"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
function FaqItem({ q, a }: { q: string; a: string }) { return (<details className="border border-gray-200 rounded-xl p-4 group"><summary className="font-semibold text-gray-900 cursor-pointer group-open:mb-2">{q}</summary><p className="text-gray-600 leading-relaxed">{a}</p></details>); }
export default function ApartmentRenovationGuide() {
  useEffect(() => { document.title = "מדריך שיפוץ דירה — 10 צעדים מההתחלה ועד המפתח | ShiputzAI"; }, []);
  const s1 = {"@context":"https://schema.org","@type":"Article","headline":"מדריך שיפוץ דירה — 10 צעדים מההתחלה ועד המפתח","author":{"@type":"Organization","name":"ShiputzAI"},"datePublished":"2026-04-02"};
  const s2 = {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"כמה עולה שיפוץ דירה בישראל?","acceptedAnswer":{"@type":"Answer","text":"שיפוץ דירת 4 חדרים: ₪80,000-250,000. קוסמטי: ₪30,000-60,000. קומפלט כולל מטבח ואמבטיה: ₪150,000-250,000+."}},{"@type":"Question","name":"כמה זמן לוקח שיפוץ דירה?","acceptedAnswer":{"@type":"Answer","text":"שיפוץ קוסמטי: 2-4 שבועות. שיפוץ בינוני: 1-2 חודשים. שיפוץ קומפלט: 2-4 חודשים."}}]};
  return (
    <div dir="rtl" className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s1) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s2) }} />
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50"><div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between"><Link href="/" className="text-xl font-bold text-gray-900">ShiputzAI</Link><div className="flex items-center gap-4"><Link href="/tips" className="text-gray-600 hover:text-gray-900 text-sm">טיפים</Link><Link href="/signup" className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600">התחילו בחינם</Link></div></div></nav>
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-4 text-sm text-gray-500"><Link href="/tips" className="hover:text-amber-600">טיפים</Link> / מדריך שיפוץ דירה</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-6">מדריך שיפוץ דירה — 10 צעדים מההתחלה ועד המפתח</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-10"><p className="text-lg text-gray-800"><strong>שיפוץ דירה בישראל עולה בין ₪80,000 ל-₪250,000 ונמשך 1-4 חודשים.</strong> ההבדל בין שיפוץ מוצלח לכאב ראש הוא תכנון מסודר. הנה 10 צעדים שחוסכים כסף, זמן ועצבים.</p></div>
        <article className="prose prose-lg max-w-none">
          {[
            { step: "1", title: "הגדירו תקציב ברור (+15% לבלת&quot;מ)", text: "קבעו תקציב מקסימלי והוסיפו 15% חירום. שיפוץ תמיד עולה יותר מהמתוכנן — הפתעות בקירות, אינסטלציה ישנה, בעיות שמתגלות רק בהריסה." },
            { step: "2", title: "הדמיה לפני הכל", text: "לפני שמדברים עם קבלן, העלו תמונות של כל חדר ל-ShiputzAI וצרו הדמיות. ככה תגיעו לקבלן עם חזון ברור — וחוסכים שעות דיונים." },
            { step: "3", title: "קחו 3 הצעות מחיר לפחות", text: "לעולם אל תסגרו עם הקבלן הראשון. קחו 3 הצעות, השוו סעיף-סעיף. השתמשו בכלי ניתוח הצעות מחיר של ShiputzAI כדי לזהות מחירים חריגים." },
            { step: "4", title: "חוזה + לוח זמנים בכתב", text: "חוזה חייב לכלול: סכום כולל, לוח זמנים עם אבני דרך, תנאי תשלום (לעולם לא 100% מראש!), פיצוי על איחור, ואחריות." },
            { step: "5", title: "הריסה וגילוי", text: "השלב שבו מתגלות הפתעות: צנרת חלודה, חשמל ישן, רטיבות. לכן חשוב כרית הביטחון של 15%." },
            { step: "6", title: "אינסטלציה + חשמל", text: "כל מה שנכנס לקירות — צנרת, חשמל, מיזוג — חייב להיעשות עכשיו. אחרי שסוגרים קירות, שינויים עולים פי 5." },
            { step: "7", title: "טיח, שפכטל, צבע", text: "בסדר הזה. טיח מיישר קירות, שפכטל מחליק, צבע מסיים. לפחות 2 שכבות צבע." },
            { step: "8", title: "ריצוף + חיפויים", text: "הסעיף היקר. קנו 10% עודף (שברים, חיתוכים, עתיד). ודאו שכל האריחים מאותו LOT — צבעים משתנים בין משלוחים." },
            { step: "9", title: "מטבח + אמבטיה + ארונות", text: "הזמינו מראש (4-8 שבועות אספקה למטבח). מדידה סופית רק אחרי שהקירות מוכנים." },
            { step: "10", title: "גימורים + ניקיון + כניסה", text: "ידיות, מנורות, אביזרי אמבטיה, עיגולי חשמל. ניקיון בניין מקצועי. בדיקה סופית לפני תשלום אחרון." },
          ].map((s) => (
            <div key={s.step} className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">צעד {s.step}: {s.title}</h2>
              <p className="text-gray-700 leading-relaxed">{s.text}</p>
            </div>
          ))}
          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">טבלת עלויות לפי סוג שיפוץ</h2>
          <div className="bg-gray-50 rounded-xl p-6 space-y-3">
            <div className="flex justify-between border-b pb-2"><span className="text-gray-700">קוסמטי (צבע, ריצוף, תאורה)</span><span className="font-bold">₪30,000-60,000</span></div>
            <div className="flex justify-between border-b pb-2"><span className="text-gray-700">בינוני (+ מטבח או אמבטיה)</span><span className="font-bold">₪80,000-150,000</span></div>
            <div className="flex justify-between border-b pb-2"><span className="text-gray-700">קומפלט (הכל מאפס)</span><span className="font-bold">₪150,000-250,000+</span></div>
            <div className="flex justify-between"><span className="text-gray-700">הדמיית AI (לתכנון מראש)</span><span className="font-bold text-amber-600">₪10-25</span></div>
          </div>
        </article>
        <section className="mt-12"><h2 className="text-2xl font-bold text-gray-900 mb-4">שאלות נפוצות</h2><div className="space-y-3">
          <FaqItem q="כמה עולה שיפוץ דירה בישראל?" a="דירת 4 חדרים: ₪80,000-250,000. קוסמטי: ₪30,000-60,000. קומפלט: ₪150,000-250,000+." />
          <FaqItem q="כמה זמן לוקח?" a="קוסמטי: 2-4 שבועות. בינוני: 1-2 חודשים. קומפלט: 2-4 חודשים." />
        </div></section>
        <div className="mt-12 text-center"><Link href="/visualize" className="bg-amber-500 text-white px-8 py-3 rounded-xl font-medium text-lg hover:bg-amber-600 inline-block">הדמיית שיפוץ — חינם</Link></div>
        <div className="mt-8 flex flex-wrap gap-3 text-sm"><Link href="/tips/renovation-cost-calculator" className="text-amber-600">מחשבון עלויות →</Link><Link href="/tips/contractor-quote-tips" className="text-amber-600">טיפים להצעות מחיר →</Link><Link href="/tips/bathroom-renovation-cost" className="text-amber-600">עלות שיפוץ אמבטיה →</Link></div>
      </main>
      <Footer />
    </div>
  );
}
