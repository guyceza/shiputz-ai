"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >{children}</motion.div>
  );
}

export default function LandingPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroImgY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <div dir="rtl" className="min-h-screen bg-white" style={{ fontFamily: "'Heebo', -apple-system, sans-serif" }}>

      {/* ===== NAV ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: "rgba(255,255,255,0.75)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "1px solid rgba(0,0,0,0.06)"
        }}>
        <div className="max-w-[1200px] mx-auto px-8 h-[72px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo-no-bg.png" alt="ShiputzAI" width={36} height={36} className="rounded-xl" />
            <span className="text-[22px] font-extrabold text-[#14171f] tracking-tight">
              Shiputz<span className="text-[#4580f7]">AI</span>
            </span>
          </Link>
          <div className="flex items-center gap-8">
            <a href="#features" className="hidden md:block text-[15px] font-medium text-[#6d727e] hover:text-[#14171f] transition-colors">יכולות</a>
            <a href="#how" className="hidden md:block text-[15px] font-medium text-[#6d727e] hover:text-[#14171f] transition-colors">איך זה עובד</a>
            <a href="#pricing" className="hidden md:block text-[15px] font-medium text-[#6d727e] hover:text-[#14171f] transition-colors">מחירים</a>
            <Link href="/"
              className="bg-[#14171f] hover:bg-[#2a2d35] text-white text-[14px] font-bold px-5 py-2.5 rounded-xl transition-all hover:shadow-lg">
              התחל בחינם
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section ref={heroRef} className="relative overflow-hidden pt-[140px] pb-[80px]"
        style={{
          background: "linear-gradient(160deg, #1a3a8a 0%, #4580f7 35%, #6ba3ff 60%, #a5c8ff 80%, #e8eeff 100%)"
        }}>
        {/* Decorative shapes */}
        <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-300px] right-[-200px] w-[800px] h-[800px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 60%)" }} />
          <div className="absolute bottom-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 60%)" }} />
        </div>
        
        <div className="relative z-10 text-center px-8 max-w-[860px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2.5 bg-white/15 border border-white/20 rounded-full px-5 py-2 text-[13px] font-semibold text-white mb-8 backdrop-blur-sm"
          >
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            מופעל בינה מלאכותית
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-[clamp(40px,5vw,68px)] font-black text-white leading-[1.08] tracking-[-0.03em] mb-6"
          >
            השיפוץ שלך. חכם יותר.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-[19px] text-white/80 leading-[1.7] max-w-[560px] mx-auto mb-10"
          >
            העלו תמונה של החדר — קבלו הדמיית שיפוץ, כתב כמויות מפורט, וניתוח הצעות מחיר. הכל אוטומטי עם AI.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex gap-4 justify-center flex-wrap mb-16"
          >
            <Link href="/"
              className="bg-white hover:bg-gray-50 text-[#14171f] text-[16px] font-bold px-8 py-4 rounded-xl transition-all hover:-translate-y-0.5 shadow-[0_4px_16px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)]">
              התחל בחינם ←
            </Link>
            <a href="#how"
              className="bg-white/10 hover:bg-white/20 text-white text-[16px] font-semibold px-8 py-4 rounded-xl border border-white/20 transition-all backdrop-blur-sm">
              איך זה עובד?
            </a>
          </motion.div>

          {/* Logo Trust Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mb-16"
          >
            <p className="text-[12px] uppercase tracking-[2.5px] text-white/50 font-semibold mb-5">
              קישורים לחנויות המובילות
            </p>
            <div className="flex items-center justify-center gap-8 flex-wrap">
              {["ikea", "homecenter", "ace", "foxhome", "aminach", "tambur"].map(logo => (
                <Image key={logo} src={`/logos/${logo}.png`} alt={logo} width={80} height={24} className="h-5 w-auto brightness-0 invert opacity-50" />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Hero Screenshot - Floating */}
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ y: heroImgY }}
          className="relative max-w-[1060px] mx-auto px-8"
        >
          <div className="relative rounded-2xl overflow-hidden"
            style={{
              boxShadow: "0 30px 60px rgba(0,0,0,0.2), 0 15px 30px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.1)",
            }}>
            <Image src="/ads/screenshot-home-landscape.png" alt="ShiputzAI" width={1200} height={700} className="w-full h-auto" priority />
          </div>
        </motion.div>
      </section>

      {/* ===== STATS ===== */}
      <section className="py-20 px-8 border-b border-[#f0f0f2]">
        <div className="max-w-[1000px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { num: "63%", label: "מהיר מעיצוב ידני" },
            { num: "127+", label: "בעלי מקצוע משתמשים" },
            { num: "8", label: "כלי AI במקום אחד" },
            { num: "₪99", label: "חד פעמי — בלי מנוי" },
          ].map((s, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <div className="text-[42px] font-black text-[#14171f]">{s.num}</div>
              <div className="text-[14px] text-[#6d727e] font-medium mt-1">{s.label}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="pt-[140px] pb-[80px] px-8">
        <Reveal className="text-center mb-20">
          <h2 className="text-[clamp(32px,4vw,48px)] font-black text-[#14171f] tracking-[-0.02em] mb-4">
            הכלים שישנו לך את השיפוץ
          </h2>
          <p className="text-[18px] text-[#6d727e] max-w-[500px] mx-auto">
            כל מה שצריך כדי לתכנן, לדמיין ולחסוך
          </p>
        </Reveal>

        {/* Feature 1: Visualize */}
        <div className="max-w-[1100px] mx-auto mb-[140px]">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <Reveal>
              <span className="inline-block text-[12px] font-bold uppercase tracking-[2px] text-[#4580f7] mb-5">הדמיות AI</span>
              <h3 className="text-[32px] font-extrabold text-[#14171f] leading-[1.2] mb-5">
                העלה תמונה. קבל הדמיית שיפוץ תוך שניות.
              </h3>
              <p className="text-[17px] text-[#6d727e] leading-[1.8] mb-8">
                ה-AI מנתח את החדר שלך ומייצר הדמיה ריאליסטית של איך הוא ייראה אחרי השיפוץ. בחר סגנון, שנה צבעים, הוסף רהיטים — בלחיצה.
              </p>
              <Link href="/visualize" className="inline-flex items-center gap-2 text-[#4580f7] font-bold text-[15px] hover:gap-3 transition-all">
                נסו עכשיו ←
              </Link>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="grid grid-cols-2 gap-3 relative">
                <div className="rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-black/[0.04] relative">
                  <Image src="/examples/kitchen-before.jpg" alt="לפני" width={400} height={300} className="w-full h-full object-cover" />
                  <span className="absolute bottom-3 right-3 text-[10px] font-bold bg-white/90 text-[#14171f] px-3 py-1 rounded-lg shadow-sm backdrop-blur-sm">לפני</span>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-black/[0.04] relative">
                  <Image src="/examples/kitchen-after.jpg" alt="אחרי" width={400} height={300} className="w-full h-full object-cover" />
                  <span className="absolute bottom-3 left-3 text-[10px] font-bold bg-[#4580f7] text-white px-3 py-1 rounded-lg shadow-sm">אחרי</span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Feature 2: Style Matcher */}
        <div className="max-w-[1100px] mx-auto mb-[140px]">
          <div className="grid md:grid-cols-2 gap-20 items-center" dir="ltr">
            <Reveal delay={0.15}>
              <div className="rounded-2xl overflow-hidden shadow-[0_25px_50px_rgba(0,0,0,0.12)] border border-black/[0.04] rotate-[-1deg] hover:rotate-0 transition-transform duration-500">
                <Image src="/images/ai-vision/style-match-showcase.jpg" alt="Style Matcher" width={600} height={400} className="w-full h-auto" />
              </div>
            </Reveal>
            <Reveal className="text-right" dir="rtl">
              <span className="inline-block text-[12px] font-bold uppercase tracking-[2px] text-[#7c3aed] mb-5">STYLE MATCHER</span>
              <h3 className="text-[32px] font-extrabold text-[#14171f] leading-[1.2] mb-5">
                זיהוי סגנון + רשימת קניות מוכנה
              </h3>
              <p className="text-[17px] text-[#6d727e] leading-[1.8] mb-8">
                העלו תמונה של חדר שאהבתם — ה-AI מזהה את סגנון העיצוב, מפרט את כל המוצרים ומציע לינקים ישירים לקנייה.
              </p>
              <Link href="/style-match" className="inline-flex items-center gap-2 text-[#7c3aed] font-bold text-[15px] hover:gap-3 transition-all">
                נסו עכשיו ←
              </Link>
            </Reveal>
          </div>
        </div>

        {/* Feature 3: Floorplan */}
        <div className="max-w-[1100px] mx-auto mb-[140px]">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <Reveal>
              <span className="inline-block text-[12px] font-bold uppercase tracking-[2px] text-[#059669] mb-5">תוכנית קומה חכמה</span>
              <h3 className="text-[32px] font-extrabold text-[#14171f] leading-[1.2] mb-5">
                מתוכנית אדריכלית להדמיה תלת-ממדית
              </h3>
              <p className="text-[17px] text-[#6d727e] leading-[1.8] mb-8">
                העלו תוכנית קומה — ה-AI ממיר אותה להדמיה ריאליסטית. תראו איך הדירה תיראה במציאות, עוד לפני שהתחלתם.
              </p>
              <Link href="/floorplan" className="inline-flex items-center gap-2 text-[#059669] font-bold text-[15px] hover:gap-3 transition-all">
                נסו עכשיו ←
              </Link>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="rounded-2xl overflow-hidden shadow-[0_25px_50px_rgba(0,0,0,0.12)] border border-black/[0.04] rotate-[1deg] hover:rotate-0 transition-transform duration-500">
                <Image src="/images/ai-vision/floorplan.jpg" alt="תוכנית קומה" width={600} height={400} className="w-full h-auto" />
              </div>
            </Reveal>
          </div>
        </div>

        {/* Feature 4: Video Tour */}
        <div className="max-w-[1100px] mx-auto mb-[140px]">
          <div className="grid md:grid-cols-2 gap-20 items-center" dir="ltr">
            <Reveal delay={0.15}>
              <div className="rounded-2xl overflow-hidden shadow-[0_25px_50px_rgba(0,0,0,0.12)] border border-black/[0.04] rotate-[-1deg] hover:rotate-0 transition-transform duration-500">
                <Image src="/images/ai-vision/video-tour-thumb.jpg" alt="סיור וידאו" width={600} height={400} className="w-full h-auto" />
              </div>
            </Reveal>
            <Reveal className="text-right" dir="rtl">
              <span className="inline-block text-[12px] font-bold uppercase tracking-[2px] text-[#e11d48] mb-5">סיור וידאו AI</span>
              <h3 className="text-[32px] font-extrabold text-[#14171f] leading-[1.2] mb-5">
                הליכה וירטואלית בדירה החדשה
              </h3>
              <p className="text-[17px] text-[#6d727e] leading-[1.8] mb-8">
                סרטון AI שמדמה הליכה אמיתית בתוך ההדמיה. שתפו עם בן/בת הזוג, המעצב או הקבלן.
              </p>
              <Link href="/floorplan?mode=video" className="inline-flex items-center gap-2 text-[#e11d48] font-bold text-[15px] hover:gap-3 transition-all">
                צרו סרטון ←
              </Link>
            </Reveal>
          </div>
        </div>

        {/* Feature 5: Shop the Look */}
        <div className="max-w-[1100px] mx-auto mb-[60px]">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <Reveal>
              <span className="inline-block text-[12px] font-bold uppercase tracking-[2px] text-[#d97706] mb-5">SHOP THE LOOK</span>
              <h3 className="text-[32px] font-extrabold text-[#14171f] leading-[1.2] mb-5">
                ראית עיצוב שאהבת? קנה אותו.
              </h3>
              <p className="text-[17px] text-[#6d727e] leading-[1.8] mb-8">
                העלו תמונת השראה — ה-AI מזהה כל מוצר עם קישורים ישירים לרכישה בחנויות ישראליות.
              </p>
              <Link href="/shop-the-look" className="inline-flex items-center gap-2 text-[#d97706] font-bold text-[15px] hover:gap-3 transition-all">
                נסו עכשיו ←
              </Link>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="rounded-2xl overflow-hidden shadow-[0_25px_50px_rgba(0,0,0,0.12)] border border-black/[0.04] rotate-[1deg] hover:rotate-0 transition-transform duration-500">
                <Image src="/images/ai-vision/shop-look.jpg" alt="Shop the Look" width={600} height={400} className="w-full h-auto" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== MORE TOOLS BENTO ===== */}
      <section className="py-[120px] px-8" style={{ background: "linear-gradient(160deg, #0d9488 0%, #14b8a6 40%, #5eead4 100%)" }}>
        <Reveal className="text-center mb-14">
          <h2 className="text-[36px] font-black text-white tracking-[-0.02em] mb-3">ועוד כלים בארגז</h2>
        </Reveal>
        <div className="max-w-[1100px] mx-auto grid md:grid-cols-3 gap-5">
          {[
            { title: "כתב כמויות", desc: "צלמו את החדר וקבלו פירוט מלא — ריצוף, צבע, חשמל, אינסטלציה.", img: "/features/feature-budget.png" },
            { title: "ניתוח הצעות מחיר", desc: "העלו הצעת מחיר — ה-AI ישווה מול מחירי שוק ויגיד אם המחיר הוגן.", img: "/features/feature-receipt.png" },
            { title: "עוזר AI לשיפוץ", desc: "שאלו כל שאלה על השיפוץ וקבלו תשובה מיידית.", img: "/images/ai-vision/chat-support-thumb.jpg" },
          ].map((f, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.15)] transition-all hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)] group">
                <div className="h-[200px] overflow-hidden">
                  <Image src={f.img} alt={f.title} width={400} height={200}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-6">
                  <h4 className="text-[17px] font-bold text-[#14171f] mb-2">{f.title}</h4>
                  <p className="text-[14px] text-[#4a4f5a] leading-[1.7]">{f.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how" className="py-[140px] px-8">
        <Reveal className="text-center mb-16">
          <h2 className="text-[clamp(32px,4vw,48px)] font-black text-[#14171f] tracking-[-0.02em] mb-4">איך זה עובד?</h2>
          <p className="text-[18px] text-[#6d727e]">שלושה צעדים — מתמונה לתוכנית שיפוץ מלאה</p>
        </Reveal>
        <div className="max-w-[960px] mx-auto grid md:grid-cols-3 gap-8">
          {[
            { num: "1", title: "העלו תמונה", desc: "צלמו את החדר או העלו תמונה קיימת. ה-AI מזהה אוטומטית את המרחב." },
            { num: "2", title: "בחרו כלי", desc: "הדמיית שיפוץ? כתב כמויות? ניתוח מחיר? בחרו מה שמתאים." },
            { num: "3", title: "קבלו תוצאה", desc: "תוך שניות — תוצאה מקצועית לשיתוף עם הקבלן או בן/בת הזוג." },
          ].map((step, i) => (
            <Reveal key={i} delay={i * 0.12}>
              <div className="bg-white rounded-2xl p-8 text-center border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
                <div className="w-14 h-14 rounded-2xl bg-[#4580f7] text-white text-[22px] font-black flex items-center justify-center mx-auto mb-6 shadow-[0_4px_12px_rgba(69,128,247,0.25)]">
                  {step.num}
                </div>
                <h4 className="text-[19px] font-bold text-[#14171f] mb-3">{step.title}</h4>
                <p className="text-[15px] text-[#6d727e] leading-[1.7]">{step.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-[120px] px-8 bg-[#f6f8fb]">
        <Reveal className="text-center mb-16">
          <h2 className="text-[clamp(32px,4vw,48px)] font-black text-[#14171f] tracking-[-0.02em] mb-4">מה אומרים עלינו</h2>
          <p className="text-[18px] text-[#6d727e]">בעלי מקצוע ולקוחות שכבר משתמשים</p>
        </Reveal>
        <div className="max-w-[1100px] mx-auto grid md:grid-cols-3 gap-6">
          {[
            { text: "חסך לי שעות של עבודה. במקום לשבת עם אקסל ולחשב כמויות, פשוט צילמתי את הדירה וקיבלתי כתב כמויות מפורט תוך דקה.", name: "דניאל כ.", role: "קבלן שיפוצים, תל אביב", initial: "ד" },
            { text: "הלקוחות שלי מתים על ההדמיות. במקום להסביר במילים איך החדר ייראה, אני מראה להם תמונה ריאליסטית. סוגר עסקאות יותר מהר.", name: "שירה ד.", role: "מעצבת פנים", initial: "ש" },
            { text: "קיבלתי הצעת מחיר מקבלן והרגשתי שמשהו לא בסדר. העליתי ל-ShiputzAI וזה הראה לי שהמחיר מנופח ב-40%. חסך לי אלפי שקלים.", name: "אורן מ.", role: "בעל דירה, חיפה", initial: "א" },
          ].map((t, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="bg-white rounded-2xl p-8 border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.03)] h-full flex flex-col">
                <div className="text-[#f59e0b] text-[16px] mb-5 tracking-wider">★★★★★</div>
                <p className="text-[15px] text-[#4a4f5a] leading-[1.8] mb-6 flex-1">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-[#f0f0f2]">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4580f7] to-[#7c3aed] text-white flex items-center justify-center font-bold text-[15px]">
                    {t.initial}
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-[#14171f]">{t.name}</div>
                    <div className="text-[12px] text-[#6d727e]">{t.role}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="py-[140px] px-8">
        <Reveal className="text-center mb-16">
          <h2 className="text-[clamp(32px,4vw,48px)] font-black text-[#14171f] tracking-[-0.02em] mb-4">מחירים פשוטים</h2>
          <p className="text-[18px] text-[#6d727e]">בלי מנויים. בלי הפתעות.</p>
        </Reveal>
        <div className="max-w-[780px] mx-auto grid md:grid-cols-2 gap-6">
          {/* Free */}
          <Reveal>
            <div className="bg-white rounded-2xl p-10 border border-black/[0.06] h-full flex flex-col">
              <h4 className="text-[20px] font-bold text-[#14171f] mb-3">חינם</h4>
              <div className="text-[48px] font-black text-[#14171f] mb-1">₪0</div>
              <div className="text-[14px] text-[#6d727e] mb-8">לנצח</div>
              <ul className="flex-1 mb-8 space-y-0">
                {["הדמיית שיפוץ אחת", "כתב כמויות אחד", "ניתוח הצעת מחיר אחד", "תמיכה בצ׳אט"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 py-3 text-[15px] text-[#4a4f5a] border-b border-[#f0f0f2] last:border-none">
                    <svg className="w-4 h-4 text-[#4580f7] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/"
                className="w-full text-center bg-[#f6f8fb] hover:bg-[#eef1f6] text-[#14171f] text-[15px] font-bold py-3.5 rounded-xl transition-all border border-[#e0e3e8]">
                התחל בחינם
              </Link>
            </div>
          </Reveal>

          {/* Pro */}
          <Reveal delay={0.12}>
            <div className="relative bg-white rounded-2xl p-10 border-2 border-[#4580f7] h-full flex flex-col shadow-[0_4px_20px_rgba(69,128,247,0.1)]">
              <div className="absolute -top-3 right-6 bg-[#4580f7] text-white text-[11px] font-bold px-4 py-1.5 rounded-full">
                הכי פופולרי
              </div>
              <h4 className="text-[20px] font-bold text-[#14171f] mb-3">Pro</h4>
              <div className="text-[48px] font-black text-[#14171f] mb-1">₪99 <span className="text-[15px] font-medium text-[#6d727e]">חד פעמי</span></div>
              <div className="text-[14px] text-[#6d727e] mb-8">4 קרדיטים לכל הכלים</div>
              <ul className="flex-1 mb-8 space-y-0">
                {["4 הדמיות שיפוץ", "כתב כמויות ללא הגבלה", "ניתוח הצעות מחיר", "Shop the Look", "סריקת קבלות", "סיור וידאו AI", "תמיכה בעדיפות"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 py-3 text-[15px] text-[#4a4f5a] border-b border-[#f0f0f2] last:border-none">
                    <svg className="w-4 h-4 text-[#4580f7] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/"
                className="w-full text-center bg-[#14171f] hover:bg-[#2a2d35] text-white text-[15px] font-bold py-3.5 rounded-xl transition-all hover:shadow-lg">
                שדרג ל-Pro ←
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-[140px] px-8 text-center relative overflow-hidden"
        style={{ background: "linear-gradient(180deg, #f6f8fb 0%, #e8eeff 50%, #f0f4ff 100%)" }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(69,128,247,0.06) 0%, transparent 70%)" }} />
        <Reveal className="relative z-10">
          <h2 className="text-[clamp(36px,4.5vw,52px)] font-black text-[#14171f] tracking-[-0.02em] mb-5">
            מוכנים לשפץ חכם?
          </h2>
          <p className="text-[18px] text-[#6d727e] mb-10 max-w-[480px] mx-auto">
            הצטרפו למאות בעלי מקצוע ובעלי דירות שכבר משתמשים ב-ShiputzAI
          </p>
          <Link href="/"
            className="inline-flex bg-[#14171f] hover:bg-[#2a2d35] text-white text-[17px] font-bold px-10 py-4 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(0,0,0,0.15)]">
            התחל בחינם — בלי כרטיס אשראי ←
          </Link>
        </Reveal>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-10 px-8 border-t border-[#f0f0f2] text-center text-[14px] text-[#6d727e]">
        © 2026 ShiputzAI. כל הזכויות שמורות.
      </footer>
    </div>
  );
}
