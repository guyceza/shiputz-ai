import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "ShiputzAI - ניהול שיפוצים חכם",
    template: "%s | ShiputzAI",
  },
  description: "בינה מלאכותית לניהול שיפוצים - מעקב תקציב, סריקת קבלות, ניתוח הצעות מחיר והתראות חכמות. התחל לשפץ בשליטה מלאה.",
  keywords: ["שיפוץ", "שיפוצים", "ניהול תקציב", "קבלות", "הצעות מחיר", "AI", "בינה מלאכותית", "שיפוץ דירה", "שיפוץ בית"],
  authors: [{ name: "ShiputzAI" }],
  creator: "ShiputzAI",
  metadataBase: new URL("https://shipazti.com"),
  openGraph: {
    type: "website",
    locale: "he_IL",
    url: "https://shipazti.com",
    siteName: "ShiputzAI",
    title: "ShiputzAI - ניהול שיפוצים חכם",
    description: "בינה מלאכותית לניהול שיפוצים - מעקב תקציב, סריקת קבלות, ניתוח הצעות מחיר והתראות חכמות.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ShiputzAI - ניהול שיפוצים חכם",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ShiputzAI - ניהול שיפוצים חכם",
    description: "בינה מלאכותית לניהול שיפוצים - מעקב תקציב, סריקת קבלות והתראות חכמות.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.className} antialiased`}>{children}</body>
    </html>
  );
}
