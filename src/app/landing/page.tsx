import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ShiputzAI — עוזר השיפוץ החכם שלך',
  description: 'ShiputzAI הופך כל תמונה להדמיית שיפוץ מדהימה, מייצר כתב כמויות אוטומטי, סורק קבלות ומנתח הצעות מחיר — הכל עם AI.',
};

export default function LandingPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800;900&display=swap');
        
        :root {
          --blue: #4580f7;
          --blue-dark: #3570e0;
          --dark: #050917;
          --dark-card: #0d1117;
          --gray-50: #f8f9fa;
          --gray-100: #f1f3f5;
          --gray-200: #e9ecef;
          --gray-400: #ced4da;
          --gray-600: #868e96;
          --gray-800: #343a40;
          --radius: 16px;
          --amber: #f59e0b;
        }

        .lp * { margin: 0; padding: 0; box-sizing: border-box; }
        .lp {
          font-family: 'Heebo', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #fff; line-height: 1.6; direction: rtl;
          background: var(--dark);
          overflow-x: hidden;
        }
        .lp a { text-decoration: none; color: inherit; }

        /* ===== NAV ===== */
        .lp-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          background: rgba(5,9,23,0.85); backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          height: 72px; display: flex; align-items: center;
        }
        .lp-nav-inner {
          max-width: 1200px; margin: 0 auto; padding: 0 32px;
          width: 100%; display: flex; align-items: center; justify-content: space-between;
        }
        .lp-nav-logo {
          display: flex; align-items: center; gap: 10px;
          font-size: 22px; font-weight: 800;
        }
        .lp-nav-logo img { height: 32px; width: 32px; border-radius: 8px; }
        .lp-nav-logo span { color: var(--blue); }
        .lp-nav-links { display: flex; gap: 32px; align-items: center; }
        .lp-nav-links a {
          font-size: 15px; font-weight: 500; color: rgba(255,255,255,0.6);
          transition: color 0.2s;
        }
        .lp-nav-links a:hover { color: #fff; }

        /* ===== BUTTONS ===== */
        .lp-btn {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 16px;
          transition: all 0.25s; cursor: pointer; border: none; font-family: inherit;
          gap: 8px;
        }
        .lp-btn-primary {
          background: var(--blue); color: #fff;
          box-shadow: 0 0 0 0 rgba(69,128,247,0), 0 2px 8px rgba(69,128,247,0.3);
        }
        .lp-btn-primary:hover {
          background: var(--blue-dark); transform: translateY(-2px);
          box-shadow: 0 0 30px rgba(69,128,247,0.15), 0 8px 24px rgba(69,128,247,0.3);
        }
        .lp-btn-outline {
          background: transparent; color: #fff;
          border: 1.5px solid rgba(255,255,255,0.2);
        }
        .lp-btn-outline:hover { border-color: rgba(255,255,255,0.5); background: rgba(255,255,255,0.05); }
        .lp-btn-sm { padding: 10px 20px; font-size: 14px; }

        /* ===== HERO ===== */
        .lp-hero {
          padding: 160px 32px 100px; text-align: center;
          position: relative; overflow: hidden;
          background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(69,128,247,0.12) 0%, transparent 60%);
        }
        .lp-hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(69,128,247,0.1); border: 1px solid rgba(69,128,247,0.2);
          border-radius: 100px; padding: 8px 20px; font-size: 14px; font-weight: 600;
          color: var(--blue); margin-bottom: 32px;
        }
        .lp-hero-badge .pulse {
          width: 8px; height: 8px; border-radius: 50%; background: var(--blue);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.5); }
        }
        .lp-hero h1 {
          font-size: clamp(40px, 5.5vw, 72px); font-weight: 900; line-height: 1.08;
          margin-bottom: 24px; max-width: 900px; margin-left: auto; margin-right: auto;
          letter-spacing: -0.02em;
        }
        .lp-hero h1 .gradient {
          background: linear-gradient(135deg, var(--blue) 0%, #a78bfa 50%, #f472b6 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .lp-hero p {
          font-size: 20px; color: rgba(255,255,255,0.55); max-width: 600px;
          margin: 0 auto 40px; line-height: 1.7; font-weight: 400;
        }
        .lp-hero-buttons { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }

        /* Hero screenshot */
        .lp-hero-image {
          max-width: 1000px; margin: 60px auto 0; position: relative;
        }
        .lp-hero-image img {
          width: 100%; border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 40px 80px rgba(0,0,0,0.5), 0 0 60px rgba(69,128,247,0.08);
        }
        .lp-hero-image::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 120px;
          background: linear-gradient(transparent, var(--dark));
          pointer-events: none;
        }

        /* ===== STATS ===== */
        .lp-stats {
          padding: 80px 32px;
          background: var(--dark-card);
          border-top: 1px solid rgba(255,255,255,0.04);
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .lp-stats-inner {
          max-width: 1000px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px;
          text-align: center;
        }
        .lp-stat-number {
          font-size: 44px; font-weight: 900;
          background: linear-gradient(135deg, var(--blue), #a78bfa);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .lp-stat-label { font-size: 14px; color: rgba(255,255,255,0.5); margin-top: 4px; font-weight: 500; }

        /* ===== FEATURES ===== */
        .lp-features { padding: 120px 32px; }
        .lp-features .lp-section-header { margin-bottom: 80px; }

        .lp-feature {
          max-width: 1100px; margin: 0 auto 120px;
          display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center;
        }
        .lp-feature.reverse { direction: ltr; }
        .lp-feature.reverse .lp-feature-text { direction: rtl; }
        
        .lp-feature-tag {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 13px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 1.5px; color: var(--blue); margin-bottom: 16px;
        }
        .lp-feature-text h3 {
          font-size: 36px; font-weight: 800; margin-bottom: 16px; line-height: 1.2;
          letter-spacing: -0.01em;
        }
        .lp-feature-text p {
          font-size: 17px; color: rgba(255,255,255,0.55); line-height: 1.8;
        }
        .lp-feature-text .lp-btn { margin-top: 24px; }

        .lp-feature-visual {
          border-radius: var(--radius); overflow: hidden;
          border: 1px solid rgba(255,255,255,0.06);
          background: var(--dark-card);
          position: relative;
        }
        .lp-feature-visual img {
          width: 100%; height: auto; display: block;
          transition: transform 0.4s;
        }
        .lp-feature-visual:hover img { transform: scale(1.02); }

        /* Before/After wrapper */
        .lp-before-after {
          display: grid; grid-template-columns: 1fr 1fr; gap: 2px;
          background: rgba(255,255,255,0.1);
          border-radius: var(--radius); overflow: hidden;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .lp-before-after img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .lp-before-after-label {
          position: absolute; bottom: 8px; font-size: 11px; font-weight: 700;
          background: rgba(0,0,0,0.7); color: #fff; padding: 4px 10px; border-radius: 6px;
          text-transform: uppercase; letter-spacing: 1px;
        }
        .lp-ba-item { position: relative; }
        .lp-ba-item .lp-before-after-label.before { right: 8px; }
        .lp-ba-item .lp-before-after-label.after { left: 8px; }

        /* ===== HOW ===== */
        .lp-how {
          padding: 120px 32px;
          background: var(--dark-card);
          border-top: 1px solid rgba(255,255,255,0.04);
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .lp-section-header { text-align: center; margin-bottom: 60px; }
        .lp-section-header h2 {
          font-size: clamp(32px, 4vw, 48px); font-weight: 900; margin-bottom: 16px;
          letter-spacing: -0.02em;
        }
        .lp-section-header p { font-size: 18px; color: rgba(255,255,255,0.5); }

        .lp-steps {
          max-width: 1000px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
        }
        .lp-step {
          background: rgba(255,255,255,0.03); border-radius: var(--radius); padding: 40px 32px;
          border: 1px solid rgba(255,255,255,0.06); text-align: center;
          transition: transform 0.3s, border-color 0.3s;
        }
        .lp-step:hover { transform: translateY(-6px); border-color: rgba(69,128,247,0.2); }
        .lp-step-number {
          width: 56px; height: 56px; border-radius: 14px;
          background: linear-gradient(135deg, var(--blue), #7c3aed);
          color: #fff; font-size: 22px; font-weight: 900;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 24px;
        }
        .lp-step h4 { font-size: 20px; font-weight: 700; margin-bottom: 10px; }
        .lp-step p { font-size: 15px; color: rgba(255,255,255,0.5); line-height: 1.7; }

        /* ===== TESTIMONIALS ===== */
        .lp-testimonials { padding: 120px 32px; }
        .lp-testimonials-grid {
          max-width: 1100px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
        }
        .lp-testimonial {
          background: var(--dark-card); border-radius: var(--radius);
          padding: 36px; border: 1px solid rgba(255,255,255,0.06);
          transition: border-color 0.3s;
        }
        .lp-testimonial:hover { border-color: rgba(69,128,247,0.15); }
        .lp-testimonial-stars { color: var(--amber); font-size: 18px; margin-bottom: 20px; letter-spacing: 2px; }
        .lp-testimonial-text {
          font-size: 15px; line-height: 1.8; margin-bottom: 24px;
          color: rgba(255,255,255,0.7); font-style: italic;
        }
        .lp-testimonial-author { display: flex; align-items: center; gap: 12px; }
        .lp-testimonial-avatar {
          width: 44px; height: 44px; border-radius: 50%;
          background: linear-gradient(135deg, var(--blue), #7c3aed);
          color: #fff; display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 17px;
        }
        .lp-testimonial-name { font-size: 15px; font-weight: 700; }
        .lp-testimonial-role { font-size: 13px; color: rgba(255,255,255,0.4); }

        /* ===== PRICING ===== */
        .lp-pricing {
          padding: 120px 32px;
          background: var(--dark-card);
          border-top: 1px solid rgba(255,255,255,0.04);
        }
        .lp-pricing-grid {
          max-width: 800px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px;
        }
        .lp-price-card {
          background: rgba(255,255,255,0.03); border-radius: var(--radius); padding: 40px;
          border: 1px solid rgba(255,255,255,0.06);
          transition: border-color 0.3s;
        }
        .lp-price-card:hover { border-color: rgba(255,255,255,0.1); }
        .lp-price-card.popular {
          border: 2px solid var(--blue); position: relative;
          background: rgba(69,128,247,0.04);
        }
        .lp-price-card.popular::before {
          content: 'הכי פופולרי'; position: absolute; top: -13px; right: 24px;
          background: linear-gradient(135deg, var(--blue), #7c3aed);
          color: #fff; font-size: 12px; font-weight: 700;
          padding: 5px 16px; border-radius: 100px;
        }
        .lp-price-card h4 { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
        .lp-price { font-size: 52px; font-weight: 900; margin-bottom: 4px; }
        .lp-price span { font-size: 16px; font-weight: 500; color: rgba(255,255,255,0.5); }
        .lp-period { font-size: 14px; color: rgba(255,255,255,0.4); margin-bottom: 28px; }
        .lp-price-card ul { list-style: none; margin-bottom: 32px; }
        .lp-price-card li {
          padding: 10px 0; font-size: 15px; color: rgba(255,255,255,0.7);
          display: flex; align-items: center; gap: 10px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .lp-price-card li:last-child { border-bottom: none; }
        .lp-price-card li::before {
          content: '✓'; color: var(--blue); font-weight: 700; font-size: 16px;
        }

        /* ===== CTA ===== */
        .lp-cta {
          padding: 120px 32px; text-align: center;
          background: radial-gradient(ellipse 60% 50% at 50% 100%, rgba(69,128,247,0.1) 0%, transparent 60%);
          border-top: 1px solid rgba(255,255,255,0.04);
        }
        .lp-cta h2 {
          font-size: clamp(36px, 4.5vw, 52px); font-weight: 900; margin-bottom: 20px;
          letter-spacing: -0.02em;
        }
        .lp-cta p {
          font-size: 18px; color: rgba(255,255,255,0.5); margin-bottom: 40px;
          max-width: 500px; margin-left: auto; margin-right: auto;
        }

        /* ===== FOOTER ===== */
        .lp-footer {
          padding: 48px 32px;
          border-top: 1px solid rgba(255,255,255,0.04);
          text-align: center; font-size: 14px; color: rgba(255,255,255,0.3);
        }

        /* ===== LOGOS ===== */
        .lp-logos {
          padding: 60px 32px;
          border-top: 1px solid rgba(255,255,255,0.04);
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .lp-logos p {
          text-align: center; font-size: 13px; text-transform: uppercase;
          letter-spacing: 2px; color: rgba(255,255,255,0.3); font-weight: 600;
          margin-bottom: 32px;
        }
        .lp-logos-row {
          display: flex; align-items: center; justify-content: center;
          gap: 40px; flex-wrap: wrap; opacity: 0.4;
        }
        .lp-logos-row img { height: 28px; filter: brightness(0) invert(1); }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 768px) {
          .lp-feature { grid-template-columns: 1fr; gap: 40px; }
          .lp-feature.reverse { direction: rtl; }
          .lp-steps { grid-template-columns: 1fr; }
          .lp-testimonials-grid { grid-template-columns: 1fr; }
          .lp-pricing-grid { grid-template-columns: 1fr; }
          .lp-stats-inner { grid-template-columns: repeat(2, 1fr); gap: 24px; }
          .lp-nav-links a:not(.lp-btn) { display: none; }
          .lp-hero { padding: 130px 20px 60px; }
          .lp-hero h1 { font-size: 36px; }
          .lp-features, .lp-how, .lp-testimonials, .lp-pricing, .lp-cta { padding: 80px 20px; }
        }
      `}} />

      <div className="lp">
        {/* NAV */}
        <nav className="lp-nav">
          <div className="lp-nav-inner">
            <div className="lp-nav-logo">
              <img src="/logo-no-bg.png" alt="ShiputzAI" />
              Shiputz<span>AI</span>
            </div>
            <div className="lp-nav-links">
              <a href="#features">יכולות</a>
              <a href="#how">איך זה עובד</a>
              <a href="#pricing">מחירים</a>
              <a href="/" className="lp-btn lp-btn-primary lp-btn-sm">התחל בחינם</a>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <section className="lp-hero">
          <div className="lp-hero-badge"><span className="pulse"></span> מופעל בינה מלאכותית</div>
          <h1>הדמיית שיפוץ.<br /><span className="gradient">תוך שניות.</span></h1>
          <p>העלו תמונה של החדר, קבלו הדמיה ריאליסטית של השיפוץ, כתב כמויות מפורט, וניתוח הצעות מחיר — הכל אוטומטי עם AI.</p>
          <div className="lp-hero-buttons">
            <a href="/" className="lp-btn lp-btn-primary">התחל בחינם — בלי כרטיס אשראי ←</a>
            <a href="#how" className="lp-btn lp-btn-outline">איך זה עובד?</a>
          </div>
          <div className="lp-hero-image">
            <img src="/images/ai-vision/style-match-showcase.jpg" alt="ShiputzAI בפעולה" />
          </div>
        </section>

        {/* STATS */}
        <section className="lp-stats">
          <div className="lp-stats-inner">
            <div>
              <div className="lp-stat-number">63%</div>
              <div className="lp-stat-label">מהיר מעיצוב ידני</div>
            </div>
            <div>
              <div className="lp-stat-number">127+</div>
              <div className="lp-stat-label">בעלי מקצוע משתמשים</div>
            </div>
            <div>
              <div className="lp-stat-number">8</div>
              <div className="lp-stat-label">כלי AI במקום אחד</div>
            </div>
            <div>
              <div className="lp-stat-number">₪99</div>
              <div className="lp-stat-label">חד פעמי — בלי מנוי</div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="lp-features" id="features">
          <div className="lp-section-header">
            <h2>הכלים שישנו לך את השיפוץ</h2>
            <p>כל מה שצריך כדי לתכנן, לדמיין ולחסוך — במקום אחד</p>
          </div>

          {/* Feature 1: Visualize - Before/After */}
          <div className="lp-feature">
            <div className="lp-feature-text">
              <div className="lp-feature-tag">הדמיות AI</div>
              <h3>העלה תמונה. קבל הדמיית שיפוץ תוך שניות.</h3>
              <p>ה-AI מנתח את החדר שלך ומייצר הדמיה ריאליסטית של איך הוא ייראה אחרי השיפוץ. בחר סגנון, שנה צבעים, הוסף רהיטים — בלחיצה.</p>
              <a href="/visualize" className="lp-btn lp-btn-primary lp-btn-sm">נסו עכשיו ←</a>
            </div>
            <div className="lp-before-after">
              <div className="lp-ba-item">
                <img src="/examples/kitchen-before.jpg" alt="לפני השיפוץ" />
                <span className="lp-before-after-label before">לפני</span>
              </div>
              <div className="lp-ba-item">
                <img src="/examples/kitchen-after.jpg" alt="אחרי השיפוץ" />
                <span className="lp-before-after-label after">אחרי</span>
              </div>
            </div>
          </div>

          {/* Feature 2: Style Matcher */}
          <div className="lp-feature reverse">
            <div className="lp-feature-text">
              <div className="lp-feature-tag">STYLE MATCHER</div>
              <h3>זיהוי סגנון + רשימת קניות מוכנה</h3>
              <p>העלו תמונה של חדר שאהבתם — ה-AI מזהה את סגנון העיצוב, מפרט את כל המוצרים ומציע לינקים ישירים לקנייה בישראל. כולל מפת חומרים וטקסטורות.</p>
              <a href="/style-match" className="lp-btn lp-btn-primary lp-btn-sm">נסו עכשיו ←</a>
            </div>
            <div className="lp-feature-visual">
              <img src="/images/ai-vision/style-match-showcase.jpg" alt="Style Matcher" />
            </div>
          </div>

          {/* Feature 3: Floorplan */}
          <div className="lp-feature">
            <div className="lp-feature-text">
              <div className="lp-feature-tag">תוכנית קומה חכמה</div>
              <h3>מתוכנית אדריכלית להדמיה תלת-ממדית</h3>
              <p>העלו תוכנית קומה — ה-AI ממיר אותה להדמיה ריאליסטית של הדירה. תראו איך הסלון, המטבח וחדרי השינה ייראו במציאות, עוד לפני שהתחלתם.</p>
              <a href="/floorplan" className="lp-btn lp-btn-primary lp-btn-sm">נסו עכשיו ←</a>
            </div>
            <div className="lp-feature-visual">
              <img src="/images/ai-vision/floorplan.jpg" alt="תוכנית קומה חכמה" />
            </div>
          </div>

          {/* Feature 4: Video Tour */}
          <div className="lp-feature reverse">
            <div className="lp-feature-text">
              <div className="lp-feature-tag">סיור וידאו AI</div>
              <h3>הליכה וירטואלית בדירה החדשה</h3>
              <p>סרטון AI שמדמה הליכה אמיתית בתוך ההדמיה שלכם. שתפו עם בן/בת הזוג, המעצב או הקבלן — כולם רואים את אותה חזון.</p>
              <a href="/floorplan?mode=video" className="lp-btn lp-btn-primary lp-btn-sm">צרו סרטון ←</a>
            </div>
            <div className="lp-feature-visual">
              <img src="/images/ai-vision/video-tour-thumb.jpg" alt="סיור וידאו AI" />
            </div>
          </div>

          {/* Feature 5: Shop the Look */}
          <div className="lp-feature">
            <div className="lp-feature-text">
              <div className="lp-feature-tag">SHOP THE LOOK</div>
              <h3>ראית עיצוב שאהבת? קנה אותו.</h3>
              <p>העלו תמונת השראה וה-AI יזהה כל מוצר — רהיטים, תאורה, אביזרים — עם קישורים ישירים לרכישה בחנויות ישראליות.</p>
              <a href="/shop-the-look" className="lp-btn lp-btn-primary lp-btn-sm">נסו עכשיו ←</a>
            </div>
            <div className="lp-feature-visual">
              <img src="/images/ai-vision/shop-look.jpg" alt="Shop the Look" />
            </div>
          </div>

          {/* Feature 6: BOQ */}
          <div className="lp-feature reverse">
            <div className="lp-feature-text">
              <div className="lp-feature-tag">כתב כמויות</div>
              <h3>כתב כמויות אוטומטי מתמונה אחת</h3>
              <p>צלמו את החדר, וה-AI ימפה כל פריט: ריצוף, צבע, חשמל, אינסטלציה. תקבלו כתב כמויות מפורט עם מחירי שוק מעודכנים.</p>
              <a href="/dashboard/bill-of-quantities" className="lp-btn lp-btn-primary lp-btn-sm">נסו עכשיו ←</a>
            </div>
            <div className="lp-feature-visual">
              <img src="/features/feature-budget.png" alt="כתב כמויות" />
            </div>
          </div>
        </section>

        {/* LOGOS */}
        <section className="lp-logos">
          <p>קישורים ישירים לחנויות המובילות</p>
          <div className="lp-logos-row">
            <img src="/logos/ikea.png" alt="IKEA" />
            <img src="/logos/homecenter.png" alt="Home Center" />
            <img src="/logos/ace.png" alt="ACE" />
            <img src="/logos/foxhome.png" alt="Fox Home" />
            <img src="/logos/aminach.png" alt="עמינח" />
            <img src="/logos/tambur.png" alt="טמבור" />
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="lp-how" id="how">
          <div className="lp-section-header">
            <h2>איך זה עובד?</h2>
            <p>שלושה צעדים פשוטים — מתמונה לתוכנית שיפוץ מלאה</p>
          </div>
          <div className="lp-steps">
            <div className="lp-step">
              <div className="lp-step-number">1</div>
              <h4>העלו תמונה</h4>
              <p>צלמו את החדר או העלו תמונה קיימת. ה-AI מזהה אוטומטית את המרחב.</p>
            </div>
            <div className="lp-step">
              <div className="lp-step-number">2</div>
              <h4>בחרו מה לעשות</h4>
              <p>הדמיית שיפוץ? כתב כמויות? ניתוח מחיר? בחרו את הכלי שמתאים לכם.</p>
            </div>
            <div className="lp-step">
              <div className="lp-step-number">3</div>
              <h4>קבלו תוצאה מיידית</h4>
              <p>תוך שניות תקבלו תוצאה מקצועית לשיתוף עם הקבלן, המעצב או בן/בת הזוג.</p>
            </div>
          </div>
        </section>

        {/* MORE FEATURES GRID */}
        <section style={{ padding: '120px 32px' }}>
          <div className="lp-section-header">
            <h2>ועוד כלים בארגז</h2>
          </div>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { title: 'ניתוח הצעות מחיר', desc: 'העלו הצעת מחיר מקבלן — ה-AI ישווה מול מחירי שוק ויגיד אם המחיר הוגן.', img: '/features/feature-receipt.png' },
              { title: 'סריקת קבלות', desc: 'צלמו קבלה וקבלו סכום, תאריך וקטגוריה אוטומטית.', img: '/features/feature-receipt.png' },
              { title: 'עוזר AI לשיפוץ', desc: 'שאלו כל שאלה על השיפוץ וקבלו תשובה מיידית מעוזר מומחה.', img: '/images/ai-vision/chat-support-thumb.jpg' },
            ].map((f, i) => (
              <div key={i} style={{
                background: 'var(--dark-card)', borderRadius: 'var(--radius)',
                border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden',
                transition: 'border-color 0.3s',
              }}>
                <img src={f.img} alt={f.title} style={{ width: '100%', height: 200, objectFit: 'cover' }} />
                <div style={{ padding: '24px' }}>
                  <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{f.title}</h4>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="lp-testimonials" id="testimonials">
          <div className="lp-section-header">
            <h2>מה אומרים עלינו</h2>
            <p>בעלי מקצוע ולקוחות שכבר משתמשים</p>
          </div>
          <div className="lp-testimonials-grid">
            <div className="lp-testimonial">
              <div className="lp-testimonial-stars">★★★★★</div>
              <div className="lp-testimonial-text">&ldquo;חסך לי שעות של עבודה. במקום לשבת עם אקסל ולחשב כמויות, פשוט צילמתי את הדירה וקיבלתי כתב כמויות מפורט תוך דקה.&rdquo;</div>
              <div className="lp-testimonial-author">
                <div className="lp-testimonial-avatar">ד</div>
                <div>
                  <div className="lp-testimonial-name">דניאל כ.</div>
                  <div className="lp-testimonial-role">קבלן שיפוצים, תל אביב</div>
                </div>
              </div>
            </div>
            <div className="lp-testimonial">
              <div className="lp-testimonial-stars">★★★★★</div>
              <div className="lp-testimonial-text">&ldquo;הלקוחות שלי מתים על ההדמיות. במקום להסביר במילים איך החדר ייראה, אני מראה להם תמונה ריאליסטית. סוגר עסקאות יותר מהר.&rdquo;</div>
              <div className="lp-testimonial-author">
                <div className="lp-testimonial-avatar">ש</div>
                <div>
                  <div className="lp-testimonial-name">שירה ד.</div>
                  <div className="lp-testimonial-role">מעצבת פנים</div>
                </div>
              </div>
            </div>
            <div className="lp-testimonial">
              <div className="lp-testimonial-stars">★★★★★</div>
              <div className="lp-testimonial-text">&ldquo;קיבלתי הצעת מחיר מקבלן והרגשתי שמשהו לא בסדר. העליתי ל-ShiputzAI וזה הראה לי שהמחיר מנופח ב-40%. חסך לי אלפי שקלים.&rdquo;</div>
              <div className="lp-testimonial-author">
                <div className="lp-testimonial-avatar">א</div>
                <div>
                  <div className="lp-testimonial-name">אורן מ.</div>
                  <div className="lp-testimonial-role">בעל דירה, חיפה</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="lp-pricing" id="pricing">
          <div className="lp-section-header">
            <h2>מחירים פשוטים</h2>
            <p>בלי מנויים. בלי הפתעות. שלם על מה שאתה צריך.</p>
          </div>
          <div className="lp-pricing-grid">
            <div className="lp-price-card">
              <h4>חינם</h4>
              <div className="lp-price">₪0</div>
              <div className="lp-period">לנצח</div>
              <ul>
                <li>הדמיית שיפוץ אחת</li>
                <li>כתב כמויות אחד</li>
                <li>ניתוח הצעת מחיר אחד</li>
                <li>תמיכה בצ׳אט</li>
              </ul>
              <a href="/" className="lp-btn lp-btn-outline" style={{width:'100%'}}>התחל בחינם</a>
            </div>
            <div className="lp-price-card popular">
              <h4>Pro</h4>
              <div className="lp-price">₪99 <span>חד פעמי</span></div>
              <div className="lp-period">4 קרדיטים לכל הכלים</div>
              <ul>
                <li>4 הדמיות שיפוץ</li>
                <li>כתב כמויות ללא הגבלה</li>
                <li>ניתוח הצעות מחיר</li>
                <li>Shop the Look</li>
                <li>סריקת קבלות</li>
                <li>סיור וידאו AI</li>
                <li>תמיכה בעדיפות</li>
              </ul>
              <a href="/" className="lp-btn lp-btn-primary" style={{width:'100%'}}>שדרג ל-Pro ←</a>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="lp-cta">
          <h2>מוכנים לשפץ חכם?</h2>
          <p>הצטרפו למאות בעלי מקצוע ובעלי דירות שכבר משתמשים ב-ShiputzAI</p>
          <a href="/" className="lp-btn lp-btn-primary" style={{fontSize:18,padding:'16px 44px'}}>התחל בחינם — בלי כרטיס אשראי ←</a>
        </section>

        {/* FOOTER */}
        <footer className="lp-footer">
          <p>© 2026 ShiputzAI. כל הזכויות שמורות.</p>
        </footer>
      </div>
    </>
  );
}
