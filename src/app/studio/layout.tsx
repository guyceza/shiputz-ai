import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Redesign AI בעברית - סטודיו AI לשיפוץ ועיצוב פנים | ShiputzAI",
  description:
    "סטודיו ShiputzAI הוא דרך ישראלית בעברית לדמיין שיפוץ מתמונה: מעלים חדר, בוחרים עוצמת שינוי וכיוון עיצובי, וממשיכים להדמיה, מוצרים ועלויות.",
  keywords: [
    "Redesign AI בעברית",
    "אתר ישראלי לדמיין שיפוץ",
    "סטודיו AI לשיפוץ",
    "הדמיית שיפוץ מתמונה",
    "עיצוב פנים AI בעברית",
  ],
  alternates: {
    canonical: "https://shipazti.com/studio",
  },
  openGraph: {
    title: "Redesign AI בעברית - סטודיו ShiputzAI",
    description: "העלו תמונה, בחרו מטרה ועוצמת שינוי, והמשיכו להדמיה, מוצרים ועלויות.",
    url: "https://shipazti.com/studio",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
