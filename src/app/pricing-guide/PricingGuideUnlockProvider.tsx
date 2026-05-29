"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";

type PriceValue = {
  min_price: number;
  max_price: number;
};

type UnlockContextValue = {
  checking: boolean;
  isRegistered: boolean;
  prices: Record<string, PriceValue>;
};

const QUOTE_POPUP_KEY = "shiputz_pricing_quote_popup_seen_v1";

const UnlockContext = createContext<UnlockContextValue>({
  checking: true,
  isRegistered: false,
  prices: {},
});

function formatPriceRange(price: PriceValue) {
  return `₪${price.min_price.toLocaleString()} - ₪${price.max_price.toLocaleString()}`;
}

export function PricingGuideUnlockProvider({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [prices, setPrices] = useState<Record<string, PriceValue>>({});

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      let registered = false;

      try {
        const supabase = getSupabaseClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        registered = Boolean(user?.email);

        if (registered) {
          const { data, error } = await supabase
            .from("pricing_items")
            .select("id,min_price,max_price");

          if (!error && data && !cancelled) {
            setPrices(
              Object.fromEntries(
                data.map((item) => [
                  item.id,
                  {
                    min_price: Number(item.min_price),
                    max_price: Number(item.max_price),
                  },
                ])
              )
            );
          }
        }
      } catch {
        // Keep the guest-safe locked state.
      } finally {
        if (!cancelled) {
          setIsRegistered(registered);
          setChecking(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ checking, isRegistered, prices }),
    [checking, isRegistered, prices]
  );

  return <UnlockContext.Provider value={value}>{children}</UnlockContext.Provider>;
}

export function PricingGuidePriceCell({
  itemId,
  initialMinPrice,
  initialMaxPrice,
  lockedForGuest,
}: {
  itemId: string;
  initialMinPrice?: number;
  initialMaxPrice?: number;
  lockedForGuest: boolean;
}) {
  const { checking, isRegistered, prices } = useContext(UnlockContext);
  const initialPrice =
    typeof initialMinPrice === "number" && typeof initialMaxPrice === "number"
      ? { min_price: initialMinPrice, max_price: initialMaxPrice }
      : null;
  const unlockedPrice = prices[itemId] || initialPrice;
  const shouldShowPrice = !lockedForGuest || (isRegistered && unlockedPrice);

  if (shouldShowPrice && unlockedPrice) {
    return (
      <div className="text-left font-semibold text-gray-900 whitespace-nowrap">
        {formatPriceRange(unlockedPrice)}
      </div>
    );
  }

  return (
    <div className="relative w-36 shrink-0 text-left" aria-label="המחיר נעול עד הרשמה">
      <div className="select-none rounded-lg bg-gray-100 px-3 py-2 text-center font-semibold text-gray-700 blur-[5px]">
        ₪00,000 - ₪00,000
      </div>
      <Link
        href="/signup?redirect=/pricing-guide"
        className="absolute inset-0 flex items-center justify-center rounded-lg border border-gray-200 bg-white/65 px-2 text-center text-[11px] font-semibold leading-4 text-gray-900 backdrop-blur-[1px] transition-colors hover:bg-white/85"
      >
        {checking ? "בודק הרשמה..." : "הירשמו כדי לראות מחיר"}
      </Link>
    </div>
  );
}

export function PricingGuideStatusText() {
  const { checking, isRegistered } = useContext(UnlockContext);

  if (checking) {
    return <p className="mt-3 text-sm text-gray-400">בודקים אם המחירון פתוח לחשבון שלך...</p>;
  }

  if (isRegistered) {
    return (
      <p className="mt-3 text-sm font-medium text-emerald-700">
        המחירון המלא פתוח. אפשר לבדוק הצעה אמיתית מול מחירי השוק.
      </p>
    );
  }

  return (
    <p className="mt-3 text-sm text-gray-400">
      פתחנו את ״שיפוץ כללי״ כדי לתת כיוון ראשוני. שאר המחירים נפתחים אחרי הרשמה.
    </p>
  );
}

export function PricingGuideConversionBridge() {
  const { checking, isRegistered } = useContext(UnlockContext);

  if (checking) return null;

  if (isRegistered) {
    return null;
  }

  return (
    <div className="mb-12 rounded-[8px] border border-gray-200 bg-white p-5 md:p-6">
      <p className="mb-2 text-sm font-semibold text-gray-950">רוצים לפתוח את כל המחירים?</p>
      <p className="mb-5 text-sm leading-6 text-gray-600">
        הרשמה חינם פותחת את המחירון המלא. אחרי זה נוביל אתכם לבדיקה אישית של הצעה אמיתית, שם מתקבלת החלטת הרכישה.
      </p>
      <Link
        href="/signup?redirect=/pricing-guide"
        className="mx-auto flex w-full justify-center rounded-lg bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 sm:w-fit"
      >
        הרשמה ופתיחת המחירון
      </Link>
    </div>
  );
}

export function PricingGuideBottomCta() {
  const { checking, isRegistered } = useContext(UnlockContext);

  if (checking || !isRegistered) {
    return (
      <div className="mt-20 bg-gray-900 rounded-[8px] p-10 text-center text-white">
        <h2 className="text-2xl font-bold mb-3">צריך מחיר לפי הצעה או דירה אמיתית?</h2>
        <p className="text-gray-300 mb-6">
          הירשמו, פתחו את המחירון המלא ואז בדקו הצעה אמיתית מול מחירי השוק.
        </p>
        <Link
          href="/signup?redirect=/quote-analysis"
          className="inline-block bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors"
        >
          הירשמו ובדקו הצעת מחיר
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-20 bg-gray-900 rounded-[8px] p-10 text-center text-white">
      <h2 className="text-2xl font-bold mb-3">המחירים פתוחים. עכשיו בודקים אם ההצעה משתלמת.</h2>
      <p className="text-gray-300 mb-6">
        העלו הצעת מחיר או כתבו את הסעיפים, וקבלו תשובה ברורה: מציאה או לא מציאה.
      </p>
      <Link
        href="/quote-analysis"
        className="inline-block bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors"
      >
        ניתוח הצעת מחיר
      </Link>
    </div>
  );
}

export function PricingGuideProgressPopup() {
  const { checking } = useContext(UnlockContext);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      if (typeof window === "undefined") return false;
      return sessionStorage.getItem(QUOTE_POPUP_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (checking || dismissed) return;

    const onScroll = () => {
      const scrolledEnough = window.scrollY > 280;
      if (scrolledEnough) setVisible(true);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [checking, dismissed]);

  const close = () => {
    setVisible(false);
    setDismissed(true);
    try {
      sessionStorage.setItem(QUOTE_POPUP_KEY, "true");
    } catch {}
  };

  if (checking || dismissed || !visible) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-[60] mx-auto max-w-sm" dir="rtl" role="dialog" aria-live="polite">
      <div className="rounded-[8px] border border-gray-200 bg-white p-3 shadow-xl shadow-gray-900/12">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold leading-5 text-gray-950">בדקו הצעת מחיר</h3>
            <p className="mt-1 text-xs leading-5 text-gray-600">
              קיבלתם הצעה מקבלן? בדקו אם היא הוגנת מול מחירי השוק.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="סגור"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <Link
          href="/quote-analysis"
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
        >
          בדקו הצעת מחיר
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
