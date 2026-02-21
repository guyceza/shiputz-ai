'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

export default function ComparisonSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  // Chaotic items with more organic positioning
  const chaosItems = [
    { 
      text: 'אקסל מבולגן', 
      type: 'note',
      style: { top: '8%', left: '5%', rotate: -7 },
    },
    { 
      text: '₪12,450', 
      type: 'receipt',
      style: { top: '5%', right: '15%', rotate: 4 },
    },
    { 
      text: 'קבלות אבודות', 
      type: 'sticky',
      style: { top: '35%', left: '12%', rotate: 3 },
    },
    { 
      text: 'הפתעות בתקציב', 
      type: 'note',
      style: { top: '28%', right: '8%', rotate: -5 },
    },
    { 
      text: '???', 
      type: 'sticky',
      style: { top: '60%', left: '25%', rotate: 8 },
    },
    { 
      text: 'אי אפשר להשוות', 
      type: 'paper',
      style: { top: '55%', right: '5%', rotate: -3 },
    },
  ];

  const newWayItems = [
    'מעקב אוטומטי בזמן אמת',
    'צילום קבלה = הוספה מיידית',
    'AI שמנתח ומשווה מחירים',
    'התראות לפני שיש בעיה',
  ];

  const getItemStyle = (type: string) => {
    switch (type) {
      case 'receipt':
        return 'bg-gradient-to-b from-gray-50 to-gray-100 border-t-4 border-t-gray-300 font-mono text-gray-600 text-sm px-4 py-3 shadow-md';
      case 'sticky':
        return 'bg-amber-100 text-amber-900 font-medium px-4 py-3 shadow-md border-b-4 border-b-amber-200';
      case 'paper':
        return 'bg-white text-gray-600 px-5 py-3 shadow-lg border border-gray-200';
      default: // note
        return 'bg-white text-gray-700 px-5 py-3 shadow-md border border-gray-100';
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
          {/* Old Way - Organized Chaos */}
          <motion.div 
            className="relative min-h-[400px] rounded-2xl bg-stone-100/80 overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Subtle grid pattern */}
            <div 
              className="absolute inset-0 opacity-[0.4]"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #d4d4d4 1px, transparent 1px),
                  linear-gradient(to bottom, #d4d4d4 1px, transparent 1px)
                `,
                backgroundSize: '24px 24px',
              }}
            />
            
            <div className="absolute top-4 left-0 right-0 text-center">
              <span className="text-xs font-medium text-stone-400 uppercase tracking-widest">
                בלי ShiputzAI
              </span>
            </div>

            {/* Scattered elements */}
            <div className="relative h-full p-8 pt-12">
              {chaosItems.map((item, i) => (
                <motion.div
                  key={i}
                  className={`absolute rounded ${getItemStyle(item.type)} whitespace-nowrap`}
                  style={{
                    ...item.style,
                    transform: `rotate(${item.style.rotate}deg)`,
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isInView ? { 
                    opacity: 1, 
                    scale: 1,
                  } : {}}
                  transition={{ 
                    duration: 0.5, 
                    delay: 0.4 + i * 0.08,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileHover={{ 
                    scale: 1.05, 
                    rotate: 0,
                    zIndex: 10,
                    transition: { duration: 0.2 }
                  }}
                >
                  {item.text}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* New Way - Clean and organized */}
          <motion.div 
            className="relative rounded-2xl bg-gray-900 p-10 md:p-12"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-10 text-center">
              עם ShiputzAI
            </h3>
            
            <ul className="space-y-6">
              {newWayItems.map((item, i) => (
                <motion.li 
                  key={i}
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <svg 
                      className="w-3.5 h-3.5 text-emerald-400" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor" 
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-lg text-gray-100">{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
