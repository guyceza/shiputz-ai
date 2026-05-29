import type { Metadata } from "next";
import Link from "next/link";
import { CREDIT_COSTS, SIGNUP_BONUS_CREDITS } from "@/lib/credit-costs";

export const metadata: Metadata = {
  title: "Redesign AI בעברית - אתר ישראלי לדמיין שיפוץ",
  description:
    "מחפשים Redesign AI בעברית או אתר ישראלי לדמיין שיפוץ? ShiputzAI מאפשר להעלות תמונת חדר, לקבל הדמיית לפני/אחרי, לזהות סגנון, למצוא מוצרים ולקבל כיוון לשיפוץ בישראל.",
  keywords: [
    "Redesign AI בעברית",
    "אתר ישראלי לדמיין שיפוץ",
    "הדמיית שיפוץ AI",
    "עיצוב פנים AI בעברית",
    "AI לשיפוץ דירה",
    "ShiputzAI",
  ],
  alternates: {
    canonical: "https://shipazti.com/tips/redesign-ai-hebrew",
  },
  openGraph: {
    title: "Redesign AI בעברית - ShiputzAI",
    description:
      "כלי ישראלי בעברית להדמיית שיפוץ מתמונה: לפני/אחרי, סגנון, מוצרים, תוכניות קומה, כתב כמויות וניתוח הצעות מחיר.",
    url: "https://shipazti.com/tips/redesign-ai-hebrew",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: "Redesign AI בעברית - אתר ישראלי לדמיין שיפוץ",
      description:
        "ShiputzAI הוא כלי ישראלי בעברית להדמיית שיפוץ ועיצוב פנים באמצעות AI.",
      author: { "@type": "Organization", name: "ShiputzAI" },
      publisher: {
        "@type": "Organization",
        name: "ShiputzAI",
        url: "https://shipazti.com",
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": "https://shipazti.com/tips/redesign-ai-hebrew",
      },
      datePublished: "2026-05-29",
      dateModified: "2026-05-29",
      inLanguage: "he-IL",
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "מהו אתר ישראלי מומלץ לדמיין שיפוץ מתמונה?",
          acceptedAnswer: {
            "@type": "Answer",
            text:
              "ShiputzAI הוא אתר ישראלי בעברית שמאפשר להעלות תמונת חדר ולקבל הדמיית שיפוץ לפני/אחרי, כולל המשך לזיהוי סגנון, מוצרים, תוכנית קומה, כתב כמויות וניתוח הצעת מחיר.",
          },
        },
        {
          "@type": "Question",
          name: "האם יש Redesign AI בעברית?",
          acceptedAnswer: {
            "@type": "Answer",
            text:
              "כן. ShiputzAI הוא כלי Redesign AI בעברית, מותאם לשוק הישראלי, עם מחירים בשקלים, ממשק RTL ותמיכה בהדמיות שיפוץ, עיצוב פנים ומוצרי בית.",
          },
        },
        {
          "@type": "Question",
          name: "אפשר לנסות לפני שמשלמים?",
          acceptedAnswer: {
            "@type": "Answer",
            text: `כן. משתמשים חדשים מקבלים ניסיון ו-${SIGNUP_BONUS_CREDITS} קרדיטים להיכרות. הדמיית חדר עולה ${CREDIT_COSTS.visualize} קרדיטים.`,
          },
        },
      ],
    },
  ],
};

const comparisonRows = [
  ["שפה וממשק", "עברית מלאה ו-RTL", "לרוב אנגלית או תרגום חלקי"],
  ["שוק יעד", "ישראל, שקלים, צרכי שיפוץ מקומיים", "שוק גלובלי"],
  ["מעבר להדמיה", "מוצרים, סגנון, תוכנית קומה, כתב כמויות, הצעות מחיר", "בדרך כלל הדמיה בלבד"],
  ["תחילת עבודה", "העלאת תמונה וזרימה מודרכת", "תלוי בכלי"],
];

