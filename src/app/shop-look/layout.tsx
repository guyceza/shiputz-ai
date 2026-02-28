import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop the Look",
  description: "לחץ על המוצרים בתמונה ומצא איפה לקנות אותם. השוואת מחירים בין רשתות הריהוט המובילות בישראל.",
  alternates: {
    canonical: "https://shipazti.com/shop-look",
  },
  openGraph: {
    title: "Shop the Look | ShiputzAI",
    description: "מצא ורכוש את המוצרים מהדמיית השיפוץ שלך",
    images: ["/og-image.jpg"],
  },
};

export default function ShopLookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
