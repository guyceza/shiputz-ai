import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import ChatWidget from "@/components/ChatWidget";
import { ThemeProvider } from "@/contexts/ThemeContext";
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

// JSON-LD Structured Data
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://shipazti.com/#website",
      "url": "https://shipazti.com",
      "name": "ShiputzAI",
      "description": "בינה מלאכותית לניהול שיפוצים",
      "inLanguage": "he-IL",
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://shipazti.com/#app",
      "name": "ShiputzAI",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "149.99",
        "priceCurrency": "ILS",
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "ratingCount": "127",
      },
    },
    {
      "@type": "Organization",
      "@id": "https://shipazti.com/#organization",
      "name": "ShiputzAI",
      "url": "https://shipazti.com",
      "logo": "https://shipazti.com/icon-512.png",
      "sameAs": [],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Microsoft Clarity */}
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "vn0prbfm38");
          `}
        </Script>
      </head>
      <body className={`${heebo.className} antialiased bg-[var(--background)] text-[var(--foreground)]`}>
        <ThemeProvider>
          {children}
          <ChatWidget />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
