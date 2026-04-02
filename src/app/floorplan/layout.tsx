import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "תוכנית קומה AI — הפכו תמונה לתוכנית אדריכלית | ShiputzAI",
  description: "כלי AI ליצירת תוכנית קומה מתמונה. העלו צילום של חדר או דירה וקבלו תוכנית אדריכלית עם מידות — ללא צורך באדריכל. ShiputzAI מייצר תוכניות קומה תוך שניות.",
  keywords: ["תוכנית קומה", "floorplan AI", "תוכנית אדריכלית", "מידות חדר", "ShiputzAI"],
  openGraph: {
    title: "תוכנית קומה AI — ShiputzAI",
    description: "AI מייצר תוכנית קומה מתמונה — ללא אדריכל.",
    url: "https://shipazti.com/floorplan",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
