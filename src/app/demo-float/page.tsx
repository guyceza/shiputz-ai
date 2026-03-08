"use client";

import { useEffect, useRef } from "react";

// ============================================
// DEMO - Floating Circles Animation
// URL: /demo-float (internal only)
// ============================================

interface Circle {
  x: number;
  y: number;
  radius: number;
  dx: number;
  dy: number;
  opacity: number;
  opacityDir: number;
  lineWidth: number;
}

function FloatingCirclesCanvas({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    // Create circles
    const count = 12;
    const circles: Circle[] = [];
    const w = () => canvas.getBoundingClientRect().width;
    const h = () => canvas.getBoundingClientRect().height;

    for (let i = 0; i < count; i++) {
      circles.push({
        x: Math.random() * w(),
        y: Math.random() * h(),
        radius: 20 + Math.random() * 80,
        dx: (Math.random() - 0.5) * 0.4,
        dy: (Math.random() - 0.5) * 0.4,
        opacity: 0.05 + Math.random() * 0.15,
        opacityDir: (Math.random() - 0.5) * 0.001,
        lineWidth: 1 + Math.random() * 1.5,
      });
    }

    const draw = () => {
      const cw = w();
      const ch = h();
      ctx.clearRect(0, 0, cw, ch);

      for (const c of circles) {
        // Move
        c.x += c.dx;
        c.y += c.dy;

        // Wrap around
        if (c.x < -c.radius) c.x = cw + c.radius;
        if (c.x > cw + c.radius) c.x = -c.radius;
        if (c.y < -c.radius) c.y = ch + c.radius;
        if (c.y > ch + c.radius) c.y = -c.radius;

        // Breathe opacity
        c.opacity += c.opacityDir;
        if (c.opacity > 0.22 || c.opacity < 0.04) c.opacityDir *= -1;

        // Draw
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${c.opacity})`;
        ctx.lineWidth = c.lineWidth;
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
    />
  );
}

// Pulsing glow element
function PulsingGlow() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes glowPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.15); }
        }
        .glow-ring {
          animation: glowPulse 4s ease-in-out infinite;
        }
      `}} />
      <div className="glow-ring absolute inset-0 rounded-full bg-white/5 blur-2xl" />
    </>
  );
}

