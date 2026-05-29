"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Images, ShoppingBag } from "lucide-react";

const firstActions = [
  {
    title: "להפוך תמונת חדר להדמיה",
    description: "מתאים למי שרוצה לראות לפני שקונים, שוברים או סוגרים עם קבלן.",
    href: "/visualize",
    image: "/images/ai-vision/visualize.jpg",
    icon: Images,
    badge: "הכי מהיר להתחלה",
    accent: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  {
    title: "להפוך תוכנית קומה לדירה מוחשית",
    description: "מתאים כשיש תוכנית אדריכלית ורוצים להבין איך החלל ירגיש בפועל.",
    href: "/floorplan",
    image: "/images/ai-vision/floorplan.jpg",
    icon: Building2,
    badge: "לתוכניות ודירות",
    accent: "bg-blue-50 text-blue-700 border-blue-100",
  },
  {
    title: "למצוא פריטים דומים מתמונה",
    description: "מתאים כשיש סגנון שאהבתם ורוצים להגיע למוצרים שאפשר לקנות.",
    href: "/shop-look",
    image: "/images/ai-vision/shop-look.jpg",
    icon: ShoppingBag,
    badge: "לקנייה והשראה",
    accent: "bg-amber-50 text-amber-700 border-amber-100",
  },
];

function getStoredUserEmail() {
  if (typeof window === "undefined") return "";

  try {
    const stored = JSON.parse(localStorage.getItem("user") || "{}");
    return typeof stored.email === "string" ? stored.email : "";
  } catch {
    return "";
  }
}

export default function StartPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const { getSession } = await import("@/lib/auth");
        const session = await getSession();
        const storedEmail = getStoredUserEmail();

        if (!session?.user && !storedEmail) {
          router.push("/signup?redirect=/start");
          return;
        }

        if (isMounted) {
          setEmail(session?.user?.email || storedEmail);
          const stored = JSON.parse(localStorage.getItem("user") || "{}");
          const name = typeof stored.name === "string" ? stored.name.trim() : "";
          setFirstName(name ? name.split(" ")[0] : "");
        }
      } catch {
        const storedEmail = getStoredUserEmail();
        if (!storedEmail) {
          router.push("/signup?redirect=/start");
          return;
        }

        if (isMounted) {
          setEmail(storedEmail);
          try {
            const stored = JSON.parse(localStorage.getItem("user") || "{}");
            const name = typeof stored.name === "string" ? stored.name.trim() : "";
            setFirstName(name ? name.split(" ")[0] : "");
          } catch {
            setFirstName("");
          }
        }
      } finally {
        if (isMounted) {
          setCheckingAuth(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const trackChoice = async (action: string, page: string) => {
    if (!email) return;

    try {
      await fetch("/api/track-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action, page }),
      });
    } catch {
      // Tracking must not block navigation.
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-stone-200 border-t-stone-900" />
          <p className="text-sm text-stone-500">מכינים את הכלים שלך...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900" dir="rtl">
      <nav className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="text-base font-semibold text-stone-900">
            ShiputzAI
          </Link>
          <Link href="/dashboard" className="text-xs text-stone-500 transition-colors hover:text-stone-900">
            דשבורד
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-4 py-7 md:px-6 md:py-10">
        <div className="grid gap-7 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-600 shadow-sm">
              ניסיון ראשון בלי להסתבך
            </div>
            <h1 className="max-w-xl text-3xl font-semibold leading-tight text-stone-950 md:text-5xl">
              {firstName ? `${firstName}, מה רוצים לעשות עכשיו?` : "מה רוצים לעשות עכשיו?"}
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-stone-600">
              בחרו פעולה אחת ברורה. אחרי שתראו תוצאה, יהיה הרבה יותר קל להבין אם שווה להתקדם לרכישה.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-xl border border-stone-200 bg-white p-2 shadow-sm">
            <div className="rounded-lg bg-stone-100 px-3 py-3 text-center">
              <p className="text-lg font-semibold text-stone-950">1</p>
              <p className="text-[11px] text-stone-500">בוחרים כלי</p>
            </div>
            <div className="rounded-lg bg-stone-100 px-3 py-3 text-center">
              <p className="text-lg font-semibold text-stone-950">2</p>
              <p className="text-[11px] text-stone-500">מעלים תמונה</p>
            </div>
            <div className="rounded-lg bg-stone-900 px-3 py-3 text-center text-white">
              <p className="text-lg font-semibold">3</p>
              <p className="text-[11px] text-stone-200">רואים ערך</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {firstActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.href}
                href={action.href}
                onClick={() => trackChoice(action.title, action.href)}
                className="group overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                  <Image
                    src={action.image}
                    alt={action.title}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4 md:p-5">
                  <div className={`mb-4 inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] ${action.accent}`}>
                    <Icon className="h-3.5 w-3.5" />
                    {action.badge}
                  </div>
                  <h2 className="text-lg font-semibold leading-snug text-stone-950">
                    {action.title}
                  </h2>
                  <p className="mt-2 min-h-[3.25rem] text-sm leading-6 text-stone-600">
                    {action.description}
                  </p>
                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-stone-950">
                    להתחיל עכשיו
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white px-4 py-4 text-center shadow-sm md:flex-row md:text-right">
          <p className="text-sm text-stone-600">
            לא בטוחים מה מתאים? אפשר לראות את כל כלי ההדמיה והניתוח במקום אחד.
          </p>
          <Link href="/ai-vision" className="text-sm font-medium text-stone-950 underline underline-offset-4">
            לכל הכלים
          </Link>
        </div>
      </section>
    </main>
  );
}
