"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Images, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const DISMISSED_UNTIL_KEY = "shiputzai_free_visualization_popup_dismissed_until";
const POPUP_DELAY_MS = 10000;
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000;

const excludedPathPrefixes = [
  "/admin",
  "/auth",
  "/checkout",
  "/checkout-vision",
  "/dashboard",
  "/forgot-password",
  "/login",
  "/onboarding",
  "/payment-failed",
  "/payment-success",
  "/project",
  "/reset-password",
  "/share",
  "/shared",
  "/signup",
  "/unsubscribe",
  "/visualize",
];

export default function FreeVisualizationPopup() {
  const pathname = usePathname();
  const { isLoading, isLoggedIn } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  const shouldSkipPath = useMemo(() => {
    return excludedPathPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  }, [pathname]);

  useEffect(() => {
    if (isLoading || isLoggedIn || shouldSkipPath) {
      return;
    }

    const dismissedUntil = Number(localStorage.getItem(DISMISSED_UNTIL_KEY) || 0);
    if (dismissedUntil > Date.now()) {
      return;
    }

    const timer = window.setTimeout(() => {
      setIsVisible(true);
    }, POPUP_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [isLoading, isLoggedIn, shouldSkipPath]);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_UNTIL_KEY, String(Date.now() + DISMISS_DURATION_MS));
    setIsVisible(false);
  };

  const shouldRender = isVisible && !isLoading && !isLoggedIn && !shouldSkipPath;

  if (!shouldRender) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/35 px-4 py-5 backdrop-blur-[2px] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="free-visualization-popup-title"
      dir="rtl"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-2xl">
        <button
          type="button"
          onClick={dismiss}
          className="absolute left-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-800"
          aria-label="סגור"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-l from-emerald-100 via-sky-100 to-amber-100" />

        <div className="relative p-6 pt-8 text-right sm:p-7">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-950 text-white shadow-lg">
            <Images className="h-7 w-7" />
          </div>

          <h2 id="free-visualization-popup-title" className="text-3xl font-bold leading-tight text-gray-950 sm:text-4xl">
            חדש! הדמיה חינם!
          </h2>
          <p className="mt-3 text-base leading-7 text-gray-700">
            העלו תמונה אחת ותראו איך הבית יכול להיראות אחרי השיפוץ, עוד לפני שמדברים עם קבלן.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/visualize"
              onClick={dismiss}
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-gray-950 px-6 text-base font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-gray-800"
            >
              נסו הדמיה חינם
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-gray-200 px-5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              אולי אחר כך
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
