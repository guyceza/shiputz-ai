"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function DesignLandingPage() {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Hero — straight to the point */}
      <section className="pt-12 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <Link href="/" className="text-lg font-semibold text-gray-900 inline-block mb-8">ShiputzAI</Link>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              רוצים לראות איך הבית ייראה<br />לפני שמתחילים?
            </h1>
            <p className="text-xl text-gray-500 max-w-xl mx-auto">
              העלו תמונה של חדר — קבלו הדמיית עיצוב תוך 30 שניות. בחינם.
            </p>
          </div>

          {/* Before/After Preview */}
          <div className="relative max-w-2xl mx-auto mb-10 rounded-2xl overflow-hidden border border-gray-200 shadow-lg">
            <Image
              src="/images/ai-vision/before-after-preview.jpg"
              alt="לפני ואחרי — הדמיית עיצוב AI"
              width={800}
              height={450}
              className="w-full"
              priority
              onLoad={() => setImgLoaded(true)}
            />
            {!imgLoaded && (
              <div className="absolute inset-0 bg-gray-100 animate-pulse" />
            )}
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/visualize"
              className="inline-block bg-[#101010] text-white px-10 py-4 rounded-full text-lg font-medium hover:bg-gray-800 transition-all"
            >
              נסו הדמיה עכשיו — בחינם
            </Link>
            <p className="text-sm text-gray-400 mt-3">ללא הרשמה · ללא כרטיס אשראי · תוצאה תוך 30 שניות</p>
          </div>
        </div>
      </section>

      {/* 3 Benefits */}
      <section className="py-16 px-6 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8 text-center">
          <div>
            <span className="text-3xl mb-3 block">📸</span>
            <h3 className="font-semibold text-gray-900 mb-1">מעלים תמונה</h3>
            <p className="text-sm text-gray-500">מצלמים חדר בטלפון או מעלים תמונה קיימת</p>
          </div>
          <div>
            <span className="text-3xl mb-3 block">🎨</span>
            <h3 className="font-semibold text-gray-900 mb-1">כותבים מה רוצים</h3>
            <p className="text-sm text-gray-500">&quot;סלון מודרני&quot;, &quot;מטבח לבן&quot;, &quot;חדר ילדים צבעוני&quot;</p>
          </div>
          <div>
            <span className="text-3xl mb-3 block">✨</span>
            <h3 className="font-semibold text-gray-900 mb-1">מקבלים הדמיה</h3>
            <p className="text-sm text-gray-500">תמונה מלאה של החדר אחרי השינוי, תוך 30 שניות</p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
            <div className="flex gap-1 justify-center mb-3 text-amber-400 text-lg">{'★★★★★'}</div>
            <p className="text-gray-700 leading-relaxed mb-4">
              &quot;העליתי תמונה של הסלון וקיבלתי הדמיה מדהימה. הלקוחה אישרה את הפרויקט באותו יום.&quot;
            </p>
            <p className="text-sm text-gray-500">רונית א. · מעצבת פנים, תל אביב</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-6 bg-[#101010] text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-4">מוכנים לראות?</h2>
          <p className="text-gray-400 mb-6">העלו תמונה וקבלו הדמיה. בלי הרשמה, בלי תשלום.</p>
          <Link
            href="/visualize"
            className="inline-block bg-white text-gray-900 px-10 py-4 rounded-full text-lg font-medium hover:bg-gray-100 transition-all"
          >
            נסו עכשיו
          </Link>
        </div>
      </section>
    </div>
  );
}
