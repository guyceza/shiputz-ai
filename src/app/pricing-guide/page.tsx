import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import {
  PricingGuideConversionBridge,
  PricingGuidePriceCell,
  PricingGuideProgressPopup,
  PricingGuideStatusText,
  PricingGuideUnlockProvider,
} from "./PricingGuideUnlockProvider";

export const metadata: Metadata = {
  title: "מחירון שיפוצים 2026 - כמה עולה שיפוץ דירה? | ShiputzAI",
  description: "מחירון שיפוצים מעודכן 2026: מטבח, אמבטיה, ריצוף, חשמל, אינסטלציה, צביעה ועוד. מחירים ממוצעים בישראל לפי קטגוריה.",
  keywords: "מחירון שיפוצים, כמה עולה שיפוץ, מחירי שיפוץ 2026, שיפוץ דירה מחיר, שיפוץ מטבח מחיר, שיפוץ אמבטיה מחיר",
  openGraph: {
    title: "מחירון שיפוצים 2026 - כמה עולה שיפוץ דירה?",
    description: "מחירון שיפוצים מעודכן: שיפוץ כללי פתוח, ושאר טווחי המחירים אחרי הרשמה.",
    url: "https://shipazti.com/pricing-guide",
  },
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const unitLabels: Record<string, string> = {
  sqm: 'למ"ר',
  unit: "ליחידה",
  meter: "למ׳ אורך",
};

const categoryDescriptions: Record<string, string> = {
  general: "מחירי שיפוץ כללי למ״ר - מקוסמטי ועד יוקרתי. כולל עבודה וחומרים.",
  bathroom: "שיפוץ חדר אמבטיה כולל פירוק, איטום, צנרת, ריצוף וחיפוי. מחירים לחדר ממוצע.",
  kitchen: "חידוש או החלפת מטבח - מפורמייקה ועד מטבח יוקרתי. כולל דלתות, משטחים ופרזול.",
  flooring: "ריצוף ופרקט למ״ר - קרמיקה, למינציה, עץ גושני ואבן טבעית.",
  electrical: "עבודות חשמל - מנקודה בודדת ועד שדרוג ללוח תלת-פאזי.",
  plumbing: "אינסטלציה - סתימות, ברזים, נקודות מים, אסלות תלויות.",
  drywall: "עבודות גבס - קירות, הנמכת תקרה, תקרה אקוסטית, מזנונים.",
  aluminum: "אלומיניום - חלונות, סגירת מרפסת, תריסים חשמליים.",
  painting: "צביעה - מקיר בודד ועד דירה שלמה.",
  waterproofing: "איטום - גג, מרפסת, קיר חיצוני. ביריעות או זפת.",
};

const categoryIcons: Record<string, string> = {
  general: "🏠",
  bathroom: "🚿",
  kitchen: "🍳",
  flooring: "🪵",
  electrical: "⚡",
  plumbing: "🔧",
  drywall: "🧱",
  aluminum: "🪟",
  painting: "🎨",
  waterproofing: "💧",
};

type PricingCategory = {
  id: string;
  key: string;
  name_he: string;
  sort_order: number;
};

type PricingItem = {
  id: string;
  category_id: string;
  key: string;
  name_he: string;
  min_price: number;
  max_price: number;
  unit: string;
  sort_order: number;
};

async function getPricingData() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data: categories } = await supabase
    .from("pricing_categories")
    .select("*")
    .order("sort_order");

  const { data: items } = await supabase
    .from("pricing_items")
    .select("*")
    .order("sort_order");

  return {
    categories: (categories || []) as PricingCategory[],
    items: (items || []) as PricingItem[],
  };
}

export const dynamic = "force-dynamic";

