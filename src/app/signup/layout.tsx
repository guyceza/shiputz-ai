import { Metadata } from "next";

export const metadata: Metadata = {
  title: "הרשמה",
  description: "הצטרף ל-ShiputzAI והתחל לנהל את השיפוץ שלך בצורה חכמה. מעקב תקציב, סריקת קבלות והתראות - הכל במקום אחד.",
  alternates: {
    canonical: "https://shipazti.com/signup",
  },
  openGraph: {
    title: "הרשמה | ShiputzAI",
    description: "הצטרף והתחל לנהל את השיפוץ שלך בצורה חכמה",
    images: ["/og-image.jpg"],
  },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
