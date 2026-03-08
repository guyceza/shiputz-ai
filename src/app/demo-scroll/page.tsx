"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ============================================
// DEMO PAGE - Scroll Animations Preview
// URL: /demo-scroll (not linked anywhere)
// ============================================

// --- Fade-in on Scroll Component ---
function FadeInSection({ children, className = "", delay = 0 }: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -50px 0px" }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </div>
  );
}

// --- Before/After Slider Component ---
function BeforeAfterSlider({ 
  beforeSrc, 
  afterSrc, 
  beforeLabel = "לפני", 
  afterLabel = "אחרי" 
}: { 
  beforeSrc: string; 
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(2, Math.min(98, (x / rect.width) * 100));
    setSliderPos(percent);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => { e.preventDefault(); updatePosition(e.clientX); };
    const handleTouchMove = (e: TouchEvent) => { updatePosition(e.touches[0].clientX); };
    const handleUp = () => setIsDragging(false);
    
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [isDragging, updatePosition]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden cursor-col-resize select-none shadow-2xl"
      onMouseDown={(e) => { setIsDragging(true); updatePosition(e.clientX); }}
      onTouchStart={(e) => { setIsDragging(true); updatePosition(e.touches[0].clientX); }}
    >
      {/* After Image (full background) */}
      <img src={afterSrc} alt="אחרי" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      
      {/* Before Image (clipped) */}
      <div 
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPos}%` }}
      >
        <img 
          src={beforeSrc} 
          alt="לפני" 
          className="absolute inset-0 w-full h-full object-cover"
          style={{ width: `${containerRef.current?.offsetWidth || 1000}px`, maxWidth: 'none' }}
          draggable={false}
        />
      </div>

      {/* Slider Line */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
        style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
      >
        {/* Handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7 4L3 10L7 16" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M13 4L17 10L13 16" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full z-20">
        {afterLabel}
      </div>
      <div 
        className="absolute top-4 bg-black/60 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full z-20"
        style={{ right: `max(16px, ${100 - sliderPos + 2}%)` }}
      >
        {beforeLabel}
      </div>
    </div>
  );
}

// --- Stagger Children ---
function StaggerChildren({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <div className={className}>
      {items.map((child, i) => (
        <FadeInSection key={i} delay={i * 150}>
          {child}
        </FadeInSection>
      ))}
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================
export default function DemoScrollPage() {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-red-500/90 backdrop-blur-sm text-white text-center py-2 text-sm z-50 font-medium">
        דף דמו פנימי — לא מקושר מהאתר
      </div>

      {/* ============================================ */}
      {/* CONCEPT 1: Fade-in on Scroll */}
      {/* ============================================ */}
      <section className="pt-20 pb-16 px-6 border-b-4 border-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-gray-400 tracking-widest uppercase mb-3">קונספט 1</p>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Fade-in on Scroll</h1>
          <p className="text-gray-500 text-lg">כל אלמנט מופיע באנימציה כשגוללים אליו. גלול למטה ←</p>
        </div>
      </section>

      {/* Demo: Hero-like section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <FadeInSection>
            <p className="text-sm text-gray-400 tracking-widest uppercase mb-4">ניהול שיפוצים חכם</p>
          </FadeInSection>
          <FadeInSection delay={200}>
            <h2 className="text-5xl md:text-6xl font-semibold tracking-tight mb-4 text-gray-900">
              שיפוץ בשליטה מלאה.
            </h2>
          </FadeInSection>
          <FadeInSection delay={400}>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed">
              בינה מלאכותית שמנהלת את התקציב, מנתחת הצעות מחיר, ומתריעה לפני שנכנסים לבעיה.
            </p>
          </FadeInSection>
          <FadeInSection delay={600}>
            <div className="flex gap-4 justify-center">
              <span className="text-white px-8 py-4 rounded-full text-base" style={{ backgroundColor: '#101010' }}>
                התחילו בחינם
              </span>
              <span className="text-gray-900 px-8 py-4 rounded-full text-base border border-gray-300">
                גלו עוד
              </span>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* Demo: Stats */}
      <section className="py-20 px-6 bg-gray-50">
        <StaggerChildren className="max-w-4xl mx-auto grid md:grid-cols-3 gap-12 text-center">
          <div>
            <p className="text-4xl font-semibold text-gray-900 mb-2">₪15B</p>
            <p className="text-gray-500">שוק השיפוצים בישראל</p>
          </div>
          <div>
            <p className="text-4xl font-semibold text-gray-900 mb-2">70%</p>
            <p className="text-gray-500">משיפוצים חורגים מהתקציב</p>
          </div>
          <div>
            <p className="text-4xl font-semibold text-gray-900 mb-2">3 מתוך 4</p>
            <p className="text-gray-500">מדווחים על בעיות עם קבלנים</p>
          </div>
        </StaggerChildren>
      </section>

      {/* Demo: Features cards */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeInSection>
            <div className="text-center mb-16">
              <p className="text-gray-400 text-sm tracking-widest uppercase mb-4">כלים</p>
              <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-3">הכל במקום אחד</h2>
              <p className="text-gray-500">שבעה כלי AI שעוזרים לכם לתכנן, לדמיין, ולחסוך</p>
            </div>
          </FadeInSection>
          
          <StaggerChildren className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-gray-200 bg-white">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-4 text-lg">🎨</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">הדמיות AI</h3>
              <p className="text-gray-500 text-sm">צלמו חדר, תארו מה אתם רוצים, וקבלו הדמיה תוך שניות</p>
            </div>
            <div className="p-6 rounded-2xl border border-gray-200 bg-white">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-4 text-lg">📋</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">כתב כמויות</h3>
              <p className="text-gray-500 text-sm">מקבלים פירוט מדויק של חומרים, כמויות ועלויות</p>
            </div>
            <div className="p-6 rounded-2xl border border-gray-200 bg-white">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-4 text-lg">📸</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">סריקת קבלות</h3>
              <p className="text-gray-500 text-sm">צלמו קבלה והמערכת תזהה הכל אוטומטית</p>
            </div>
          </StaggerChildren>
        </div>
      </section>

      {/* Demo: About section with slide-in */}
      <section className="py-24 px-6 bg-gray-950 text-white">
        <div className="max-w-4xl mx-auto">
          <FadeInSection>
            <div className="text-center mb-12">
              <p className="text-gray-500 text-sm tracking-widest uppercase mb-4">הסיפור שלנו</p>
              <h2 className="text-4xl font-bold mb-4">מי אנחנו</h2>
              <div className="w-16 h-px bg-white/20 mx-auto"></div>
            </div>
          </FadeInSection>
          
          <div className="space-y-6 text-right max-w-2xl mx-auto">
            <FadeInSection delay={100}>
              <p className="text-xl text-white font-light leading-relaxed">
                בנינו את ShiputzAI כי עברנו את זה בעצמנו.
              </p>
            </FadeInSection>
            <FadeInSection delay={200}>
              <p className="text-gray-400 text-lg leading-relaxed">
                שיפוצים שיצאו משליטה, קבלות שהלכו לאיבוד, והרגשה שמישהו תמיד מנפח לנו את המחיר.
              </p>
            </FadeInSection>
            <FadeInSection delay={300}>
              <div className="border-r-2 border-white/30 pr-6 my-4">
                <p className="text-white text-xl font-medium leading-relaxed">
                  המטרה שלנו: שכל מי שנכנס לשיפוץ ירגיש בשליטה.
                </p>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* Spacer */}
      <div className="h-24 bg-white"></div>

      {/* ============================================ */}
      {/* CONCEPT 2: Before/After Slider */}
      {/* ============================================ */}
      <section className="py-16 px-6 border-t-4 border-gray-900 border-b border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-gray-400 tracking-widest uppercase mb-3">קונספט 2</p>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Before / After Slider</h1>
          <p className="text-gray-500 text-lg">גררו את הפס כדי לראות את ההבדל</p>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeInSection>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-semibold text-gray-900 mb-3">תראו מה AI יכול לעשות</h2>
              <p className="text-gray-500">גררו את הפס ימינה ושמאלה</p>
            </div>
          </FadeInSection>

          <FadeInSection delay={200}>
            <BeforeAfterSlider
              beforeSrc="https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=1200&q=80"
              afterSrc="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=80"
              beforeLabel="לפני השיפוץ"
              afterLabel="אחרי השיפוץ"
            />
          </FadeInSection>

          {/* Second example */}
          <div className="mt-16">
            <FadeInSection delay={100}>
              <BeforeAfterSlider
                beforeSrc="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&q=80"
                afterSrc="https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1200&q=80"
                beforeLabel="לפני"
                afterLabel="אחרי"
              />
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* How it could look on the homepage */}
      <section className="py-20 px-6 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <FadeInSection>
            <p className="text-gray-400 text-sm tracking-widest uppercase mb-4">איך זה ישב באתר</p>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">הצעה למיקום</h2>
            <div className="text-right bg-white rounded-2xl p-8 border border-gray-200 mt-8 space-y-4 text-gray-600">
              <p><strong className="text-gray-900">Fade-in (#1):</strong> מחליף את ההופעה הסטטית של כל הסקשנים. אפס שינוי במבנה — רק עוטפים כל סקשן ב-FadeInSection.</p>
              <p><strong className="text-gray-900">Before/After (#2):</strong> סקשן חדש בין ה-Features Carousel לבין ה-Stats. כותרת: ״תראו מה AI יכול לעשות״ עם תמונות אמיתיות מהדמיות ShiputzAI.</p>
            </div>
          </FadeInSection>
        </div>
      </section>

      <div className="py-8 text-center text-gray-400 text-sm">
        דף דמו פנימי · ShiputzAI
      </div>
    </div>
  );
}
