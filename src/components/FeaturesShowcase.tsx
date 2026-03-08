"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BeforeAfterSlider from "./BeforeAfterSlider";

interface Feature {
  title: string;
  subtitle?: string;
  description: string;
  image: string;
  href: string;
  cta?: string;
  video?: string;
  isGif?: boolean;
  beforeAfter?: { before: string; after: string };
}

const mainFeatures: Feature[] = [
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
    image: "/images/ai-vision/video-tour-thumb.jpg",
    video: "/images/ai-vision/video-tour-showcase.mp4",
    href: "/floorplan?mode=video",
    cta: "צרו סרטון",
  },
];

const teaserFeatures: Feature[] = [
  {
    title: "עוזר AI לשיפוץ",
    description: "שאל כל שאלה על השיפוץ וקבל תשובה מיידית",
    href: "/dashboard",
    image: "/images/ai-vision/chat-support-thumb.jpg",
    video: "/images/ai-vision/chat-support-showcase.mp4",
  },
  {
    title: "עיצוב מחדש",
    description: "הדמיית AI של החדר בעיצוב חדש",
    href: "/visualize",
    image: "/images/ai-vision/visualize-teaser.jpg",
    beforeAfter: {
      before: "/before-room.webp",
      after: "/after-room.webp",
    },
  },
  {
    title: "כתב כמויות",
    description: "פירוט חומרים, כמויות ועלויות",
    href: "/dashboard/bill-of-quantities",
    image: "/images/ai-vision/boq.gif",
    isGif: true,
  },
  {
    title: "ניתוח הצעת מחיר",
    description: "בדיקה אוטומטית של הצעות מקבלנים",
    href: "/quote-analysis",
    image: "/images/ai-vision/quote-analysis.gif",
    isGif: true,
  },
  {
    title: "סריקת קבלות",
    description: "צילום קבלה → סכום, תאריך וקטגוריה",
    href: "/receipt-scanner",
    image: "/images/ai-vision/receipt-scanner.gif",
    isGif: true,
  },
];

function CardDeck({ features }: { features: Feature[] }) {
  const [fanned, setFanned] = useState(false);
  const total = features.length;
  // Each fanned card shows ~60px of the card above (title visible) + full last card
  const cardPeek = 60;
  const cardHeight = 300;
  const fannedHeight = (total - 1) * cardPeek + cardHeight + 80;

  return (
    <div className="pt-12 pb-4">
      {/* Title always on top */}
      <div className="text-center mb-6 cursor-pointer" onClick={() => setFanned(!fanned)}>
        <h3 className="text-2xl md:text-3xl font-bold text-gray-900">ועוד הרבה...</h3>
        <p className="text-sm text-gray-500 mt-1">{fanned ? 'לחצו לסגור' : 'לחצו לגלות'}</p>
      </div>

      {/* Card stack */}
      <div
        className="relative mx-auto cursor-pointer"
        style={{ height: fanned ? `${fannedHeight}px` : '260px', maxWidth: '340px', transition: 'height 0.5s ease-out' }}
        onClick={() => setFanned(!fanned)}
      >
        {features.map((feature, i) => {
          // Collapsed: stacked with rotation fan
          const spreadAngle = 36;
          const angleStep = total > 1 ? spreadAngle / (total - 1) : 0;
          const collapsedRotate = -spreadAngle / 2 + i * angleStep;
          const collapsedY = Math.abs(collapsedRotate) * 0.6;
          
          // Fanned: cascading down, each card offset so title of card below is visible
          const fannedY = i * cardPeek;

          return (
            <div
              key={feature.title}
              className="absolute left-1/2 transition-all duration-500 ease-out"
              style={{
                width: '280px',
                marginLeft: '-140px',
                transform: fanned
                  ? `translateY(${fannedY}px) rotate(0deg)`
                  : `translateY(${collapsedY}px) rotate(${collapsedRotate}deg)`,
                zIndex: fanned ? total - i : total - i,
                transformOrigin: 'bottom center',
              }}
            >
              <Link
                href={feature.href}
                onClick={(e) => { if (!fanned) e.preventDefault(); }}
                className={`block bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-lg ${fanned ? 'hover:shadow-xl' : 'pointer-events-none'} transition-shadow`}
              >
                {/* Title bar — always visible when fanned */}
                <div className="p-3 text-center border-b border-gray-100 bg-white">
                  <h4 className="font-semibold text-gray-900 text-sm">{feature.title}</h4>
                  <p className="text-gray-400 text-[11px]">{feature.description}</p>
                </div>
                <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                  {feature.video ? (
                    <video
                      src={feature.video}
                      poster={feature.image}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : feature.beforeAfter ? (
                    <BeforeAfterSlider
                      beforeImg={feature.beforeAfter.before}
                      afterImg={feature.beforeAfter.after}
                      height="aspect-[4/3]"
                    />
                  ) : feature.isGif ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={feature.image} alt={feature.title} className="w-full h-full object-cover" />
                  ) : (
                    <Image src={feature.image} alt={feature.title} width={300} height={225} className="w-full h-full object-cover" />
                  )}
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
                  {'video' in feature && feature.video ? (
                    <video
                      src={feature.video}
                      poster={feature.image}
                      autoPlay
                      loop
                      muted
                      playsInline
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
                <ArrowLeft className="w-4 h-4 rotate-180" />
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
