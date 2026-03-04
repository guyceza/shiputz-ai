import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const metadata: Metadata = {
  title: "מחירון שיפוצים 2026 — כמה עולה שיפוץ דירה? | ShiputzAI",
  description: "מחירון שיפוצים מעודכן 2026: מטבח, אמבטיה, ריצוף, חשמל, אינסטלציה, צביעה ועוד. מחירים ממוצעים בישראל לפי קטגוריה.",
  keywords: "מחירון שיפוצים, כמה עולה שיפוץ, מחירי שיפוץ 2026, שיפוץ דירה מחיר, שיפוץ מטבח מחיר, שיפוץ אמבטיה מחיר",
  openGraph: {
    title: "מחירון שיפוצים 2026 — כמה עולה שיפוץ דירה?",
    description: "מחירון שיפוצים מעודכן עם טווחי מחירים לכל קטגוריה. חינם.",
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
  general: "מחירי שיפוץ כללי למ״ר — מקוסמטי ועד יוקרתי. כולל עבודה וחומרים.",
  bathroom: "שיפוץ חדר אמבטיה כולל פירוק, איטום, צנרת, ריצוף וחיפוי. מחירים לחדר ממוצע.",
  kitchen: "חידוש או החלפת מטבח — מפורמייקה ועד מטבח יוקרתי. כולל דלתות, משטחים ופרזול.",
  flooring: "ריצוף ופרקט למ״ר — קרמיקה, למינציה, עץ גושני ואבן טבעית.",
  electrical: "עבודות חשמל — מנקודה בודדת ועד שדרוג ללוח תלת-פאזי.",
  plumbing: "אינסטלציה — סתימות, ברזים, נקודות מים, אסלות תלויות.",
  drywall: "עבודות גבס — קירות, הנמכת תקרה, תקרה אקוסטית, מזנונים.",
  aluminum: "אלומיניום — חלונות, סגירת מרפסת, תריסים חשמליים.",
  painting: "צביעה — מקיר בודד ועד דירה שלמה.",
  waterproofing: "איטום — גג, מרפסת, קיר חיצוני. ביריעות או זפת.",
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

  return { categories: categories || [], items: items || [] };
}

export const revalidate = 86400; // Revalidate once per day

export default async function PricingGuidePage() {
  const { categories, items } = await getPricingData();

  // Group items by category
  const grouped = categories.map((cat) => ({
    ...cat,
    items: items.filter((item) => item.category_id === cat.id),
  }));

  // Calculate some aggregate stats
  const totalItems = items.length;
  const avgBathroom = items.find(i => i.key === 'standard' && i.category_id === categories.find(c => c.key === 'bathroom')?.id);

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
            href="/visualize"
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            נסה הדמיה חינם
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            מחירון שיפוצים 2026
          </h1>
          <p className="text-xl text-gray-500 mb-2">
            {totalItems} פריטים · 10 קטגוריות · מעודכן לשנת 2026
          </p>
          <p className="text-gray-400 text-sm">
            המחירים כוללים חומרים ועבודה · ייתכנו הבדלים לפי אזור ומורכבות
          </p>
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
                {cat.items.map((item: any, i: number) => (
                  <div
                    key={item.key}
                    className={`flex items-center justify-between px-6 py-4 ${
                      i < cat.items.length - 1 ? "border-b border-gray-50" : ""
                    }`}
                  >
                    <div>
                      <span className="font-medium text-gray-900">
                        {item.name_he}
                      </span>
                      <span className="text-gray-400 text-sm mr-2">
                        {unitLabels[item.unit] || item.unit}
                      </span>
                    </div>
                    <div className="text-left font-semibold text-gray-900 whitespace-nowrap">
                      ₪{item.min_price?.toLocaleString()} — ₪{item.max_price?.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-20 bg-gray-900 rounded-2xl p-10 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">רוצה לדעת כמה יעלה השיפוץ שלך?</h2>
          <p className="text-gray-300 mb-6">
            העלה תמונה של החדר ותקבל הדמיה + הערכת עלויות מפורטת תוך 30 שניות
          </p>
          <Link
            href="/visualize"
            className="inline-block bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-colors"
          >
            נסה בחינם — הדמיה ראשונה מתנה 🎁
          </Link>
        </div>

        {/* FAQ for SEO */}
        <div className="mt-16 space-y-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">שאלות נפוצות</h2>
          
          <details className="bg-white rounded-xl border border-gray-100 p-6 group">
            <summary className="font-medium text-gray-900 cursor-pointer">כמה עולה שיפוץ דירה 4 חדרים?</summary>
            <p className="text-gray-500 mt-3">שיפוץ קוסמטי (צביעה ותיקונים) לדירת 4 חדרים (~100 מ״ר) עולה ₪45,000-70,000. שיפוץ קומפלט כולל מטבח ואמבטיה: ₪140,000-200,000. שיפוץ יוקרתי: ₪300,000-400,000.</p>
          </details>
          
          <details className="bg-white rounded-xl border border-gray-100 p-6">
            <summary className="font-medium text-gray-900 cursor-pointer">כמה עולה שיפוץ מטבח?</summary>
            <p className="text-gray-500 mt-3">חידוש מטבח (החלפת דלתות ופרזול): ₪5,000-15,000. מטבח חדש סטנדרטי: ₪35,000-50,000. מטבח יוקרתי: ₪70,000-100,000. המחיר תלוי בחומרים, גודל המטבח וסוג הדלתות.</p>
          </details>
          
          <details className="bg-white rounded-xl border border-gray-100 p-6">
            <summary className="font-medium text-gray-900 cursor-pointer">כמה עולה שיפוץ חדר אמבטיה?</summary>
            <p className="text-gray-500 mt-3">שיפוץ בסיסי: ₪16,000-25,000. סטנדרטי (פירוק מלא, צנרת חדשה, איטום, ריצוף וחיפוי): ₪25,000-32,000. יוקרתי: ₪32,000-45,000.</p>
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
    </div>
  );
}
