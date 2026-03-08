"use client";

// ============================================
// DEMO - Floating Circles Animation (CSS-based)
// URL: /demo-float (internal only)
// ============================================

const floatStyles = `
  .float-container {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .float-circle {
    position: absolute;
    border-radius: 50%;
    border: 1.5px solid rgba(255, 255, 255, 0.12);
    background: transparent;
  }

  /* Circle 1 - Large, slow drift top-left */
  .fc-1 {
    width: 160px; height: 160px;
    top: 10%; left: 5%;
    animation: drift1 18s ease-in-out infinite, breathe 6s ease-in-out infinite;
  }
  @keyframes drift1 {
    0%, 100% { transform: translate(0, 0); }
    25% { transform: translate(80px, 40px); }
    50% { transform: translate(120px, -20px); }
    75% { transform: translate(40px, -50px); }
  }

  /* Circle 2 - Medium, drift right */
  .fc-2 {
    width: 100px; height: 100px;
    top: 20%; right: 15%;
    animation: drift2 22s ease-in-out infinite, breathe 5s ease-in-out infinite 1s;
  }
  @keyframes drift2 {
    0%, 100% { transform: translate(0, 0); }
    25% { transform: translate(-60px, 50px); }
    50% { transform: translate(-30px, 90px); }
    75% { transform: translate(30px, 40px); }
  }

  /* Circle 3 - Small, fast */
  .fc-3 {
    width: 50px; height: 50px;
    top: 60%; left: 20%;
    animation: drift3 14s ease-in-out infinite, breathe 4s ease-in-out infinite 0.5s;
  }
  @keyframes drift3 {
    0%, 100% { transform: translate(0, 0); }
    25% { transform: translate(100px, -30px); }
    50% { transform: translate(60px, -70px); }
    75% { transform: translate(-20px, -40px); }
  }

  /* Circle 4 - Large, slow bottom-right */
  .fc-4 {
    width: 200px; height: 200px;
    bottom: 5%; right: 10%;
    animation: drift4 25s ease-in-out infinite, breathe 7s ease-in-out infinite 2s;
  }
  @keyframes drift4 {
    0%, 100% { transform: translate(0, 0); }
    25% { transform: translate(-70px, -60px); }
    50% { transform: translate(-120px, -30px); }
    75% { transform: translate(-50px, 20px); }
  }

  /* Circle 5 - Medium, center area */
  .fc-5 {
    width: 80px; height: 80px;
    top: 40%; left: 45%;
    animation: drift5 20s ease-in-out infinite, breathe 5.5s ease-in-out infinite 3s;
  }
  @keyframes drift5 {
    0%, 100% { transform: translate(0, 0); }
    25% { transform: translate(50px, 60px); }
    50% { transform: translate(-40px, 80px); }
    75% { transform: translate(-70px, 20px); }
  }

  /* Circle 6 - Small, top-center */
  .fc-6 {
    width: 40px; height: 40px;
    top: 15%; left: 40%;
    animation: drift6 16s ease-in-out infinite, breathe 4.5s ease-in-out infinite 1.5s;
  }
  @keyframes drift6 {
    0%, 100% { transform: translate(0, 0); }
    25% { transform: translate(30px, 40px); }
    50% { transform: translate(70px, 20px); }
    75% { transform: translate(50px, -30px); }
  }

  /* Circle 7 - Large, left side */
  .fc-7 {
    width: 130px; height: 130px;
    top: 50%; left: -3%;
    animation: drift7 23s ease-in-out infinite, breathe 6.5s ease-in-out infinite 0.8s;
  }
  @keyframes drift7 {
    0%, 100% { transform: translate(0, 0); }
    25% { transform: translate(60px, -40px); }
    50% { transform: translate(90px, 30px); }
    75% { transform: translate(30px, 50px); }
  }

  /* Circle 8 - Small, bottom-left */
  .fc-8 {
    width: 60px; height: 60px;
    bottom: 20%; left: 30%;
    animation: drift8 17s ease-in-out infinite, breathe 5s ease-in-out infinite 2.5s;
  }
  @keyframes drift8 {
    0%, 100% { transform: translate(0, 0); }
    25% { transform: translate(-40px, -50px); }
    50% { transform: translate(20px, -80px); }
    75% { transform: translate(50px, -30px); }
  }

  /* Circle 9 - Medium, right edge */
  .fc-9 {
    width: 110px; height: 110px;
    top: 35%; right: -2%;
    animation: drift9 21s ease-in-out infinite, breathe 6s ease-in-out infinite 1.2s;
  }
  @keyframes drift9 {
    0%, 100% { transform: translate(0, 0); }
    25% { transform: translate(-50px, 30px); }
    50% { transform: translate(-80px, -20px); }
    75% { transform: translate(-30px, -60px); }
  }

  /* Circle 10 - Tiny accent */
  .fc-10 {
    width: 30px; height: 30px;
    top: 70%; right: 35%;
    animation: drift10 13s ease-in-out infinite, breathe 3.5s ease-in-out infinite 0.3s;
  }
  @keyframes drift10 {
    0%, 100% { transform: translate(0, 0); }
    25% { transform: translate(40px, -20px); }
    50% { transform: translate(20px, -50px); }
    75% { transform: translate(-20px, -30px); }
  }

  /* Breathing opacity */
  @keyframes breathe {
    0%, 100% { opacity: 0.08; }
    50% { opacity: 0.2; }
  }

  /* Glow pulse for center element */
  @keyframes glowPulse {
    0%, 100% { opacity: 0.15; transform: translate(-50%, -50%) scale(1); }
    50% { opacity: 0.4; transform: translate(-50%, -50%) scale(1.2); }
  }
  .glow-center {
    position: absolute;
    top: 50%; left: 50%;
    width: 300px; height: 300px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
    transform: translate(-50%, -50%);
    animation: glowPulse 5s ease-in-out infinite;
    pointer-events: none;
  }
`;

