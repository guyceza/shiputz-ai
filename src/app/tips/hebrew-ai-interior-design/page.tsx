import type { Metadata } from "next";
import SeoPageShell, { buildArticleJsonLd, type SeoFaq, type SeoSection } from "../seo-page-shell";

const slug = "hebrew-ai-interior-design";
const title = "עיצוב פנים AI בעברית: כלי ישראלי לתכנון הבית";
const description =
  "עיצוב פנים AI בעברית עם ShiputzAI: הדמיות חדרים, זיהוי סגנון, רשימת קניות, תוכניות קומה וכלים לשיפוץ בישראל.";

const faqs: SeoFaq[] = [
  {
    question: "האם יש כלי עיצוב פנים AI בעברית?",
    answer:
      "כן. ShiputzAI בנוי בעברית ומותאם לשוק הישראלי: ממשק RTL, הסברים בעברית, מחירים בשקלים וכלים שמתאימים לשיפוץ ועיצוב מקומי.",
  },
  {
    question: "מה ההבדל בין כלי בעברית לכלי בינלאומי?",
    answer:
      "כלי בעברית מבין טוב יותר את הדרך שבה ישראלים מתארים חדרים, חומרים וסגנונות, ומחבר את ההדמיה להמשך מעשי כמו מוצרים, עלויות וכתב כמויות.",
  },
  {
    question: "אפשר להשתמש בזה לפרויקט מקצועי?",
    answer:
      "כן. מעצבים, קבלנים ומתווכים יכולים להשתמש בהדמיות כדי להציג כיוון ללקוח, אבל בפרויקט מורכב עדיין כדאי לשלב תכנון מקצועי מלא.",
  },
];

const sections: SeoSection[] = [
  {
    title: "מה אפשר לעשות עם עיצוב פנים AI?",
    body:
      "אפשר להעלות תמונת חדר, לבדוק סגנונות, להבין צבעים וחומרים, לזהות את הסגנון הקיים ולבנות רשימת מוצרים. היתרון הוא מהירות: במקום שבועות של השראות מפוזרות, מקבלים כיוון ברור תוך זמן קצר.",
    bullets: [
      "הדמיית סלון, מטבח, חדר שינה, מרפסת או חדר רחצה.",
      "בדיקת כמה סגנונות לפני החלטה: מודרני חם, יוקרתי נקי, סקנדינבי ועוד.",
      "מעבר מהשראה לתוכנית עבודה עם מוצרים, עלויות וכתב כמויות.",
    ],
  },
  {
    title: "למה עברית חשובה?",
    body:
      "בשיפוץ ישראלי אנשים מדברים על תריסים, ממד, ריצוף, קבלן, כתב כמויות ומחירים בשקלים. כלי שמדבר עברית מלאה מקצר את הדרך בין הרעיון לבין החלטה שאפשר להסביר לבעל מקצוע.",
  },
  {
    title: "איפה להתחיל?",
    body:
      "הדרך הכי נוחה היא להתחיל בסטודיו: בוחרים מטרה, עוצמת שינוי וכיוון עיצובי. מי שרוצה רק תמונת לפני/אחרי יכול להיכנס ישירות להדמיית עיצוב.",
  },
];

export const metadata: Metadata = {
  title,
  description,
  keywords: ["עיצוב פנים AI בעברית", "AI לעיצוב פנים בישראל", "כלי AI לעיצוב פנים בעברית", "הדמיית חדר AI בעברית", "ShiputzAI"],
  alternates: { canonical: `https://shipazti.com/tips/${slug}` },
  openGraph: { title, description, url: `https://shipazti.com/tips/${slug}` },
};

export default function Page() {
  const jsonLd = buildArticleJsonLd({ title, description, slug, faqs });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SeoPageShell
        eyebrow="מדריך לעיצוב פנים עם AI"
        title={title}
        intro="עיצוב פנים עם AI לא חייב להיות באנגלית או מנותק מהמציאות הישראלית. כשעובדים בעברית, קל יותר לתאר את הבית, את הסגנון ואת התקציב."
        answer="ShiputzAI הוא כלי עיצוב פנים AI בעברית שמחבר בין הדמיה מהירה לבין המשך מעשי: מוצרים, תוכנית קומה, כתב כמויות וניתוח הצעות מחיר."
        sections={sections}
        faqs={faqs}
        related={[
          { href: "/tips/ai-interior-design-israel", label: "עיצוב פנים AI בישראל" },
          { href: "/tips/ai-renovation-from-photo", label: "הדמיית שיפוץ מתמונה" },
          { href: "/studio", label: "הסטודיו המודרך" },
        ]}
      />
    </>
  );
}
