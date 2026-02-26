"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ShoppableImage, ShoppableItem } from "@/components/ShoppableImage";
// Trial tracking uses /api/vision-trial endpoint

// Fun loading messages
const loadingMessages = [
  "מזהה מוצרים בתמונה...",
  "אתם יכולים להביא קפה בינתיים ☕",
  "סורקים כל פינה בחדר...",
  "מחפשים את הספה המושלמת...",
  "הבינה המלאכותית עובדת בשבילכם 🤖",
  "עוד רגע מסיימים...",
  "בודקים אם יש מבצעים...",
  "סופרים כריות על הספה...",
  "מודדים את המזנון...",
  "כמעט שם! 🎯",
];

// Default demo items for fallback
const demoItems: ShoppableItem[] = [
  { id: "plant", name: "פיקוס כינורי", position: { top: 30, left: 14, width: 16, height: 50 }, searchQuery: "פיקוס כינורי עציץ לקנייה" },
  { id: "sofa", name: "ספה דו-מושבית בז׳", position: { top: 48, left: 30, width: 28, height: 35 }, searchQuery: "ספה דו מושבית בז סקנדינבית מודרנית" },
  { id: "tv-console", name: "מזנון טלוויזיה עץ ולבן", position: { top: 60, left: 57, width: 28, height: 22 }, searchQuery: "מזנון טלוויזיה עץ לבן סקנדינבי" },
  { id: "floor-lamp", name: "מנורת רצפה מודרנית", position: { top: 35, left: 82, width: 10, height: 45 }, searchQuery: "מנורת רצפה לבנה מודרנית מינימליסטית" },
  { id: "pampas-vase", name: "אגרטל עם פמפס", position: { top: 45, left: 58, width: 8, height: 18 }, searchQuery: "אגרטל קרמיקה לבן פמפס יבש" },
  { id: "flooring", name: "פרקט עץ אלון בהיר", position: { top: 85, left: 10, width: 80, height: 13 }, searchQuery: "פרקט למינציה עץ אלון בהיר" },
  { id: "pillows", name: "כריות נוי", position: { top: 52, left: 37, width: 15, height: 12 }, searchQuery: "כריות נוי לספה בז אפור" },
  { id: "spotlights", name: "ספוטים שקועים", position: { top: 2, left: 20, width: 60, height: 8 }, searchQuery: "ספוטים שקועים LED תקרה לבן" },
];

