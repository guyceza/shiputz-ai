import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "כלי AI לשיפוץ ועיצוב הבית",
  description: "כל כלי ה-AI של ShiputzAI במקום אחד: הדמיית חדרים, תוכנית קומה, Shop the Look, כתב כמויות, ניתוח הצעות מחיר וסריקת קבלות.",
  alternates: {
    canonical: "https://shipazti.com/ai-vision",
  },
  openGraph: {
    title: "כלי AI לשיפוץ ועיצוב הבית | ShiputzAI",
    description: "בחרו כלי AI לשיפוץ: הדמיה, תוכנית קומה, קניות, כתב כמויות וניתוח הצעת מחיר.",
    url: "https://shipazti.com/ai-vision",
    images: ["/og/shiputzai-og-ai-renovation-1200x630.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
