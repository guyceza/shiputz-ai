"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  AnimatePresence,
  useMotionValue,
} from "framer-motion";
import Link from "next/link";
import Head from "next/head";

/* ───────────────────────── helpers ───────────────────────── */

function useScrolled(threshold = 10) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > threshold);
    window.addEventListener("scroll", fn, { passive: true });
    fn();
    return () => window.removeEventListener("scroll", fn);
  }, [threshold]);
  return scrolled;
}

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const end = value;
    const duration = 1600;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, value]);
  return (
    <span ref={ref}>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ───────────────────────── SVG Icons (thin line) ─────────── */

const Icons = {
  upload: (
    <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  palette: (
    <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4c3 0 5.6-2.5 5.6-5.6C22 5.8 17.5 2 12 2z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7.5" cy="11.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="7.5" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="7.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  sparkles: (
    <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3zM19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75L19 15z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  eye: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  layout: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  ),
  video: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <polygon points="23 7 16 12 23 17 23 7" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="1" y="5" width="15" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  shoppingBag: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  sliders: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <line x1="4" y1="21" x2="4" y2="14" strokeLinecap="round" />
      <line x1="4" y1="10" x2="4" y2="3" strokeLinecap="round" />
      <line x1="12" y1="21" x2="12" y2="12" strokeLinecap="round" />
      <line x1="12" y1="8" x2="12" y2="3" strokeLinecap="round" />
      <line x1="20" y1="21" x2="20" y2="16" strokeLinecap="round" />
      <line x1="20" y1="12" x2="20" y2="3" strokeLinecap="round" />
      <line x1="1" y1="14" x2="7" y2="14" strokeLinecap="round" />
      <line x1="9" y1="8" x2="15" y2="8" strokeLinecap="round" />
      <line x1="17" y1="16" x2="23" y2="16" strokeLinecap="round" />
    </svg>
  ),
  fileText: (
    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="16" y1="13" x2="8" y2="13" strokeLinecap="round" />
      <line x1="16" y1="17" x2="8" y2="17" strokeLinecap="round" />
    </svg>
  ),
  star: (
    <svg width="16" height="16" fill="#F59E0B" stroke="none" viewBox="0 0 24 24">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  check: (
    <svg width="18" height="18" fill="none" stroke="#F59E0B" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  chevronDown: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="6 9 12 15 18 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  arrowLeft: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <line x1="19" y1="12" x2="5" y2="12" strokeLinecap="round" />
      <polyline points="12 19 5 12 12 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  arrowRight: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
      <polyline points="12 5 19 12 12 19" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

/* ───────────────────────── data ──────────────────────────── */

const steps = [
  { num: "01", title: "העלו תמונה", desc: "צלמו את החדר שלכם — מהנייד או מהמחשב", icon: Icons.upload },
  { num: "02", title: "בחרו סגנון", desc: "מודרני, סקנדינבי, קלאסי — או תנו ל-AI להפתיע", icon: Icons.palette },
  { num: "03", title: "קבלו הדמיה", desc: "תוך שניות תראו את החדר המעוצב — עם רהיטים אמיתיים", icon: Icons.sparkles },
];

const features = [
  { icon: Icons.eye, title: "הדמיית AI", desc: "ראו את החדר המעוצב בלחיצה אחת" },
  { icon: Icons.layout, title: "תוכניות קומה", desc: "תכנון מרחבי חכם ומדויק" },
  { icon: Icons.video, title: "סיור וידאו", desc: "סיור וירטואלי בעיצוב החדש" },
  { icon: Icons.shoppingBag, title: "Shop the Look", desc: "קנו את המוצרים מתוך ההדמיה" },
  { icon: Icons.sliders, title: "התאמת סגנון", desc: "AI שלומד את הטעם שלכם" },
  { icon: Icons.fileText, title: "כתב כמויות", desc: "הערכת עלויות אוטומטית ומדויקת" },
];

const testimonials = [
  {
    name: "רונית כ.",
    role: "שיפצה דירת 4 חדרים",
    text: "חסכתי אלפי שקלים כי ראיתי מראש מה עובד ומה לא. המעצבת שלי השתמשה בהדמיות כבסיס לתכנון.",
    stars: 5,
  },
  {
    name: "אורי מ.",
    role: "קבלן שיפוצים",
    text: "הלקוחות שלי מקבלים את ההדמיה ומיד מבינים מה הם רוצים. חוסך לי שעות של דיונים ואי-הבנות.",
    stars: 5,
  },
  {
    name: "דנה ל.",
    role: "מעצבת פנים",
    text: "כלי עבודה מדהים. אני מציגה ללקוחות 3-4 אופציות תוך דקות במקום ימים של עבודה על רנדרים.",
    stars: 5,
  },
];

const pricingPlans = [
  {
    name: "בייסיק",
    price: "חינם",
    period: "",
    desc: "לטעימה ראשונה",
    features: ["2 הדמיות חינם", "סגנונות בסיסיים", "רזולוציה סטנדרטית", "תמיכה במייל"],
    cta: "התחילו בחינם",
    highlight: false,
  },
  {
    name: "פרו",
    price: "₪99",
    period: "",
    desc: "לפרויקט שיפוץ אחד",
    features: ["4 הדמיות", "כל הסגנונות", "רזולוציה גבוהה", "Shop the Look", "כתב כמויות", "תמיכה בצ׳אט"],
    cta: "שדרגו עכשיו",
    highlight: true,
  },
  {
    name: "חבילת 30",
    price: "₪69",
    period: "",
    desc: "לקבלנים ומעצבים",
    features: ["30 הדמיות", "כל הסגנונות", "רזולוציה גבוהה", "Shop the Look", "כתב כמויות", "סיור וידאו", "תמיכה VIP"],
    cta: "בחרו חבילה",
    highlight: false,
  },
];

const faqs = [
  { q: "כמה זמן לוקח ליצור הדמיה?", a: "בדרך כלל 10-30 שניות. ה-AI שלנו עובד מהר כדי שתקבלו תוצאה כמעט מיידית." },
  { q: "האם ההדמיות מדויקות?", a: "ההדמיות נותנות תמונה מאוד קרובה למציאות. הן מבוססות על AI מתקדם שמבין פרופורציות, תאורה וחומרים." },
  { q: "אפשר להשתמש בתמונות מהנייד?", a: "בהחלט! צלמו עם הנייד, העלו ישירות מהגלריה. עובד מעולה גם עם תמונות בזווית רחבה." },
  { q: "מה זה כתב כמויות?", a: "זו הערכת עלויות אוטומטית שמחושבת על בסיס ההדמיה — כולל חומרים, ריהוט ועבודה. חוסך לכם הפתעות." },
  { q: "יש אפשרות לקבלנים ומעצבים?", a: "כן, החבילות הגדולות שלנו מיועדות בדיוק לאנשי מקצוע שרוצים להציג ללקוחות הדמיות מרשימות." },
];

/* ───────────────────────── Before/After Slider ───────────── */

function BeforeAfterSlider() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const isDragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    // RTL: flip the calculation
    const x = rect.right - clientX;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  }, [updatePosition]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    updatePosition(e.clientX);
  }, [updatePosition]);

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[16/10] rounded-3xl overflow-hidden shadow-lg cursor-col-resize select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ touchAction: "none" }}
    >
      {/* After (full background) */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 25%, #A7F3D0 50%, #BAE6FD 75%, #DDD6FE 100%)",
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-32 h-20 mx-auto mb-4 rounded-xl bg-white/40 backdrop-blur-sm" />
            <div className="w-48 h-3 mx-auto mb-2 rounded-full bg-white/50" />
            <div className="w-36 h-3 mx-auto rounded-full bg-white/40" />
          </div>
        </div>
        <div className="absolute bottom-6 left-6 bg-white/80 backdrop-blur-sm text-gray-700 text-sm font-medium px-4 py-2 rounded-full">
          אחרי ✨
        </div>
      </div>

      {/* Before (clipped) — RTL: clip from right */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: `inset(0 0 0 ${100 - sliderPos}%)`,
          background: "linear-gradient(135deg, #F5F0E8 0%, #E8E0D4 30%, #D4C8B8 60%, #C4B8A8 100%)",
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-32 h-20 mx-auto mb-4 rounded-xl bg-white/30" />
            <div className="w-48 h-3 mx-auto mb-2 rounded-full bg-white/30" />
            <div className="w-36 h-3 mx-auto rounded-full bg-white/20" />
          </div>
        </div>
        <div className="absolute bottom-6 right-6 bg-white/80 backdrop-blur-sm text-gray-700 text-sm font-medium px-4 py-2 rounded-full">
          לפני
        </div>
      </div>

      {/* Slider handle — RTL: position from right */}
      <div
        className="absolute top-0 bottom-0 z-10"
        style={{ right: `${sliderPos}%`, transform: "translateX(50%)" }}
      >
        <div className="w-0.5 h-full bg-white/90 mx-auto" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center gap-1">
          {Icons.arrowRight}
          {Icons.arrowLeft}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── FAQ Item ──────────────────────── */

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        className="w-full flex items-center justify-between py-6 text-right gap-4 group"
        onClick={() => setOpen(!open)}
      >
        <span className="text-lg font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">{q}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-gray-400 shrink-0"
        >
          {Icons.chevronDown}
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-gray-500 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════ MAIN PAGE ═══════════════════════ */

export default function LandingPage() {
  const scrolled = useScrolled();

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap');
        .landing-root,
        .landing-root * {
          font-family: 'Heebo', sans-serif;
        }
      `}</style>

      <div dir="rtl" className="landing-root bg-white text-gray-900 antialiased">

        {/* ══════════ NAV ══════════ */}
        <motion.nav
          className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
          style={{
            backgroundColor: scrolled ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0)",
            backdropFilter: scrolled ? "blur(20px)" : "none",
            boxShadow: scrolled ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
          }}
        >
          <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-gray-900 tracking-tight">
              ShiputzAI
            </Link>
            <div className="hidden md:flex items-center gap-10 text-[15px] text-gray-500">
              <a href="#how" className="hover:text-gray-900 transition-colors">איך זה עובד</a>
              <a href="#features" className="hover:text-gray-900 transition-colors">יתרונות</a>
              <a href="#pricing" className="hover:text-gray-900 transition-colors">מחירים</a>
              <a href="#faq" className="hover:text-gray-900 transition-colors">שאלות</a>
            </div>
            <Link
              href="/login"
              className="bg-amber-400 hover:bg-amber-500 text-white font-semibold text-[15px] px-7 py-2.5 rounded-full transition-all hover:shadow-lg hover:shadow-amber-200/50"
            >
              התחילו בחינם
            </Link>
          </div>
        </motion.nav>

        {/* ══════════ HERO ══════════ */}
        <section className="pt-40 pb-20 md:pt-52 md:pb-32 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <FadeIn>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-gray-900 leading-[1.1] tracking-tight">
                תראו את השיפוץ
                <br />
                <span className="text-amber-500">לפני שמתחילים</span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.15}>
              <p className="mt-8 text-lg md:text-xl text-gray-500 leading-relaxed max-w-2xl mx-auto">
                העלו תמונה של החדר, בחרו סגנון עיצוב, וקבלו הדמיה מלאה תוך שניות.
                <br className="hidden md:block" />
                בלי מעצבים יקרים, בלי הפתעות — פשוט AI שעובד.
              </p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/login"
                  className="bg-amber-400 hover:bg-amber-500 text-white font-semibold text-lg px-10 py-4 rounded-full transition-all hover:shadow-xl hover:shadow-amber-200/50 w-full sm:w-auto"
                >
                  התחילו בחינם — ללא כרטיס אשראי
                </Link>
                <a
                  href="#how"
                  className="border border-gray-200 hover:border-gray-300 text-gray-600 font-medium text-lg px-10 py-4 rounded-full transition-all hover:shadow-md w-full sm:w-auto"
                >
                  איך זה עובד?
                </a>
              </div>
            </FadeIn>

            {/* Product mockup */}
            <FadeIn delay={0.45}>
              <div className="mt-20 md:mt-28 relative">
                <div className="rounded-3xl overflow-hidden shadow-2xl shadow-gray-200/80 border border-gray-100 bg-gradient-to-br from-gray-50 to-white aspect-[16/10]">
                  <div className="w-full h-full flex items-center justify-center relative">
                    {/* Mockup UI */}
                    <div className="absolute top-0 inset-x-0 h-12 bg-gray-50 border-b border-gray-100 flex items-center px-6 gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-200" />
                      <div className="w-3 h-3 rounded-full bg-gray-200" />
                      <div className="w-3 h-3 rounded-full bg-gray-200" />
                      <div className="mx-auto w-64 h-6 rounded-full bg-gray-100" />
                    </div>
                    <div className="flex items-center gap-8 mt-6">
                      {/* Before */}
                      <div className="w-36 sm:w-48 md:w-64 aspect-[4/3] rounded-2xl bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center">
                        <span className="text-stone-400 text-sm font-medium">לפני</span>
                      </div>
                      {/* Arrow */}
                      <div className="text-amber-400">
                        <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <line x1="19" y1="12" x2="5" y2="12" strokeLinecap="round" />
                          <polyline points="12 5 5 12 12 19" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      {/* After */}
                      <div className="w-36 sm:w-48 md:w-64 aspect-[4/3] rounded-2xl bg-gradient-to-br from-amber-100 via-emerald-100 to-sky-100 flex items-center justify-center">
                        <span className="text-emerald-500 text-sm font-medium">אחרי ✨</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ══════════ TRUST BAR ══════════ */}
        <section className="bg-[#F9FAFB] py-16 md:py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <FadeIn>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
                {[
                  { value: 12400, suffix: "+", label: "הדמיות נוצרו" },
                  { value: 3200, suffix: "+", label: "משתמשים פעילים" },
                  { value: 98, suffix: "%", label: "שביעות רצון" },
                ].map((stat, i) => (
                  <div key={i}>
                    <div className="text-3xl md:text-4xl font-bold text-gray-900">
                      <Counter value={stat.value} suffix={stat.suffix} />
                    </div>
                    <div className="mt-2 text-gray-500 text-[15px]">{stat.label}</div>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ══════════ HOW IT WORKS ══════════ */}
        <section id="how" className="py-28 md:py-36 px-6">
          <div className="max-w-5xl mx-auto">
            <FadeIn>
              <div className="text-center mb-20">
                <h2 className="text-3xl md:text-5xl font-bold text-gray-900">איך זה עובד?</h2>
                <p className="mt-5 text-gray-500 text-lg">שלושה צעדים פשוטים לעיצוב החלומות</p>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {steps.map((step, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <div className="text-center group">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-6 group-hover:bg-amber-100 transition-colors">
                      {step.icon}
                    </div>
                    <div className="text-xs font-bold text-amber-400 tracking-widest mb-3">{step.num}</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                    <p className="text-gray-500 leading-relaxed">{step.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ BEFORE/AFTER ══════════ */}
        <section className="bg-[#F9FAFB] py-28 md:py-36 px-6">
          <div className="max-w-4xl mx-auto">
            <FadeIn>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold text-gray-900">תראו את ההבדל</h2>
                <p className="mt-5 text-gray-500 text-lg">גררו את הסליידר כדי לראות את השינוי</p>
              </div>
            </FadeIn>
            <FadeIn delay={0.15}>
              <BeforeAfterSlider />
            </FadeIn>
          </div>
        </section>

        {/* ══════════ FEATURES ══════════ */}
        <section id="features" className="py-28 md:py-36 px-6">
          <div className="max-w-5xl mx-auto">
            <FadeIn>
              <div className="text-center mb-20">
                <h2 className="text-3xl md:text-5xl font-bold text-gray-900">הכל במקום אחד</h2>
                <p className="mt-5 text-gray-500 text-lg">כלי AI מתקדמים שהופכים שיפוץ לפשוט</p>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <FadeIn key={i} delay={i * 0.08}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-lg hover:shadow-gray-100/80 transition-shadow cursor-default"
                  >
                    <div className="text-gray-400 mb-5">{f.icon}</div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                    <p className="text-gray-500 text-[15px] leading-relaxed">{f.desc}</p>
                  </motion.div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ TESTIMONIALS ══════════ */}
        <section className="bg-[#F9FAFB] py-28 md:py-36 px-6">
          <div className="max-w-5xl mx-auto">
            <FadeIn>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold text-gray-900">מה אומרים עלינו</h2>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: t.stars }).map((_, j) => (
                        <span key={j}>{Icons.star}</span>
                      ))}
                    </div>
                    <p className="text-gray-600 leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>
                    <div>
                      <div className="font-semibold text-gray-900">{t.name}</div>
                      <div className="text-sm text-gray-400">{t.role}</div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ PRICING ══════════ */}
        <section id="pricing" className="py-28 md:py-36 px-6">
          <div className="max-w-5xl mx-auto">
            <FadeIn>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold text-gray-900">תוכניות ומחירים</h2>
                <p className="mt-5 text-gray-500 text-lg">בחרו את החבילה שמתאימה לכם</p>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {pricingPlans.map((plan, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <div
                    className={`relative bg-white rounded-3xl p-8 md:p-10 border transition-shadow ${
                      plan.highlight
                        ? "border-amber-300 shadow-lg shadow-amber-100/50 md:scale-105"
                        : "border-gray-100 shadow-sm hover:shadow-md"
                    }`}
                  >
                    {plan.highlight && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-white text-sm font-bold px-5 py-1.5 rounded-full">
                        הכי פופולרי
                      </div>
                    )}
                    <div className="text-center mb-8">
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                      <div className="mt-4">
                        <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                        {plan.period && <span className="text-gray-400 mr-1">{plan.period}</span>}
                      </div>
                      <p className="mt-2 text-sm text-gray-400">{plan.desc}</p>
                    </div>

                    <ul className="space-y-4 mb-10">
                      {plan.features.map((feat, j) => (
                        <li key={j} className="flex items-center gap-3 text-gray-600 text-[15px]">
                          {Icons.check}
                          {feat}
                        </li>
                      ))}
                    </ul>

                    <Link
                      href="/login"
                      className={`block w-full text-center font-semibold py-3.5 rounded-full transition-all ${
                        plan.highlight
                          ? "bg-amber-400 hover:bg-amber-500 text-white hover:shadow-lg hover:shadow-amber-200/50"
                          : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ FAQ ══════════ */}
        <section id="faq" className="bg-[#F9FAFB] py-28 md:py-36 px-6">
          <div className="max-w-3xl mx-auto">
            <FadeIn>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold text-gray-900">שאלות נפוצות</h2>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-10">
                {faqs.map((faq, i) => (
                  <FAQItem key={i} q={faq.q} a={faq.a} />
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* ══════════ FINAL CTA ══════════ */}
        <section className="py-28 md:py-36 px-6">
          <FadeIn>
            <div className="max-w-4xl mx-auto bg-amber-50 rounded-3xl p-12 md:p-20 text-center">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                מוכנים לראות את הבית החדש?
              </h2>
              <p className="text-gray-500 text-lg mb-10 max-w-xl mx-auto">
                הצטרפו לאלפי משתמשים שכבר משפצים חכם — עם הדמיות AI שחוסכות זמן, כסף ועצבים.
              </p>
              <Link
                href="/login"
                className="inline-block bg-amber-400 hover:bg-amber-500 text-white font-semibold text-lg px-12 py-4 rounded-full transition-all hover:shadow-xl hover:shadow-amber-200/50"
              >
                התחילו עכשיו — בחינם
              </Link>
            </div>
          </FadeIn>
        </section>

        {/* ══════════ FOOTER ══════════ */}
        <footer className="border-t border-gray-100 py-16 px-6">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-gray-400 text-sm">
              © {new Date().getFullYear()} ShiputzAI. כל הזכויות שמורות.
            </div>
            <div className="flex items-center gap-8 text-sm text-gray-400">
              <Link href="/terms" className="hover:text-gray-600 transition-colors">תנאי שימוש</Link>
              <Link href="/privacy" className="hover:text-gray-600 transition-colors">מדיניות פרטיות</Link>
              <a href="mailto:support@shiputz.ai" className="hover:text-gray-600 transition-colors">צרו קשר</a>
            </div>
          </div>
        </footer>

        {/* ══════════ MOBILE STICKY CTA ══════════ */}
        <div className="fixed bottom-0 inset-x-0 md:hidden bg-white/95 backdrop-blur-lg border-t border-gray-100 p-4 z-50">
          <Link
            href="/login"
            className="block w-full text-center bg-amber-400 hover:bg-amber-500 text-white font-semibold py-3.5 rounded-full transition-all"
          >
            התחילו בחינם
          </Link>
        </div>

      </div>
    </>
  );
}
