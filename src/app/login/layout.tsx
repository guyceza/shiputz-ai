import { Metadata } from "next";

export const metadata: Metadata = {
  title: "התחברות",
  description: "התחבר לחשבון ShiputzAI שלך וחזור לניהול השיפוץ.",
  alternates: {
    canonical: "https://shipazti.com/login",
  },
  openGraph: {
    title: "התחברות | ShiputzAI",
    description: "התחבר לחשבון ShiputzAI שלך",
    images: ["/og-image.jpg"],
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
