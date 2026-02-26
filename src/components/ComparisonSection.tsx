'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

export default function ComparisonSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  const chaosItems = [
    { 
      text: 'אקסל מבולגן',
      subtext: 'גרסה_סופית_v3_באמת.xlsx',
      type: 'file',
      style: { top: '12%', left: '8%', rotate: -8, zIndex: 3 },
    },
    { 
      text: '₪12,450.00', 
      subtext: 'חשבונית #4821',
      type: 'receipt',
      style: { top: '8%', right: '12%', rotate: 5, zIndex: 2 },
    },
    { 
      text: 'להתקשר לשרברב!',
      type: 'sticky',
      style: { top: '42%', left: '5%', rotate: 4, zIndex: 4 },
    },
    { 
      text: 'הפתעות בתקציב', 
      subtext: '₪8,000 חריגה',
      type: 'alert',
      style: { top: '35%', right: '5%', rotate: -4, zIndex: 5 },
    },
    { 
      text: '???', 
      type: 'sticky-pink',
      style: { top: '68%', left: '20%', rotate: 12, zIndex: 2 },
    },
    { 
      text: 'הצעת מחיר',
      subtext: 'לא ברור מה כלול',
      type: 'document',
      style: { top: '62%', right: '8%', rotate: -6, zIndex: 3 },
    },
  ];

  const getItemContent = (item: typeof chaosItems[0]) => {
    switch (item.type) {
      case 'receipt':
        return (
          <div className="w-[140px] bg-gradient-to-b from-[#fafafa] to-[#f0f0f0] p-3 shadow-[0_2px_8px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)]"
               style={{ 
                 clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), 95% 100%, 90% calc(100% - 4px), 85% 100%, 80% calc(100% - 4px), 75% 100%, 70% calc(100% - 4px), 65% 100%, 60% calc(100% - 4px), 55% 100%, 50% calc(100% - 4px), 45% 100%, 40% calc(100% - 4px), 35% 100%, 30% calc(100% - 4px), 25% 100%, 20% calc(100% - 4px), 15% 100%, 10% calc(100% - 4px), 5% 100%, 0 calc(100% - 8px))',
               }}>
            <div className="text-[10px] text-gray-400 text-center mb-1 font-mono">{item.subtext}</div>
            <div className="text-base font-mono text-gray-700 text-center font-semibold">{item.text}</div>
            <div className="mt-2 border-t border-dashed border-gray-300 pt-1">
              <div className="text-[8px] text-gray-400 text-center">21/02/2026</div>
            </div>
          </div>
        );
      case 'sticky':
        return (
          <div className="w-[110px] h-[90px] p-3 shadow-[0_4px_12px_rgba(0,0,0,0.15),0_1px_3px_rgba(0,0,0,0.1)]"
               style={{ 
                 background: 'linear-gradient(135deg, #fef08a 0%, #fde047 100%)',
                 transform: 'perspective(100px) rotateX(2deg)',
               }}>
            <div className="text-sm text-amber-900 font-medium leading-tight">{item.text}</div>
          </div>
        );
      case 'sticky-pink':
        return (
          <div className="w-[70px] h-[70px] p-2.5 shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
               style={{ 
                 background: 'linear-gradient(135deg, #fecdd3 0%, #fda4af 100%)',
               }}>
            <div className="text-lg text-rose-800 font-bold text-center">{item.text}</div>
          </div>
        );
      case 'file':
        return (
          <div className="bg-white rounded shadow-[0_2px_10px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="bg-emerald-600 px-3 py-1.5 flex items-center gap-2">
              <div className="w-2 h-2 bg-white/80 rounded-sm"></div>
              <div className="w-2 h-2 bg-white/80 rounded-sm"></div>
              <div className="w-6 h-2 bg-white/60 rounded-sm"></div>
            </div>
            <div className="p-3">
              <div className="text-xs text-gray-700 font-medium mb-1">{item.text}</div>
              <div className="text-[9px] text-gray-400 truncate">{item.subtext}</div>
            </div>
          </div>
        );
      case 'alert':
        return (
          <div className="bg-white border-r-4 border-r-red-500 rounded shadow-[0_2px_10px_rgba(0,0,0,0.12)] p-3">
            <div className="text-xs text-red-600 font-semibold mb-0.5">{item.text}</div>
            <div className="text-sm text-gray-600 font-medium">{item.subtext}</div>
          </div>
        );
      case 'document':
        return (
          <div className="w-[130px] bg-white rounded shadow-[0_2px_10px_rgba(0,0,0,0.1)] p-3 border-t-4 border-t-gray-300">
            <div className="text-xs text-gray-700 font-medium mb-1">{item.text}</div>
            <div className="text-[10px] text-gray-400">{item.subtext}</div>
            <div className="mt-2 space-y-1">
              <div className="h-1.5 bg-gray-100 rounded w-full"></div>
              <div className="h-1.5 bg-gray-100 rounded w-3/4"></div>
              <div className="h-1.5 bg-gray-100 rounded w-1/2"></div>
            </div>
          </div>
        );
      default:
        return <div className="p-3 bg-white shadow-md rounded text-sm">{item.text}</div>;
    }
  };

  // Organized cards for "with Shipazti" - clean grid
  const organizedCards = [
    { type: 'budget' },
    { type: 'receipt-clean' },
    { type: 'chart' },
    { type: 'alert-good' },
    { type: 'savings' },
    { type: 'check' },
  ];

  const getOrganizedContent = (type: string) => {
    // Base card style - all cards are white with consistent padding
    const baseCard = "bg-white rounded-xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.08)]";
    
    switch (type) {
      case 'budget':
        return (
          <div className={baseCard}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs text-gray-500">תקציב כולל</span>
            </div>
            <div className="text-gray-900 text-xl font-bold mb-2">₪150,000</div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full w-[55%] bg-emerald-500 rounded-full"></div>
            </div>
            <div className="text-gray-400 text-[10px] mt-1">55% נוצל</div>
          </div>
        );
      case 'receipt-clean':
        return (
          <div className={baseCard}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-xs text-gray-500">קבלה נסרקה</span>
            </div>
            <div className="text-gray-900 text-xl font-bold">₪1,200</div>
            <div className="text-gray-400 text-xs">אינסטלטור - תיקון צנרת</div>
          </div>
        );
      case 'chart':
        return (
          <div className={baseCard}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-xs text-gray-500">הוצאות לפי קטגוריה</span>
            </div>
            <div className="flex items-end gap-1.5 h-12">
              <div className="flex-1 bg-emerald-200 rounded" style={{ height: '50%' }}></div>
              <div className="flex-1 bg-emerald-300 rounded" style={{ height: '80%' }}></div>
              <div className="flex-1 bg-emerald-400 rounded" style={{ height: '35%' }}></div>
              <div className="flex-1 bg-emerald-500 rounded" style={{ height: '65%' }}></div>
              <div className="flex-1 bg-emerald-600 rounded" style={{ height: '100%' }}></div>
            </div>
          </div>
        );
      case 'alert-good':
        return (
          <div className={baseCard}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <span className="text-xs text-gray-500">התראה חכמה</span>
            </div>
            <div className="text-gray-900 text-sm font-medium">הצעת מחיר גבוהה ב-15%</div>
            <div className="text-gray-400 text-xs">מהמחיר הממוצע באזור</div>
          </div>
        );
      case 'savings':
        return (
          <div className={baseCard}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-xs text-gray-500">חסכת עד היום</span>
            </div>
            <div className="text-emerald-600 text-xl font-bold">₪4,200</div>
            <div className="text-gray-400 text-xs">בזכות השוואת מחירים</div>
          </div>
        );
      case 'check':
        return (
          <div className={baseCard}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <span className="text-xs text-gray-500">קבלות השבוע</span>
            </div>
            <div className="text-gray-900 text-xl font-bold">12</div>
            <div className="text-gray-400 text-xs">נסרקו ותועדו אוטומטית</div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section className="py-32 px-6" ref={ref}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-6 tracking-tight">
            שיפוץ בישראל זה כאב ראש.
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            חריגות בתקציב, קבלנים שנעלמים, הצעות מחיר מנופחות, ותיעוד באקסל שמתבלגן.
          </p>
        </motion.div>

        {/* Comparison */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-stretch">
          {/* Old Way - Realistic Chaos */}
          <motion.div 
            className="relative min-h-[450px] rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, #f5f5f4 0%, #e7e5e4 50%, #d6d3d1 100%)',
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Subtle texture */}
            <div className="absolute inset-0 opacity-30"
                 style={{
                   backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                 }} />
            
            <div className="relative z-10 text-center pt-6 pb-4 mb-2">
              <span className="text-2xl font-black text-stone-700 bg-stone-200/60 px-6 py-2 rounded-full">
                בלי ShiputzAI
              </span>
            </div>

            {/* Scattered elements */}
            <div className="relative h-[380px] p-4">
              {chaosItems.map((item, i) => (
                <motion.div
                  key={i}
                  className="absolute cursor-pointer"
                  style={{
                    top: item.style.top,
                    left: item.style.left,
                    right: item.style.right,
                    zIndex: item.style.zIndex,
                  }}
                  initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
                  animate={isInView ? { 
                    opacity: 1, 
                    scale: 1,
                    rotate: item.style.rotate,
                  } : {}}
                  transition={{ 
                    duration: 0.6, 
                    delay: 0.4 + i * 0.1,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileHover={{ 
                    scale: 1.08, 
                    rotate: 0,
                    zIndex: 20,
                    transition: { duration: 0.2 }
                  }}
                >
                  {getItemContent(item)}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* New Way - Organized floating cards */}
          <motion.div 
            className="relative min-h-[450px] rounded-2xl overflow-hidden"
            style={{
              background: '#101010',
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Glow effects */}
            <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />
            
            <div className="relative z-10 text-center pt-6 pb-4">
              <span className="text-2xl font-black text-white bg-white/10 px-6 py-2 rounded-full">
                עם ShiputzAI
              </span>
            </div>

            {/* Organized grid */}
            <div className="p-5 pt-2 grid grid-cols-2 gap-3 content-start">
              {organizedCards.map((card, i) => (
                <motion.div
                  key={i}
                  className="cursor-pointer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ 
                    duration: 0.5, 
                    delay: 0.5 + i * 0.08,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileHover={{ 
                    scale: 1.03,
                    y: -3,
                    transition: { duration: 0.2 }
                  }}
                >
                  {getOrganizedContent(card.type)}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
