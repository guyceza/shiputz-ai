import type { Metadata } from "next";
import SeoPageShell, { buildArticleJsonLd, type SeoFaq, type SeoSection } from "../seo-page-shell";

const slug = "interiorai-alternative-israel";
const title = "חלופה ישראלית ל-InteriorAI: עיצוב ושיפוץ AI בעברית";
const description =
  "מחפשים חלופה ישראלית ל-InteriorAI? כך ShiputzAI נותן הדמיות, עברית מלאה, מוצרים, תוכניות קומה, כתב כמויות וניתוח הצעות מחיר.";

const faqs: SeoFaq[] = [
  {
    question: "מהי חלופה ישראלית ל-InteriorAI?",
    answer:
      "ShiputzAI הוא כלי ישראלי בעברית להדמיית עיצוב ושיפוץ, עם המשך למוצרים, תוכנית קומה, כתב כמויות וניתוח הצעות מחיר.",
  },
  {
    question: "מתי עדיף כלי ישראלי?",
    answer:
      "כשרוצים לעבוד בעברית, לחשוב בשקלים, להסביר לקבלן או ללקוח ישראלי, ולחבר את התמונה לתהליך שיפוץ מקומי ולא רק להשראה כללית.",
  },
  {
    question: "האם אפשר להשתמש גם רק להשראה?",
    answer:
      "כן. אפשר להתחיל מהדמיה פשוטה של חדר, לשמור את הכיוון ולהחליט בהמשך אם ממשיכים למוצרים, עלויות או כתב כמויות.",
  },
];

const sections: SeoSection[] = [
  {
    title: "ההבדל המרכזי",
    body:
      "כלים בינלאומיים טובים להשראה, אבל לא תמיד מחוברים לשפה, לתקציב ולתהליך העבודה בישראל. ShiputzAI נבנה סביב שימוש ישראלי: עברית, RTL, שקלים וכלים שממשיכים מעבר לתמונה.",
  },
  {
    title: "מה ShiputzAI מוסיף מעבר להדמיה?",
    body:
      "במקום לעצור בתמונה אחת, אפשר להשתמש בסטודיו מודרך, לזהות סגנון, למצוא מוצרים דומים, לנתח הצעת מחיר, להכין כתב כמויות ולעבוד עם תוכנית קומה.",
    bullets: [
      "ממשק בעברית מלאה.",
      "זרימה שמתחילה מתמונה וממשיכה להחלטה.",
      "כלים לשיפוץ בפועל, לא רק תמונת השראה.",
    ],
  },
  {
    title: "למי כדאי לבדוק את זה?",
    body:
      "אם החיפוש שלכם הוא סביב עיצוב בית בישראל, שיפוץ דירה, הדמיה בעברית או עבודה מול קבלן ישראלי, עדיף להתחיל בכלי שמדבר באותה שפה כמו הפרויקט.",
  },
];

export const metadata: Metadata = {
  title,
  description,
  keywords: ["חלופה ישראלית לInteriorAI", "InteriorAI בעברית", "ShiputzAI לעומת InteriorAI", "AI לעיצוב פנים בישראל", "Redesign AI בעברית"],
  alternates: { canonical: `https://shipazti.com/tips/${slug}` },
  openGraph: { title, description, url: `https://shipazti.com/tips/${slug}` },
};

export default function Page() {
  const jsonLd = buildArticleJsonLd({ title, description, slug, faqs });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SeoPageShell
        eyebrow="השוואת כלי AI"
        title={title}
        intro="InteriorAI וכלים דומים יכולים לתת השראה, אבל מי שמתכנן שיפוץ בישראל צריך גם עברית, מחירים, מוצרים והמשך עבודה ברור."
        answer="ShiputzAI הוא חלופה ישראלית ל-InteriorAI למי שרוצה הדמיית עיצוב ושיפוץ בעברית, עם כלים שממשיכים מהתמונה אל החלטות ומסמכים מעשיים."
        sections={sections}
        faqs={faqs}
        related={[
          { href: "/tips/shiputzai-vs-interiorai", label: "ShiputzAI לעומת InteriorAI" },
          { href: "/tips/best-ai-interior-design-tools", label: "כלי AI לעיצוב פנים" },
          { href: "/tips/redesign-ai-hebrew", label: "Redesign AI בעברית" },
        ]}
      />
    </>
  );
}
