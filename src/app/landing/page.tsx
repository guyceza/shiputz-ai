"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  useMotionValue,
  useAnimationControls,
  AnimatePresence,
} from "framer-motion";

/* ─────────────────────── HELPERS ─────────────────────── */

// Word-by-word text reveal component
function WordReveal({
  text,
  className = "",
  delay = 0,
  wordDelay = 0.04,
}: {
  text: string;
  className?: string;
  delay?: number;
  wordDelay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  const words = text.split(" ");

  return (
    <div ref={ref} className={className} style={{ direction: "rtl" }}>
      {words.map((word, i) => (
        <span
          key={i}
          style={{
            overflow: "hidden",
            display: "inline-block",
            marginLeft: "0.3em",
          }}
        >
          <motion.span
            style={{ display: "inline-block" }}
            variants={{
              closed: { y: "110%" },
              open: {
                y: "0%",
                transition: {
                  duration: 0.6,
                  delay: delay + wordDelay * i,
                  ease: [0.33, 1, 0.68, 1],
                },
              },
            }}
            animate={isInView ? "open" : "closed"}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </div>
  );
}

// Character-by-character reveal
function CharReveal({
  text,
  className = "",
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  const chars = text.split("");

  return (
    <div ref={ref} className={className} style={{ direction: "rtl" }}>
      {chars.map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, filter: "blur(4px)" }}
          animate={
            isInView
              ? {
                  opacity: 1,
                  filter: "blur(0px)",
                  transition: {
                    duration: 0.3,
                    delay: delay + 0.02 * i,
                    ease: "easeOut",
                  },
                }
              : {}
          }
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </div>
  );
}

// Magnetic button component
function MagneticButton({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const px = e.clientX - rect.left - rect.width / 2;
      const py = e.clientY - rect.top - rect.height / 2;
      x.set(px * 0.3);
      y.set(py * 0.3);
    },
    [x, y]
  );

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.button
      ref={buttonRef}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={className}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.button>
  );
}

// Spring counter for stats
function SpringCounter({
  target,
  suffix = "",
  prefix = "",
}: {
  target: number;
  suffix?: string;
  prefix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20%" });
  const motionVal = useMotionValue(0);
  const springVal = useSpring(motionVal, {
    stiffness: 80,
    damping: 20,
    mass: 1,
  });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (isInView) {
      motionVal.set(target);
    }
  }, [isInView, target, motionVal]);

  useEffect(() => {
    const unsub = springVal.on("change", (v) => {
      setDisplay(Math.round(v).toLocaleString());
    });
    return unsub;
  }, [springVal]);

  return (
    <span ref={ref}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

// 3D tilt card
function TiltCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springRotateX = useSpring(rotateX, { stiffness: 200, damping: 20 });
  const springRotateY = useSpring(rotateY, { stiffness: 200, damping: 20 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const px = (e.clientX - centerX) / (rect.width / 2);
      const py = (e.clientY - centerY) / (rect.height / 2);
      rotateY.set(px * 10);
      rotateX.set(-py * 10);
    },
    [rotateX, rotateY]
  );

  const handleMouseLeave = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
  }, [rotateX, rotateY]);

  return (
    <motion.div
      ref={cardRef}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformPerspective: 800,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Morphing SVG blob
function MorphBlob({
  color,
  size,
  top,
  left,
  delay = 0,
}: {
  color: string;
  size: number;
  top: string;
  left: string;
  delay?: number;
}) {
  const paths = [
    "M44.5,-76.3C57.1,-68.7,66.5,-55.7,73.8,-41.8C81.1,-27.8,86.4,-12.9,85.5,1.5C84.5,15.9,77.3,29.7,68.2,41.8C59.2,53.9,48.3,64.2,35.5,71.5C22.8,78.8,8.1,83.1,-6.2,82.2C-20.5,81.3,-34.5,75.2,-46.8,66.7C-59.2,58.2,-70,47.3,-76.5,34.1C-82.9,20.9,-85,5.4,-82.3,-9.1C-79.5,-23.6,-71.9,-37.2,-61.5,-47.7C-51.1,-58.2,-37.9,-65.7,-24.3,-72.5C-10.7,-79.3,3.3,-85.5,17.5,-84.1C31.7,-82.7,31.9,-83.8,44.5,-76.3Z",
    "M42.7,-73.4C55.2,-66.8,64.8,-54.5,72.5,-40.9C80.2,-27.3,86,-12.3,84.9,2C83.7,16.2,75.5,29.8,66.2,42.2C56.9,54.7,46.5,66,33.7,72.8C20.9,79.6,5.8,81.8,-8.7,79.8C-23.2,77.8,-37.1,71.5,-49.2,63C-61.3,54.5,-71.6,43.8,-77.2,31C-82.8,18.2,-83.7,3.3,-80.8,-10.5C-77.9,-24.3,-71.2,-37,-61.2,-46.7C-51.2,-56.4,-37.9,-63.1,-24.7,-69.1C-11.5,-75.1,1.6,-80.5,15.3,-80.5C29,-80.5,30.2,-80,42.7,-73.4Z",
    "M38.9,-67.2C50.2,-60.5,58.8,-48.7,66.3,-35.8C73.7,-22.8,80,-8.7,79.6,5.2C79.2,19.1,72.1,32.9,63,44.2C53.9,55.5,42.8,64.4,30.1,70.2C17.3,76.1,3,79,-11.3,77.4C-25.5,75.8,-39.8,69.7,-51.3,60.8C-62.8,51.9,-71.6,40.2,-76.7,26.8C-81.7,13.5,-83.1,-1.5,-79.7,-15.3C-76.3,-29.1,-68.1,-41.7,-57,-50.7C-46,-59.7,-32.1,-65.1,-18.7,-70.4C-5.3,-75.7,7.5,-80.9,20.7,-79.6C33.9,-78.4,27.6,-73.8,38.9,-67.2Z",
  ];

  return (
    <motion.div
      style={{
        position: "absolute",
        top,
        left,
        width: size,
        height: size,
        opacity: 0.07,
        zIndex: 0,
        filter: "blur(40px)",
      }}
      animate={{
        rotate: [0, 360],
        scale: [1, 1.1, 0.95, 1.05, 1],
      }}
      transition={{
        rotate: { duration: 40, repeat: Infinity, ease: "linear" },
        scale: {
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay,
        },
      }}
    >
      <svg viewBox="-100 -100 200 200" style={{ width: "100%", height: "100%" }}>
        <motion.path
          fill={color}
          animate={{
            d: [...paths, paths[0]],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay,
          }}
        />
      </svg>
    </motion.div>
  );
}

// SVG icon draw-in animation
function AnimatedIcon({
  path,
  isInView,
  delay = 0,
}: {
  path: string;
  isInView: boolean;
  delay?: number;
}) {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#F59E0B"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <motion.path
        d={path}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={
          isInView
            ? { pathLength: 1, opacity: 1, transition: { duration: 1.2, delay, ease: "easeInOut" } }
            : {}
        }
      />
    </svg>
  );
}

/* ─────────────────────── DATA ─────────────────────── */

const ROOM_GRADIENTS_ROW1 = [
  "linear-gradient(135deg, #fde68a 0%, #f59e0b 100%)",
  "linear-gradient(135deg, #fed7aa 0%, #fb923c 100%)",
  "linear-gradient(135deg, #fecaca 0%, #f87171 100%)",
  "linear-gradient(135deg, #e9d5ff 0%, #a78bfa 100%)",
  "linear-gradient(135deg, #bfdbfe 0%, #60a5fa 100%)",
  "linear-gradient(135deg, #bbf7d0 0%, #4ade80 100%)",
  "linear-gradient(135deg, #fde68a 0%, #fbbf24 100%)",
];

const ROOM_GRADIENTS_ROW2 = [
  "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
  "linear-gradient(135deg, #fb923c 0%, #ea580c 100%)",
  "linear-gradient(135deg, #f87171 0%, #dc2626 100%)",
  "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
  "linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)",
  "linear-gradient(135deg, #4ade80 0%, #16a34a 100%)",
  "linear-gradient(135deg, #fbbf24 0%, #b45309 100%)",
];

const ROOM_LABELS = ["סלון", "מטבח", "חדר שינה", "אמבטיה", "מרפסת", "חדר ילדים", "חדר עבודה"];

const FEATURES = [
  {
    title: "הדמיה בזמן אמת",
    desc: "AI שרואה את החדר שלכם ומציג איך הוא ייראה אחרי שיפוץ",
    icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
  },
  {
    title: "כתב כמויות אוטומטי",
    desc: "מקבלים פירוט מלא של חומרים ועלויות בלחיצת כפתור",
    icon: "M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zM6 20V4h5v7h7v9H6z",
  },
  {
    title: "השוואת הצעות מחיר",
    desc: "מעלים הצעות מחיר והמערכת מנתחת ומשווה אוטומטית",
    icon: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z",
  },
  {
    title: "סריקת קבלות",
    desc: "מצלמים קבלה והמערכת מזהה ומסווגת הוצאות אוטומטית",
    icon: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6zm0 4h8v2H6zm10 0h2v2h2zm-6-4h8v2h-8z",
  },
];

const STEPS = [
  {
    num: "01",
    title: "מצלמים את החדר",
    desc: "פשוט מצלמים תמונה של החדר שרוצים לשפץ. זהו, זה כל מה שצריך לעשות.",
  },
  {
    num: "02",
    title: "בוחרים סגנון",
    desc: "מודרני, כפרי, מינימליסטי, סקנדינבי — בחרו את הסגנון שמדבר אליכם.",
  },
  {
    num: "03",
    title: "מקבלים הדמיה מלאה",
    desc: "תוך שניות תקבלו הדמיה מפורטת עם כתב כמויות ואומדן עלויות.",
  },
];

const TESTIMONIALS = [
  {
    name: "מיכל כ.",
    text: "לא האמנתי שאפשר לראות את השיפוץ לפני שמתחילים. חסך לנו טעויות של עשרות אלפי שקלים!",
    rating: 5,
  },
  {
    name: "אלון ד.",
    text: "הכלי הכי שימושי שמצאתי. העליתי תמונה של המטבח וקיבלתי הדמיה מטורפת תוך 10 שניות.",
    rating: 5,
  },
  {
    name: "נועה ר.",
    text: "כקבלנית שיפוצים, זה כלי שעוזר לי להציג ללקוחות בדיוק מה הם יקבלו. מקצועי ומדויק.",
    rating: 5,
  },
];

const PRICING = [
  {
    name: "התנסות",
    price: "חינם",
    priceNum: "",
    features: ["הדמיה אחת בחינם", "סגנון אחד", "רזולוציה רגילה"],
    popular: false,
  },
  {
    name: "Pro",
    price: "₪99",
    priceNum: "99",
    features: [
      "4 הדמיות",
      "כל הסגנונות",
      "רזולוציה גבוהה",
      "כתב כמויות",
      "השוואת הצעות מחיר",
    ],
    popular: true,
  },
  {
    name: "חבילת 30",
    price: "₪69",
    priceNum: "69",
    features: [
      "30 הדמיות",
      "כל הסגנונות",
      "רזולוציה גבוהה",
      "כתב כמויות",
      "השוואת הצעות מחיר",
      "תמיכה מועדפת",
    ],
    popular: false,
  },
];

/* ─────────────────────── SECTIONS ─────────────────────── */

function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [0.85, 1.05]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <section
      ref={containerRef}
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        padding: "2rem",
      }}
    >
      {/* Floating blobs */}
      <MorphBlob color="#F59E0B" size={600} top="-10%" left="-10%" delay={0} />
      <MorphBlob color="#FB923C" size={500} top="50%" left="70%" delay={3} />
      <MorphBlob color="#FBBF24" size={400} top="20%" left="50%" delay={6} />

      <motion.div style={{ opacity, y, position: "relative", zIndex: 1, textAlign: "center", width: "100%", maxWidth: 900 }}>
        <WordReveal
          text="תראו את השיפוץ לפני שמתחילים"
          className="hero-headline"
          delay={0.3}
          wordDelay={0.08}
        />

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2, ease: [0.33, 1, 0.68, 1] }}
          style={{
            fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)",
            color: "#64748B",
            marginTop: "1.5rem",
            direction: "rtl",
            lineHeight: 1.6,
          }}
        >
          העלו תמונה של החדר, בחרו סגנון, וקבלו הדמיה מושלמת תוך שניות.
          <br />
          בינה מלאכותית שהופכת דמיון למציאות.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.6, ease: [0.33, 1, 0.68, 1] }}
          style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "2.5rem", flexWrap: "wrap" }}
        >
          <MagneticButton className="btn-primary">
            נסו בחינם ←
          </MagneticButton>
          <MagneticButton className="btn-secondary">
            ראו איך זה עובד
          </MagneticButton>
        </motion.div>
      </motion.div>

      {/* Scaled mockup image */}
      <motion.div
        style={{
          scale,
          width: "100%",
          maxWidth: 1000,
          marginTop: "4rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 2, ease: [0.33, 1, 0.68, 1] }}
          style={{
            width: "100%",
            height: "clamp(250px, 40vw, 500px)",
            borderRadius: 20,
            background: "linear-gradient(135deg, #FEF3C7 0%, #F59E0B 40%, #D97706 100%)",
            boxShadow: "0 40px 80px rgba(245,158,11,0.2), 0 10px 30px rgba(0,0,0,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative elements inside mockup */}
          <div
            style={{
              position: "absolute",
              inset: 16,
              borderRadius: 12,
              border: "2px solid rgba(255,255,255,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: "clamp(1.2rem, 3vw, 2rem)", color: "rgba(255,255,255,0.9)", fontWeight: 700 }}>
              ShiputzAI
            </span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

function ParallaxGallery() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const x1 = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const x2 = useTransform(scrollYProgress, [0, 1], ["0%", "-15%"]);

  return (
    <section
      ref={containerRef}
      style={{
        padding: "6rem 0",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "3rem", direction: "rtl" }}>
        <WordReveal
          text="הדמיות שיפוץ לכל חדר בבית"
          className="section-title"
        />
      </div>

      {/* Row 1 - moves right */}
      <motion.div
        style={{
          display: "flex",
          gap: "1.5rem",
          x: x1,
          paddingRight: "2rem",
          marginBottom: "1.5rem",
        }}
      >
        {ROOM_GRADIENTS_ROW1.map((grad, i) => (
          <div
            key={i}
            style={{
              minWidth: "clamp(250px, 22vw, 350px)",
              height: "clamp(180px, 16vw, 250px)",
              borderRadius: 16,
              background: grad,
              flexShrink: 0,
              display: "flex",
              alignItems: "flex-end",
              padding: "1.2rem",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <span
              style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: "1.1rem",
                fontWeight: 600,
                direction: "rtl",
              }}
            >
              {ROOM_LABELS[i]}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Row 2 - moves left */}
      <motion.div
        style={{
          display: "flex",
          gap: "1.5rem",
          x: x2,
          paddingLeft: "2rem",
        }}
      >
        {ROOM_GRADIENTS_ROW2.map((grad, i) => (
          <div
            key={i}
            style={{
              minWidth: "clamp(250px, 22vw, 350px)",
              height: "clamp(180px, 16vw, 250px)",
              borderRadius: 16,
              background: grad,
              flexShrink: 0,
              display: "flex",
              alignItems: "flex-end",
              padding: "1.2rem",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <span
              style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: "1.1rem",
                fontWeight: 600,
                direction: "rtl",
              }}
            >
              {ROOM_LABELS[i]}
            </span>
          </div>
        ))}
      </motion.div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section style={{ padding: "8rem 2rem", maxWidth: 1200, margin: "0 auto", direction: "rtl" }}>
      <WordReveal text="איך זה עובד?" className="section-title" />
      <div style={{ marginTop: "4rem", display: "flex", flexDirection: "column", gap: "6rem" }}>
        {STEPS.map((step, i) => {
          const StepItem = () => {
            const ref = useRef<HTMLDivElement>(null);
            const isInView = useInView(ref, { once: true, margin: "-15%" });
            const directions = [
              { x: -100, y: 0 },
              { x: 100, y: 0 },
              { x: 0, y: 100 },
            ];
            const dir = directions[i];

            return (
              <motion.div
                ref={ref}
                initial={{ opacity: 0, x: dir.x, y: dir.y }}
                animate={
                  isInView
                    ? { opacity: 1, x: 0, y: 0, transition: { duration: 0.8, ease: [0.33, 1, 0.68, 1] } }
                    : {}
                }
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "2rem",
                  position: "relative",
                }}
              >
                <span
                  style={{
                    fontSize: "clamp(100px, 15vw, 200px)",
                    fontWeight: 900,
                    lineHeight: 1,
                    color: "rgba(245,158,11,0.1)",
                    position: "absolute",
                    right: 0,
                    top: "-0.3em",
                    zIndex: 0,
                    userSelect: "none",
                  }}
                >
                  {step.num}
                </span>
                <div style={{ position: "relative", zIndex: 1, paddingRight: "clamp(60px, 10vw, 120px)" }}>
                  <WordReveal
                    text={step.title}
                    className="step-title"
                    delay={0.2}
                  />
                  <CharReveal text={step.desc} className="step-desc" delay={0.5} />
                </div>
              </motion.div>
            );
          };
          return <StepItem key={i} />;
        })}
      </div>
    </section>
  );
}

function FeaturesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <section
      ref={ref}
      style={{
        padding: "8rem 2rem",
        maxWidth: 1200,
        margin: "0 auto",
        direction: "rtl",
      }}
    >
      <WordReveal text="כל מה שצריך לשיפוץ מושלם" className="section-title" />
      <div
        style={{
          marginTop: "4rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "2rem",
        }}
      >
        {FEATURES.map((feat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, rotateY: -30, scale: 0.9 }}
            animate={
              isInView
                ? {
                    opacity: 1,
                    rotateY: 0,
                    scale: 1,
                    transition: {
                      duration: 0.7,
                      delay: 0.15 * i,
                      ease: [0.33, 1, 0.68, 1],
                    },
                  }
                : {}
            }
            style={{ perspective: 800 }}
          >
            <TiltCard className="feature-card">
              <AnimatedIcon path={feat.icon} isInView={isInView} delay={0.3 + 0.15 * i} />
              <h3
                style={{
                  fontSize: "1.3rem",
                  fontWeight: 700,
                  color: "#0F172A",
                  marginTop: "1rem",
                  marginBottom: "0.5rem",
                }}
              >
                {feat.title}
              </h3>
              <p style={{ color: "#64748B", lineHeight: 1.6 }}>{feat.desc}</p>
            </TiltCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function BeforeAfterSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const clipProgress = useTransform(scrollYProgress, [0.2, 0.8], [5, 95]);
  const springClip = useSpring(clipProgress, { stiffness: 100, damping: 30 });
  const [clipVal, setClipVal] = useState(5);

  useEffect(() => {
    const unsub = springClip.on("change", (v) => setClipVal(v));
    return unsub;
  }, [springClip]);

  return (
    <section
      ref={containerRef}
      style={{
        height: "200vh",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <div style={{ textAlign: "center", paddingTop: "2rem", direction: "rtl", position: "relative", zIndex: 2 }}>
          <WordReveal text="לפני ← אחרי" className="section-title" />
        </div>

        {/* Before */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, #E5E7EB 0%, #9CA3AF 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: "clamp(2rem, 5vw, 4rem)",
              fontWeight: 700,
              color: "rgba(0,0,0,0.15)",
              direction: "rtl",
            }}
          >
            לפני
          </span>
        </div>

        {/* After */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, #FEF3C7 0%, #F59E0B 50%, #D97706 100%)",
            clipPath: `inset(0 ${100 - clipVal}% 0 0)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: "clamp(2rem, 5vw, 4rem)",
              fontWeight: 700,
              color: "rgba(255,255,255,0.4)",
              direction: "rtl",
            }}
          >
            אחרי
          </span>
        </div>

        {/* Divider line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${clipVal}%`,
            width: 3,
            background: "white",
            zIndex: 2,
            boxShadow: "0 0 20px rgba(0,0,0,0.3)",
          }}
        />
      </div>
    </section>
  );
}

function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20%" });

  const stats = [
    { value: 15000, suffix: "+", label: "הדמיות נוצרו" },
    { value: 98, suffix: "%", label: "שביעות רצון" },
    { value: 10, suffix: "", label: "שניות ליצירת הדמיה" },
    { value: 50, suffix: "+", label: "סגנונות עיצוב" },
  ];

  return (
    <section
      ref={ref}
      style={{
        padding: "8rem 2rem",
        background: "linear-gradient(180deg, #FAFAFA 0%, #FEF3C7 100%)",
        direction: "rtl",
      }}
    >
      <div
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "3rem",
          textAlign: "center",
        }}
      >
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            animate={
              isInView
                ? {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.6, delay: 0.1 * i },
                  }
                : {}
            }
          >
            <div
              style={{
                fontSize: "clamp(2.5rem, 5vw, 4rem)",
                fontWeight: 900,
                color: "#0F172A",
              }}
            >
              <SpringCounter target={stat.value} suffix={stat.suffix} />
            </div>
            <div
              style={{
                fontSize: "1.1rem",
                color: "#64748B",
                marginTop: "0.5rem",
              }}
            >
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section
      style={{
        padding: "8rem 2rem",
        maxWidth: 1200,
        margin: "0 auto",
        direction: "rtl",
      }}
    >
      <WordReveal text="מה הלקוחות שלנו אומרים" className="section-title" />
      <div
        style={{
          marginTop: "4rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "2rem",
        }}
      >
        {TESTIMONIALS.map((t, i) => {
          const CardWrapper = () => {
            const ref = useRef<HTMLDivElement>(null);
            const isInView = useInView(ref, { once: true, margin: "-10%" });
            return (
              <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 50 }}
                animate={
                  isInView
                    ? {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.7, delay: 0.15 * i },
                      }
                    : {}
                }
              >
                <TiltCard className="testimonial-card">
                  <div style={{ display: "flex", gap: 2, marginBottom: "1rem" }}>
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <span key={j} style={{ color: "#F59E0B", fontSize: "1.2rem" }}>
                        ★
                      </span>
                    ))}
                  </div>
                  <p style={{ color: "#374151", lineHeight: 1.7, marginBottom: "1rem" }}>
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <p style={{ fontWeight: 700, color: "#0F172A" }}>{t.name}</p>
                </TiltCard>
              </motion.div>
            );
          };
          return <CardWrapper key={i} />;
        })}
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section
      style={{
        padding: "8rem 2rem",
        background: "#FAFAFA",
        direction: "rtl",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <WordReveal text="תוכניות ומחירים" className="section-title" />
        <div
          style={{
            marginTop: "4rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "2rem",
            alignItems: "center",
          }}
        >
          {PRICING.map((plan, i) => {
            const PlanCard = () => {
              const ref = useRef<HTMLDivElement>(null);
              const isInView = useInView(ref, { once: true, margin: "-10%" });
              return (
                <motion.div
                  ref={ref}
                  initial={{ opacity: 0, y: 50 }}
                  animate={
                    isInView
                      ? {
                          opacity: 1,
                          y: 0,
                          transition: { duration: 0.6, delay: 0.15 * i },
                        }
                      : {}
                  }
                  whileHover={{ scale: 1.04, transition: { duration: 0.3 } }}
                  className={`pricing-card ${plan.popular ? "pricing-popular" : ""}`}
                >
                  {plan.popular && (
                    <motion.div
                      className="popular-badge"
                      animate={{
                        boxShadow: [
                          "0 0 0 0 rgba(245,158,11,0.4)",
                          "0 0 0 10px rgba(245,158,11,0)",
                          "0 0 0 0 rgba(245,158,11,0)",
                        ],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      הכי פופולרי
                    </motion.div>
                  )}
                  <h3
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "#0F172A",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {plan.name}
                  </h3>
                  <div
                    style={{
                      fontSize: "2.5rem",
                      fontWeight: 900,
                      color: plan.popular ? "#F59E0B" : "#0F172A",
                      marginBottom: "1.5rem",
                    }}
                  >
                    {plan.price}
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {plan.features.map((f, j) => (
                      <li
                        key={j}
                        style={{
                          padding: "0.5rem 0",
                          borderBottom: "1px solid #F1F5F9",
                          color: "#374151",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <span style={{ color: "#F59E0B" }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <MagneticButton
                    className={plan.popular ? "btn-primary" : "btn-secondary"}
                  >
                    {plan.popular ? "התחילו עכשיו" : "בחרו תוכנית"}
                  </MagneticButton>
                </motion.div>
              );
            };
            return <PlanCard key={i} />;
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20%" });
  const [typedText, setTypedText] = useState("");
  const fullText = "מוכנים לראות את הבית החדש שלכם?";

  useEffect(() => {
    if (!isInView) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i <= fullText.length) {
        setTypedText(fullText.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 60);
    return () => clearInterval(interval);
  }, [isInView]);

  return (
    <section
      ref={ref}
      style={{
        padding: "10rem 2rem",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <MorphBlob color="#F59E0B" size={500} top="10%" left="5%" delay={2} />
      <MorphBlob color="#FB923C" size={400} top="30%" left="60%" delay={5} />

      <div style={{ position: "relative", zIndex: 1, direction: "rtl" }}>
        <h2
          style={{
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: 900,
            color: "#0F172A",
            minHeight: "1.2em",
          }}
        >
          {typedText}
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
            style={{ display: "inline-block", width: 3, height: "1em", background: "#F59E0B", marginRight: 4, verticalAlign: "text-bottom" }}
          />
        </h2>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0, transition: { delay: 2.5, duration: 0.8 } } : {}}
          style={{ marginTop: "2rem" }}
        >
          <MagneticButton className="btn-primary btn-large">
            התחילו בחינם — זה לוקח 10 שניות ←
          </MagneticButton>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer
      style={{
        padding: "3rem 2rem",
        borderTop: "1px solid #E5E7EB",
        textAlign: "center",
        direction: "rtl",
      }}
    >
      <p style={{ color: "#94A3B8", fontSize: "0.9rem" }}>
        © 2026 ShiputzAI — הדמיות שיפוץ בינה מלאכותית 🏠
      </p>
    </footer>
  );
}

/* ─────────────────────── MAIN PAGE ─────────────────────── */

export default function LandingPage() {
  // Init locomotive scroll
  useEffect(() => {
    (async () => {
      try {
        const LocomotiveScroll = (await import("locomotive-scroll")).default;
        new LocomotiveScroll();
      } catch {
        // Fallback: CSS smooth scroll
        document.documentElement.style.scrollBehavior = "smooth";
      }
    })();
  }, []);

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Heebo', sans-serif;
          background: #FAFAFA;
          color: #0F172A;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }

        .hero-headline {
          font-size: clamp(2.5rem, 8vw, 6rem);
          font-weight: 900;
          line-height: 1.1;
          color: #0F172A;
          letter-spacing: -0.02em;
        }

        .section-title {
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 800;
          color: #0F172A;
          text-align: center;
          margin-bottom: 1rem;
        }

        .step-title {
          font-size: clamp(1.5rem, 3vw, 2.2rem);
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 0.75rem;
        }

        .step-desc {
          font-size: clamp(1rem, 2vw, 1.2rem);
          color: #64748B;
          line-height: 1.7;
          max-width: 500px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
          color: white;
          border: none;
          padding: 1rem 2.5rem;
          border-radius: 14px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          font-family: 'Heebo', sans-serif;
          box-shadow: 0 4px 20px rgba(245,158,11,0.3);
          transition: box-shadow 0.3s;
        }

        .btn-primary:hover {
          box-shadow: 0 8px 30px rgba(245,158,11,0.45);
        }

        .btn-secondary {
          background: transparent;
          color: #0F172A;
          border: 2px solid #E5E7EB;
          padding: 1rem 2.5rem;
          border-radius: 14px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Heebo', sans-serif;
          transition: border-color 0.3s, background 0.3s;
        }

        .btn-secondary:hover {
          border-color: #F59E0B;
          background: rgba(245,158,11,0.05);
        }

        .btn-large {
          padding: 1.2rem 3rem;
          font-size: 1.25rem;
          border-radius: 18px;
        }

        .feature-card {
          background: white;
          border: 1px solid #F1F5F9;
          border-radius: 20px;
          padding: 2rem;
          height: 100%;
          transition: box-shadow 0.3s;
          cursor: default;
        }

        .feature-card:hover {
          box-shadow: 0 20px 60px rgba(0,0,0,0.06);
        }

        .testimonial-card {
          background: white;
          border: 1px solid #F1F5F9;
          border-radius: 20px;
          padding: 2rem;
          height: 100%;
          cursor: default;
          transition: box-shadow 0.3s;
        }

        .testimonial-card:hover {
          box-shadow: 0 20px 60px rgba(0,0,0,0.06);
        }

        .pricing-card {
          background: white;
          border: 1px solid #F1F5F9;
          border-radius: 24px;
          padding: 2.5rem 2rem;
          text-align: center;
          position: relative;
          cursor: default;
          transition: box-shadow 0.3s;
        }

        .pricing-card:hover {
          box-shadow: 0 20px 60px rgba(0,0,0,0.08);
        }

        .pricing-popular {
          border-color: #F59E0B;
          box-shadow: 0 10px 40px rgba(245,158,11,0.15);
          transform: scale(1.03);
        }

        .pricing-card .btn-primary,
        .pricing-card .btn-secondary {
          width: 100%;
          margin-top: 1.5rem;
        }

        .popular-badge {
          position: absolute;
          top: -14px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
          color: white;
          padding: 0.3rem 1.2rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 700;
          white-space: nowrap;
        }

        /* Mobile adjustments */
        @media (max-width: 768px) {
          .hero-headline {
            font-size: clamp(2rem, 10vw, 3.5rem);
          }
          .section-title {
            font-size: clamp(1.5rem, 7vw, 2.5rem);
          }
          .pricing-popular {
            transform: none;
          }
        }

        /* Smooth scrollbar for locomotive */
        html.has-scroll-smooth {
          overflow: hidden;
        }
      `}</style>

      <main>
        <HeroSection />
        <ParallaxGallery />
        <HowItWorks />
        <FeaturesSection />
        <BeforeAfterSection />
        <StatsSection />
        <TestimonialsSection />
        <PricingSection />
        <FinalCTA />
        <Footer />
      </main>
    </>
  );
}
