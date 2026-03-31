import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ShiputzAI — עוזר השיפוץ החכם שלך',
  description: 'ShiputzAI הופך כל תמונה להדמיית שיפוץ מדהימה, מייצר כתב כמויות אוטומטי, סורק קבלות ומנתח הצעות מחיר — הכל עם AI.',
};

export default function LandingPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --blue: #4580f7;
          --dark: #0a0a0a;
          --gray-50: #f8f9fa;
          --gray-100: #f1f3f5;
          --gray-200: #e9ecef;
          --gray-400: #ced4da;
          --gray-600: #868e96;
          --gray-800: #343a40;
          --radius: 12px;
          --radius-lg: 16px;
          --amber: #f59e0b;
        }
        .lp * { margin:0; padding:0; box-sizing:border-box; }
        .lp { font-family: 'Heebo', -apple-system, sans-serif; color: var(--dark); line-height: 1.6; direction: rtl; }
        .lp a { text-decoration: none; color: inherit; }

        .lp-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          background: rgba(255,255,255,0.92); backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--gray-200);
          height: 64px; display: flex; align-items: center;
        }
        .lp-nav-inner {
          max-width: 1200px; margin: 0 auto; padding: 0 24px;
          width: 100%; display: flex; align-items: center; justify-content: space-between;
        }
        .lp-nav-logo { font-size: 22px; font-weight: 800; }
        .lp-nav-logo span { color: var(--blue); }
        .lp-nav-links { display: flex; gap: 32px; align-items: center; }
        .lp-nav-links a { font-size: 15px; font-weight: 500; color: var(--gray-600); transition: color 0.2s; }
        .lp-nav-links a:hover { color: var(--dark); }
        
        .lp-btn {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px;
          transition: all 0.2s; cursor: pointer; border: none; font-family: inherit;
        }
        .lp-btn-primary { background: var(--blue); color: #fff; }
        .lp-btn-primary:hover { background: #3570e0; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(69,128,247,0.3); }
        .lp-btn-outline { background: transparent; color: var(--dark); border: 1.5px solid var(--gray-400); }
        .lp-btn-outline:hover { border-color: var(--dark); }

        .lp-hero {
          padding: 140px 24px 80px; text-align: center;
          background: linear-gradient(180deg, #f0f4ff 0%, #fff 100%);
          position: relative; overflow: hidden;
        }
        .lp-hero::before {
          content: ''; position: absolute; top: -200px; left: 50%; transform: translateX(-50%);
          width: 800px; height: 800px; border-radius: 50%;
          background: radial-gradient(circle, rgba(69,128,247,0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .lp-hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(69,128,247,0.08); border: 1px solid rgba(69,128,247,0.15);
          border-radius: 100px; padding: 6px 16px; font-size: 13px; font-weight: 500;
          color: var(--blue); margin-bottom: 24px;
        }
        .lp-hero-badge .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--blue); }
        .lp-hero h1 {
          font-size: clamp(36px, 5vw, 64px); font-weight: 900; line-height: 1.1;
          margin-bottom: 20px; max-width: 800px; margin-left: auto; margin-right: auto;
        }
        .lp-hero h1 .gradient {
          background: linear-gradient(135deg, var(--blue) 0%, #7c3aed 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .lp-hero p {
          font-size: 20px; color: var(--gray-600); max-width: 600px;
          margin: 0 auto 36px; line-height: 1.7;
        }
        .lp-hero-buttons { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

        .lp-stats {
          padding: 60px 24px; background: var(--dark); color: #fff;
        }
        .lp-stats-inner {
          max-width: 1000px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px;
          text-align: center;
        }
        .lp-stat-number { font-size: 48px; font-weight: 800; color: var(--blue); }
        .lp-stat-label { font-size: 15px; color: rgba(255,255,255,0.7); margin-top: 4px; }

        .lp-features { padding: 100px 24px; }
        .lp-feature {
          max-width: 1100px; margin: 0 auto 100px;
          display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center;
        }
        .lp-feature:nth-child(even) { direction: ltr; }
        .lp-feature:nth-child(even) .lp-feature-text { direction: rtl; }
        .lp-feature-tag {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 1px; color: var(--blue); margin-bottom: 12px;
        }
        .lp-feature h3 { font-size: 32px; font-weight: 800; margin-bottom: 16px; line-height: 1.3; }
        .lp-feature p { font-size: 17px; color: var(--gray-600); line-height: 1.7; }
        .lp-feature-visual {
          background: var(--gray-50); border-radius: var(--radius-lg);
          border: 1px solid var(--gray-200); padding: 40px;
          display: flex; align-items: center; justify-content: center;
          min-height: 320px; position: relative; overflow: hidden;
        }
        .lp-feature-icon {
          width: 80px; height: 80px; border-radius: 20px; background: var(--blue);
          display: flex; align-items: center; justify-content: center;
          font-size: 36px; color: #fff; box-shadow: 0 8px 24px rgba(69,128,247,0.25);
        }

        .lp-how { padding: 100px 24px; background: var(--gray-50); }
        .lp-section-header { text-align: center; margin-bottom: 60px; }
        .lp-section-header h2 { font-size: 40px; font-weight: 800; margin-bottom: 12px; }
        .lp-section-header p { font-size: 18px; color: var(--gray-600); }
        .lp-steps {
          max-width: 1000px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px;
        }
        .lp-step {
          background: #fff; border-radius: var(--radius-lg); padding: 32px;
          border: 1px solid var(--gray-200); text-align: center;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .lp-step:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.08); }
        .lp-step-number {
          width: 48px; height: 48px; border-radius: 50%; background: var(--blue);
          color: #fff; font-size: 20px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px;
        }
        .lp-step h4 { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
        .lp-step p { font-size: 15px; color: var(--gray-600); }

        .lp-testimonials { padding: 100px 24px; }
        .lp-testimonials-grid {
          max-width: 1100px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
        }
        .lp-testimonial {
          background: var(--gray-50); border-radius: var(--radius-lg);
          padding: 32px; border: 1px solid var(--gray-200);
        }
        .lp-testimonial-stars { color: var(--amber); font-size: 18px; margin-bottom: 16px; }
        .lp-testimonial-text { font-size: 15px; line-height: 1.7; margin-bottom: 20px; color: var(--gray-800); }
        .lp-testimonial-author { display: flex; align-items: center; gap: 12px; }
        .lp-testimonial-avatar {
          width: 40px; height: 40px; border-radius: 50%;
          background: var(--blue); color: #fff; display: flex; align-items: center;
          justify-content: center; font-weight: 700; font-size: 16px;
        }
        .lp-testimonial-name { font-size: 14px; font-weight: 600; }
        .lp-testimonial-role { font-size: 12px; color: var(--gray-600); }

        .lp-pricing { padding: 100px 24px; background: var(--gray-50); }
        .lp-pricing-grid {
          max-width: 900px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px;
        }
        .lp-price-card {
          background: #fff; border-radius: var(--radius-lg); padding: 36px;
          border: 1px solid var(--gray-200);
        }
        .lp-price-card.popular { border: 2px solid var(--blue); position: relative; }
        .lp-price-card.popular::before {
          content: 'הכי פופולרי'; position: absolute; top: -12px; right: 24px;
          background: var(--blue); color: #fff; font-size: 11px; font-weight: 700;
          padding: 4px 14px; border-radius: 100px;
        }
        .lp-price-card h4 { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
        .lp-price { font-size: 48px; font-weight: 800; margin-bottom: 4px; }
        .lp-price span { font-size: 16px; font-weight: 500; color: var(--gray-600); }
        .lp-period { font-size: 14px; color: var(--gray-600); margin-bottom: 24px; }
        .lp-price-card ul { list-style: none; margin-bottom: 28px; }
        .lp-price-card li {
          padding: 8px 0; font-size: 14px; color: var(--gray-800);
          display: flex; align-items: center; gap: 8px;
        }
        .lp-price-card li::before { content: '✓'; color: var(--blue); font-weight: 700; }

        .lp-cta {
          padding: 100px 24px; text-align: center;
          background: var(--dark); color: #fff;
        }
        .lp-cta h2 { font-size: 40px; font-weight: 800; margin-bottom: 16px; }
        .lp-cta p { font-size: 18px; color: rgba(255,255,255,0.7); margin-bottom: 36px; max-width: 500px; margin-left: auto; margin-right: auto; }
        .lp-cta .lp-btn-primary { font-size: 18px; padding: 16px 40px; }

        .lp-footer {
          padding: 40px 24px; border-top: 1px solid var(--gray-200);
          text-align: center; font-size: 14px; color: var(--gray-600);
        }

        @media (max-width: 768px) {
          .lp-feature { grid-template-columns: 1fr; }
          .lp-steps { grid-template-columns: 1fr; }
          .lp-testimonials-grid { grid-template-columns: 1fr; }
          .lp-pricing-grid { grid-template-columns: 1fr; }
          .lp-stats-inner { grid-template-columns: 1fr; gap: 24px; }
          .lp-nav-links a:not(.lp-btn) { display: none; }
        }
      `}} />

      <div className="lp">
        {/* NAV */}
        <nav className="lp-nav">
          <div className="lp-nav-inner">
            <div className="lp-nav-logo">Shiputz<span>AI</span></div>
            <div className="lp-nav-links">
              <a href="#features">יכולות</a>
              <a href="#how">איך זה עובד</a>
              <a href="#pricing">מחירים</a>
              <a href="/" className="lp-btn lp-btn-primary">התחל בחינם</a>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <section className="lp-hero">
          <div className="lp-hero-badge"><span className="dot"></span> מופעל בינה מלאכותית</div>
          <h1>השיפוץ שלך.<br /><span className="gradient">חכם יותר.</span></h1>
          <p>ShiputzAI הופך כל תמונה להדמיית שיפוץ מדהימה, מייצר כתב כמויות אוטומטי, סורק קבלות ומנתח הצעות מחיר — הכל עם AI.</p>
          <div className="lp-hero-buttons">
            <a href="/" className="lp-btn lp-btn-primary">התחל בחינם →</a>
            <a href="#how" className="lp-btn lp-btn-outline">איך זה עובד?</a>
          </div>
        </section>

        {/* STATS */}
        <section className="lp-stats">
          <div className="lp-stats-inner">
            <div>
              <div className="lp-stat-number">63%</div>
              <div className="lp-stat-label">מהיר יותר מעיצוב ידני</div>
            </div>
            <div>
              <div className="lp-stat-number">127+</div>
              <div className="lp-stat-label">בעלי מקצוע כבר משתמשים</div>
            </div>
            <div>
              <div className="lp-stat-number">₪99</div>
              <div className="lp-stat-label">חבילת Pro — תשלום חד פעמי</div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="lp-features" id="features">
          <div className="lp-feature">
            <div className="lp-feature-text">
              <div className="lp-feature-tag">🎨 הדמיות AI</div>
              <h3>העלה תמונה, קבל הדמיית שיפוץ תוך שניות</h3>
              <p>ה-AI מנתח את החדר שלך ומייצר הדמיה ריאליסטית של איך הוא ייראה אחרי השיפוץ. בחר סגנון, שנה צבעים, הוסף רהיטים — בלחיצה.</p>
            </div>
            <div className="lp-feature-visual"><div className="lp-feature-icon">🏠</div></div>
          </div>
          <div className="lp-feature">
            <div className="lp-feature-text">
              <div className="lp-feature-tag">📋 כתב כמויות</div>
              <h3>כתב כמויות אוטומטי מתמונה אחת</h3>
              <p>צלם את החדר, וה-AI ימפה כל פריט: ריצוף, צבע, חשמל, אינסטלציה. תקבל כתב כמויות מפורט עם מחירי שוק מעודכנים.</p>
            </div>
            <div className="lp-feature-visual"><div className="lp-feature-icon">📊</div></div>
          </div>
          <div className="lp-feature">
            <div className="lp-feature-text">
              <div className="lp-feature-tag">🔍 ניתוח הצעות מחיר</div>
              <h3>אל תשלם יותר מדי. תן ל-AI לבדוק</h3>
              <p>העלה הצעת מחיר מקבלן וה-AI ישווה מול מחירי שוק, יזהה סעיפים חסרים ויגיד לך אם המחיר הוגן או מנופח.</p>
            </div>
            <div className="lp-feature-visual"><div className="lp-feature-icon">💰</div></div>
          </div>
          <div className="lp-feature">
            <div className="lp-feature-text">
              <div className="lp-feature-tag">🛍️ Shop the Look</div>
              <h3>ראית עיצוב שאהבת? קנה אותו</h3>
              <p>העלה תמונת השראה וה-AI יזהה כל מוצר בתמונה — רהיטים, תאורה, אביזרים — עם קישורים ישירים לרכישה.</p>
            </div>
            <div className="lp-feature-visual"><div className="lp-feature-icon">🛒</div></div>
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
              <h4>העלה תמונה</h4>
              <p>צלם את החדר או העלה תמונה קיימת. ה-AI מזהה אוטומטית את המרחב.</p>
            </div>
            <div className="lp-step">
              <div className="lp-step-number">2</div>
              <h4>בחר מה לעשות</h4>
              <p>הדמיית שיפוץ? כתב כמויות? ניתוח הצעת מחיר? בחר את הכלי שמתאים לך.</p>
            </div>
            <div className="lp-step">
              <div className="lp-step-number">3</div>
              <h4>קבל תוצאה מיידית</h4>
              <p>תוך שניות תקבל תוצאה מקצועית שתוכל לשתף עם הקבלן, המעצב או בן/בת הזוג.</p>
            </div>
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
              <div className="lp-testimonial-text">&ldquo;קיבלתי הצעת מחיר מקבלן והרגשתי שמשהו לא בסדר. העליתי לShiputzAI וזה הראה לי שהמחיר מנופח ב-40%. חסך לי אלפי שקלים.&rdquo;</div>
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
                <li>תמיכה בעדיפות</li>
              </ul>
              <a href="/" className="lp-btn lp-btn-primary" style={{width:'100%'}}>שדרג ל-Pro →</a>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="lp-cta">
          <h2>מוכן לשפץ חכם?</h2>
          <p>הצטרף למאות בעלי מקצוע ובעלי דירות שכבר משתמשים ב-ShiputzAI</p>
          <a href="/" className="lp-btn lp-btn-primary" style={{fontSize:18,padding:'16px 40px'}}>התחל בחינם — בלי כרטיס אשראי →</a>
        </section>

        {/* FOOTER */}
        <footer className="lp-footer">
          <p>© 2026 ShiputzAI. כל הזכויות שמורות.</p>
        </footer>
      </div>
    </>
  );
}