export default function ShopLookPage() {
  const [imageSrc, setImageSrc] = useState<string>("/after-room.jpg");
  const [items, setItems] = useState<ShoppableItem[]>(demoItems);
  const [loading, setLoading] = useState(false);
  const [isCustomImage, setIsCustomImage] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [trialUsed, setTrialUsed] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false); // Main subscription
  const [showPaywall, setShowPaywall] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = localStorage.getItem("user");
        let userEmail = "";
        let currentUserId = "";
        
        if (userData) {
          const user = JSON.parse(userData);
          if (user.id) {
            setIsLoggedIn(true);
            setUserId(user.id);
            userEmail = user.email;
            currentUserId = user.id;
            setHasPurchased(user.purchased === true);
          }
        } else {
          const { getSession } = await import("@/lib/auth");
          const session = await getSession();
          if (session?.user) {
            setIsLoggedIn(true);
            setUserId(session.user.id);
            userEmail = session.user.email || "";
            currentUserId = session.user.id;
            // Check purchased from localStorage
            const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
            setHasPurchased(storedUser.purchased === true);
          }
        }
        
        // Check trial & subscription status from APIs
        if (currentUserId && userEmail) {
          // Check trial from DB
          try {
            const trialRes = await fetch(`/api/vision-trial?email=${encodeURIComponent(userEmail)}`);
            if (trialRes.ok) {
              const trialData = await trialRes.json();
              setTrialUsed(trialData.trialUsed || false);
            }
          } catch (e) {
            console.error("Failed to check trial:", e);
          }
          
          // Check Vision subscription from Supabase
          try {
            const visionRes = await fetch(`/api/check-vision?email=${encodeURIComponent(userEmail)}`);
            if (visionRes.ok) {
              const visionData = await visionRes.json();
              const hasSub = visionData.hasSubscription || false;
              setHasSubscription(hasSub);
              setHasAccess(hasSub || !trialUsed);
            }
          } catch (e) {
            console.error("Failed to check vision subscription:", e);
          }
        }
      } catch {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        setIsLoggedIn(!!user.id);
        setHasPurchased(user.purchased === true);
        if (user.id && user.email) {
          setUserId(user.id);
          // Check trial from API
          fetch(`/api/vision-trial?email=${encodeURIComponent(user.email)}`)
            .then(res => res.json())
            .then(data => {
              setTrialUsed(data.trialUsed || false);
            })
            .catch(e => console.error("Failed to check trial:", e));
          
          // Check Vision subscription from Supabase
          fetch(`/api/check-vision?email=${encodeURIComponent(user.email)}`)
            .then(res => res.json())
            .then(data => {
              const hasSub = data.hasSubscription || false;
              setHasSubscription(hasSub);
              setHasAccess(hasSub || !trialUsed);
            })
            .catch(e => console.error("Failed to check vision:", e));
        }
      }
    };
    checkAuth();
  }, []);

  // Consume trial when user generates their first visualization
  const consumeTrial = async () => {
    if (userId && !hasSubscription && !trialUsed) {
      const userData = localStorage.getItem("user");
      const userEmail = userData ? JSON.parse(userData).email : null;
      if (userEmail) {
        await fetch('/api/vision-trial', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail })
        });
      }
      setTrialUsed(true);
    }
  };

  // Countdown and message rotation during loading
  useEffect(() => {
    if (loading) {
      setCountdown(30);
      setMessageIndex(0);
      
      const countdownInterval = setInterval(() => {
        setCountdown(prev => Math.max(0, prev - 1));
      }, 1000);
      
      const messageInterval = setInterval(() => {
        setMessageIndex(prev => (prev + 1) % loadingMessages.length);
      }, 3000);
      
      return () => {
        clearInterval(countdownInterval);
        clearInterval(messageInterval);
      };
    }
  }, [loading]);

  useEffect(() => {
    // Check for custom image from localStorage
    const customImage = localStorage.getItem('shopLookImage');
    if (customImage) {
      setImageSrc(customImage);
      setIsCustomImage(true);
      setLoading(true);
      
      // Consume trial when analyzing custom image
      consumeTrial();
      
      // Analyze image with AI to detect products
      analyzeImage(customImage);
      
      // Clear from localStorage after reading
      localStorage.removeItem('shopLookImage');
    }
  }, [userId, hasSubscription, trialUsed]);

  const analyzeImage = async (imageUrl: string) => {
    try {
      const userData = localStorage.getItem("user");
      const userEmailForProducts = userData ? JSON.parse(userData).email : null;
      
      const response = await fetch('/api/detect-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageUrl, userEmail: userEmailForProducts })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          setItems(data.items);
        }
      }
    } catch (error) {
      console.error('Product detection failed:', error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-11 bg-white/80 backdrop-blur-xl z-30 border-b border-gray-200/50">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="text-base font-semibold text-gray-900">
            ShiputzAI
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/tips" className="text-xs text-gray-500 hover:text-gray-900">
              מאמרים וטיפים
            </Link>
            {isLoggedIn ? (
              <Link href="/dashboard" className="text-xs text-gray-900 hover:text-gray-600">
                לאזור האישי
              </Link>
            ) : (
              <Link href="/login" className="text-xs text-gray-900 hover:text-gray-600">
                התחברות
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-8 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full px-4 py-2 mb-6">
            <img src="/icons/cart.png" alt="" className="w-5 h-5" />
            <span className="text-sm font-medium text-gray-900">Shop the Look</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4 text-gray-900">
            קנה את הסגנון
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            לחצו על כל פריט בתמונה כדי למצוא היכן לקנות אותו בישראל
          </p>
        </div>
      </section>

      {/* Interactive Image */}
      <section className="px-6 pb-16">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 aspect-video flex items-center justify-center">
              <div className="text-center max-w-md px-6">
                <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-6"></div>
                <p className="text-lg text-gray-800 font-medium mb-2">{loadingMessages[messageIndex]}</p>
                {countdown > 0 ? (
                  <p className="text-gray-500">עוד {countdown} שניות...</p>
                ) : (
                  <p className="text-orange-600">לוקח קצת יותר זמן, עוד רגע...</p>
                )}
              </div>
            </div>
          ) : (
            <ShoppableImage
              imageSrc={imageSrc}
              imageAlt="סלון מעוצב אחרי שיפוץ"
              items={items}
            />
          )}
          
          {/* Legend */}
          <div className="mt-8 p-6 bg-gray-50 rounded-2xl">
            <h3 className="font-semibold text-gray-900 mb-4">פריטים בתמונה</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-gray-900 rounded-full" />
                  {item.name}
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-2xl">
              <img src="/icons/search.png" alt="" className="w-8 h-8 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">זיהוי אוטומטי</h4>
              <p className="text-sm text-gray-600">AI מזהה כל מוצר בתמונה</p>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-2xl">
              <span className="text-3xl mb-3 block">🇮🇱</span>
              <h4 className="font-semibold text-gray-900 mb-2">חיפוש בישראל</h4>
              <p className="text-sm text-gray-600">מציאת מוצרים דומים בחנויות ישראליות</p>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-2xl">
              <img src="/icons/money.png" alt="" className="w-8 h-8 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">השוואת מחירים</h4>
              <p className="text-sm text-gray-600">מצאו את המחיר הטוב ביותר</p>
            </div>
          </div>
        </div>
      </section>

      {/* Upload Your Own Image CTA */}
      <section className="py-16 px-6 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">רוצה לראות את החדר שלך?</h2>
          <p className="text-gray-300 mb-8">העלה תמונה של החדר שלך וה-AI יזהה את המוצרים ויעזור לך לקנות אותם</p>
          
          {!isLoggedIn ? (
            <Link
              href="/login?redirect=/shop-look"
              className="inline-block bg-white text-gray-900 px-8 py-4 rounded-full text-base font-medium hover:bg-gray-100 transition-all"
            >
              התחבר כדי להעלות תמונה
            </Link>
          ) : hasAccess ? (
            <label className="inline-block cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const imageData = event.target?.result as string;
                      localStorage.setItem('shopLookImage', imageData);
                      window.location.reload();
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <span className="inline-block bg-white text-gray-900 px-8 py-4 rounded-full text-base font-medium hover:bg-gray-100 transition-all">
                {hasSubscription ? '📸 העלה תמונה' : '✨ נסה עכשיו בחינם (ניסיון אחד)'}
              </span>
            </label>
          ) : (
            <button
              onClick={() => setShowPaywall(true)}
              className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-4 rounded-full text-base font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg"
            >
              🔓 שדרג לגישה מלאה
            </button>
          )}
          
          {!hasSubscription && !trialUsed && isLoggedIn && (
            <p className="text-gray-400 text-sm mt-4">ניסיון אחד חינם · ללא כרטיס אשראי</p>
          )}
          {!hasSubscription && trialUsed && isLoggedIn && (
            <p className="text-amber-400 text-sm mt-4">השתמשת בניסיון החינמי</p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-5xl mx-auto text-center text-sm text-gray-500">
          <p>חלק מ-ShiputzAI - ניהול שיפוצים חכם</p>
        </div>
      </footer>

      {/* Paywall Modal */}
      {showPaywall && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full relative">
            <button
              onClick={() => setShowPaywall(false)}
              className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            
            {hasPurchased ? (
              // User has main subscription - show Vision upgrade
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-3xl">✨</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">השתמשת בניסיון החינמי</h3>
                  <p className="text-gray-500">אהבת את מה שראית? המשך ליצור הדמיות ללא הגבלה</p>
                </div>
                
                <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">מנוי Vision</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">חודשי</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">₪39.99</span>
                    <span className="text-gray-400">/חודש</span>
                  </div>
                </div>
                
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-3 text-sm">
                    <span className="text-green-500">✓</span>
                    <span>העלאת תמונות ללא הגבלה</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <span className="text-green-500">✓</span>
                    <span>זיהוי מוצרים AI מתקדם</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <span className="text-green-500">✓</span>
                    <span>קישורים ישירים לקנייה</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <span className="text-green-500">✓</span>
                    <span>ביטול בכל עת</span>
                  </li>
                </ul>
                
                <Link
                  href="/checkout-vision"
                  className="block w-full text-center bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-full text-base font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg"
                >
                  🚀 שדרג עכשיו
                </Link>
                
                <p className="text-center text-xs text-gray-400 mt-4">
                  תשלום מאובטח · ביטול בלחיצה
                </p>
              </>
            ) : (
              // User doesn't have main subscription - redirect to main checkout
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-3xl">🔒</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">שירות זה דורש מנוי ShiputzAI</h3>
                  <p className="text-gray-500">כדי להמשיך, צריך קודם חשבון ShiputzAI פעיל</p>
                </div>
                
                <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">ShiputzAI</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">חד פעמי</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-gray-900">₪299.99</span>
                  </div>
                </div>
                
                <Link
                  href="/checkout"
                  className="block w-full text-center bg-gray-900 text-white py-4 rounded-full text-base font-bold hover:bg-gray-800 transition-all shadow-lg"
                >
                  הצטרף ל-ShiputzAI
                </Link>
                
                <p className="text-center text-xs text-gray-400 mt-4">
                  תשלום חד פעמי · גישה לכל הכלים
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
