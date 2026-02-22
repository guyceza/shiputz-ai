import { Metadata } from "next";

export const metadata: Metadata = {
  title: "הדמיית שיפוץ בAI",
  description: "העלה תמונה של החדר שלך וקבל הדמיה של איך הוא יראה אחרי השיפוץ. כולל הערכת עלויות וקישורים לרכישת המוצרים.",
  openGraph: {
    title: "הדמיית שיפוץ בAI | ShiputzAI",
    description: "העלה תמונה של החדר וקבל הדמיה של התוצאה הסופית עם הערכת עלויות",
    images: ["/og-image.jpg"],
  },
};

export default function VisualizeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