export default function DemoFloatPage() {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Banner */}
      <div className="fixed top-0 left-0 right-0 bg-red-500/90 backdrop-blur-sm text-white text-center py-2 text-sm z-50 font-medium">
        דף דמו פנימי — לא מקושר מהאתר
      </div>

      {/* Spacer */}
      <div className="h-16" />

      {/* ============================================ */}
      {/* OPTION A: CTA Section with floating circles */}
      {/* ============================================ */}
      <section className="py-8 px-6">
        <p className="text-center text-sm text-gray-400 tracking-widest uppercase mb-2">אופציה A — סקשן CTA</p>
      </section>

      <section className="relative py-32 px-6 overflow-hidden" style={{ backgroundColor: '#0a0a0a' }}>
        <FloatingCirclesCanvas />
        
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="relative inline-block mb-8">
            <div className="w-20 h-20 rounded-full border border-white/20 flex items-center justify-center mx-auto relative">
              <PulsingGlow />
              <span className="text-3xl relative z-10">✦</span>
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4">מוכנים?</h2>
          <p className="text-gray-400 text-lg mb-10">התחילו לנהל את השיפוץ בצורה חכמה.</p>
          <a
            href="#"
            className="inline-block bg-white text-gray-900 px-10 py-4 rounded-full text-base font-medium hover:bg-gray-100 transition-colors"
          >
            התחילו בחינם
          </a>
        </div>
      </section>

      <div className="h-24" />

      {/* ============================================ */}
      {/* OPTION B: Features / Stats with circles */}
      {/* ============================================ */}
      <section className="py-8 px-6">
        <p className="text-center text-sm text-gray-400 tracking-widest uppercase mb-2">אופציה B — סטטיסטיקות</p>
      </section>

      <section className="relative py-28 px-6 overflow-hidden" style={{ backgroundColor: '#0a0a0a' }}>
        <FloatingCirclesCanvas />

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-gray-500 text-sm tracking-widest uppercase mb-4">למה ShiputzAI</p>
            <h2 className="text-3xl md:text-4xl font-semibold text-white">המספרים מדברים</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div>
              <p className="text-5xl font-bold text-white mb-3">₪15B</p>
              <p className="text-gray-500">שוק השיפוצים בישראל</p>
            </div>
            <div>
              <p className="text-5xl font-bold text-white mb-3">70%</p>
              <p className="text-gray-500">משיפוצים חורגים מהתקציב</p>
            </div>
            <div>
              <p className="text-5xl font-bold text-white mb-3">3 מתוך 4</p>
              <p className="text-gray-500">מדווחים על בעיות עם קבלנים</p>
            </div>
          </div>
        </div>
      </section>

      <div className="h-24" />

      {/* ============================================ */}
      {/* OPTION C: About / Story section */}
      {/* ============================================ */}
      <section className="py-8 px-6">
        <p className="text-center text-sm text-gray-400 tracking-widest uppercase mb-2">אופציה C — מי אנחנו</p>
      </section>

      <section className="relative py-28 px-6 overflow-hidden" style={{ backgroundColor: '#0a0a0a' }}>
        <FloatingCirclesCanvas />

        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-gray-500 text-sm tracking-widest uppercase mb-4">הסיפור שלנו</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">מי אנחנו</h2>
            <div className="w-16 h-px bg-white/20 mx-auto"></div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-10 md:p-14 border border-white/10 text-right space-y-6">
            <p className="text-xl text-white font-light leading-relaxed">
              בנינו את <span className="font-semibold">ShiputzAI</span> כי עברנו את זה בעצמנו.
            </p>
            <p className="text-gray-400 text-lg leading-relaxed">
              שיפוצים שיצאו משליטה, קבלות שהלכו לאיבוד, והרגשה שמישהו תמיד מנפח לנו את המחיר.
            </p>
            <div className="border-r-2 border-white/30 pr-6 my-4">
              <p className="text-white text-xl font-medium leading-relaxed">
                המטרה שלנו: שכל מי שנכנס לשיפוץ ירגיש בשליטה.
              </p>
            </div>
            <p className="text-gray-400 text-lg leading-relaxed">
              שידע בדיוק לאן הולך הכסף, שיקבל התראה לפני שחורג, ושיוכל לבדוק אם המחיר שמציעים לו הגיוני.
            </p>
          </div>
        </div>
      </section>

      <div className="h-24" />

      {/* ============================================ */}
      {/* OPTION D: Hero-style with floating circles */}
      {/* ============================================ */}
      <section className="py-8 px-6">
        <p className="text-center text-sm text-gray-400 tracking-widest uppercase mb-2">אופציה D — Hero כהה</p>
      </section>

      <section className="relative py-32 px-6 overflow-hidden" style={{ backgroundColor: '#0a0a0a' }}>
        <FloatingCirclesCanvas />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <p className="text-sm text-gray-500 mb-4">ניהול שיפוצים חכם</p>
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight mb-6 text-white">
            שיפוץ בשליטה מלאה.
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            בינה מלאכותית שמנהלת את התקציב, מנתחת הצעות מחיר, ומתריעה לפני שנכנסים לבעיה.
          </p>
          <div className="flex gap-4 justify-center">
            <a href="#" className="bg-white text-gray-900 px-8 py-4 rounded-full text-base font-medium hover:bg-gray-100 transition-colors">
              התחילו בחינם
            </a>
            <a href="#" className="text-white px-8 py-4 rounded-full text-base border border-white/30 hover:border-white/60 transition-colors">
              גלו עוד
            </a>
          </div>
        </div>
      </section>

      <div className="py-12 text-center text-gray-400 text-sm">
        דף דמו פנימי · ShiputzAI
      </div>
    </div>
  );
}
