"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
function FaqItem({ q, a }: { q: string; a: string }) { return (<details className="border border-gray-200 rounded-xl p-4 group"><summary className="font-semibold text-gray-900 cursor-pointer group-open:mb-2">{q}</summary><p className="text-gray-600 leading-relaxed">{a}</p></details>); }
export default function MinimalistDesignGuide() {
  useEffect(() => { document.title = "עיצוב מינימליסטי — פחות זה יותר, המדריך המלא | ShiputzAI"; }, []);
  const s1 = {"@context":"https://schema.org","@type":"Article","headline":"עיצוב מינימליסטי — פחות זה יותר, המדריך המלא","author":{"@type":"Organization","name":"ShiputzAI"},"datePublished":"2026-04-02"};
  const s2 = {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"מה זה עיצוב מינימליסטי?","acceptedAnswer":{"@type":"Answer","text":"עיצוב שמתמקד בפחות: פחות רהיטים, פחות צבעים, פחות עיטורים. כל פריט חייב להיות פונקציונלי ויפה. התוצאה: מרחב נקי, שקט ואלגנטי."}},{"@type":"Question","name":"איך מתחילים עיצוב מינימליסטי?","acceptedAnswer":{"@type":"Answer","text":"שלב 1: היפטרו מעודפים (declutter). שלב 2: בחרו פלטת צבעים מצומצמת (2-3 גוונים). שלב 3: השאירו רק רהיטים שאתם באמת משתמשים בהם."}}]};
  return (
    <div dir="rtl" className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s1) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s2) }} />
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50"><div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between"><Link href="/" className="text-xl font-bold text-gray-900">ShiputzAI</Link><div className="flex items-center gap-4"><Link href="/tips" className="text-gray-600 hover:text-gray-900 text-sm">טיפים</Link><Link href="/signup" className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600">התחילו בחינם</Link></div></div></nav>
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-4 text-sm text-gray-500"><Link href="/tips" className="hover:text-amber-600">טיפים</Link> / מינימליסטי</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-6">עיצוב מינימליסטי — פחות זה יותר, המדריך המלא</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-10"><p className="text-lg text-gray-800"><strong>עיצוב מינימליסטי אומר לא &quot;ריק&quot; אלא &quot;מדויק&quot;.</strong> כל פריט נבחר בקפידה, כל משטח נקי, וכל צבע מכוון. התוצאה: בית שמרגיש רחב, שקט ויוקרתי — בלי לבזבז על עודפים.</p></div>
        <article className="prose prose-lg max-w-none">
          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">5 עקרונות מינימליזם</h2>
          <p className="text-gray-700 leading-relaxed mb-4"><strong>1. Less is more</strong> — רהיט אחד איכותי עדיף על 3 זולים. <strong>2. Hidden storage</strong> — ארונות סגורים, מגירות flush, אחסון מובנה. <strong>3. פלטה מצומצמת</strong> — 2-3 צבעים מקסימום. <strong>4. קווים נקיים</strong> — ללא עיטורים, פרופילים פשוטים. <strong>5. מרחב שלילי</strong> — הקירות הריקים חשובים כמו המלאים.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">צבעים מינימליסטיים</h2>
          <p className="text-gray-700 leading-relaxed mb-4">הבסיס: <strong>לבן/שמנת</strong> (70% מהמשטחים). אקסנט: <strong>שחור מט</strong> (ידיות, מסגרות, מנורות). חום: <strong>עץ טבעי</strong> (אלון, אגוז) כאלמנט מחמם. וזהו. אין צורך ביותר.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">חדר חדר</h2>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-5"><h3 className="font-bold text-gray-900 mb-2">סלון</h3><p className="text-gray-600">ספה אחת (לא L + כורסא + פוף). שולחן סלון אחד. טלוויזיה תלויה (בלי ארון TV מסורבל). מנורה אחת statement. שטיח אחד.</p></div>
            <div className="bg-gray-50 rounded-xl p-5"><h3 className="font-bold text-gray-900 mb-2">מטבח</h3><p className="text-gray-600">ארונות ללא ידיות (push-to-open). משטח תמיד נקי — מכשירים בארונות. צבע אחיד. ללא מגנטים על המקרר.</p></div>
            <div className="bg-gray-50 rounded-xl p-5"><h3 className="font-bold text-gray-900 mb-2">חדר שינה</h3><p className="text-gray-600">מיטה + 2 שידות + מנורת קריאה. ארון בגדים מובנה (לא עומד). מצעים בצבע אחיד. אפס בלאגן.</p></div>
            <div className="bg-gray-50 rounded-xl p-5"><h3 className="font-bold text-gray-900 mb-2">אמבטיה</h3><p className="text-gray-600">ארון אמבטיה סגור (לא מדף פתוח עם 15 בקבוקים). מראה עם אחסון מאחור. ברזים מינימליים שחור/כרום.</p></div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">הטעות הנפוצה: &quot;מינימליסטי = קר&quot;</h2>
          <p className="text-gray-700 leading-relaxed mb-4">לא. מינימליזם טוב הוא חם. עץ טבעי, שטיח רך, תאורה חמימה (2700K), כרית אחת בד טבעי — האלמנטים האלה הופכים מרחב מינימליסטי למזמין. הסוד: פחות פריטים אבל כל אחד איכותי ונעים למגע.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">הדמיה מינימליסטית עם AI</h2>
          <p className="text-gray-700 leading-relaxed mb-4">רוצים לראות את הבית בלי הבלאגן? <Link href="/visualize" className="text-amber-600 font-medium">העלו תמונה ל-ShiputzAI</Link> וכתבו &quot;עיצוב מינימליסטי, צבעים ניטרליים, ללא עודפים&quot;. 30 שניות — ותראו את ההבדל.</p>
        </article>
        <section className="mt-12"><h2 className="text-2xl font-bold text-gray-900 mb-4">שאלות נפוצות</h2><div className="space-y-3">
          <FaqItem q="מה זה עיצוב מינימליסטי?" a='כל פריט חייב להיות פונקציונלי ויפה. פחות רהיטים, פחות צבעים, פחות עיטורים. מרחב נקי ואלגנטי.' />
          <FaqItem q="איך מתחילים?" a="היפטרו מעודפים. בחרו 2-3 צבעים. השאירו רק רהיטים שבאמת צריך." />
        </div></section>
        <div className="mt-12 text-center"><Link href="/visualize" className="bg-amber-500 text-white px-8 py-3 rounded-xl font-medium text-lg hover:bg-amber-600 inline-block">נסו הדמיה מינימליסטית — חינם</Link></div>
        <div className="mt-8 flex flex-wrap gap-3 text-sm"><Link href="/tips/scandinavian-design-israel" className="text-amber-600">סקנדינבי →</Link><Link href="/tips/modern-living-room-ideas" className="text-amber-600">סלון מודרני →</Link><Link href="/tips/industrial-design-style" className="text-amber-600">תעשייתי →</Link></div>
      </main>
      <Footer />
    </div>
  );
}
