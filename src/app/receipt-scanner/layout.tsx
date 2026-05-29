import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "סריקת קבלות שיפוץ ב-AI",
  description: "צלמו קבלה מהשיפוץ ו-ShiputzAI יחלץ סכום, תאריך וקטגוריה למעקב תקציב מסודר.",
  alternates: {
    canonical: "https://shipazti.com/receipt-scanner",
  },
  openGraph: {
    title: "סריקת קבלות שיפוץ ב-AI | ShiputzAI",
    description: "AI שמסדר קבלות שיפוץ למעקב תקציב ברור.",
    url: "https://shipazti.com/receipt-scanner",
    images: ["/og/shiputzai-og-ai-renovation-1200x630.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
