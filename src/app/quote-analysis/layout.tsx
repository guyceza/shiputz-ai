import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ניתוח הצעת מחיר בAI — גלו אם הקבלן מייקר | ShiputzAI",
  description: "כלי AI לניתוח הצעות מחיר של קבלנים. העלו את ההצעה ו-ShiputzAI ינתח כל סעיף, ישווה למחירי שוק, ויזהה תמחור יתר. 67% מבעלי דירות חווים חריגה בתקציב — אל תהיו אחד מהם.",
  keywords: ["ניתוח הצעת מחיר", "השוואת מחירי קבלנים", "AI quote analysis", "תמחור יתר שיפוץ", "ShiputzAI"],
  openGraph: {
    title: "ניתוח הצעת מחיר בAI — ShiputzAI",
    description: "AI מנתח את הצעת המחיר של הקבלן ומזהה תמחור יתר.",
    url: "https://shipazti.com/quote-analysis",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
