import type { Metadata } from "next";
import SeoPageShell, { buildArticleJsonLd, type SeoFaq, type SeoSection } from "../seo-page-shell";

const slug = "floor-plan-ai-israel";
const title = "תוכנית דירה ל-AI: להפוך שרטוט לחדרים, הדמיות וכיווני שיפוץ";
const description =
  "מדריך לתוכנית דירה עם AI בישראל: איך משתמשים בתוכנית קומה, מזהים חדרים, יוצרים הדמיות וממשיכים לכתב כמויות.";

const faqs: SeoFaq[] = [
  {
    question: "אפשר להעלות תוכנית דירה ל-AI?",
    answer:
      "כן. ב-ShiputzAI אפשר להתחיל מתוכנית קומה או שרטוט, לזהות חדרים ולהמשיך להדמיות, מוצרים וכתב כמויות בהתאם לצורך.",
  },
  {
    question: "האם AI מחליף אדריכל?",
    answer:
      "לא. AI עוזר להבין כיוון, חדרים ואפשרויות עיצוב, אבל אישורי בנייה, תכנון הנדסי ומידות סופיות צריכים איש מקצוע מתאים.",
  },
  {
    question: "למי זה מתאים?",
    answer:
      "זה מתאים לבעלי דירות לפני שיפוץ, משקיעים, מתווכים, קבלנים ומעצבים שרוצים להסביר מהר את פוטנציאל החלל.",
  },
];

const sections: SeoSection[] = [
  {
    title: "מה עושים עם תוכנית דירה?",
    body:
      "תוכנית דירה יכולה להיות נקודת התחלה לתהליך שלם: להבין חדרים, לבחור חלל, ליצור הדמיה, לבדוק מוצרים ולחשב כמויות. במקום שהתוכנית תישאר PDF או צילום, היא הופכת לכלי עבודה.",
  },
  {
    title: "מתי זה מועיל במיוחד?",
    body:
      "זה חזק במיוחד כשיש דירה ישנה, נכס לפני רכישה, או לקוח שלא מצליח להבין תוכנית דו-ממדית. הדמיה מחברת בין השרטוט לבין תחושת החדר בפועל.",
    bullets: [
      "לפני שיפוץ דירה ישנה.",
      "לפני רכישת נכס והשבחה.",
      "כשצריך להסביר ללקוח איך חדר בתוכנית יכול להיראות.",
    ],
  },
  {
    title: "איך ממשיכים אחרי הזיהוי?",
    body:
      "אחרי שהחדרים מזוהים אפשר לבחור חדר ולהמשיך להדמיה או להכנת כתב כמויות. כך תכנון ראשוני מתחבר להחלטות עיצוב, עלויות וחומרים.",
  },
];

export const metadata: Metadata = {
  title,
  description,
  keywords: ["תוכנית דירה AI", "תוכנית קומה AI", "AI לתוכנית דירה", "הדמיית תוכנית דירה", "ShiputzAI"],
  alternates: { canonical: `https://shipazti.com/tips/${slug}` },
  openGraph: { title, description, url: `https://shipazti.com/tips/${slug}` },
};

export default function Page() {
  const jsonLd = buildArticleJsonLd({ title, description, slug, faqs });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SeoPageShell
        eyebrow="תוכנית דירה עם AI"
        title={title}
        intro="תוכנית דירה היא לא רק מסמך טכני. עם AI אפשר להשתמש בה כדי להבין חדרים, לראות אפשרויות עיצוב ולהתקדם לתכנון שיפוץ בצורה ברורה יותר."
        answer="ShiputzAI מאפשר להתחיל מתוכנית קומה או שרטוט, לזהות חדרים ולהמשיך להדמיות, מוצרים וכתב כמויות — בעברית ובשפה שמתאימה לשיפוץ בישראל."
        primaryHref="/floorplan"
        primaryLabel="פתחו כלי תוכנית קומה"
        secondaryHref="/studio"
        secondaryLabel="מסלול מודרך"
        sections={sections}
        faqs={faqs}
        related={[
          { href: "/floorplan", label: "כלי תוכנית קומה" },
          { href: "/tips/bill-of-quantities-ai", label: "כתב כמויות AI" },
          { href: "/tips/apartment-renovation-guide", label: "מדריך שיפוץ דירה" },
        ]}
      />
    </>
  );
}
