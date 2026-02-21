'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const oldWayItems = [
  { text: 'אקסל מבולגן', rotation: -8, x: 10, y: 0 },
  { text: 'קבלות אבודות', rotation: 12, x: -15, y: 5 },
  { text: 'הפתעות בתקציב', rotation: -5, x: 20, y: -10 },
  { text: 'אי אפשר להשוות', rotation: 7, x: -10, y: 15 },
];

const newWayItems = [
  { icon: '📊', title: 'מעקב אוטומטי', desc: 'בזמן אמת' },
  { icon: '📸', title: 'צילום קבלה', desc: 'הוספה מיידית' },
  { icon: '🤖', title: 'AI חכם', desc: 'משווה מחירים' },
  { icon: '🔔', title: 'התראות', desc: 'לפני שיש בעיה' },
];

export default function ComparisonSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="py-24 px-6 border-t border-gray-100 overflow-hidden" ref={ref}>
      <div className="max-w-5xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-gray-900">שיפוץ בישראל זה כאב ראש.</h2>
          <p className="text-lg text-gray-500">
            חריגות בתקציב, קבלנים שנעלמים, הצעות מחיר מנופחות, ותיעוד באקסל שמתבלגן.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {/* Old Way - Chaotic scattered elements */}
          <motion.div 
            className="relative min-h-[320px] rounded-3xl bg-gradient-to-br from-gray-100 to-gray-50 p-8 overflow-hidden"
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p className="text-sm font-medium text-gray-400 mb-8 text-center">הדרך הישנה</p>
            
            <div className="relative h-[240px]">
              {oldWayItems.map((item, i) => (
                <motion.div
                  key={i}
                  className="absolute bg-white rounded-lg shadow-md px-4 py-3 border border-gray-200"
                  style={{
                    left: `${15 + i * 18}%`,
                    top: `${10 + (i % 2) * 35}%`,
                  }}
                  initial={{ opacity: 0, scale: 0, rotate: 0 }}
                  animate={isInView ? { 
                    opacity: 1, 
                    scale: 1, 
                    rotate: item.rotation,
                    x: item.x,
                    y: item.y,
                  } : {}}
                  transition={{ 
                    duration: 0.5, 
                    delay: 0.4 + i * 0.1,
                    type: 'spring',
                    stiffness: 200,
                  }}
                  whileHover={{ 
                    scale: 1.05, 
                    rotate: 0,
                    transition: { duration: 0.2 }
                  }}
                >
                  <span className="text-gray-600 text-sm whitespace-nowrap">{item.text}</span>
                </motion.div>
              ))}
              
              {/* Chaos lines */}
              <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 200 200">
                <motion.path
                  d="M20,50 Q60,20 100,60 T180,40"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="text-gray-400"
                  initial={{ pathLength: 0 }}
                  animate={isInView ? { pathLength: 1 } : {}}
                  transition={{ duration: 1.5, delay: 0.8 }}
                />
                <motion.path
                  d="M10,120 Q80,150 120,100 T190,130"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="text-gray-400"
                  initial={{ pathLength: 0 }}
                  animate={isInView ? { pathLength: 1 } : {}}
                  transition={{ duration: 1.5, delay: 1 }}
                />
              </svg>
            </div>
          </motion.div>

          {/* New Way - Clean bento grid */}
          <motion.div 
            className="relative rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 overflow-hidden"
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Glow effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl" />
            
            <p className="relative text-sm font-medium text-gray-400 mb-6 text-center">עם ShiputzAI</p>
            
            <div className="relative grid grid-cols-2 gap-3">
              {newWayItems.map((item, i) => (
                <motion.div
                  key={i}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:border-emerald-500/30 transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
                  whileHover={{ 
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                >
                  <motion.div 
                    className="text-2xl mb-2"
                    animate={isInView ? { 
                      scale: [1, 1.2, 1],
                    } : {}}
                    transition={{ 
                      duration: 0.5, 
                      delay: 1 + i * 0.15,
                      ease: 'easeInOut'
                    }}
                  >
                    {item.icon}
                  </motion.div>
                  <p className="text-white font-medium text-sm">{item.title}</p>
                  <p className="text-gray-400 text-xs">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Animated badge */}
            <motion.div 
              className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg"
              initial={{ scale: 0, rotate: -12 }}
              animate={isInView ? { scale: 1, rotate: -12 } : {}}
              transition={{ duration: 0.4, delay: 1.2, type: 'spring' }}
            >
              ✨ חדש
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
