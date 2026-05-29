"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { trackAcquisitionEvent } from "@/lib/acquisition-tracking";

const examples = [
  {
    title: "סלון ריק לבית חם",
    before: "/examples/before-after-gallery/room-01-before.jpg",
    after: "/examples/before-after-gallery/room-01-after.jpg",
    prompt: "סלון מודרני חם עם ספה בהירה, שטיח וטקסטורות עץ",
  },
  {
    title: "חלל פתוח לאירוח",
    before: "/examples/before-after-gallery/room-02-before.jpg",
    after: "/examples/before-after-gallery/room-02-after.jpg",
    prompt: "סלון ופינת אוכל מודרניים באור טבעי",
  },
  {
    title: "קיר צבעוני כיתרון",
    before: "/examples/before-after-gallery/room-03-before.jpg",
    after: "/examples/before-after-gallery/room-03-after.jpg",
    prompt: "חדר עבודה וסלון קטן עם קיר ירוק עמוק",
  },
  {
    title: "דירה קלאסית רגועה",
    before: "/examples/before-after-gallery/room-04-before.jpg",
    after: "/examples/before-after-gallery/room-04-after.jpg",
    prompt: "סלון קלאסי מודרני עם ריהוט בהיר ווילונות",
  },
  {
    title: "מעטפת חדשה לחדר שינה",
    before: "/examples/before-after-gallery/room-05-before.jpg",
    after: "/examples/before-after-gallery/room-05-after.jpg",
    prompt: "חדר שינה מינימליסטי עם פרקט, מיטה וארון מובנה",
  },
  {
    title: "חדר חם בסגנון ים תיכוני",
    before: "/examples/before-after-gallery/room-06-before.jpg",
    after: "/examples/before-after-gallery/room-06-after.jpg",
    prompt: "סלון ים תיכוני עם קירות חמרה, ספה בהירה וצמחייה",
  },
];

export default function BeforeAfterGallery({ showGuestTrial = false }: { showGuestTrial?: boolean }) {
  const [active, setActive] = useState(0);
  const [slider, setSlider] = useState(52);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const current = examples[active];
  const trialHref = showGuestTrial ? "/visualize?trial=home_gallery" : "/visualize";
  const ctaLabel = showGuestTrial ? "נסו הדמיה ראשונה בחינם" : "פתחו הדמיה";

  const move = (direction: number) => {
    setActive((index) => (index + direction + examples.length) % examples.length);
    setSlider(52);
  };

  const updateSliderFromClientX = (clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const nextValue = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSlider(nextValue);
  };

  const startSliderDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    isDraggingRef.current = true;
    updateSliderFromClientX(event.clientX);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!isDraggingRef.current) return;
      updateSliderFromClientX(moveEvent.clientX);
    };

    const stopDragging = () => {
      isDraggingRef.current = false;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging, { once: true });
    window.addEventListener("pointercancel", stopDragging, { once: true });
  };

  return (
    <section className="bg-[#f8f7f4] px-4 pb-6 pt-16 md:px-6 md:pb-8 md:pt-20" dir="rtl">
      <div className="mx-auto max-w-4xl">
        <div className="mx-auto mb-6 max-w-3xl text-right">
          <h1 className="text-3xl font-semibold leading-tight text-gray-950 md:text-4xl">
            רואים את הפוטנציאל. הופכים אותו למציאות.
          </h1>
        </div>

        <div className="mx-auto max-w-3xl">
          <div className="overflow-hidden rounded-[24px] border border-black/[0.06] bg-white p-2.5 shadow-[0_18px_50px_rgba(0,0,0,0.09)]">
            <div
              ref={sliderRef}
              className="relative aspect-[4/3] touch-none overflow-hidden rounded-[20px] bg-gray-100 md:aspect-[16/8]"
              role="slider"
              aria-label="השוואת לפני ואחרי"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(slider)}
              tabIndex={0}
              onPointerDown={startSliderDrag}
              onKeyDown={(event) => {
                if (event.key === "ArrowLeft") {
                  event.preventDefault();
                  setSlider((value) => Math.max(0, value - 5));
                }
                if (event.key === "ArrowRight") {
                  event.preventDefault();
                  setSlider((value) => Math.min(100, value + 5));
                }
                if (event.key === "Home") {
                  event.preventDefault();
                  setSlider(0);
                }
                if (event.key === "End") {
                  event.preventDefault();
                  setSlider(100);
                }
              }}
            >
              <Image
                src={current.after}
                alt={`${current.title} אחרי`}
                fill
                sizes="(min-width: 1024px) 760px, 100vw"
                className="object-cover"
              />
              <div
                className="absolute inset-0"
                style={{ clipPath: `inset(0 0 0 ${slider}%)` }}
              >
                <Image
                  src={current.before}
                  alt={`${current.title} לפני`}
                  fill
                  sizes="(min-width: 1024px) 760px, 100vw"
                  className="object-cover"
                />
              </div>

              <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-gray-950 shadow-sm backdrop-blur">
                לפני
              </div>
              <div className="absolute left-4 top-4 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                אחרי
              </div>

              <div
                className="pointer-events-none absolute top-0 bottom-0 z-20 w-0.5 bg-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.12)]"
                style={{ left: `${slider}%`, transform: "translateX(-50%)" }}
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute bottom-[18px] z-20 h-8 w-8 rounded-full border-4 border-white bg-white shadow-[0_6px_18px_rgba(0,0,0,0.25)]"
                style={{ left: `${slider}%`, transform: "translateX(-50%)" }}
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute inset-x-5 bottom-[31px] z-10 h-1.5 rounded-full bg-white/85 shadow-sm"
                aria-hidden="true"
              />

            </div>

            <div className="relative flex flex-col gap-4 px-2 py-4 md:min-h-[64px] md:justify-center">
              <div className="text-center md:max-w-[40%] md:text-right">
                <h3 className="text-xl font-semibold text-gray-950">{current.title}</h3>
                <p className="mt-1 text-sm leading-6 text-gray-500">{current.prompt}</p>
              </div>
              <div className="flex items-center justify-center gap-2 md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2">
                <button
                  type="button"
                  onClick={() => move(-1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition-colors hover:bg-gray-50"
                  aria-label="דוגמה קודמת"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition-colors hover:bg-gray-50"
                  aria-label="דוגמה הבאה"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <Link
                  href={trialHref}
                  onClick={() =>
                    trackAcquisitionEvent("cta_click", {
                      eventName: showGuestTrial ? "home_gallery_trial" : "home_gallery_visualize",
                      targetUrl: trialHref,
                    })
                  }
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-gray-950 px-4 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                >
                  {ctaLabel}
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </div>
              {showGuestTrial && (
                <p className="text-center text-xs font-medium text-gray-500 md:absolute md:bottom-1 md:left-1/2 md:-translate-x-1/2">
                  בלי כרטיס אשראי · 10 קרדיטים בהרשמה · תוצאה תוך דקה
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