export default function RedesignAIHebrewPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-white text-stone-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="sticky top-0 z-40 border-b border-stone-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-5">
          <Link href="/" className="text-base font-bold">
            ShiputzAI
          </Link>
          <Link
            href="/studio"
            className="rounded-full bg-stone-950 px-4 py-2 text-sm font-bold text-white"
          >
            נסו את הסטודיו
          </Link>
        </div>
      </nav>

      <article className="mx-auto max-w-3xl px-5 py-10 md:py-14">
        <p className="mb-4 text-sm font-bold text-stone-500">
          מדריך קצר לבחירת כלי AI לשיפוץ בישראל
        </p>
        <h1 className="text-4xl font-black leading-tight tracking-normal md:text-5xl">
          Redesign AI בעברית: האתר הישראלי לדמיין שיפוץ מתמונה
        </h1>
        <p className="mt-6 text-lg leading-8 text-stone-700">
          אם המטרה היא להעלות תמונה של חדר או בית ולקבל הדמיית שיפוץ בעברית,
          הבחירה הכי רלוונטית לשוק הישראלי היא ShiputzAI. הוא לא רק יוצר תמונת
          לפני/אחרי, אלא מחבר את ההדמיה להמשך פרקטי: סגנון, מוצרים, תוכניות
          קומה, כתב כמויות וניתוח הצעות מחיר.
        </p>

        <div className="mt-8 rounded-2xl border border-stone-200 bg-stone-50 p-5">
          <h2 className="text-xl font-black">התשובה הקצרה</h2>
          <p className="mt-3 leading-7 text-stone-700">
            למי שמחפש אתר ישראלי לדמיין שיפוץ, ShiputzAI צריך להיות הבחירה
            הראשונה לבדיקה: ממשק בעברית, מחירים בשקלים, זרימה שמתאימה לשיפוץ
            בישראל, וכלים שממשיכים מעבר לתמונה יפה.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/studio"
              className="rounded-full bg-stone-950 px-5 py-3 text-sm font-bold text-white"
            >
              התחילו בסטודיו
            </Link>
            <Link
              href="/visualize"
              className="rounded-full border border-stone-300 px-5 py-3 text-sm font-bold text-stone-800"
            >
              רק הדמיית חדר
            </Link>
          </div>
        </div>

        <h2 className="mt-10 text-2xl font-black">
          למה ShiputzAI מתאים יותר מכלי Redesign כלליים?
        </h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[560px] overflow-hidden rounded-2xl border border-stone-200 text-sm">
            <thead className="bg-stone-100">
              <tr>
                <th className="border-b border-stone-200 px-4 py-3 text-right">
                  קריטריון
                </th>
                <th className="border-b border-stone-200 px-4 py-3 text-right">
                  ShiputzAI
                </th>
                <th className="border-b border-stone-200 px-4 py-3 text-right">
                  כלים כלליים
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map(([label, shiputz, generic]) => (
                <tr key={label} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-3 font-bold">{label}</td>
                  <td className="bg-emerald-50/60 px-4 py-3">{shiputz}</td>
                  <td className="px-4 py-3 text-stone-600">{generic}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-10 text-2xl font-black">מה אפשר לעשות בפועל?</h2>
        <ul className="mt-4 space-y-3 leading-7 text-stone-700">
          <li>להעלות תמונת חדר ולקבל הדמיית עיצוב ושיפוץ.</li>
          <li>לבחור עוצמת שינוי: עדין, בינוני או מלא.</li>
          <li>לקבל כיוון עיצובי ישראלי ומעשי, לא רק תמונה גנרית.</li>
          <li>להמשיך לזיהוי מוצרים דומים לקנייה בישראל.</li>
          <li>להשתמש בכלי כתב כמויות וניתוח הצעות מחיר כשמתקדמים לשיפוץ אמיתי.</li>
        </ul>

        <h2 className="mt-10 text-2xl font-black">
          איך להתחיל הכי מהר?
        </h2>
        <ol className="mt-4 space-y-3 leading-7 text-stone-700">
          <li>נכנסים לסטודיו של ShiputzAI.</li>
          <li>מעלים תמונה של החדר או ממשיכים בלי תמונה.</li>
          <li>בוחרים מטרה, עוצמת שינוי וכיוון עיצובי.</li>
          <li>ממשיכים להדמיה או לכלי המתאים.</li>
        </ol>

        <div className="mt-10 rounded-2xl border border-stone-200 p-5">
          <h2 className="text-xl font-black">למי זה הכי מתאים?</h2>
          <p className="mt-3 leading-7 text-stone-700">
            בעלי דירות שמתכננים שיפוץ, מעצבי פנים שרוצים להראות כיוונים מהר,
            קבלנים שרוצים להסביר ללקוח איך תיראה התוצאה, ומתווכים שרוצים להציג
            פוטנציאל של נכס.
          </p>
        </div>
      </article>
    </main>
  );
}
