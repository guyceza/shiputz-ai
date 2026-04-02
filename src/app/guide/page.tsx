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

export default function GuidePage() {
  useEffect(() => {
    document.title = "מדריך שימוש ב-ShiputzAI — איך להפיק את המקסימום מהדמיית עיצוב פנים AI";
  }, []);

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "איך להשתמש ב-ShiputzAI להדמיית עיצוב פנים",
    "description": "מדריך צעד אחר צעד לשימוש ב-ShiputzAI — העלאת תמונה, תיאור השינוי, וקבלת הדמיה פוטוריאליסטית תוך 30 שניות",
    "step": [
      { "@type": "HowToStep", "name": "העלו תמונה", "text": "צלמו את החדר שרוצים לשפץ והעלו את התמונה לShiputzAI" },
      { "@type": "HowToStep", "name": "תארו את השינוי", "text": "כתבו בעברית מה תרצו לשנות — לדוגמה: מטבח לבן מודרני עם אי" },
      { "@type": "HowToStep", "name": "קבלו הדמיה", "text": "תוך 30 שניות תקבלו תמונה פוטוריאליסטית של החדר המשופץ" },
      { "@type": "HowToStep", "name": "שתפו והשוו", "text": "שמרו את ההדמיה, שתפו עם בן/בת הזוג או הקבלן, והשוו אפשרויות" },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "כמה זמן לוקח לקבל הדמיה?", "acceptedAnswer": { "@type": "Answer", "text": "כ-30 שניות. העלו תמונה, כתבו תיאור, וה-AI מייצר את ההדמיה." } },
      { "@type": "Question", "name": "האם צריך ידע בעיצוב פנים?", "acceptedAnswer": { "@type": "Answer", "text": "ממש לא. ShiputzAI מיועד לכולם — בעלי דירות, מעצבים וקבלנים." } },
      { "@type": "Question", "name": "כמה עולה להשתמש?", "acceptedAnswer": { "@type": "Answer", "text": "הדמיה ראשונה חינם. חבילת Pro עולה ₪99 ל-4 הדמיות, או חבילות קרדיטים מ-₪29." } },
      { "@type": "Question", "name": "אפשר להשתמש בעברית?", "acceptedAnswer": { "@type": "Answer", "text": "כן! ShiputzAI בנוי מהיסוד בעברית — ממשק, תיאורים, ותוצאות AI בעברית מלאה." } },
      { "@type": "Question", "name": "מה ההבדל בין הדמיה ל-3D?", "acceptedAnswer": { "@type": "Answer", "text": "הדמיית AI מבוססת תמונה אמיתית ונותנת תוצאה פוטוריאליסטית ב-30 שניות. תכנון 3D דורש שעות עבודה ותוכנה מקצועית." } },
    ],
  };

  const tools = [
    { icon: "🎨", name: "הדמיית חדר", link: "/visualize", desc: "הכלי המרכזי. העלו תמונה של חדר, תארו מה תרצו לשנות, וקבלו הדמיה פוטוריאליסטית.", tips: ["צלמו מזווית רחבה — ככל שרואים יותר מהחדר, התוצאה טובה יותר", "תארו בפירוט — ״מטבח לבן עם משטח שיש אפור ואי מרכזי״ עדיף על ״מטבח יפה״", "נסו סגנונות שונים — מודרני, סקנדינבי, תעשייתי — עד שמוצאים את הנכון", "תאורה טבעית = תוצאות טובות יותר. צלמו ביום כשיש אור מהחלון"] },
    { icon: "🔍", name: "Style Matcher — זיהוי סגנון", link: "/style-match", desc: "העלו תמונה של חדר שמצא חן בעיניכם — מפינטרסט, אינסטגרם, או מגזין — וה-AI יזהה את הסגנון, החומרים, פלטת הצבעים ורשימת קניות מלאה.", tips: ["עובד גם על תמונות מאינסטגרם או פינטרסט", "מזהה חומרים ספציפיים — לא רק ״עץ״ אלא ״אלון טבעי״", "רשימת הקניות כוללת מרקמי חומרים AI שאפשר לקחת לחנות"] },
    { icon: "🛒", name: "Shop the Look", link: "/shop-look", desc: "העלו תמונה של חדר מעוצב — ה-AI מזהה כל פריט (ספה, שטיח, מנורה) ומציע לינקים לקנייה ב-Google Shopping.", tips: ["לחצו על הנקודות בתמונה כדי לראות מוצרים דומים", "עובד הכי טוב על חדרים מלאים עם פריטים ברורים", "הלינקים מובילים ל-Google Shopping עם מוצרים דומים"] },
    { icon: "🎬", name: "סרטון סיור וירטואלי", link: "/visualize", desc: "אחרי הדמיה, ה-AI מייצר סרטון סיור קצר בחדר המעוצב — כאילו אתם נכנסים לתוכו. מושלם לשיתוף עם בן/בת הזוג.", tips: ["הסרטון נוצר מההדמיה הסופית", "אפשר לשתף בוואטסאפ ישירות", "עובד הכי טוב על תמונות עם עומק (לא flat)"] },
    { icon: "📐", name: "תוכנית קומה", link: "/floorplan", desc: "העלו תמונה מלמעלה או סקיצה — וה-AI ייצור תוכנית קומה עם מידות משוערות.", tips: ["צלמו ממש מלמעלה (אם אפשר, מגובה)", "סקיצה ביד גם עובדת — ה-AI מבין קירות ופתחים", "המידות משוערות — לתכנון מדויק פנו לאדריכל"] },
    { icon: "📋", name: "כתב כמויות AI", link: "/dashboard/bill-of-quantities", desc: "העלו תמונה של חדר וה-AI ייצור כתב כמויות מפורט — חומרים, כמויות, ואומדן עלויות. חוסך שעות של עבודה.", tips: ["עובד הכי טוב אחרי הדמיה — ככה ה-AI יודע מה לכמת", "המחירים הם אומדנים — השתמשו כבסיס להשוואת הצעות מחיר", "אפשר להוריד כ-PDF ולשלוח לקבלן"] },
    { icon: "🔎", name: "ניתוח הצעת מחיר", link: "/quote-analysis", desc: "העלו הצעת מחיר מקבלן — ה-AI ינתח כל סעיף, יזהה מחירים חריגים, ויסמן דגלים אדומים.", tips: ["העלו תמונה ברורה של הצעת המחיר (לא מטושטשת)", "ה-AI משווה מחירים למחירון מקובל בישראל", "מזהה סעיפים חסרים שקבלנים ״שוכחים״ לציין"] },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Nav */}
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

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">מדריך שימוש ב-ShiputzAI — איך להפיק את המקסימום</h1>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-12">
          <p className="text-lg text-gray-800 leading-relaxed">
            <strong>ShiputzAI מאפשר ליצור הדמיית עיצוב פנים תוך 30 שניות.</strong> העלו תמונה, תארו את השינוי הרצוי בעברית, וקבלו תמונה פוטוריאליסטית של החדר המשופץ. הפלטפורמה כוללת 7 כלי AI — מהדמיית חדרים ועד ניתוח הצעות מחיר. הנה מדריך מלא לכל כלי.
          </p>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-8">7 הכלים — מדריך לכל אחד</h2>

        <div className="space-y-12">
          {tools.map((tool, i) => (
            <section key={i} className="border border-gray-100 rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{tool.icon}</span>
                <h3 className="text-xl font-bold text-gray-900">{tool.name}</h3>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">{tool.desc}</p>
              <div className="bg-gray-50 rounded-xl p-5">
                <h4 className="font-semibold text-gray-800 mb-3">💡 טיפים לתוצאות מעולות:</h4>
                <ul className="space-y-2">
                  {tool.tips.map((tip, j) => (
                    <li key={j} className="flex items-start gap-2 text-gray-600">
                      <span className="text-amber-500 mt-1">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link href={tool.link} className="inline-block mt-4 text-amber-600 font-medium hover:text-amber-700 transition-colors">
                נסו עכשיו ←
              </Link>
            </section>
          ))}
        </div>

        {/* 5 Tips */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">5 טיפים כלליים לתוצאות טובות יותר</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: "💡", title: "תאורה טבעית", text: "צלמו ביום כשיש אור מהחלון. תאורה מלאכותית יוצרת צללים שמבלבלים את ה-AI." },
              { icon: "📐", title: "זווית רחבה", text: "ככל שנראה יותר מהחדר בתמונה, ה-AI מבין טוב יותר את המרחב ומייצר תוצאה מדויקת." },
              { icon: "✍️", title: "תיאור מפורט", text: "״מטבח לבן מודרני עם אי מרכזי ומשטח שיש אפור״ > ״מטבח יפה״. ספציפיות = תוצאות טובות." },
              { icon: "🎨", title: "ציינו סגנון", text: "הוסיפו מילות סגנון: סקנדינבי, תעשייתי, בוהו, מינימליסטי. ה-AI מכיר את כולם." },
              { icon: "🔄", title: "נסו כמה פעמים", text: "כל הדמיה קצת שונה. נסו 2-3 גרסאות עם תיאורים שונים ובחרו את הטובה." },
            ].map((tip, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{tip.icon}</span>
                  <h3 className="font-semibold text-gray-900">{tip.title}</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{tip.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Credit System */}
        <section className="mt-16 bg-amber-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">מערכת קרדיטים</h2>
          <p className="text-gray-700 mb-4">כל הדמיה צורכת קרדיט אחד. שאר הכלים (Style Matcher, Shop the Look, כתב כמויות, ניתוח הצעת מחיר) — חינם ללא הגבלה.</p>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: "Pro", price: "₪99", credits: "4 הדמיות" },
              { name: "Pack 10", price: "₪29", credits: "10 הדמיות" },
              { name: "Pack 30", price: "₪69", credits: "30 הדמיות" },
              { name: "Pack 100", price: "₪149", credits: "100 הדמיות" },
            ].map((pkg, i) => (
              <div key={i} className="bg-white rounded-xl p-4 text-center border border-amber-200">
                <div className="font-bold text-gray-900">{pkg.name}</div>
                <div className="text-2xl font-bold text-amber-600 my-1">{pkg.price}</div>
                <div className="text-gray-500 text-sm">{pkg.credits}</div>
              </div>
            ))}
          </div>
          <Link href="/pricing" className="inline-block mt-4 text-amber-600 font-medium hover:text-amber-700">
            לכל המחירים ←
          </Link>
        </section>

        {/* FAQ */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">שאלות נפוצות</h2>
          <div className="space-y-3">
            <FaqItem q="כמה זמן לוקח לקבל הדמיה?" a="כ-30 שניות. העלו תמונה, כתבו תיאור, וה-AI מייצר את ההדמיה." />
            <FaqItem q="האם צריך ידע בעיצוב פנים?" a="ממש לא. ShiputzAI מיועד לכולם — בעלי דירות, מעצבים וקבלנים. כל מה שצריך זה תמונה ותיאור." />
            <FaqItem q="כמה עולה להשתמש?" a="הדמיה ראשונה חינם. חבילת Pro עולה ₪99 ל-4 הדמיות, או חבילות קרדיטים מ-₪29." />
            <FaqItem q="אפשר להשתמש בעברית?" a="כן! ShiputzAI בנוי מהיסוד בעברית — ממשק, תיאורים, ותוצאות AI בעברית מלאה." />
            <FaqItem q="מה ההבדל בין הדמיית AI ל-הדמיה תלת מימדית?" a="הדמיית AI מבוססת תמונה אמיתית ונותנת תוצאה פוטוריאליסטית ב-30 שניות. תכנון 3D דורש שעות עבודה ותוכנה מקצועית." />
          </div>
        </section>

        {/* CTA */}
        <section className="mt-16 text-center py-12 bg-gray-50 rounded-2xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">מוכנים לראות את הבית החדש?</h2>
          <p className="text-gray-600 mb-6">ההדמיה הראשונה חינם. תוצאה תוך 30 שניות.</p>
          <Link href="/signup" className="bg-amber-500 text-white px-8 py-3 rounded-xl font-medium text-lg hover:bg-amber-600 transition-colors inline-block">
            התחילו עכשיו — חינם
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
