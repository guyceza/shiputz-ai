import type { Metadata } from "next";
import SeoPageShell, { buildArticleJsonLd, type SeoFaq, type SeoSection } from "../seo-page-shell";

const slug = "ai-kitchen-renovation";
const title = "הדמיית מטבח AI: לבדוק שיפוץ מטבח לפני שמזמינים";
const description =
  "הדמיית מטבח AI בעברית: איך לבדוק חזיתות, צבעים, תאורה, שיש וריצוף לפני שיפוץ מטבח, ומה כדאי לתאר בפרומפט.";

const faqs: SeoFaq[] = [
  {
    question: "אפשר לעשות הדמיית מטבח מתמונה קיימת?",
    answer:
      "כן. מעלים תמונה של המטבח הקיים, מתארים את השינוי הרצוי ומקבלים הדמיה שמראה כיוון חדש לפני הזמנת נגר, שיש או קבלן.",
  },
  {
    question: "מה כדאי לציין בפרומפט למטבח?",
    answer:
      "כדאי לציין צבע חזיתות, סוג שיש, תאורה, ריצוף, ידיות, סגנון כללי ומה לא להזיז. למשל: חזיתות שמנת, שיש בהיר, תאורה נסתרת וריצוף עץ.",
  },
  {
    question: "האם AI יכול לתכנן מטבח מדויק?",
    answer:
      "AI מצוין לכיוון ויזואלי, אבל תכנון מידות, נקודות מים, חשמל ונגרות צריך לעבור דרך בעל מקצוע. ההדמיה עוזרת להגיע לשיחה מוכנים יותר.",
  },
];

const sections: SeoSection[] = [
  {
    title: "מה אפשר לבדוק לפני השיפוץ?",
    body:
      "מטבח הוא אחד החלקים היקרים בבית, ולכן כדאי לבדוק כמה כיוונים לפני שמתחייבים. AI מאפשר לראות איך חזיתות, שיש, תאורה וריצוף עובדים יחד.",
    bullets: [
      "חזיתות בהירות מול כהות.",
      "שיש לבן, אפור, אבן טבעית או מראה בטון.",
      "תאורה נסתרת, פסי לד, גופי תאורה תלויים וריצוף מתאים.",
    ],
  },
  {
    title: "איך ShiputzAI עוזר במטבח?",
    body:
      "מתחילים מהתמונה הקיימת, בוחרים עוצמת שינוי, ומקבלים הדמיה. לאחר מכן אפשר להשתמש ב-Shop the Look כדי למצוא פריטים משלימים, ובמחירון כדי להבין סדרי גודל.",
  },
  {
    title: "טיפ חשוב לפני קבלת הצעת מחיר",
    body:
      "הגיעו לנגר או לקבלן עם תמונת כיוון, רשימת חומרים וסדר עדיפויות. זה מצמצם אי הבנות ומקל להשוות בין הצעות מחיר.",
  },
];

export const metadata: Metadata = {
  title,
  description,
  keywords: ["הדמיית מטבח AI", "שיפוץ מטבח AI", "עיצוב מטבח AI בעברית", "הדמיית מטבח מתמונה", "ShiputzAI"],
  alternates: { canonical: `https://shipazti.com/tips/${slug}` },
  openGraph: { title, description, url: `https://shipazti.com/tips/${slug}` },
};

export default function Page() {
  const jsonLd = buildArticleJsonLd({ title, description, slug, faqs });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SeoPageShell
        eyebrow="מטבח ושיפוץ"
        title={title}
        intro="לפני שמזמינים מטבח חדש, כדאי לראות כמה אפשרויות על התמונה האמיתית של הבית. הדמיית מטבח AI עוזרת לבדוק סגנון, צבעים וחומרים בלי להתחייב."
        answer="ShiputzAI מאפשר ליצור הדמיית מטבח בעברית, לבדוק כיוונים שונים ולהמשיך למוצרים ועלויות שמתאימים לשיפוץ בישראל."
        sections={sections}
        faqs={faqs}
        related={[
          { href: "/tips/ai-kitchen-visualization", label: "מדריך הדמיית מטבח" },
          { href: "/tips/small-kitchen-design-ai", label: "עיצוב מטבח קטן" },
          { href: "/visualize", label: "התחילו הדמיה" },
        ]}
      />
    </>
  );
}
