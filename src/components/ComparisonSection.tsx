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

  // Dashboard transactions
  const transactions = [
    { name: 'אינסטלטור - תיקון צנרת', amount: '₪1,200', category: 'אינסטלציה' },
    { name: 'חומרי בניין - קרמיקה', amount: '₪3,450', category: 'חומרים' },
    { name: 'חשמלאי - נקודות חשמל', amount: '₪2,800', category: 'חשמל' },
  ];

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

          {/* New Way - Clean Dashboard */}
          <motion.div 
            className="relative rounded-2xl overflow-hidden bg-[#0c0c0f]"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="absolute top-5 left-0 right-0 text-center z-10">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">
                עם Shipazti
              </span>
            </div>

            {/* App mockup */}
            <div className="p-6 pt-14">
              {/* Budget card */}
              <motion.div 
                className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur rounded-xl p-5 mb-4 border border-gray-700/50"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-gray-400 text-xs mb-1">תקציב שיפוץ</div>
                    <div className="text-2xl font-semibold text-white">₪150,000</div>
                  </div>
                  <div className="text-left">
                    <div className="text-gray-400 text-xs mb-1">נותר</div>
                    <div className="text-lg font-medium text-emerald-400">₪67,550</div>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={isInView ? { width: '55%' } : {}}
                    transition={{ duration: 1, delay: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>55% נוצל</span>
                  <span>₪82,450 הוצאות</span>
                </div>
              </motion.div>

              {/* Recent transactions */}
              <motion.div 
                className="bg-gray-800/50 backdrop-blur rounded-xl border border-gray-700/50 overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <div className="px-4 py-3 border-b border-gray-700/50">
                  <div className="text-sm font-medium text-gray-300">הוצאות אחרונות</div>
                </div>
                <div className="divide-y divide-gray-700/30">
                  {transactions.map((tx, i) => (
                    <motion.div 
                      key={i}
                      className="px-4 py-3 flex items-center justify-between"
                      initial={{ opacity: 0, x: 20 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.4, delay: 0.9 + i * 0.1 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-700/50 flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-emerald-500/60"></div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-200">{tx.name}</div>
                          <div className="text-xs text-gray-500">{tx.category}</div>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-300">{tx.amount}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <motion.div 
                  className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/30"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.4, delay: 1.2 }}
                >
                  <div className="text-xs text-gray-500 mb-1">קבלות השבוע</div>
                  <div className="text-xl font-semibold text-white">12</div>
                </motion.div>
                <motion.div 
                  className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/30"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.4, delay: 1.3 }}
                >
                  <div className="text-xs text-gray-500 mb-1">חיסכון זוהה</div>
                  <div className="text-xl font-semibold text-emerald-400">₪4,200</div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
