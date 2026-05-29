import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "סטודיו AI לשיפוץ ועיצוב פנים | ShiputzAI",
  description:
    "סטודיו ShiputzAI מחבר הדמיית חדר, בחירת עוצמת שינוי, כיווני עיצוב, מוצרים ועלויות למסלול אחד פשוט.",
  alternates: {
    canonical: "https://shipazti.com/studio",
  },
  openGraph: {
    title: "סטודיו AI לשיפוץ ועיצוב פנים | ShiputzAI",
    description: "העלו תמונה, בחרו מטרה ועוצמת שינוי, והמשיכו להדמיה, מוצרים ועלויות.",
    url: "https://shipazti.com/studio",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
