import type { Metadata } from "next";

import Home from "../page";
import HomeScrollRevealEnhancer from "@/components/HomeScrollRevealEnhancer";

export const metadata: Metadata = {
  title: "תצוגת אפקט גלילה לדף הבית | ShiputzAI",
  robots: {
    index: false,
    follow: false,
  },
};

export default function HomeScrollRevealTestPage() {
  return (
    <div data-home-scroll-reveal-page>
      <HomeScrollRevealEnhancer />
      <Home />
    </div>
  );
}
