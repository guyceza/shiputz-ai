import type { Metadata } from "next";
import SeoPageShell, { buildArticleJsonLd, type SeoFaq, type SeoSection } from "../seo-page-shell";

const slug = "living-room-before-after-ai";
const title = "הדמיית סלון לפני שיפוץ: לראות לפני ואחרי עם AI";
const description =
  "הדמיית סלון לפני שיפוץ עם AI: איך לבדוק צבעים, ריצוף, ספה, תאורה וסגנון לפני קנייה או עבודה בבית.";

const faqs: SeoFaq[] = [
  {
    question: "איך עושים הדמיית סלון לפני ואחרי?",
    answer:
      "מצלמים את הסלון, מעלים ל-ShiputzAI, מתארים את השינוי ומקבלים הדמיה שמראה איך הסלון יכול להיראות אחרי השיפוץ או העיצוב.",
  },
  {
    question: "איזה סגנונות עובדים טוב בסלון?",
    answer:
      "סגנונות פופולריים הם מודרני חם, סקנדינבי, יוקרתי נקי, Japandi ובוהו עדין. כדאי לבחור סגנון אחד ברור ולא לערבב יותר מדי רעיונות.",
  },
  {
    question: "אפשר למצוא מוצרים אחרי ההדמיה?",
    answer:
      "כן. אחרי שמקבלים כיוון עיצובי אפשר לעבור ל-Shop the Look ולזהות פריטים דומים כמו ספה, שטיח, שולחן, תאורה ואקססוריז.",
  },
];

const sections: SeoSection[] = [
  {
    title: "למה להתחיל דווקא מהסלון?",
    body:
      "הסלון הוא בדרך כלל החלל הכי נראה בבית, ולכן החלטות קטנות בו משפיעות על כל התחושה. הדמיה מאפשרת לבדוק שינוי קיר, ספה, שטיח, תאורה וריצוף לפני שמתחילים לקנות.",
  },
  {
    title: "מה כדאי לבדוק בהדמיה?",
    body:
      "כדאי ליצור כמה גרסאות: שינוי עדין, שינוי בינוני ושינוי מלא. כך רואים אם מספיק להחליף צבע ותאורה, או שצריך לחשוב גם על ריצוף, רהיטים וקיר כוח.",
    bullets: [
      "צבע קיר חדש מול שמירה על הקיים.",
      "ספה גדולה מול ספה קומפקטית יותר.",
      "ריצוף בהיר, פרקט או שטיח מרכזי.",
      "תאורה נסתרת לעומת גופי תאורה דקורטיביים.",
    ],
  },
  {
    title: "איך להפוך השראה לתוכנית?",
    body:
      "אחרי שמוצאים כיוון, כדאי לשמור את התמונה, לרשום את הפריטים המרכזיים ולהשוות מחירים. ShiputzAI מחבר את ההדמיה לכלים שיעזרו לעבור מהרעיון לקנייה ולעבודה בפועל.",
  },
];

export const metadata: Metadata = {
  title,
  description,
  keywords: ["הדמיית סלון לפני שיפוץ", "עיצוב סלון AI", "הדמיית סלון AI", "לפני אחרי סלון", "ShiputzAI"],
  alternates: { canonical: `https://shipazti.com/tips/${slug}` },
  openGraph: { title, description, url: `https://shipazti.com/tips/${slug}` },
};

export default function Page() {
  const jsonLd = buildArticleJsonLd({ title, description, slug, faqs });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SeoPageShell
        eyebrow="סלון לפני ואחרי"
        title={title}
        intro="לפני שקונים ספה, צבע או תאורה, אפשר לראות את הסלון בגרסה חדשה על בסיס התמונה האמיתית שלו. זה חוסך ניחושים ומוריד סיכון."
        answer="למי שמחפש הדמיית סלון לפני שיפוץ, ShiputzAI נותן דרך מהירה בעברית לראות לפני/אחרי ולהמשיך למוצרים שמתאימים לכיוון שנבחר."
        sections={sections}
        faqs={faqs}
        related={[
          { href: "/tips/ai-living-room-design", label: "עיצוב סלון AI" },
          { href: "/tips/modern-living-room-ideas", label: "רעיונות לסלון מודרני" },
          { href: "/shop-look", label: "מציאת מוצרים מהתמונה" },
        ]}
      />
    </>
  );
}
