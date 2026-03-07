"use client";

import Link from "next/link";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";

const features = [
  {
    title: "תוכנית קומה",
    subtitle: "Floor Plan",
    description: "העלו תוכנית אדריכלית וקבלו הדמיה תלת-ממדית של הדירה",
    credits: 10,
    href: "/floorplan",
    image: "/images/ai-vision/floorplan.jpg",
    hasRealImage: true,
    gradient: "from-blue-500/10 to-indigo-500/10",
  },
  {
    title: "עיצוב מחדש",
    subtitle: "Reimagine My Room",
    description: "העלו תמונה של החדר וקבלו הדמיה של איך הוא יראה אחרי שיפוץ",
    credits: 10,
    href: "/visualize",
    image: "/images/ai-vision/visualize.jpg",
    hasSlider: true,
    sliderBefore: "/before-room.jpg",
    sliderAfter: "/after-room.jpg",
    gradient: "from-emerald-500/10 to-teal-500/10",
  },
  {
    title: "Shop the Look",
    subtitle: "קנו את העיצוב",
    description: "מצאו וקנו מוצרים דומים למה שרואים בהדמיה",
    credits: 3,
    href: "/shop-look",
    image: "/images/ai-vision/shop-look.jpg",
    hasRealImage: true,
    gradient: "from-amber-500/10 to-orange-500/10",
  },
  {
    title: "סיור וידאו",
    subtitle: "Video Walkthrough",
    description: "צרו סרטון AI שמדמה הליכה בחדר לפני ואחרי השיפוץ",
    credits: 25,
    href: "/floorplan?mode=video",
    image: "/images/ai-vision/video-tour.gif",
    hasRealImage: true,
    gradient: "from-purple-500/10 to-pink-500/10",
  },
  {
    title: "כתב כמויות",
    subtitle: "Bill of Quantities",
    description: "קבלו פירוט מדויק של חומרים, כמויות ועלויות לפרויקט",
    credits: 5,
    href: "/dashboard/bill-of-quantities",
    image: "/images/ai-vision/boq.gif",
    hasRealImage: true,
    gradient: "from-gray-500/10 to-slate-500/10",
  },
  {
    title: "ניתוח הצעת מחיר",
    subtitle: "Quote Analysis",
    description: "העלו הצעת מחיר מקבלן וקבלו ניתוח AI — מה סביר ומה חסר",
    credits: 3,
    href: "/dashboard",
    image: "/images/ai-vision/quote-analysis.gif",
    hasRealImage: true,
    gradient: "from-rose-500/10 to-red-500/10",
  },
  {
    title: "סריקת קבלות",
    subtitle: "Receipt Scanner",
    description: "צלמו קבלה — ה-AI קורא סכום, תאריך וקטגוריה אוטומטית",
    credits: 2,
    href: "/dashboard",
    image: "/images/ai-vision/receipt-scanner.gif",
    hasRealImage: true,
    gradient: "from-cyan-500/10 to-sky-500/10",
  },
];

export default function AIVisionPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-11 bg-white/80 backdrop-blur-xl z-50 border-b border-gray-200/50">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="text-base font-semibold text-gray-900">
            ShiputzAI
          </Link>
          <Link href="/" className="text-xs text-gray-500 hover:text-gray-900">
            חזרה לדף הבית
          </Link>
        </div>
      </nav>

      <div className="pt-20 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-3">
              AI Vision
            </h1>
            <p className="text-gray-500 text-base">
              בחרו את הכלי שמתאים לכם — כל הקסם במקום אחד
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => {
              const cardContent = (
                <>
                  {/* Image */}
                  <div className={`aspect-[4/3] bg-gradient-to-br ${feature.gradient} flex items-center justify-center overflow-hidden`}>
                    {feature.hasSlider && feature.sliderBefore && feature.sliderAfter ? (
                      <BeforeAfterSlider
                        beforeImg={feature.sliderBefore}
                        afterImg={feature.sliderAfter}
                        className="w-full aspect-[4/3]"
                        compact
                      />
                    ) : feature.image && feature.hasRealImage ? (
                      <img 
                        src={feature.image} 
                        alt={feature.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="text-4xl opacity-50 group-hover:opacity-70 transition-opacity">
                        {feature.title === "תוכנית קומה" && "📐"}
                        {feature.title === "עיצוב מחדש" && "🎨"}
                        {feature.title === "Shop the Look" && "🛒"}
                        {feature.title === "סיור וידאו" && "🎬"}
                        {feature.title === "כתב כמויות" && "📋"}
                        {feature.title === "ניתוח הצעת מחיר" && "📊"}
                        {feature.title === "סריקת קבלות" && "🧾"}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <Link href={feature.href} className="block p-4">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-base font-semibold text-gray-900 group-hover:text-gray-700">
                        {feature.title}
                      </h3>
                      <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap mr-2">
                        {feature.credits} קרדיטים
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{feature.subtitle}</p>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {feature.description}
                    </p>
                  </Link>
                </>
              );

              return feature.hasSlider ? (
                <div
                  key={feature.href + feature.title}
                  className="group relative bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 hover:shadow-lg transition-all duration-300"
                >
                  {cardContent}
                </div>
              ) : (
                <Link
                  key={feature.href + feature.title}
                  href={feature.href}
                  className="group relative bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 hover:shadow-lg transition-all duration-300"
                >
                  {cardContent}
                </Link>
              );
            })}
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-gray-400 mt-10">
            כל ההדמיות נוצרות באמצעות AI להמחשה בלבד
          </p>
        </div>
      </div>
    </div>
  );
}
