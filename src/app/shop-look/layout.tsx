import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop the Look — מצאו ורכשו כל פריט מתמונה | ShiputzAI",
  description: "Shop the Look של ShiputzAI מזהה כל פריט בתמונת עיצוב ועוזר למצוא אותו לרכישה. לחצו על ספה, שולחן או מנורה בתמונה וקבלו קישורי קנייה — AI שעובד בשבילכם.",
  keywords: ["Shop the Look", "מציאת מוצרים מתמונה", "AI product detection", "רהיטים", "קניות עיצוב", "ShiputzAI"],
  alternates: {
    canonical: "https://shipazti.com/shop-look",
  },
  openGraph: {
    title: "Shop the Look — קנו מה שאתם רואים | ShiputzAI",
    description: "AI מזהה פריטי עיצוב בתמונה ועוזר למצוא אותם לרכישה.",
    url: "https://shipazti.com/shop-look",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
