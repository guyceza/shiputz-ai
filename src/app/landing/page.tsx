"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import Link from "next/link";

/* ─────────────────────────── helpers ─────────────────────────── */

function useScrollDirection() {
  const [dir, setDir] = useState<"up" | "down">("up");
  const [y, setY] = useState(0);
  useEffect(() => {
    const handle = () => {
      const cur = window.scrollY;
      setDir(cur > y && cur > 80 ? "down" : "up");
      setY(cur);
    };
    window.addEventListener("scroll", handle, { passive: true });
    return () => window.removeEventListener("scroll", handle);
  }, [y]);
  return dir;
}

/* ─── fade-in wrapper ─── */
function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ─── animated counter ─── */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 50, damping: 20 });
  const [display, setDisplay] = useState("0");
  useEffect(() => {
    if (inView) mv.set(to);
  }, [inView, mv, to]);
  useEffect(() => {
    const unsub = spring.on("change", (v) =>
      setDisplay(Math.round(v).toLocaleString("he-IL"))
    );
    return unsub;
  }, [spring]);
  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

/* ─── before/after slider ─── */
function BeforeAfterSlider({
  beforeGradient,
  afterGradient,
  label,
}: {
  beforeGradient: string;
  afterGradient: string;
  label: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50);
  const dragging = useRef(false);

  const updatePos = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    // RTL: flip the calculation
    const pct = ((rect.right - clientX) / rect.width) * 100;
    setPos(Math.max(2, Math.min(98, pct)));
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      updatePos(e.clientX);
    },
    [updatePos]
  );
  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragging.current) updatePos(e.clientX);
    },
    [updatePos]
  );
  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return (
    <div className="space-y-3">
      <p className="text-sm text-white/50 text-center">{label}</p>
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden cursor-col-resize select-none touch-none border border-white/[0.06]"
      >
        {/* after (full bg) */}
        <div
          className="absolute inset-0"
          style={{ background: afterGradient }}
        />
        {/* before (clipped) */}
        <div
          className="absolute inset-0"
          style={{
            background: beforeGradient,
            clipPath: `inset(0 0 0 ${100 - pos}%)`,
          }}
        />
        {/* divider */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-white/80 z-10"
          style={{ right: `${pos}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="text-[#050917]"
            >
              <path
                d="M7 4L3 10L7 16M13 4L17 10L13 16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        {/* labels */}
        <span className="absolute top-3 right-3 text-xs font-bold bg-black/50 backdrop-blur px-2 py-1 rounded-full text-white/80 z-20">
          לפני
        </span>
        <span className="absolute top-3 left-3 text-xs font-bold bg-black/50 backdrop-blur px-2 py-1 rounded-full text-white/80 z-20">
          אחרי
        </span>
      </div>
    </div>
  );
}

/* ─── FAQ accordion ─── */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/[0.06]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-right gap-4 group"
      >
        <span className="text-base md:text-lg font-medium text-white/90 group-hover:text-white transition-colors">
          {q}
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-xl text-white/40 shrink-0"
        >
          +
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-white/50 leading-relaxed text-sm md:text-base">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────── icons (inline SVG) ─────────────────────────── */

const Icons = {
  visualize: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  ),
  floorplan: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <path d="M3 12h8v9M12 3v8h9" />
    </svg>
  ),
  video: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  shop: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  ),
  bill: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  quote: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  ),
  upload: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  palette: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.7-.8 1.7-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.8-1.7 1.7-1.7H16c3.3 0 6-2.7 6-6 0-5.5-4.5-9.6-10-9.4z" />
    </svg>
  ),
  sparkle: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" />
    </svg>
  ),
  star: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

/* ─────────────────────────── data ─────────────────────────── */

const features = [
  {
    icon: Icons.visualize,
    title: "הדמיות AI",
    desc: "העלו תמונה של החדר וקבלו הדמיית שיפוץ תוך 30 שניות",
    color: "#F59E0B",
    span: "md:col-span-2",
  },
  {
    icon: Icons.floorplan,
    title: "תוכניות קומה",
    desc: "הפקת תוכנית קומה אוטומטית מתמונה אחת",
    color: "#3B82F6",
    span: "",
  },
  {
    icon: Icons.video,
    title: "סיורים וירטואליים",
    desc: "סרטון תלת-ממדי של החדר המשופץ בלחיצת כפתור",
    color: "#8B5CF6",
    span: "",
  },
  {
    icon: Icons.shop,
    title: "Shop the Look",
    desc: "זיהוי אוטומטי של רהיטים ופריטים עם קישורי רכישה",
    color: "#10B981",
    span: "md:col-span-2",
  },
  {
    icon: Icons.bill,
    title: "כתב כמויות",
    desc: "הפקת כתב כמויות מפורט עם אומדן עלויות לכל פריט",
    color: "#EC4899",
    span: "",
  },
  {
    icon: Icons.quote,
    title: "ניתוח הצעות מחיר",
    desc: "השוואה חכמה של הצעות מחיר מקבלנים שונים",
    color: "#F97316",
    span: "",
  },
];

const testimonials = [
  {
    name: "שירה לוי",
    role: "מעצבת פנים",
    quote:
      "חסכתי שעות של עבודה על הדמיות. הלקוחות שלי מתלהבים כשהם רואים את התוצאה תוך שניות במקום ימים.",
    stars: 5,
  },
  {
    name: "אורן כהן",
    role: "קבלן שיפוצים",
    quote:
      "כתב הכמויות האוטומטי חסך לי טעויות יקרות. עכשיו אני נותן הצעות מחיר מדויקות יותר ומרוויח יותר.",
    stars: 5,
  },
  {
    name: "מיכל אברהם",
    role: "בעלת דירה",
    quote:
      "לפני ShiputzAI הייתי לגמרי אבודה עם השיפוץ. עכשיו אני רואה בדיוק מה אני רוצה לפני שמוציאה שקל.",
    stars: 5,
  },
];

const pricing = [
  {
    name: "Pack 10",
    price: "29",
    credits: "10",
    desc: "לניסיון ראשון",
    features: ["10 הדמיות AI", "כל הסגנונות", "תמיכה במייל"],
    highlighted: false,
  },
  {
    name: "Pro",
    price: "99",
    credits: "4",
    desc: "הכי פופולרי למקצוענים",
    features: [
      "4 הדמיות AI",
      "כתב כמויות",
      "ניתוח הצעות מחיר",
      "סיורים וירטואליים",
      "תמיכה בעדיפות",
    ],
    highlighted: true,
  },
  {
    name: "Pack 100",
    price: "149",
    credits: "100",
    desc: "למשרדים ומעצבים",
    features: [
      "100 הדמיות AI",
      "כל הכלים",
      "תמיכה בעדיפות",
      "המחיר הכי משתלם",
    ],
    highlighted: false,
  },
];

const faqs = [
  {
    q: "כמה מדויקות ההדמיות?",
    a: "ההדמיות שלנו מבוססות על מודלי AI מתקדמים שמנתחים את החדר שלכם ויוצרים תוצאה ריאליסטית. הדיוק הוא כ-90% מהתוצאה הסופית — מספיק כדי לקבל החלטות חכמות על שיפוץ.",
  },
  {
    q: "אילו סוגי חדרים נתמכים?",
    a: "כל סוג חדר — סלון, מטבח, חדר שינה, חדר אמבטיה, מרפסת, משרד ועוד. המערכת מזהה אוטומטית את סוג החדר ומתאימה את העיצוב.",
  },
  {
    q: "איך עובד מערכת הקרדיטים?",
    a: "כל הדמיה צורכת קרדיט אחד. קרדיטים לא פגים ותקפים לנצח. תוכלו לרכוש חבילות נוספות בכל עת.",
  },
  {
    q: "האם קבלנים יכולים להשתמש בשירות?",
    a: "בהחלט! קבלנים רבים משתמשים ב-ShiputzAI כדי להציג ללקוחות הדמיות של העבודה לפני תחילת הביצוע, מה שמגביר את שיעור הסגירה משמעותית.",
  },
  {
    q: "מה קורה עם הפרטיות שלי?",
    a: "התמונות שלכם מוגנות ומאובטחות. אנחנו לא משתפים תמונות עם צדדים שלישיים ולא משתמשים בהן לאימון מודלים. תוכלו למחוק את כל התמונות בכל עת.",
  },
];

/* ─────────────────────────── page ─────────────────────────── */

export default function LandingPage() {
  const scrollDir = useScrollDirection();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroImageY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <div dir="rtl" className="relative bg-[#050917] text-white overflow-x-hidden">
      {/* ── Nav ── */}
      <motion.nav
        initial={{ y: 0 }}
        animate={{ y: scrollDir === "down" ? -100 : 0 }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.04]"
        style={{ backdropFilter: "blur(20px)", background: "rgba(5,9,23,0.7)" }}
      >
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/landing"
            className="text-xl font-extrabold tracking-tight"
          >
            <span className="text-[#F59E0B]">Shiputz</span>
            <span className="text-white/90">AI</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/50">
            <a href="#how" className="hover:text-white transition-colors">
              איך זה עובד
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              יכולות
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              מחירים
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              שאלות נפוצות
            </a>
          </div>
          <Link
            href="/login"
            className="text-sm font-semibold px-5 py-2 rounded-full bg-[#F59E0B] text-[#050917] hover:bg-[#FBBF24] transition-colors"
          >
            התחילו בחינם
          </Link>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <div ref={heroRef} className="relative pt-32 md:pt-44 pb-12 px-4">
        {/* glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#F59E0B]/[0.07] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 left-1/3 w-[300px] h-[300px] bg-[#3B82F6]/[0.05] rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#F59E0B]/20 bg-[#F59E0B]/[0.06] text-[#F59E0B] text-sm font-medium mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
            AI לעיצוב הבית
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-extrabold leading-[1.1] tracking-tight"
            style={{
              fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
            }}
          >
            תראו את{" "}
            <span className="bg-gradient-to-l from-[#F59E0B] to-[#FBBF24] bg-clip-text text-transparent">
              השיפוץ
            </span>
            <br />
            לפני שמתחילים
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-5 text-base md:text-lg text-white/50 max-w-xl mx-auto leading-relaxed"
          >
            העלו תמונה של החדר, בחרו סגנון עיצוב, וקבלו הדמיית שיפוץ
            מקצועית תוך 30 שניות. בינה מלאכותית שחוסכת לכם זמן, כסף וטעויות.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#F59E0B] text-[#050917] font-bold text-base hover:bg-[#FBBF24] transition-all hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]"
            >
              התחילו בחינם
            </Link>
            <a
              href="#gallery"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full border border-white/10 text-white/70 font-medium text-base hover:border-white/20 hover:text-white transition-colors"
            >
              צפו בדוגמאות
            </a>
          </motion.div>

          {/* Hero mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            style={{ y: heroImageY }}
            className="relative mt-16 mx-auto max-w-3xl"
          >
            {/* glow behind */}
            <div className="absolute -inset-4 bg-gradient-to-b from-[#F59E0B]/10 via-[#3B82F6]/5 to-transparent rounded-3xl blur-2xl" />
            <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0d1117]">
              {/* simulated app UI */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="mr-auto text-xs text-white/30">
                  shipazti.com
                </span>
              </div>
              <div className="aspect-[16/9] bg-gradient-to-br from-[#0d1117] via-[#131a27] to-[#0d1117] relative flex items-center justify-center">
                {/* Split view mockup */}
                <div className="absolute inset-0 flex">
                  <div className="w-1/2 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-end justify-center p-6">
                    <div className="w-32 h-24 md:w-48 md:h-36 rounded-lg bg-gradient-to-t from-[#2a2a3e] to-[#3a3a5e] opacity-40" />
                  </div>
                  <div className="w-1/2 bg-gradient-to-br from-[#1a1a2e] via-[#1e3a5f] to-[#0f3460] flex items-end justify-center p-6 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#F59E0B]/5 to-[#3B82F6]/5" />
                    <div className="w-32 h-24 md:w-48 md:h-36 rounded-lg bg-gradient-to-t from-[#F59E0B]/20 to-[#3B82F6]/10 relative z-10" />
                  </div>
                </div>
                {/* Center divider */}
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/20" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 border border-white/20 backdrop-blur flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-white/60">
                    <path d="M7 4L3 10L7 16M13 4L17 10L13 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                {/* Labels */}
                <span className="absolute bottom-4 right-6 text-xs text-white/40 font-medium">לפני</span>
                <span className="absolute bottom-4 left-6 text-xs text-white/40 font-medium">אחרי</span>
              </div>
            </div>
            {/* bottom gradient fade */}
            <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-[#050917] to-transparent" />
          </motion.div>
        </div>
      </div>

      {/* ── Trust bar ── */}
      <Section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-white/40 text-sm mb-8">
            בשימוש מעצבי פנים, אדריכלים וקבלנים בכל הארץ
          </p>
          <div className="flex flex-wrap justify-center gap-10 md:gap-16">
            {[
              { label: "הדמיות נוצרו", value: 12400, suffix: "+" },
              { label: "משתמשים פעילים", value: 2800, suffix: "+" },
              { label: "שביעות רצון", value: 98, suffix: "%" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-extrabold text-white">
                  <Counter to={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-white/40 text-sm mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── How it works ── */}
      <Section id="how" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-center font-bold mb-4"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)" }}
          >
            איך זה עובד
          </h2>
          <p className="text-center text-white/40 mb-14 max-w-lg mx-auto">
            שלושה צעדים פשוטים לשיפוץ חכם
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Icons.upload,
                step: "01",
                title: "העלו תמונה",
                desc: "צלמו את החדר או העלו תמונה קיימת מהגלריה",
              },
              {
                icon: Icons.palette,
                step: "02",
                title: "בחרו סגנון",
                desc: "מודרני, סקנדינבי, תעשייתי, ים-תיכוני ועוד",
              },
              {
                icon: Icons.sparkle,
                step: "03",
                title: "קבלו הדמיה",
                desc: "תוך 30 שניות תקבלו הדמיה מקצועית של השיפוץ",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="relative group"
              >
                <div className="p-8 rounded-2xl bg-[#0d1117] border border-white/[0.04] hover:border-white/[0.08] transition-all duration-300 group-hover:-translate-y-1">
                  <span className="text-xs font-mono text-[#F59E0B]/60 tracking-widest">
                    {item.step}
                  </span>
                  <div className="mt-4 text-white/60 group-hover:text-[#F59E0B] transition-colors duration-300">
                    {item.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-bold">{item.title}</h3>
                  <p className="mt-2 text-white/40 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                {/* connector line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -left-4 w-8 border-t border-dashed border-white/[0.08]" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Before/After Gallery ── */}
      <Section id="gallery" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-center font-bold mb-4"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)" }}
          >
            לפני ואחרי
          </h2>
          <p className="text-center text-white/40 mb-14 max-w-lg mx-auto">
            גררו את הפס כדי לראות את ההבדל
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            <BeforeAfterSlider
              beforeGradient="linear-gradient(135deg, #2a2a3e 0%, #1a1a2a 50%, #252535 100%)"
              afterGradient="linear-gradient(135deg, #1e3a5f 0%, #F59E0B22 50%, #3B82F622 100%)"
              label="מטבח"
            />
            <BeforeAfterSlider
              beforeGradient="linear-gradient(135deg, #2e2e3a 0%, #1e1e28 50%, #2a2a36 100%)"
              afterGradient="linear-gradient(135deg, #2d1f4e 0%, #8B5CF622 50%, #EC489922 100%)"
              label="סלון"
            />
            <BeforeAfterSlider
              beforeGradient="linear-gradient(135deg, #282838 0%, #1c1c2c 50%, #222232 100%)"
              afterGradient="linear-gradient(135deg, #1a3a2f 0%, #10B98122 50%, #F59E0B11 100%)"
              label="חדר אמבטיה"
            />
            <BeforeAfterSlider
              beforeGradient="linear-gradient(135deg, #2c2c3a 0%, #202030 50%, #262636 100%)"
              afterGradient="linear-gradient(135deg, #1e2a4f 0%, #3B82F622 50%, #F59E0B11 100%)"
              label="חדר שינה"
            />
          </div>
        </div>
      </Section>

      {/* ── Features bento grid ── */}
      <Section id="features" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-center font-bold mb-4"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)" }}
          >
            כל מה שצריך לשיפוץ חכם
          </h2>
          <p className="text-center text-white/40 mb-14 max-w-lg mx-auto">
            חבילת כלים מלאה מבוססת בינה מלאכותית
          </p>
          <div className="grid md:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                whileHover={{ y: -4 }}
                className={`group p-6 rounded-2xl bg-[#0d1117] border border-white/[0.04] hover:border-opacity-100 transition-all duration-300 ${f.span}`}
                style={
                  {
                    "--card-color": f.color,
                  } as React.CSSProperties
                }
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300"
                  style={{
                    background: `${f.color}10`,
                    color: f.color,
                  }}
                >
                  {f.icon}
                </div>
                <h3 className="text-base font-bold mb-1.5">{f.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">
                  {f.desc}
                </p>
                {/* hover glow */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    boxShadow: `inset 0 0 0 1px ${f.color}30`,
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Testimonials ── */}
      <Section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-center font-bold mb-14"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)" }}
          >
            מה אומרים עלינו
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -4 }}
                className="p-6 rounded-2xl bg-[#0d1117] border border-white/[0.04] hover:border-white/[0.08] transition-all duration-300"
              >
                <div className="flex gap-0.5 text-[#F59E0B] mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <span key={j}>{Icons.star}</span>
                  ))}
                </div>
                <p className="text-white/60 text-sm leading-relaxed mb-5">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="font-bold text-sm">{t.name}</p>
                  <p className="text-white/40 text-xs mt-0.5">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Pricing ── */}
      <Section id="pricing" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-center font-bold mb-4"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)" }}
          >
            תוכניות ומחירים
          </h2>
          <p className="text-center text-white/40 mb-14 max-w-md mx-auto">
            קרדיטים לא פגים. שלמו פעם אחת, השתמשו מתי שרוצים.
          </p>
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {pricing.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className={`relative p-6 rounded-2xl border transition-all duration-300 ${
                  p.highlighted
                    ? "bg-[#0d1117] border-[#F59E0B]/30 shadow-[0_0_40px_rgba(245,158,11,0.08)]"
                    : "bg-[#0d1117] border-white/[0.04] hover:border-white/[0.08]"
                }`}
              >
                {p.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#F59E0B] text-[#050917] text-xs font-bold">
                    הכי פופולרי
                  </div>
                )}
                <h3 className="text-lg font-bold">{p.name}</h3>
                <p className="text-white/40 text-sm mt-1">{p.desc}</p>
                <div className="mt-5 mb-6">
                  <span className="text-4xl font-extrabold">₪{p.price}</span>
                  <span className="text-white/40 text-sm mr-1">
                    / {p.credits} קרדיטים
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  {p.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-sm text-white/60"
                    >
                      <span
                        className={
                          p.highlighted ? "text-[#F59E0B]" : "text-white/30"
                        }
                      >
                        {Icons.check}
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={`block w-full text-center py-3 rounded-full font-semibold text-sm transition-all duration-200 ${
                    p.highlighted
                      ? "bg-[#F59E0B] text-[#050917] hover:bg-[#FBBF24] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                      : "border border-white/10 text-white/70 hover:border-white/20 hover:text-white"
                  }`}
                >
                  התחילו עכשיו
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── FAQ ── */}
      <Section id="faq" className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <h2
            className="text-center font-bold mb-14"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)" }}
          >
            שאלות נפוצות
          </h2>
          <div>
            {faqs.map((f) => (
              <FAQItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </Section>

      {/* ── Final CTA ── */}
      <Section className="py-24 px-4">
        <div className="relative max-w-3xl mx-auto text-center">
          {/* glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-[#F59E0B]/[0.08] rounded-full blur-[80px] pointer-events-none" />
          <h2
            className="relative font-extrabold mb-5"
            style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}
          >
            מוכנים לראות את{" "}
            <span className="bg-gradient-to-l from-[#F59E0B] to-[#FBBF24] bg-clip-text text-transparent">
              השיפוץ
            </span>
            ?
          </h2>
          <p className="relative text-white/40 mb-8 max-w-md mx-auto">
            הצטרפו לאלפי ישראלים שכבר משפצים חכם עם בינה מלאכותית
          </p>
          <Link
            href="/login"
            className="relative inline-block px-10 py-4 rounded-full bg-[#F59E0B] text-[#050917] font-bold text-lg hover:bg-[#FBBF24] transition-all hover:shadow-[0_0_40px_rgba(245,158,11,0.35)]"
          >
            התחילו בחינם — ללא כרטיס אשראי
          </Link>
        </div>
      </Section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.04] py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-white/30">
            © {new Date().getFullYear()} ShiputzAI. כל הזכויות שמורות.
          </div>
          <div className="flex gap-6 text-sm text-white/30">
            <Link href="/terms" className="hover:text-white/50 transition-colors">
              תנאי שימוש
            </Link>
            <Link href="/privacy" className="hover:text-white/50 transition-colors">
              פרטיות
            </Link>
            <a href="mailto:support@shipazti.com" className="hover:text-white/50 transition-colors">
              צור קשר
            </a>
          </div>
        </div>
      </footer>

      {/* ── Mobile sticky CTA ── */}
      <div className="fixed bottom-0 inset-x-0 md:hidden z-40 p-3 bg-[#050917]/90 backdrop-blur border-t border-white/[0.04]">
        <Link
          href="/login"
          className="block w-full text-center py-3 rounded-full bg-[#F59E0B] text-[#050917] font-bold text-sm"
        >
          התחילו בחינם
        </Link>
      </div>
    </div>
  );
}
