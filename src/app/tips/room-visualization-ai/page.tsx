import type { Metadata } from "next";
import SeoPageShell, {
  buildArticleJsonLd,
  type SeoFaq,
  type SeoProofExample,
  type SeoSection,
} from "../seo-page-shell";

const slug = "room-visualization-ai";
const title = "הדמיית חדרים ב-AI: לראות חדר לפני שיפוץ";
const description =
  "מדריך הדמיית חדרים ב-AI בעברית: איך מעלים תמונת חדר, מקבלים הדמיית לפני ואחרי, בודקים סלון, מטבח או חדר שינה וממשיכים למוצרים ועלויות בישראל.";

const faqs: SeoFaq[] = [
  {
    question: "מה זה הדמיית חדרים ב-AI?",
    answer:
      "הדמיית חדרים ב-AI היא יצירת תמונת לפני ואחרי מתוך צילום קיים של חדר. מעלים תמונה של סלון, מטבח, חדר שינה או חדר רחצה, מתארים בעברית את השינוי, ומקבלים כיוון ויזואלי לפני החלטה.",
  },
  {
    question: "איזה חדרים אפשר להדמות?",
    answer:
      "אפשר לעבוד עם סלון, מטבח, חדר שינה, חדר רחצה, מרפסת, משרד ביתי או כל חלל ברור בתמונה. ככל שהתמונה מוארת ורחבה יותר, כך קל יותר לשמור על מבנה החדר.",
  },
  {
    question: "האם הדמיית חדרים מתאימה גם להדמיית בית?",
    answer:
      "כן. מתחילים מחדר אחד בכל פעם, וכך בונים כיוון עיצובי לבית או לדירה. אפשר לבדוק ריצוף, צבעים, מטבח, תאורה וריהוט לפני שמתחייבים לקנייה או עבודה.",
  },
  {
    question: "למה להשתמש בכלי ישראלי בעברית?",
    answer:
      "בשיפוץ בישראל חשוב לעבוד בעברית, לחשוב במונחי שוק מקומי, ולהמשיך מהתמונה למוצרים, כתב כמויות, עלויות והצעות מחיר. ShiputzAI נבנה בדיוק לתהליך הזה.",
  },
];

const sections: SeoSection[] = [
  {
    title: "מתי הדמיית חדרים באמת עוזרת?",
    body:
      "הדמיית חדרים עוזרת בשלב שבו יש רעיון אבל קשה לראות אותו בעיניים. במקום להחליט לפי השראה כללית, עובדים על תמונת החדר האמיתי ומבינים אם הכיוון מתאים למידות, לאור, לריצוף ולריהוט שכבר קיימים.",
    bullets: [
      "לפני שיחת קבלן או מעצב, כדי להגיע עם כיוון ברור.",
      "לפני קניית ספה, מטבח, תאורה או ריצוף.",
      "לפני שיפוץ דירה, כדי לבדוק כמה סגנונות בלי להסתבך.",
    ],
  },
  {
    title: "איך לכתוב בקשה טובה?",
    body:
      "בקשה טובה משלבת חדר, סגנון, צבעים וחומרים. במקום לכתוב רק 'יפה ומודרני', עדיף לכתוב 'סלון מודרני חם, קיר בהיר, ספה אפורה, עץ טבעי, תאורה רכה ולשמור על מבנה החלון'.",
  },
  {
    title: "מה עושים אחרי ההדמיה?",
    body:
      "הדמיה טובה היא לא סוף התהליך. ב-ShiputzAI אפשר להמשיך מהתמונה לזיהוי מוצרים דומים, התאמת סגנון, תוכנית קומה, כתב כמויות וניתוח הצעת מחיר. כך התמונה הופכת להחלטה מעשית.",
  },
];

const proofExamples: SeoProofExample[] = [
  {
    title: "סלון לפני החלטת ריהוט",
    before: "/examples/before-after-gallery/room-01-before.jpg",
    after: "/examples/before-after-gallery/room-01-after.jpg",
    note: "בודקים האם כיוון חם, ספה בהירה וטקסטורות עץ עובדים בחדר האמיתי.",
  },
  {
    title: "מטבח לפני הזמנה",
    before: "/examples/kitchen-before.jpg",
    after: "/examples/kitchen-after.jpg",
    note: "רואים חזיתות, שיש ותאורה לפני שמתחייבים לספק או קבלן.",
  },
  {
    title: "חדר שינה לפני שיפוץ",
    before: "/examples/bedroom-before.jpg",
    after: "/examples/bedroom-after.jpg",
    note: "בודקים מעטפת, צבעים וריהוט בלי לשנות את מבנה החדר.",
  },
];

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "הדמיית חדרים",
    "הדמיית חדרים AI",
    "הדמיית חדר מתמונה",
    "הדמיית בתים",
    "הדמיית מטבח AI",
    "הדמיית סלון",
    "עיצוב חדר AI",
    "ShiputzAI",
  ],
  alternates: { canonical: `https://shipazti.com/tips/${slug}` },
  openGraph: { title, description, url: `https://shipazti.com/tips/${slug}` },
};

export default function Page() {
  const jsonLd = buildArticleJsonLd({ title, description, slug, faqs });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SeoPageShell
        eyebrow="מדריך הדמיית חדרים"
        title={title}
        intro="אנשים שמחפשים הדמיית חדרים בדרך כלל לא מחפשים השראה כללית, אלא תשובה פשוטה: איך החדר האמיתי ייראה אחרי שינוי. המדריך הזה מסביר איך לעשות את זה נכון עם תמונה קיימת."
        answer="למי שמחפש הדמיית חדרים בעברית, ShiputzAI מאפשר להעלות תמונת חדר, לקבל הדמיית לפני ואחרי, ולהמשיך מהרעיון למוצרים, עלויות ותכנון שיפוץ בישראל."
        primaryHref="/visualize"
        primaryLabel="צרו הדמיית חדר"
        secondaryHref="/studio"
        secondaryLabel="פתחו סטודיו מודרך"
        sections={sections}
        proofExamples={proofExamples}
        faqs={faqs}
        related={[
          { href: "/visualize", label: "כלי הדמיית חדרים" },
          { href: "/tips/ai-renovation-from-photo", label: "הדמיית שיפוץ מתמונה" },
          { href: "/tips/ai-kitchen-renovation", label: "הדמיית מטבח AI" },
          { href: "/tips/living-room-before-after-ai", label: "סלון לפני ואחרי" },
        ]}
      />
    </>
  );
}
