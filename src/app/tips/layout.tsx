import { Metadata } from "next";

export const metadata: Metadata = {
  title: "מאמרים וטיפים לשיפוץ",
  description: "מדריכים מקצועיים לשיפוץ הבית - טיפים לבחירת קבלן, ניהול תקציב, שיפוץ מטבח ואמבטיה, ועוד. כל מה שצריך לדעת לפני שמתחילים.",
  openGraph: {
    title: "מאמרים וטיפים לשיפוץ | ShiputzAI",
    description: "מדריכים מקצועיים לשיפוץ הבית - כל מה שצריך לדעת לפני שמתחילים",
    images: ["/og-image.jpg"],
  },
};

export default function TipsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
