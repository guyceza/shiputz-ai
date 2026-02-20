"use client";

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-11 bg-white/80 backdrop-blur-xl z-50 border-b border-gray-200/50">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="text-base font-semibold text-gray-900">
            ShiputzAI
          </Link>
          <Link href="/" className="text-xs text-gray-500 hover:text-gray-900">
            חזרה לדף הבית
          </Link>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-semibold text-gray-900 mb-8">מדיניות פרטיות</h1>
          <p className="text-sm text-gray-500 mb-12">עודכן לאחרונה: פברואר 2026</p>

          <div className="prose prose-gray max-w-none space-y-8 text-gray-600">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. מבוא</h2>
              <p>
                ברוכים הבאים ל-ShiputzAI. אנו מחויבים להגן על פרטיותכם ולשמור על המידע האישי שלכם בצורה מאובטחת. 
                מדיניות פרטיות זו מסבירה כיצד אנו אוספים, משתמשים ומגנים על המידע שלכם.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. המידע שאנו אוספים</h2>
              <p>אנו אוספים את סוגי המידע הבאים:</p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li><strong>מידע אישי:</strong> שם, כתובת דוא״ל, מספר טלפון בעת ההרשמה</li>
                <li><strong>נתוני פרויקט:</strong> תקציבים, הוצאות, קבלות ומסמכים שתעלו למערכת</li>
                <li><strong>נתוני שימוש:</strong> מידע על אופן השימוש שלכם באפליקציה</li>
                <li><strong>מידע טכני:</strong> כתובת IP, סוג דפדפן, מכשיר</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. כיצד אנו משתמשים במידע</h2>
              <p>המידע שלכם משמש אותנו למטרות הבאות:</p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li>אספקת שירותי האפליקציה וניהול החשבון שלכם</li>
                <li>ניתוח הצעות מחיר וקבלות באמצעות בינה מלאכותית</li>
                <li>שיפור השירותים שלנו והתאמתם לצרכיכם</li>
                <li>שליחת עדכונים והתראות הקשורים לפרויקט שלכם</li>
                <li>תמיכה טכנית ושירות לקוחות</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. אבטחת מידע</h2>
              <p>
                אנו נוקטים באמצעי אבטחה מתקדמים להגנה על המידע שלכם, כולל הצפנת נתונים, 
                גישה מוגבלת למידע ואחסון מאובטח. עם זאת, אין שיטת העברה או אחסון באינטרנט 
                שהיא מאובטחת ב-100%.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. שיתוף מידע עם צדדים שלישיים</h2>
              <p>
                אנו לא מוכרים את המידע האישי שלכם לצדדים שלישיים. אנו עשויים לשתף מידע עם:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li>ספקי שירות שעוזרים לנו להפעיל את האפליקציה</li>
                <li>רשויות חוק כאשר נדרש על פי דין</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. הזכויות שלכם</h2>
              <p>יש לכם את הזכויות הבאות בנוגע למידע שלכם:</p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li>לגשת למידע האישי שלכם</li>
                <li>לתקן מידע שגוי</li>
                <li>למחוק את המידע שלכם</li>
                <li>להתנגד לעיבוד המידע</li>
                <li>לקבל עותק של המידע בפורמט נגיש</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. עוגיות (Cookies)</h2>
              <p>
                אנו משתמשים בעוגיות ובטכנולוגיות דומות לשיפור חוויית המשתמש, 
                לניתוח תנועה ולהתאמה אישית של תוכן. תוכלו לנהל את העדפות העוגיות 
                דרך הגדרות הדפדפן שלכם.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. שינויים במדיניות</h2>
              <p>
                אנו עשויים לעדכן מדיניות זו מעת לעת. שינויים מהותיים יפורסמו באתר 
                ותקבלו הודעה במייל. המשך השימוש באפליקציה לאחר השינויים מהווה הסכמה למדיניות המעודכנת.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. יצירת קשר</h2>
              <p>
                לשאלות בנוגע למדיניות הפרטיות שלנו, ניתן לפנות אלינו בכתובת:
              </p>
              <p className="mt-4">
                <strong>דוא״ל:</strong> privacy@shiputzai.co.il
              </p>
            </section>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">© 2026 ShiputzAI</p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/terms" className="hover:text-gray-900">תנאי שימוש</Link>
            <Link href="/privacy" className="hover:text-gray-900">פרטיות</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
