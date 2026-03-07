"use client";

import Link from "next/link";

export default function TermsPage() {
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
          <h1 className="text-4xl font-semibold text-gray-900 mb-8">תנאי שימוש</h1>
          <p className="text-sm text-gray-500 mb-12">עודכן לאחרונה: פברואר 2026</p>

          <div className="prose prose-gray max-w-none space-y-8 text-gray-600">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. הסכמה לתנאים</h2>
              <p>
                בעצם השימוש באפליקציית ShiputzAI, אתם מסכימים לתנאי שימוש אלה. 
                אם אינכם מסכימים לתנאים, אנא הימנעו משימוש בשירות.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. תיאור השירות</h2>
              <p>
                ShiputzAI היא פלטפורמה דיגיטלית המבוססת על בינה מלאכותית (AI) לסיוע בתכנון וניהול שיפוצים. 
                השירות מציע כלים לניהול תקציב, סריקת קבלות, ניתוח הצעות מחיר, הדמיות חזותיות ועוד.
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                <p className="font-semibold text-gray-900 mb-2">הבהרה חשובה בנוגע להדמיות AI:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>כל ההדמיות החזותיות נוצרות באמצעות בינה מלאכותית <strong>להמחשה בלבד</strong> ואינן מייצגות תוצאה סופית מובטחת</li>
                  <li>הניתוחים, ההערכות והמלצות המחירים הם הערכות אוטומטיות ועשויים להשתנות בפועל</li>
                  <li>ShiputzAI הוא <strong>כלי עזר דיגיטלי בלבד</strong> — אינו קבלן שיפוצים, מהנדס, אדריכל או יועץ מקצועי מוסמך</li>
                  <li>אין להסתמך על תוצאות השירות כייעוץ מקצועי. מומלץ להתייעץ עם בעלי מקצוע מוסמכים לפני קבלת החלטות</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. הרשמה וחשבון</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>עליכם להיות בני 18 ומעלה לשימוש בשירות</li>
                <li>אתם אחראים לשמור על סודיות פרטי החשבון שלכם</li>
                <li>עליכם לספק מידע מדויק ועדכני בעת ההרשמה</li>
                <li>אתם אחראים לכל הפעילות המתבצעת תחת החשבון שלכם</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. תשלום ומחירים</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>התשלום עבור השירות הוא חד-פעמי כמפורט בעמוד התמחור. ניתן לרכוש גם חבילות הדמיות נוספות בתשלום חד-פעמי</li>
                <li>כל המחירים כוללים מע״מ כחוק</li>
                <li>אנו שומרים לעצמנו את הזכות לשנות מחירים בהתראה מראש</li>
                <li>תשלום שבוצע לא יוחזר, למעט במקרים חריגים ובהתאם לשיקול דעתנו</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. שימוש מותר</h2>
              <p>אתם מתחייבים:</p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li>להשתמש בשירות למטרות חוקיות בלבד</li>
                <li>לא להעתיק, לשנות או להפיץ את תוכן האפליקציה</li>
                <li>לא לנסות לפרוץ או לשבש את פעולת המערכת</li>
                <li>לא להשתמש בבוטים או כלים אוטומטיים ללא אישור</li>
                <li>לא להעלות תוכן פוגעני, בלתי חוקי או מזיק</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. קניין רוחני</h2>
              <p>
                כל הזכויות באפליקציה, כולל עיצוב, קוד, לוגו ותוכן, שייכות ל-ShiputzAI. 
                המידע שאתם מעלים לאפליקציה נשאר בבעלותכם, אך אתם מעניקים לנו רישיון 
                להשתמש בו לצורך אספקת השירות.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. הגבלת אחריות</h2>
              <p>
                השירות מסופק ״כמות שהוא״ (AS IS). אנו לא מתחייבים שהשירות יהיה זמין 
                בכל עת או נטול שגיאות. אנו לא אחראים לנזקים ישירים או עקיפים הנובעים 
                משימוש בשירות, כולל:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li>החלטות כלכליות שהתקבלו בהסתמך על נתוני האפליקציה</li>
                <li>אי-דיוקים בניתוח AI של מסמכים</li>
                <li>אובדן נתונים עקב תקלות טכניות</li>
              </ul>
              <p className="mt-4">
                <strong>חשוב:</strong> האפליקציה מיועדת לסיוע בניהול שיפוצים ואינה מהווה תחליף 
                לייעוץ מקצועי מרואה חשבון, עורך דין או מהנדס.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. שינויים בשירות</h2>
              <p>
                אנו שומרים לעצמנו את הזכות לשנות, להשעות או להפסיק את השירות בכל עת, 
                עם או ללא הודעה מוקדמת. לא נהיה אחראים לכל שינוי או הפסקת השירות.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. סיום שימוש</h2>
              <p>
                אנו רשאים להשעות או לסגור את חשבונכם בכל עת אם תפרו את תנאי השימוש. 
                אתם רשאים לסגור את חשבונכם בכל עת דרך הגדרות החשבון.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. דין וסמכות שיפוט</h2>
              <p>
                תנאי שימוש אלה כפופים לחוקי מדינת ישראל. כל סכסוך יידון בבתי המשפט 
                המוסמכים בתל אביב-יפו.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. פרטי החברה</h2>
              <p>
                ShiputzAI הוא מוצר של גיא סזנה.
              </p>
              <ul className="list-none space-y-2 mt-4">
                <li><strong>דוא״ל:</strong> support@shipazti.com</li>
                <li><strong>אתר:</strong> shipazti.com</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. יצירת קשר</h2>
              <p>
                לשאלות בנוגע לתנאי השימוש, ניתן לפנות אלינו:
              </p>
              <p className="mt-4">
                <strong>דוא״ל:</strong> support@shipazti.com
              </p>
              <p className="mt-2">
                <strong>טופס יצירת קשר:</strong>{" "}
                <a href="/contact" className="text-emerald-600 hover:underline">לחצו כאן</a>
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
