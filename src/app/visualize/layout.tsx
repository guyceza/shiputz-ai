import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "הדמיית חדרים ב-AI מתמונה | הדמיית בית, מטבח וסלון",
  description: "העלו תמונה של חדר וקבלו הדמיית חדרים ב-AI בעברית: סלון, מטבח, חדר שינה או בית לפני שיפוץ. ניסיון ראשון חינם, עם המשך למוצרים ועלויות בישראל.",
  keywords: [
    "הדמיית חדרים",
    "הדמיית בתים",
    "הדמיית מטבח AI",
    "הדמיה AI",
    "הדמיית עיצוב פנים",
    "הדמיית חדר מתמונה",
    "הדמיית שיפוץ",
    "עיצוב הבית AI",
    "ShiputzAI",
  ],
  alternates: {
    canonical: "https://shipazti.com/visualize",
  },
  openGraph: {
    title: "הדמיית חדרים ב-AI מתמונה - ShiputzAI",
    description: "העלו תמונה וקבלו הדמיית בית, סלון או מטבח לפני שיפוץ. ממשק בעברית וכלים שממשיכים למוצרים ועלויות.",
    url: "https://shipazti.com/visualize",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": "https://shipazti.com/visualize#webpage",
        url: "https://shipazti.com/visualize",
        name: "הדמיית חדרים ב-AI מתמונה",
        description: metadata.description,
        inLanguage: "he-IL",
        isPartOf: {
          "@type": "WebSite",
          name: "ShiputzAI",
          url: "https://shipazti.com",
        },
      },
      {
        "@type": "SoftwareApplication",
        name: "ShiputzAI Room Visualization",
        applicationCategory: "DesignApplication",
        operatingSystem: "Web",
        url: "https://shipazti.com/visualize",
        description: "כלי ישראלי בעברית להדמיית חדרים, בתים, מטבחים וסלונים מתמונה קיימת בעזרת AI.",
        offers: {
          "@type": "Offer",
          priceCurrency: "ILS",
          availability: "https://schema.org/InStock",
        },
      },
      {
        "@type": "HowTo",
        name: "איך ליצור הדמיית חדרים ב-AI",
        description: "מעלים תמונה של חדר, כותבים בעברית מה רוצים לשנות, ומקבלים הדמיית לפני ואחרי.",
        totalTime: "PT1M",
        step: [
          {
            "@type": "HowToStep",
            position: 1,
            name: "מעלים תמונת חדר",
            text: "צלמו סלון, מטבח, חדר שינה, חדר רחצה או חלל אחר באור טוב והעלו אותו ל-ShiputzAI.",
          },
          {
            "@type": "HowToStep",
            position: 2,
            name: "מתארים את השינוי",
            text: "כתבו בעברית את הסגנון, הצבעים, החומרים ומה חשוב לשמור בחדר הקיים.",
          },
          {
            "@type": "HowToStep",
            position: 3,
            name: "מקבלים הדמיית לפני ואחרי",
            text: "המערכת יוצרת הדמיית AI של אותו חדר אחרי השינוי, עם אפשרות להמשיך למוצרים ועלויות.",
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "מה זה הדמיית חדרים ב-AI?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "הדמיית חדרים ב-AI היא יצירת תמונת לפני ואחרי מתוך תמונה קיימת של חדר. ב-ShiputzAI מעלים תמונה, כותבים בעברית מה רוצים לשנות, ומקבלים כיוון ויזואלי לשיפוץ או עיצוב.",
            },
          },
          {
            "@type": "Question",
            name: "האם זה מתאים להדמיית בתים ומטבחים?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "כן. אפשר להשתמש ב-ShiputzAI להדמיית בתים, סלונים, מטבחים, חדרי שינה, חדרי רחצה ומרפסות, כל עוד יש תמונה ברורה של החלל.",
            },
          },
          {
            "@type": "Question",
            name: "האם אפשר לנסות בלי הרשמה?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "כן. אפשר להעלות תמונה ולקבל ניסיון ראשון בחינם כאורח. הרשמה מאפשרת לשמור תוצאות ולהמשיך לכלים נוספים.",
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
    </>
  );
}
