import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "זיהוי סגנון עיצוב פנים בAI — Style Matcher | ShiputzAI",
  description: "Style Matcher של ShiputzAI מזהה את סגנון העיצוב שלכם באמצעות AI. העלו תמונה של חדר וקבלו ניתוח סגנון מפורט, רשימת קניות מותאמת, וטקסטורות חומרים — תוך שניות.",
  keywords: ["זיהוי סגנון עיצוב", "Style Matcher", "AI style identification", "עיצוב פנים", "ShiputzAI"],
  alternates: {
    canonical: "https://shipazti.com/style-match",
  },
  openGraph: {
    title: "זיהוי סגנון עיצוב פנים בAI — ShiputzAI",
    description: "AI מזהה את סגנון העיצוב שלכם ויוצר רשימת קניות מותאמת.",
    url: "https://shipazti.com/style-match",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