function FloatingCircles() {
  return (
    <div className="float-container">
      <div className="float-circle fc-1" />
      <div className="float-circle fc-2" />
      <div className="float-circle fc-3" />
      <div className="float-circle fc-4" />
      <div className="float-circle fc-5" />
      <div className="float-circle fc-6" />
      <div className="float-circle fc-7" />
      <div className="float-circle fc-8" />
      <div className="float-circle fc-9" />
      <div className="float-circle fc-10" />
      <div className="glow-center" />
    </div>
  );
}

export default function DemoFloatPage() {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: floatStyles }} />

      {/* Banner */}
      <div className="fixed top-0 left-0 right-0 bg-red-500/90 backdrop-blur-sm text-white text-center py-2 text-sm z-50 font-medium">
        דף דמו פנימי — לא מקושר מהאתר
      </div>

      <div className="h-16" />

      {/* OPTION A: CTA */}
      <section className="py-6 px-6">
        <p className="text-center text-sm text-gray-400 tracking-widest uppercase">אופציה A — CTA</p>
      </section>
      <section className="relative py-32 px-6 overflow-hidden" style={{ backgroundColor: '#0a0a0a' }}>
        <FloatingCircles />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4">מוכנים?</h2>
          <p className="text-gray-400 text-lg mb-10">התחילו לנהל את השיפוץ בצורה חכמה.</p>
          <a href="#" className="inline-block bg-white text-gray-900 px-10 py-4 rounded-full text-base font-medium hover:bg-gray-100 transition-colors">
            התחילו בחינם
          </a>
        </div>
      </section>

      <div className="h-20" />

      {/* OPTION B: Stats */}
      <section className="py-6 px-6">
        <p className="text-center text-sm text-gray-400 tracking-widest uppercase">אופציה B — סטטיסטיקות</p>
      </section>
      <section className="relative py-28 px-6 overflow-hidden" style={{ backgroundColor: '#0a0a0a' }}>
        <FloatingCircles />
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

      <div className="h-20" />

      {/* OPTION C: About */}
      <section className="py-6 px-6">
        <p className="text-center text-sm text-gray-400 tracking-widest uppercase">אופציה C — מי אנחנו</p>
      </section>
      <section className="relative py-28 px-6 overflow-hidden" style={{ backgroundColor: '#0a0a0a' }}>
        <FloatingCircles />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-gray-500 text-sm tracking-widest uppercase mb-4">הסיפור שלנו</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">מי אנחנו</h2>
            <div className="w-16 h-px bg-white/20 mx-auto"></div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-10 border border-white/10 text-right space-y-6">
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
          </div>
        </div>
      </section>

      <div className="py-12 text-center text-gray-400 text-sm">
        דף דמו פנימי · ShiputzAI
      </div>
    </div>
  );
}
