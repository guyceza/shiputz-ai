'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const oldWayItems = [
  { text: 'אקסל מבולגן', rotation: -6, x: 5, y: 0 },
  { text: 'קבלות אבודות', rotation: 8, x: -10, y: 8 },
  { text: 'הפתעות בתקציב', rotation: -4, x: 15, y: -5 },
  { text: 'אי אפשר להשוות', rotation: 5, x: -5, y: 12 },
];

// SVG Icons as components
const ChartIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

const CameraIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

const BellIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
);

const newWayItems = [
  { Icon: ChartIcon, title: 'מעקב אוטומטי', desc: 'בזמן אמת' },
  { Icon: CameraIcon, title: 'צילום קבלה', desc: 'הוספה מיידית' },
  { Icon: SparklesIcon, title: 'AI חכם', desc: 'משווה מחירים' },
  { Icon: BellIcon, title: 'התראות', desc: 'לפני שיש בעיה' },
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
                    className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3"
                    animate={isInView ? { 
                      scale: [1, 1.1, 1],
                    } : {}}
                    transition={{ 
                      duration: 0.5, 
                      delay: 1 + i * 0.15,
                      ease: 'easeInOut'
                    }}
                  >
                    <item.Icon />
                  </motion.div>
                  <p className="text-white font-medium text-sm">{item.title}</p>
                  <p className="text-gray-400 text-xs">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
