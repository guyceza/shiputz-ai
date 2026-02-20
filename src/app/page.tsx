"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-11 bg-white/80 backdrop-blur-xl z-50 border-b border-gray-200/50">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="text-base font-semibold text-gray-900">
            ShiputzAI
          </Link>
          <Link href="/login" className="text-xs text-gray-900 hover:text-gray-600">
            התחברות
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-11 min-h-screen flex flex-col justify-center items-center text-center px-6">
        <p className="text-sm text-gray-500 mb-4">ניהול שיפוצים חכם</p>
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight mb-4 text-gray-900">
          שיפוץ בשליטה מלאה.
        </h1>
        <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mb-8 leading-relaxed">
          בינה מלאכותית שמנהלת את התקציב, מנתחת הצעות מחיר, ומתריעה לפני שנכנסים לבעיה.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link
            href="/signup"
            className="bg-gray-900 text-white px-8 py-4 rounded-full text-base hover:bg-gray-800 transition-colors"
          >
            התחל בחינם
          </Link>
          <Link
            href="#features"
            className="text-gray-900 px-8 py-4 rounded-full text-base hover:bg-gray-100 transition-colors"
          >
            גלה עוד
          </Link>
        </div>
        <p className="text-sm text-gray-400 mt-6">ללא כרטיס אשראי · התחל תוך דקה</p>
      </section>

      {/* Stats */}
      <section className="py-20 px-6 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 text-center">
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
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-24 px-6 border-t border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-6 text-gray-900">שיפוץ בישראל זה כאב ראש.</h2>
          <p className="text-lg text-gray-500 mb-16">
            חריגות בתקציב, קבלנים שנעלמים, הצעות מחיר מנופחות, ותיעוד באקסל שמתבלגן.
          </p>
          <div className="grid md:grid-cols-2 gap-8 text-right">
            <div className="border border-gray-200 rounded-2xl p-8">
              <p className="font-semibold text-gray-900 mb-4">הדרך הישנה</p>
              <ul className="text-gray-500 space-y-3 text-sm">
                <li>אקסל מבולגן שאף אחד לא מעדכן</li>
                <li>קבלות בארנק שהולכות לאיבוד</li>
                <li>הצעות מחיר שאי אפשר להשוות</li>
                <li>הפתעות בסוף החודש</li>
              </ul>
            </div>
            <div className="border border-gray-900 rounded-2xl p-8 bg-gray-900 text-white">
              <p className="font-semibold mb-4">עם ShiputzAI</p>
              <ul className="text-gray-300 space-y-3 text-sm">
                <li>מעקב אוטומטי בזמן אמת</li>
                <li>צילום קבלה = הוספה מיידית</li>
                <li>AI שמנתח ומשווה מחירים</li>
                <li>התראות לפני שיש בעיה</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900">כל מה שצריך.</h2>
            <p className="text-gray-500 mt-4">ותו לא.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            <Feature title="מעקב תקציב" description="ראה בדיוק כמה הוצאת, על מה, ומתי. התראות אוטומטיות כשמתקרבים לגבול." />
            <Feature title="סריקת קבלות" description="צלם קבלה, ה-AI קורא ומוסיף לרשימה. סכום, תאריך, קטגוריה - אוטומטי." />
            <Feature title="ניתוח הצעות מחיר" description="העלה הצעה ותקבל ניתוח מיידי. האם המחיר הוגן? מה חסר?" />
            <Feature title="בדיקת חוזים" description="ה-AI סורק את החוזה ומזהה סעיפים בעייתיים או חסרים." />
            <Feature title="התראות חכמות" description="חרגת מהתקציב? תשלום חריג? המערכת מתריעה בזמן." />
            <Feature title="עוזר AI" description="שאל כל שאלה על השיפוץ וקבל תשובה מקצועית ומותאמת." />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900">שלושה צעדים.</h2>
          </div>
          <div className="space-y-16">
            <Step number="01" title="הגדר פרויקט" description="תן שם, הגדר תקציב, והתחל. לוקח 30 שניות." />
            <Step number="02" title="תעד הוצאות" description="צלם קבלות, העלה מסמכים, סמן תשלומים." />
            <Step number="03" title="קבל שליטה" description="ראה את המצב בזמן אמת, קבל התראות, קבל החלטות." />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 border-t border-gray-100">
        <div className="max-w-sm mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-gray-900">פשוט.</h2>
          <p className="text-gray-500 mb-12">תשלום אחד. לכל משך הפרויקט.</p>
          
          <div className="border border-gray-200 rounded-3xl p-10">
            <div className="text-6xl font-semibold text-gray-900 mb-2">₪149</div>
            <p className="text-gray-500 mb-10">תשלום חד פעמי</p>
            <ul className="text-right space-y-4 mb-10 text-sm text-gray-600">
              <li className="flex items-center gap-3">
                <span className="text-gray-900">—</span>
                <span>מעקב תקציב ללא הגבלה</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-gray-900">—</span>
                <span>סריקת קבלות AI</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-gray-900">—</span>
                <span>ניתוח הצעות מחיר</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-gray-900">—</span>
                <span>בדיקת חוזים</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-gray-900">—</span>
                <span>התראות חכמות</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-gray-900">—</span>
                <span>עוזר AI אישי</span>
              </li>
            </ul>
            <Link
              href="/signup"
              className="block bg-gray-900 text-white py-4 rounded-full text-base hover:bg-gray-800 transition-colors"
            >
              התחל עכשיו
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-gray-900 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">מוכנים?</h2>
          <p className="text-gray-400 mb-8">התחילו לנהל את השיפוץ בצורה חכמה.</p>
          <Link
            href="/signup"
            className="inline-block bg-white text-gray-900 px-8 py-4 rounded-full text-base hover:bg-gray-100 transition-colors"
          >
            התחל בחינם
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">© 2026 ShiputzAI</p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="#" className="hover:text-gray-900">תנאי שימוש</Link>
            <Link href="#" className="hover:text-gray-900">פרטיות</Link>
            <Link href="#" className="hover:text-gray-900">צור קשר</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-8 items-start">
      <span className="text-sm text-gray-400 font-medium">{number}</span>
      <div>
        <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
        <p className="text-gray-500">{description}</p>
      </div>
    </div>
  );
}
