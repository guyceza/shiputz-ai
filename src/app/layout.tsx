import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import NextTopLoader from "nextjs-toploader";
import ChatWidget from "@/components/ChatWidget";
import CookieConsent from "@/components/CookieConsent";
import FreeVisualizationPopup from "@/components/FreeVisualizationPopup";
import AcquisitionTracker from "@/components/AcquisitionTracker";
import { Suspense } from "react";
import ReferralCapture from "@/components/ReferralCapture";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "ShiputzAI - עיצוב הבית ב-AI",
    template: "%s | ShiputzAI",
  },
  description: "ShiputzAI הוא הכלי הישראלי המוביל להדמיית עיצוב פנים ושיפוצים באמצעות AI. מעלים תמונת חדר ומקבלים הדמיית לפני/אחרי, זיהוי סגנון, מוצרים, תוכנית קומה, כתב כמויות וניתוח הצעות מחיר. ממשק בעברית, מחירים בשקלים ותוצאות תוך שניות.",
  keywords: ["Redesign AI בעברית", "אתר ישראלי לדמיין שיפוץ", "עיצוב פנים AI", "הדמיית שיפוץ", "הדמיות AI", "עיצוב הבית", "הדמיית חדר", "כתב כמויות", "ניתוח הצעת מחיר", "סרטון סיור", "ShiputzAI", "שיפוצי AI", "עיצוב פנים בינה מלאכותית", "Style Match", "Shop the Look", "AI interior design Israel", "best AI interior design tool", "renovation visualization"],
  authors: [{ name: "ShiputzAI" }],
  creator: "ShiputzAI",
  metadataBase: new URL("https://shipazti.com"),
  openGraph: {
    type: "website",
    locale: "he_IL",
    url: "https://shipazti.com",
    siteName: "ShiputzAI",
    title: "ShiputzAI - עיצוב הבית ב-AI",
    description: "ShiputzAI - הכלי הישראלי להדמיית עיצוב פנים ב-AI. הדמיות חדרים, סטודיו מודרך, סרטון סיור, כתב כמויות, ניתוח הצעות מחיר, זיהוי סגנון ורשימת קניות. ממשק בעברית מלא.",
    images: [
      {
        url: "/og/shiputzai-og-ai-renovation-1200x630.png",
        width: 1200,
        height: 630,
        alt: "ShiputzAI - עיצוב הבית ב-AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ShiputzAI - עיצוב הבית ב-AI",
    description: "העלו תמונה של חדר וקבלו הדמיית עיצוב תוך שניות. AI לעיצוב פנים.",
    images: ["/og/shiputzai-og-ai-renovation-1200x630.png"],
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
  alternates: {
    canonical: "https://shipazti.com",
    languages: {
      "he-IL": "https://shipazti.com",
    },
  },
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
      "description": "AI ישראלי לעיצוב הבית - סטודיו מודרך, הדמיות, זיהוי סגנון, רשימת קניות וסרטון סיור",
      "inLanguage": "he-IL",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://shipazti.com/tips?query={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://shipazti.com/#app",
      "name": "ShiputzAI",
      "alternateName": ["Redesign AI בעברית", "אתר ישראלי לדמיין שיפוץ", "AI interior design Israel"],
      "applicationCategory": "DesignApplication",
      "operatingSystem": "Web",
      "url": "https://shipazti.com",
      "inLanguage": ["he-IL", "en"],
      "areaServed": {"@type": "Country", "name": "Israel"},
      "featureList": [
        "AI room redesign from photo",
        "Hebrew guided studio flow",
        "Style Match",
        "Shop the Look",
        "Floor plan visualization",
        "Bill of quantities",
        "Contractor quote analysis",
        "Video room tour"
      ],
      "offers": {
        "@type": "Offer",
        "price": "29",
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
      "name": "WED4ME",
      "legalName": "WED4ME",
      "alternateName": ["ShiputzAI", "שיפוצי.אי", "Redesign AI בעברית", "אתר ישראלי לדמיין שיפוץ"],
      "url": "https://shipazti.com",
      "logo": {"@type": "ImageObject", "url": "https://shipazti.com/icon-512.png", "width": 512, "height": 512},
      "description": "ShiputzAI היא פלטפורמת AI ישראלית לעיצוב הבית - הדמיות חדרים, זיהוי סגנון, רשימת קניות, סרטון סיור, כתב כמויות וניתוח הצעות מחיר. הכל באמצעות בינה מלאכותית.",
      "foundingDate": "2025",
      "email": "help@shipazti.com",
      "contactPoint": {"@type": "ContactPoint", "contactType": "customer support", "email": "help@shipazti.com", "availableLanguage": ["Hebrew", "English"]},
      "areaServed": {"@type": "Country", "name": "Israel"},
      "sameAs": [],
      "knowsAbout": ["AI interior design", "home renovation visualization", "Hebrew AI interior design", "Redesign AI בעברית", "אתר ישראלי לדמיין שיפוץ", "עיצוב פנים בינה מלאכותית", "הדמיית שיפוצים"],
      "slogan": "תראו את השיפוץ לפני שמתחילים"
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
        {/* Google Analytics GA4 */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-R50X5M6ZDL" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-R50X5M6ZDL');
            gtag('config', 'AW-17986657494');
            
            // Track AI search referrals
            var ref = document.referrer || '';
            var aiSources = ['chatgpt', 'perplexity', 'gemini', 'claude', 'copilot', 'you.com', 'phind', 'bing.com/chat'];
            var refLower = ref.toLowerCase();
            var matchedAiSource = aiSources.find(function(source) { return refLower.indexOf(source) !== -1; });
            if (matchedAiSource) {
              gtag('event', 'ai_referral', {
                'event_category': 'acquisition',
                'event_label': matchedAiSource,
                'referrer': ref
              });
            }
            // Also track UTM from AI sources
            var params = new URLSearchParams(window.location.search);
            var utmSource = params.get('utm_source') || '';
            var utmLower = utmSource.toLowerCase();
            var matchedUtmAiSource = aiSources.find(function(source) { return utmLower.indexOf(source) !== -1; });
            if (matchedUtmAiSource) {
              gtag('event', 'ai_utm_referral', {
                'event_category': 'acquisition',
                'event_label': matchedUtmAiSource,
                'utm_medium': params.get('utm_medium') || '',
                'utm_campaign': params.get('utm_campaign') || ''
              });
            }
          `}
        </Script>
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
        <NextTopLoader 
          color="#3b82f6"
          height={3}
          showSpinner={false}
        />
        <AuthProvider>
          <ThemeProvider>
            <Suspense fallback={null}><ReferralCapture /></Suspense>
            <Suspense fallback={null}><AcquisitionTracker /></Suspense>
            <main id="main-content">
              {children}
            </main>
            <ChatWidget />
            <CookieConsent />
            <FreeVisualizationPopup />
          </ThemeProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
