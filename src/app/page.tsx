"use client";

import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [calcSize, setCalcSize] = useState("80");
  const [calcType, setCalcType] = useState("קומפלט");
  const [calcLocation, setCalcLocation] = useState("מרכז");
  const [calcBathrooms, setCalcBathrooms] = useState("1");
  const [calcKitchen, setCalcKitchen] = useState("חדש");
  const [calcInfrastructure, setCalcInfrastructure] = useState("חלקי");
  const [estimate, setEstimate] = useState<number | null>(null);
  const [estimateBreakdown, setEstimateBreakdown] = useState<{base: number, bathrooms: number, kitchen: number, infrastructure: number} | null>(null);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const calculateEstimate = () => {
    const size = parseInt(calcSize);
    const bathrooms = parseInt(calcBathrooms);
    
    // Base price per sqm by type
    const basePrices: Record<string, number> = {
      "קוסמטי": 400,
      "קומפלט": 1400,
      "יוקרתי": 2800,
    };
    
    // Location multiplier
    const locationMultiplier: Record<string, number> = {
      "תל אביב": 1.25,
      "מרכז": 1.0,
      "שרון/שפלה": 0.95,
      "חיפה/צפון": 0.85,
      "דרום": 0.80,
    };
    
    // Kitchen prices
    const kitchenPrices: Record<string, number> = {
      "ללא": 0,
      "רענון": 8000,
      "חדש": 35000,
      "יוקרתי": 70000,
    };
    
    // Infrastructure prices
    const infraPrices: Record<string, number> = {
      "ללא": 0,
      "חלקי": 8000,
      "מלא": 25000,
    };
    
    // Bathroom price (per bathroom)
    const bathroomPrice = calcType === "יוקרתי" ? 22000 : calcType === "קומפלט" ? 14000 : 5000;
    
    const basePrice = basePrices[calcType] || 1400;
    const locMultiplier = locationMultiplier[calcLocation] || 1.0;
    
    const baseEstimate = Math.round(size * basePrice * locMultiplier);
    const bathroomEstimate = bathrooms * bathroomPrice;
    const kitchenEstimate = kitchenPrices[calcKitchen] || 0;
    const infraEstimate = infraPrices[calcInfrastructure] || 0;
    
    const total = baseEstimate + bathroomEstimate + kitchenEstimate + infraEstimate;
    
    setEstimate(total);
    setEstimateBreakdown({
      base: baseEstimate,
      bathrooms: bathroomEstimate,
      kitchen: kitchenEstimate,
      infrastructure: infraEstimate
    });
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      console.log("Newsletter subscription:", email);
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-11 bg-white/80 backdrop-blur-xl z-50 border-b border-gray-200/50">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="text-base font-semibold text-gray-900">
            ShiputzAI
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/tips" className="text-xs text-gray-500 hover:text-gray-900">
              מאמרים וטיפים
            </Link>
            <Link href="/login" className="text-xs text-gray-900 hover:text-gray-600">
              התחברות
            </Link>
          </div>
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

      {/* Social Proof Stats Banner */}
      <section className="py-12 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="group">
              <p className="text-3xl md:text-4xl font-bold text-gray-900 mb-1 group-hover:scale-105 transition-transform">₪50,000,000<span className="text-blue-600">+</span></p>
              <p className="text-sm text-gray-500">תקציבים נוהלו</p>
            </div>
            <div className="group">
              <p className="text-3xl md:text-4xl font-bold text-gray-900 mb-1 group-hover:scale-105 transition-transform">100<span className="text-blue-600">+</span></p>
              <p className="text-sm text-gray-500">משפצים פעילים</p>
            </div>
            <div className="group">
              <p className="text-3xl md:text-4xl font-bold text-gray-900 mb-1 group-hover:scale-105 transition-transform">500<span className="text-blue-600">+</span></p>
              <p className="text-sm text-gray-500">הצעות מחיר נותחו</p>
            </div>
            <div className="group">
              <p className="text-3xl md:text-4xl font-bold text-gray-900 mb-1 group-hover:scale-105 transition-transform">10,000<span className="text-blue-600">+</span></p>
              <p className="text-sm text-gray-500">טיפים נקראו</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-6 px-6 border-b border-gray-100">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-sm text-gray-500">
            <span className="flex items-center gap-2">🔒 מאובטח ופרטי</span>
            <span className="flex items-center gap-2">💰 ללא עלות לנסות</span>
            <span className="flex items-center gap-2">🤖 מבוסס AI</span>
          </div>
        </div>
      </section>

      {/* Quick Calculator */}
      <section className="py-20 px-6 border-t border-gray-100">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">כמה יעלה לך השיפוץ?</h2>
            <p className="text-gray-500">קבל הערכה מיידית על בסיס מחירי שוק מאומתים</p>
          </div>
          
          <div className="bg-gray-50 rounded-3xl p-8 md:p-10">
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">גודל הדירה (מ״ר)</label>
                <select 
                  value={calcSize}
                  onChange={(e) => setCalcSize(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-gray-900 cursor-pointer"
                >
                  <option value="50">50 מ״ר</option>
                  <option value="60">60 מ״ר</option>
                  <option value="70">70 מ״ר</option>
                  <option value="80">80 מ״ר</option>
                  <option value="90">90 מ״ר</option>
                  <option value="100">100 מ״ר</option>
                  <option value="120">120 מ״ר</option>
                  <option value="150">150 מ״ר</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">סוג השיפוץ</label>
                <select 
                  value={calcType}
                  onChange={(e) => setCalcType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-gray-900 cursor-pointer"
                >
                  <option value="קוסמטי">קוסמטי (צבע, תיקונים קלים)</option>
                  <option value="קומפלט">קומפלט (שינויים משמעותיים)</option>
                  <option value="יוקרתי">יוקרתי (גמר גבוה)</option>
                </select>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">מיקום</label>
                <select 
                  value={calcLocation}
                  onChange={(e) => setCalcLocation(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-gray-900 cursor-pointer"
                >
                  <option value="תל אביב">תל אביב (+25%)</option>
                  <option value="מרכז">מרכז (בסיס)</option>
                  <option value="שרון/שפלה">שרון / שפלה (-5%)</option>
                  <option value="חיפה/צפון">חיפה / צפון (-15%)</option>
                  <option value="דרום">דרום (-20%)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">חדרי רחצה</label>
                <select 
                  value={calcBathrooms}
                  onChange={(e) => setCalcBathrooms(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-gray-900 cursor-pointer"
                >
                  <option value="1">1 חדר רחצה</option>
                  <option value="2">2 חדרי רחצה</option>
                  <option value="3">3 חדרי רחצה</option>
                </select>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm text-gray-600 mb-2">מטבח</label>
                <select 
                  value={calcKitchen}
                  onChange={(e) => setCalcKitchen(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-gray-900 cursor-pointer"
                >
                  <option value="ללא">ללא שינוי</option>
                  <option value="רענון">רענון (חזיתות, משטח)</option>
                  <option value="חדש">מטבח חדש סטנדרטי</option>
                  <option value="יוקרתי">מטבח יוקרתי</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">תשתיות (חשמל/אינסטלציה)</label>
                <select 
                  value={calcInfrastructure}
                  onChange={(e) => setCalcInfrastructure(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-gray-900 cursor-pointer"
                >
                  <option value="ללא">ללא שינוי</option>
                  <option value="חלקי">שדרוג חלקי</option>
                  <option value="מלא">החלפה מלאה</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={calculateEstimate}
              className="w-full bg-gray-900 text-white py-4 rounded-full text-base font-medium hover:bg-gray-800 transition-colors"
            >
              חשב עכשיו
            </button>
            
            {estimate && estimateBreakdown && (
              <div className="mt-8 animate-fadeIn">
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <p className="text-sm text-gray-500 mb-2 text-center">הערכת עלות משוערת</p>
                  <p className="text-4xl font-bold text-gray-900 mb-4 text-center">₪{estimate.toLocaleString()}</p>
                  
                  <div className="border-t border-gray-100 pt-4 mb-4">
                    <p className="text-xs text-gray-500 mb-2">פירוט:</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">עבודות בסיס ({calcSize} מ״ר)</span>
                        <span className="text-gray-900">₪{estimateBreakdown.base.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">חדרי רחצה ({calcBathrooms})</span>
                        <span className="text-gray-900">₪{estimateBreakdown.bathrooms.toLocaleString()}</span>
                      </div>
                      {estimateBreakdown.kitchen > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">מטבח</span>
                          <span className="text-gray-900">₪{estimateBreakdown.kitchen.toLocaleString()}</span>
                        </div>
                      )}
                      {estimateBreakdown.infrastructure > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">תשתיות</span>
                          <span className="text-gray-900">₪{estimateBreakdown.infrastructure.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-400 mb-6 text-center">±10% תלוי בספקים ובחומרים שתבחר</p>
                  <Link
                    href="/signup"
                    className="block text-center bg-blue-600 text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    רוצה לנהל את התקציב? התחל פרויקט ←
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
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

      {/* Testimonials */}
      <section className="py-24 px-6 border-t border-gray-100 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">מה אומרים המשפצים</h2>
            <p className="text-gray-500">הצטרפו למאות משפצים שכבר חוסכים זמן וכסף</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard
              quote="שפצתי דירת 4 חדרים והאפליקציה עזרה לי לחסוך ₪15,000 בהשוואת הצעות מחיר"
              name="יעל מ."
              city="תל אביב"
              rating={5}
            />
            <TestimonialCard
              quote="סוף סוף הצלחתי לעקוב אחרי כל ההוצאות במקום אחד. ממליץ בחום!"
              name="אבי כ."
              city="רמת גן"
              rating={5}
            />
            <TestimonialCard
              quote="ניתוח הצעת המחיר ב-AI חשף לי עלויות מנופחות שחסכו לי אלפים"
              name="מיכל ר."
              city="חיפה"
              rating={5}
            />
          </div>
        </div>
      </section>

      {/* Tip of the Week */}
      <section className="py-16 px-6 border-t border-gray-100">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 md:p-10 border border-amber-100">
            <div className="flex items-start gap-4">
              <span className="text-4xl">💡</span>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">הטיפ השבוע</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  לפני שסוגרים עם קבלן, בקשו ממנו כתב כמויות מפורט - זה יחסוך לכם הפתעות בהמשך ויאפשר השוואה אמיתית בין הצעות.
                </p>
                <Link 
                  href="/tips"
                  className="text-sm font-medium text-amber-700 hover:text-amber-800 inline-flex items-center gap-1 group"
                >
                  עוד טיפים 
                  <span className="group-hover:-translate-x-1 transition-transform">←</span>
                </Link>
              </div>
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

      {/* Newsletter */}
      <section className="py-20 px-6 border-t border-gray-100 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">קבלו טיפים לשיפוץ חכם</h2>
          <p className="text-gray-500 mb-8">הצטרפו ל-500+ משפצים שמקבלים טיפים שבועיים</p>
          
          {subscribed ? (
            <div className="bg-green-50 text-green-700 rounded-2xl p-6 border border-green-100">
              <span className="text-2xl mb-2 block">✓</span>
              <p className="font-medium">נרשמת בהצלחה!</p>
              <p className="text-sm mt-1">הטיפ הראשון בדרך אליך</p>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-5 py-4 border border-gray-200 rounded-full text-base focus:outline-none focus:border-gray-900 text-left"
                dir="ltr"
                required
              />
              <button
                type="submit"
                className="bg-gray-900 text-white px-8 py-4 rounded-full text-base font-medium hover:bg-gray-800 transition-colors whitespace-nowrap"
              >
                הרשמה
              </button>
            </form>
          )}
          <p className="text-xs text-gray-400 mt-4">ללא ספאם. אפשר להסיר בכל עת.</p>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 border-t border-gray-100">
        <div className="max-w-sm mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-gray-900">פשוט.</h2>
          <p className="text-gray-500 mb-12">תשלום אחד. לכל משך הפרויקט.</p>
          
          <div className="border border-gray-200 rounded-3xl p-10 relative overflow-hidden">
            {/* Discount Badge */}
            <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              50% הנחה
            </div>
            
            <div className="mb-2">
              <span className="text-2xl text-gray-400 line-through">₪299.99</span>
            </div>
            <div className="text-6xl font-semibold text-gray-900 mb-2">₪149.99</div>
            <p className="text-gray-500 mb-2">תשלום חד פעמי</p>
            <p className="text-xs text-green-600 mb-8">🔥 מבצע לזמן מוגבל</p>
            
            <ul className="text-right space-y-4 mb-10 text-sm text-gray-600">
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <span>מעקב תקציב ללא הגבלה</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <span>סריקת קבלות AI</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <span>ניתוח הצעות מחיר</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <span>בדיקת חוזים</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <span>התראות חכמות</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <span>עוזר AI אישי</span>
              </li>
            </ul>
            <Link
              href="/signup"
              className="block bg-gray-900 text-white py-4 rounded-full text-base hover:bg-gray-800 transition-colors"
            >
              נצל את ההנחה
            </Link>
            <p className="text-xs text-gray-400 mt-4">ללא התחייבות</p>
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
            <Link href="/terms" className="hover:text-gray-900">תנאי שימוש</Link>
            <Link href="/privacy" className="hover:text-gray-900">פרטיות</Link>
            <Link href="#" className="hover:text-gray-900">צור קשר</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({ title, description }: { title: string; description: string }) {
  return (
    <div className="group">
      <h3 className="text-lg font-semibold mb-2 text-gray-900 group-hover:text-blue-600 transition-colors">{title}</h3>
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

function TestimonialCard({ quote, name, city, rating }: { quote: string; name: string; city: string; rating: number }) {
  return (
    <div className="bg-white rounded-2xl p-8 border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300">
      <div className="text-4xl text-gray-200 mb-4 leading-none">"</div>
      <p className="text-gray-700 mb-6 leading-relaxed">{quote}</p>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900">{name}</p>
          <p className="text-sm text-gray-500">{city}</p>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: rating }).map((_, i) => (
            <span key={i} className="text-amber-400">★</span>
          ))}
        </div>
      </div>
    </div>
  );
}
