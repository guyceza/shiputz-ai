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
        <p className="text-base text-gray-500 mb-2">בקרוב</p>
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight mb-4">
          שיפוץ חכם יותר.
        </h1>
        <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mb-8 leading-relaxed">
          בינה מלאכותית שמנהלת את התקציב, מנתחת הצעות מחיר, ומתריעה כשמשהו לא
          תקין.
        </p>
        <div className="flex gap-6">
          <Link
            href="/signup"
            className="text-lg text-blue-600 hover:underline inline-flex items-center gap-1"
          >
            התחל עכשיו
            <span>‹</span>
          </Link>
          <Link
            href="#features"
            className="text-lg text-blue-600 hover:underline inline-flex items-center gap-1"
          >
            גלה עוד
            <span>‹</span>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
              יכולות
            </p>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
              הכל במקום אחד.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Feature
              title="סריקת מסמכים"
              description="צלם קבלה או הצעת מחיר. הבינה המלאכותית קוראת, מפענחת, ומארגנת אוטומטית."
            />
            <Feature
              title="ניתוח מחירים"
              description="השוואה למחירי שוק בזמן אמת. תדע מיד אם ההצעה הוגנת."
            />
            <Feature
              title="בדיקת חוזים"
              description="סריקה של סעיפים בעייתיים, פערים, וחוסרים. לפני שחותמים."
            />
            <Feature
              title="מעקב תקציב"
              description="תמונה ברורה של ההוצאות מול התקציב. בכל רגע, בכל מקום."
            />
            <Feature
              title="התראות חכמות"
              description="המערכת מזהה חריגות ומתריעה. תשלום גבוה מדי? תקבל התראה."
            />
            <Feature
              title="תיעוד מלא"
              description="כל תמונה, תשלום והתכתבות. מתועדים ומאורגנים."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6">
        <div className="max-w-md mx-auto text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
            מחיר
          </p>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
            פשוט.
          </h2>
          <p className="text-lg text-gray-500 mb-8">
            תשלום אחד. לכל משך הפרויקט.
          </p>
          <div className="text-6xl font-semibold mb-2">₪149</div>
          <p className="text-gray-500 mb-8">תשלום חד פעמי</p>
          <Link
            href="/signup"
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-full text-base hover:bg-blue-700 transition-colors"
          >
            התחל עכשיו
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-6 text-center text-xs text-gray-500 bg-gray-50">
        © 2026 ShiputzAI
      </footer>
    </div>
  );
}

function Feature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="text-right">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-base text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}
