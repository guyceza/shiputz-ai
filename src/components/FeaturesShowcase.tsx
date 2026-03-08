"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Sparkles, Home, Video, FileText, Receipt, ShoppingBag, Palette } from "lucide-react";

const mainFeatures = [
  {
    title: "Style Matcher",
    subtitle: "זיהוי סגנון + רשימת קניות",
    description: "העלו תמונה של חדר שאהבתם — ה-AI מזהה את סגנון העיצוב, מפרט את כל המוצרים ומציע לינקים ישירים לקנייה בישראל. כולל מפת חומרים וטקסטורות.",
    image: "/images/ai-vision/style-match-showcase.jpg",
    href: "/style-match",
    cta: "נסו עכשיו",
  },
  {
    title: "תוכנית קומה חכמה",
    subtitle: "מתוכנית אדריכלית להדמיה תלת-ממדית",
    description: "העלו תוכנית קומה — ה-AI ממיר אותה להדמיה ריאליסטית של הדירה. תראו איך הסלון, המטבח וחדרי השינה ייראו במציאות, עוד לפני שהתחלתם.",
    image: "/images/ai-vision/floorplan.jpg",
    href: "/floorplan",
    cta: "נסו עכשיו",
  },
  {
    title: "סיור וידאו AI",
    subtitle: "הליכה וירטואלית בדירה החדשה",
    description: "סרטון AI שמדמה הליכה אמיתית בתוך ההדמיה שלכם. שתפו עם בן/בת הזוג, המעצב או הקבלן — כולם רואים את אותה חזון.",
    image: "/images/ai-vision/video-tour.gif",
    href: "/floorplan?mode=video",
    cta: "צרו סרטון",
    isGif: true,
  },
];

const teaserFeatures = [
  {
    icon: Sparkles,
    title: "עיצוב מחדש",
    description: "הדמיית AI של החדר בעיצוב חדש",
    href: "/visualize",
  },
  {
    icon: FileText,
    title: "כתב כמויות",
    description: "פירוט חומרים, כמויות ועלויות",
    href: "/dashboard/boq",
  },
  {
    icon: Receipt,
    title: "ניתוח הצעת מחיר",
    description: "בדיקה אוטומטית של הצעות מקבלנים",
    href: "/dashboard",
  },
  {
    icon: ShoppingBag,
    title: "סריקת קבלות",
    description: "צילום קבלה → סכום, תאריך וקטגוריה",
    href: "/dashboard",
  },
];

export default function FeaturesShowcase() {
  return (
    <div className="space-y-24 md:space-y-32">
      {/* Main Features - Alternating Layout */}
      {mainFeatures.map((feature, index) => {
        const imageOnRight = index % 2 === 0; // 0,2 = right, 1 = left

        return (
          <div
            key={feature.title}
            className={`flex flex-col ${imageOnRight ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-8 md:gap-16`}
          >
            {/* Image */}
            <div className="w-full md:w-1/2">
              <Link href={feature.href} className="block group">
                <div className="relative rounded-2xl overflow-hidden shadow-xl group-hover:shadow-2xl transition-shadow duration-300">
                  {feature.isGif ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-auto"
                    />
                  ) : (
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      width={600}
                      height={400}
                      className="w-full h-auto object-cover"
                    />
                  )}
                </div>
              </Link>
            </div>

            {/* Text */}
            <div className="w-full md:w-1/2 text-right">
              <p className="text-sm font-medium text-gray-400 tracking-widest uppercase mb-2">
                {feature.subtitle}
              </p>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                {feature.description}
              </p>
              <Link
                href={feature.href}
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 rotate-180" />
                {feature.cta}
              </Link>
            </div>
          </div>
        );
      })}

      {/* "ועוד הרבה" Teaser Section */}
      <div className="pt-8">
        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-4">
          ועוד הרבה...
        </h3>
        <p className="text-gray-500 text-center mb-10 max-w-md mx-auto">
          כלים נוספים שיעזרו לכם בכל שלב של השיפוץ
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {teaserFeatures.map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="group bg-gray-50 hover:bg-white border border-gray-100 hover:border-gray-200 rounded-2xl p-5 md:p-6 text-center transition-all duration-200 hover:shadow-lg"
            >
              <feature.icon className="w-8 h-8 text-gray-400 group-hover:text-gray-900 mx-auto mb-3 transition-colors" />
              <h4 className="font-semibold text-gray-900 mb-1 text-sm md:text-base">{feature.title}</h4>
              <p className="text-gray-500 text-xs md:text-sm leading-snug">{feature.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
