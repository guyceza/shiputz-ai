import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Style Matcher — זיהוי סגנון עיצוב | ShiputzAI",
  description: "העלו תמונה של חדר שאהבתם וקבלו זיהוי סגנון, רשימת חומרים, רשימת קניות עם מחירים וטיפים לשחזור הסגנון אצלכם בבית.",
};

export default function StyleMatchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
