"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Feature {
  title: string;
  subtitle?: string;
  description: string;
  image: string;
  href: string;
  cta?: string;
  video?: string;
  isGif?: boolean;
  toolKey?: string;
}

const mainFeatures: Feature[] = [
  {
    title: "Style Matcher",
    subtitle: "זיהוי סגנון + רשימת קניות",
    description: "העלו תמונה של חדר שאהבתם - ה-AI מזהה את סגנון העיצוב, מפרט את כל המוצרים ומציע לינקים ישירים לקנייה בישראל. כולל מפת חומרים וטקסטורות.",
    image: "/images/ai-vision/style-match-showcase.jpg",
    href: "/style-match",
    cta: "נסו עכשיו",
    toolKey: "style-match",
  },
  {
    title: "תוכנית קומה חכמה",
    subtitle: "מתוכנית אדריכלית להדמיה תלת-ממדית",
    description: "העלו תוכנית קומה - ה-AI ממיר אותה להדמיה ריאליסטית של הדירה. תראו איך הסלון, המטבח וחדרי השינה ייראו במציאות, עוד לפני שהתחלתם.",
    image: "/images/ai-vision/floorplan.jpg",
    href: "/floorplan",
    cta: "נסו עכשיו",
    toolKey: "floorplan",
  },
  {
    title: "סיור וידאו AI",
    subtitle: "הליכה וירטואלית בדירה החדשה",
    description: "סרטון AI שמדמה הליכה אמיתית בתוך ההדמיה שלכם. שתפו עם בן/בת הזוג, המעצב או הקבלן - כולם רואים את אותו חזון.",
    image: "/images/ai-vision/video-tour-thumb.jpg",
    video: "/images/ai-vision/video-tour-showcase.mp4",
    href: "/floorplan?mode=video",
    cta: "צרו סרטון",
    toolKey: "video-tour",
  },
];

const teaserFeatures: Feature[] = [
  {
    title: "עוזר AI לשיפוץ",
    description: "שאל כל שאלה על השיפוץ וקבל תשובה מיידית",
    href: "/dashboard",
    image: "/images/ai-vision/chat-support-thumb.jpg",
    video: "/images/ai-vision/chat-support-showcase.mp4",
    toolKey: "chat",
  },
  {
    title: "עיצוב מחדש",
    description: "הדמיית AI של החדר בעיצוב חדש",
    href: "/visualize",
    image: "/images/ai-vision/visualize-teaser.jpg",
    toolKey: "visualize",
  },
  {
    title: "כתב כמויות",
    description: "פירוט חומרים, כמויות ועלויות",
    href: "/dashboard/bill-of-quantities",
    image: "/images/ai-vision/boq.gif",
    isGif: true,
    toolKey: "boq",
  },
  {
    title: "ניתוח הצעת מחיר",
    description: "בדיקה אוטומטית של הצעות מקבלנים",
    href: "/quote-analysis",
    image: "/images/ai-vision/quote-analysis.gif",
    isGif: true,
    toolKey: "quotes",
  },
  {
    title: "סריקת קבלות",
    description: "צילום קבלה → סכום, תאריך וקטגוריה",
    href: "/receipt-scanner",
    image: "/images/ai-vision/receipt-scanner.gif",
    isGif: true,
    toolKey: "receipts",
  },
];

function CardDeck({ features }: { features: Feature[] }) {
  const total = features.length;

  return (
    <Link href="/ai-vision" className="block pt-12 pb-4 group" aria-label="מעבר לדף AI Vision">
      {/* Title + card deck */}
      <div className="text-center mb-8">
        <h3 className="text-2xl md:text-3xl font-bold text-gray-900">ועוד הרבה...</h3>
        <p className="text-sm text-gray-500 mt-1 group-hover:text-gray-700 transition-colors">לחצו לגלות ↓</p>
      </div>

      {/* Collapsed: stacked card deck */}
      <div
        className="relative mx-auto cursor-pointer"
        style={{ height: '220px', maxWidth: '300px' }}
      >
        {features.map((feature, i) => {
          const spreadAngle = 30;
          const angleStep = total > 1 ? spreadAngle / (total - 1) : 0;
          const rotate = -spreadAngle / 2 + i * angleStep;
          const yOffset = Math.abs(rotate) * 0.5;

          return (
            <div
              key={feature.title}
              className="absolute left-1/2 transition-all duration-500 ease-out"
              style={{
                width: '240px',
                marginLeft: '-120px',
                transform: `translateY(${yOffset}px) rotate(${rotate}deg)`,
                zIndex: total - i,
                transformOrigin: 'bottom center',
              }}
            >
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-lg group-hover:shadow-xl transition-shadow">
                <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                  {feature.video ? (
                    <video src={feature.video} poster={feature.image} muted playsInline preload="none" className="w-full h-full object-cover" />
                  ) : feature.isGif ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={feature.image} alt={feature.title} className="w-full h-full object-cover" />
                  ) : (
                    <Image src={feature.image} alt={feature.title} width={300} height={225} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-3 text-center">
                  <h4 className="font-semibold text-gray-900 text-sm">{feature.title}</h4>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Link>
  );
}

export default function FeaturesShowcase() {
  return (
    <div className="space-y-24 md:space-y-32">
      {/* Main Features - Alternating Layout */}
      {mainFeatures.map((feature, index) => {
        const imageOnLeft = index % 2 === 0;

        return (
          <div
            key={feature.title}
            className={`flex flex-col ${imageOnLeft ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-8 md:gap-16`}
          >
            {/* Image */}
            <div className="w-full md:w-1/2">
              <Link href={feature.href} className="block group">
                <div className="relative rounded-2xl overflow-hidden shadow-xl group-hover:shadow-2xl transition-shadow duration-300">
                  {'video' in feature && feature.video ? (
                    <video
                      src={feature.video}
                      poster={feature.image}
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="metadata"
                      className="w-full h-auto object-cover"
                    />
                  ) : feature.isGif ? (
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
                <ArrowLeft className={`w-4 h-4 ${imageOnLeft ? '' : 'rotate-180'}`} />
                {feature.cta}
              </Link>
            </div>
          </div>
        );
      })}

      {/* Card Deck Section */}
      <CardDeck features={teaserFeatures} />
    </div>
  );
}