export default async function PricingGuidePage() {
  const { categories, items } = await getPricingData();

  // Group items by category
  const grouped = categories.map((cat) => ({
    ...cat,
    items: items.filter((item) => item.category_id === cat.id),
  }));

  // Calculate some aggregate stats
  const totalItems = items.length;
  // JSON-LD structured data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "מחירון שיפוצים 2026",
    description: "מחירון שיפוצים מעודכן 2026 בישראל",
    url: "https://shipazti.com/pricing-guide",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: totalItems,
      itemListElement: grouped.map((cat, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: cat.name_he,
        description: categoryDescriptions[cat.key] || "",
      })),
    },
  };

  return (
    <PricingGuideUnlockProvider>
      <div className="min-h-screen bg-[#fafafa]" dir="rtl">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Header */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-semibold text-gray-900">
              ShiputzAI
            </Link>
            <Link
              href="/quote-analysis"
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              בדיקת הצעה
            </Link>
          </div>
        </div>

        {/* Conversion Hero */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-6 py-10 md:py-14">
            <div className="rounded-[8px] bg-gray-950 p-6 text-center text-white md:p-9">
              <div className="mx-auto max-w-2xl">
                <p className="mb-3 text-sm font-semibold text-gray-200">
                  מחירון כללי פתוח, המחירים המלאים אחרי הרשמה
                </p>
                <h1 className="mb-4 text-3xl font-bold leading-tight md:text-5xl">
                  רוצה לדעת כמה יעלה השיפוץ שלך?
                </h1>
                <p className="mb-6 text-base leading-7 text-gray-300 md:text-lg">
                  אפשר לראות מיד את מחיר שיפוץ כללי למ״ר. כדי לפתוח את שאר המחירים ולקבל בדיקה לפי הצעת מחיר אמיתית, הירשמו בחינם.
                </p>
                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    href="/signup?redirect=/pricing-guide"
                    className="inline-flex w-full items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-gray-950 transition-colors hover:bg-gray-100 sm:w-auto"
                  >
                    הירשמו ופתחו מחירון מלא
                  </Link>
                  <Link
                    href="/quote-analysis"
                    className="inline-flex w-full items-center justify-center rounded-lg border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
                  >
                    בדקו הצעת מחיר
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Nav */}
        <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-6 py-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {grouped.map((cat) => (
                <a
                  key={cat.key}
                  href={`#${cat.key}`}
                  className="flex-shrink-0 px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  {categoryIcons[cat.key]} {cat.name_he}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              מחירון שיפוצים 2026
            </h2>
            <p className="text-gray-500">
              {totalItems} פריטים · 10 קטגוריות · המחירים כוללים חומרים ועבודה
            </p>
            <PricingGuideStatusText />
          </div>

          <PricingGuideConversionBridge />

        <div className="space-y-16">
          {grouped.map((cat) => (
            <section key={cat.key} id={cat.key}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {categoryIcons[cat.key]} {cat.name_he}
                </h2>
                <p className="text-gray-500">
                  {categoryDescriptions[cat.key]}
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {cat.items.map((item, i) => (
                  <div
                    key={item.key}
                    className={`flex items-center justify-between gap-4 px-6 py-4 ${
                      i < cat.items.length - 1 ? "border-b border-gray-50" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="font-medium text-gray-900">
                        {item.name_he}
                      </span>
                      <span className="text-gray-400 text-sm mr-2">
                        {unitLabels[item.unit] || item.unit}
                      </span>
                    </div>
                    <PricingGuidePriceCell
                      itemId={item.id}
                      initialMinPrice={cat.key === "general" ? item.min_price : undefined}
                      initialMaxPrice={cat.key === "general" ? item.max_price : undefined}
                      lockedForGuest={cat.key !== "general"}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* FAQ for SEO */}
        <div className="mt-16 space-y-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">שאלות נפוצות</h2>
          
          <details className="bg-white rounded-xl border border-gray-100 p-6 group">
            <summary className="font-medium text-gray-900 cursor-pointer">כמה עולה שיפוץ דירה 4 חדרים?</summary>
            <p className="text-gray-500 mt-3">החישוב מתחיל ממחיר למ״ר לפי רמת השיפוץ, ואז משתנה לפי מטבח, אמבטיות, חשמל, אינסטלציה ומורכבות העבודה. הירשמו כדי לפתוח את טווחי המחירים המלאים לפי קטגוריה.</p>
          </details>
          
          <details className="bg-white rounded-xl border border-gray-100 p-6">
            <summary className="font-medium text-gray-900 cursor-pointer">כמה עולה שיפוץ מטבח?</summary>
            <p className="text-gray-500 mt-3">המחיר תלוי אם מדובר בחידוש חזיתות, מטבח חדש, סוג הדלתות, משטח העבודה והפרזול. הטווחים המלאים פתוחים אחרי הרשמה.</p>
          </details>
          
          <details className="bg-white rounded-xl border border-gray-100 p-6">
            <summary className="font-medium text-gray-900 cursor-pointer">כמה עולה שיפוץ חדר אמבטיה?</summary>
            <p className="text-gray-500 mt-3">שיפוץ אמבטיה מורכב מפירוק, איטום, צנרת, ריצוף, חיפוי וכלים סניטריים. טווחי המחירים המלאים לכל סעיף נפתחים אחרי הרשמה.</p>
          </details>

          <details className="bg-white rounded-xl border border-gray-100 p-6">
            <summary className="font-medium text-gray-900 cursor-pointer">איך לחסוך בשיפוץ?</summary>
            <p className="text-gray-500 mt-3">1. השוו לפחות 3 הצעות מחיר מקבלנים. 2. הכינו כתב כמויות מפורט לפני שמבקשים הצעות. 3. קנו חומרים בעצמכם (חיסכון של 20-30%). 4. השתמשו בכלי AI כמו ShiputzAI לקבל הערכה מוקדמת ולהימנע מהפתעות.</p>
          </details>
          
          <details className="bg-white rounded-xl border border-gray-100 p-6">
            <summary className="font-medium text-gray-900 cursor-pointer">מה זה כתב כמויות ולמה צריך אותו?</summary>
            <p className="text-gray-500 mt-3">כתב כמויות הוא מסמך שמפרט את כל עבודות השיפוץ, הכמויות והמחירים. הוא מאפשר להשוות הצעות מחיר בין קבלנים בצורה מדויקת, ומונע הפתעות ותוספות לא צפויות. ShiputzAI יוצר כתב כמויות אוטומטי בהתבסס על הדמיית AI.</p>
          </details>
        </div>
      </div>

      {/* Footer */}
        <div className="border-t border-gray-100 bg-white mt-20">
          <div className="max-w-4xl mx-auto px-6 py-8 text-center text-gray-400 text-sm">
            <p>המחירים מבוססים על סקר שוק ומעודכנים לשנת 2026. ייתכנו שינויים לפי אזור, עונה ומורכבות הפרויקט.</p>
            <p className="mt-2">
              <Link href="/" className="hover:text-gray-600">ShiputzAI</Link>
              {" · "}
              <Link href="/visualize" className="hover:text-gray-600">הדמיית שיפוץ</Link>
              {" · "}
              <Link href="/tips" className="hover:text-gray-600">טיפים</Link>
              {" · "}
              <Link href="/terms" className="hover:text-gray-600">תנאי שימוש</Link>
            </p>
          </div>
        </div>
        <PricingGuideProgressPopup />
      </div>
    </PricingGuideUnlockProvider>
  );
}
