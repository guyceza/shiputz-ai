'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

export default function ComparisonSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const oldWayItems = [
    'אקסל מבולגן שאף אחד לא מעדכן',
    'קבלות בארנק שהולכות לאיבוד',
    'הצעות מחיר שאי אפשר להשוות',
    'הפתעות בסוף החודש',
  ];

  const newWayItems = [
    'מעקב אוטומטי בזמן אמת',
    'צילום קבלה = הוספה מיידית',
    'AI שמנתח ומשווה מחירים',
    'התראות לפני שיש בעיה',
  ];

  return (
    <section className="py-32 px-6" ref={ref}>
      <div className="max-w-4xl mx-auto">
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
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Old Way */}
          <motion.div 
            className="p-10 md:p-12 rounded-2xl bg-gray-50"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-8">
              בלי ShiputzAI
            </h3>
            <ul className="space-y-5">
              {oldWayItems.map((item, i) => (
                <motion.li 
                  key={i}
                  className="flex items-start gap-4 text-gray-500"
                  initial={{ opacity: 0, x: -10 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                >
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                  <span className="text-lg leading-relaxed">{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* New Way */}
          <motion.div 
            className="p-10 md:p-12 rounded-2xl bg-gray-900 text-white"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-8">
              עם ShiputzAI
            </h3>
            <ul className="space-y-5">
              {newWayItems.map((item, i) => (
                <motion.li 
                  key={i}
                  className="flex items-start gap-4"
                  initial={{ opacity: 0, x: 10 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                >
                  <svg 
                    className="mt-1 w-5 h-5 text-emerald-400 flex-shrink-0" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-lg text-gray-100 leading-relaxed">{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
