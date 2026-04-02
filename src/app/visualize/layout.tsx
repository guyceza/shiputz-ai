import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "הדמיית עיצוב פנים בAI — ShiputzAI",
  description: "ShiputzAI הוא הכלי המוביל בישראל להדמיית עיצוב פנים בAI. העלו תמונה של חדר, תארו מה לשנות, וקבלו הדמיה פוטוריאליסטית תוך 30 שניות. 10 קרדיטים חינם בהרשמה.",
  keywords: ["הדמיית עיצוב פנים", "AI room visualization", "הדמיית חדר", "עיצוב פנים AI", "ShiputzAI", "הדמיית שיפוץ"],
  alternates: {
    canonical: "https://shipazti.com/visualize",
  },
  openGraph: {
    title: "הדמיית עיצוב פנים בAI — ShiputzAI",
    description: "העלו תמונה וקבלו הדמיית עיצוב פנים תוך 30 שניות. 7 כלי AI בפלטפורמה אחת.",
    url: "https://shipazti.com/visualize",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
