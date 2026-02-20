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
          <Link
            href="/login"
            className="text-xs text-blue-600 hover:underline"
          >
            התחברות
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-11 min-h-screen flex flex-col justify-center items-center text-center px-6">
        <p className="text-sm text-blue-600 font-medium mb-4">ניהול שיפוצים חכם</p>
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight mb-4">
          שיפוץ בשליטה מלאה.
        </h1>
        <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mb-8 leading-relaxed">
          בינה מלאכותית שמנהלת את התקציב, מנתחת הצעות מחיר, ומתריעה לפני שנכנסים לבעיה.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link
            href="/signup"
            className="bg-blue-600 text-white px-8 py-4 rounded-full text-base hover:bg-blue-700 transition-colors"
          >
            התחל בחינם
          </Link>
          <Link
            href="#features"
            className="text-blue-600 px-8 py-4 rounded-full text-base hover:bg-gray-100 transition-colors"
          >
            גלה עוד
          </Link>
        </div>
        <p className="text-sm text-gray-400 mt-6">ללא כרטיס אשראי · התחל תוך דקה</p>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
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
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">הבעיה</p>
          <h2 className="text-3xl md:text-4xl font-semibold mb-6">שיפוץ בישראל זה כאב ראש.</h2>
          <p className="text-lg text-gray-500 mb-12">
            חריגות בתקציב, קבלנים שנעלמים, הצעות מחיר מנופחות, ותיעוד באקסל שמתבלגן. זה לא חייב להיות ככה.
          </p>
          <div className="grid md:grid-cols-2 gap-6 text-right">
            <div className="bg-red-50 rounded-2xl p-6">
              <p className="font-semibold text-red-900 mb-2">הדרך הישנה</p>
              <ul className="text-red-700 space-y-2 text-sm">
                <li>• אקסל מבולגן שאף אחד לא מעדכן</li>
                <li>• קבלות בארנק שהולכות לאיבוד</li>
                <li>• הצעות מחיר שאי אפשר להשוות</li>
                <li>• הפתעות בסוף - "שכחנו לחשב..."</li>
              </ul>
            </div>
            <div className="bg-green-50 rounded-2xl p-6">
              <p className="font-semibold text-green-900 mb-2">עם ShiputzAI</p>
              <ul className="text-green-700 space-y-2 text-sm">
                <li>• מעקב אוטומטי בזמן אמת</li>
                <li>• צילום קבלה = הוספה מיידית</li>
                <li>• AI שמנתח ומשווה מחירים</li>
                <li>• התראות לפני שיש בעיה</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">יכולות</p>
            <h2 className="text-3xl md:text-4xl font-semibold">כל מה שצריך. ותו לא.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="📊"
              title="מעקב תקציב"
              description="ראה בדיוק כמה הוצאת, על מה, ומתי. גרפים ברורים והתראות אוטומטיות."
            />
            <FeatureCard
              icon="📸"
              title="סריקת קבלות"
              description="צלם קבלה, ה-AI קורא ומוסיף לרשימה. סכום, תאריך, קטגוריה - הכל אוטומטי."
            />
            <FeatureCard
              icon="🔍"
              title="ניתוח הצעות מחיר"
              description="העלה הצעה ותקבל ניתוח מיידי. האם המחיר הוגן? מה חסר? מה חשוד?"
            />
            <FeatureCard
              icon="📝"
              title="בדיקת חוזים"
              description="ה-AI סורק את החוזה ומזהה סעיפים בעייתיים או חסרים לפני שחותמים."
            />
            <FeatureCard
              icon="⚠️"
              title="התראות חכמות"
              description="חרגת מהתקציב? תשלום חריג? המערכת תתריע בזמן אמת."
            />
            <FeatureCard
              icon="💬"
              title="עוזר AI"
              description="שאל כל שאלה על השיפוץ שלך וקבל תשובה מקצועית ומותאמת."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">איך זה עובד</p>
            <h2 className="text-3xl md:text-4xl font-semibold">שלושה צעדים. זה הכל.</h2>
          </div>
          <div className="space-y-12">
            <Step
              number="1"
              title="הגדר פרויקט"
              description="תן שם, הגדר תקציב, והתחל. לוקח 30 שניות."
            />
            <Step
              number="2"
              title="תעד הוצאות"
              description="צלם קבלות, העלה מסמכים, סמן תשלומים. ה-AI עושה את השאר."
            />
            <Step
              number="3"
              title="קבל שליטה"
              description="ראה את המצב בזמן אמת, קבל התראות, קבל החלטות מושכלות."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-md mx-auto text-center">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">מחיר</p>
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">פשוט והוגן.</h2>
          <p className="text-gray-500 mb-8">תשלום אחד. לכל משך הפרויקט. בלי הפתעות.</p>
          
          <div className="bg-white rounded-3xl p-8 shadow-sm">
            <div className="text-6xl font-semibold mb-2">₪149</div>
            <p className="text-gray-500 mb-8">תשלום חד פעמי</p>
            <ul className="text-right space-y-4 mb-8">
              <PricingFeature text="מעקב תקציב ללא הגבלה" />
              <PricingFeature text="סריקת קבלות AI" />
              <PricingFeature text="ניתוח הצעות מחיר" />
              <PricingFeature text="בדיקת חוזים" />
              <PricingFeature text="התראות חכמות" />
              <PricingFeature text="עוזר AI אישי" />
              <PricingFeature text="תמיכה בעברית" />
            </ul>
            <Link
              href="/signup"
              className="block bg-blue-600 text-white py-4 rounded-full text-base hover:bg-blue-700 transition-colors"
            >
              התחל עכשיו
            </Link>
            <p className="text-xs text-gray-400 mt-4">ניתן להתחיל בחינם ולשדרג מתי שרוצים</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-gray-900 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">מוכנים לשיפוץ חכם יותר?</h2>
          <p className="text-gray-400 mb-8">הצטרפו לאלפי ישראלים שכבר מנהלים את השיפוץ שלהם בצורה חכמה.</p>
          <Link
            href="/signup"
            className="inline-block bg-white text-gray-900 px-8 py-4 rounded-full text-base hover:bg-gray-100 transition-colors"
          >
            התחל בחינם
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">© 2026 ShiputzAI. כל הזכויות שמורות.</p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="#" className="hover:text-gray-700">תנאי שימוש</Link>
            <Link href="#" className="hover:text-gray-700">פרטיות</Link>
            <Link href="#" className="hover:text-gray-700">צור קשר</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white rounded-2xl p-6">
      <span className="text-3xl mb-4 block">{icon}</span>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-6 items-start">
      <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0">
        {number}
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-1">{title}</h3>
        <p className="text-gray-500">{description}</p>
      </div>
    </div>
  );
}

function PricingFeature({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="text-green-500 font-bold">✓</span>
      <span className="text-gray-700">{text}</span>
    </li>
  );
}
