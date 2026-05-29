import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "מחירים וקרדיטים ל-AI שיפוצים",
  description: "מחירי ShiputzAI: בחרו מנוי חודשי או שנתי, ומנויים פעילים יכולים להוסיף קרדיטים חד-פעמיים. 10 קרדיטים בחינם לכל משתמש חדש.",
  alternates: {
    canonical: "https://shipazti.com/pricing",
  },
  openGraph: {
    title: "מחירים וקרדיטים ל-AI שיפוצים | ShiputzAI",
    description: "בחרו מנוי וקנו קרדיטים נוספים לפי שימוש רק כשצריך.",
    url: "https://shipazti.com/pricing",
    images: ["/og/shiputzai-og-ai-renovation-1200x630.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
