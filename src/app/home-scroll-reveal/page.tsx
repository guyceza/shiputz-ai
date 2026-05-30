import type { Metadata } from "next";

import Home from "../page";

export const metadata: Metadata = {
  title: "תצוגת אפקט גלילה לדף הבית | ShiputzAI",
  robots: {
    index: false,
    follow: false,
  },
};

export default function HomeScrollRevealTestPage() {
  return <Home />;
}
