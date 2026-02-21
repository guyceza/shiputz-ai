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

  const newWayItems = [
    { title: 'מעקב אוטומטי', desc: 'כל ההוצאות במקום אחד, בזמן אמת' },
    { title: 'צילום = תיעוד', desc: 'מצלמים קבלה והיא נוספת אוטומטית' },
    { title: 'השוואת מחירים', desc: 'AI שמזהה אם גובים ממך יותר מדי' },
    { title: 'התראות חכמות', desc: 'יודעים על בעיות לפני שהן קורות' },
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
            className="relative min-h-[420px] rounded-2xl overflow-hidden"
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
            
            <div className="absolute top-5 left-0 right-0 text-center z-10">
              <span className="text-xs font-medium text-stone-500 uppercase tracking-widest">
                בלי Shipazti
              </span>
            </div>

            {/* Scattered elements */}
            <div className="relative h-full p-6 pt-14">
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

          {/* New Way - Clean and organized */}
          <motion.div 
            className="relative rounded-2xl bg-gray-900 p-8 md:p-10"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-8 text-center">
              עם Shipazti
            </h3>
            
            <ul className="space-y-6">
              {newWayItems.map((item, i) => (
                <motion.li 
                  key={i}
                  className="flex items-start gap-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg 
                      className="w-3 h-3 text-emerald-400" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor" 
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-white font-medium">{item.title}</div>
                    <div className="text-gray-400 text-sm mt-0.5">{item.desc}</div>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
