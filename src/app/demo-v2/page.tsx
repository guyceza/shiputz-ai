'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Easing curves for natural movement
const smoothEasing = [0.43, 0.13, 0.23, 0.96];
const bounceEasing = [0.68, -0.55, 0.265, 1.55];

// Floating Pill Component with sophisticated animation
const FloatingPill = ({ 
  children, 
  color, 
  delay = 0, 
  x = 0, 
  y = 0,
  rotation = 0 
}: { 
  children: React.ReactNode; 
  color: string; 
  delay?: number;
  x?: number;
  y?: number;
  rotation?: number;
}) => {
  return (
    <motion.div
      className="absolute px-5 py-2.5 rounded-full font-semibold text-white text-sm shadow-xl cursor-pointer whitespace-nowrap"
      style={{ 
        background: color,
        left: `${50 + x}%`,
        top: `${50 + y}%`,
        transform: 'translate(-50%, -50%)'
      }}
      initial={{ opacity: 0, scale: 0, rotate: rotation - 20 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        rotate: rotation,
        y: [0, -8, 0],
        x: [0, 3, 0],
      }}
      transition={{
        opacity: { duration: 0.6, delay, ease: smoothEasing },
        scale: { duration: 0.8, delay, ease: bounceEasing },
        rotate: { duration: 0.8, delay, ease: smoothEasing },
        y: { duration: 3 + Math.random() * 2, repeat: Infinity, ease: "easeInOut", delay: delay + Math.random() },
        x: { duration: 4 + Math.random() * 2, repeat: Infinity, ease: "easeInOut", delay: delay + Math.random() * 0.5 },
      }}
      whileHover={{ 
        scale: 1.15, 
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        transition: { duration: 0.3, ease: smoothEasing }
      }}
    >
      {children}
    </motion.div>
  );
};

// Animated Blob Background
const AnimatedBlob = ({ color, size, position, delay = 0 }: { 
  color: string; 
  size: number; 
  position: { top?: string; bottom?: string; left?: string; right?: string };
  delay?: number;
}) => {
  return (
    <motion.div
      className="absolute rounded-full blur-3xl opacity-50 pointer-events-none"
      style={{
        background: color,
        width: size,
        height: size,
        ...position
      }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ 
        scale: [0.8, 1.1, 0.9, 1],
        opacity: [0, 0.5, 0.6, 0.5],
        x: [0, 30, -20, 0],
        y: [0, -30, 20, 0],
      }}
      transition={{
        duration: 15,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    />
  );
};

// Reveal on Scroll Component
const RevealOnScroll = ({ children, delay = 0, direction = 'up' }: { 
  children: React.ReactNode; 
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const directions = {
    up: { y: 60, x: 0 },
    down: { y: -60, x: 0 },
    left: { y: 0, x: 60 },
    right: { y: 0, x: -60 },
  };
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...directions[direction] }}
      animate={isInView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ 
        duration: 0.8, 
        delay,
        ease: smoothEasing
      }}
    >
      {children}
    </motion.div>
  );
};

// Staggered Text Animation
const AnimatedText = ({ text, className = '', delay = 0 }: { text: string; className?: string; delay?: number }) => {
  const words = text.split(' ');
  
  return (
    <motion.span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-2"
          initial={{ opacity: 0, y: 30, rotateX: -90 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{
            duration: 0.6,
            delay: delay + i * 0.08,
            ease: smoothEasing
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
};

// Magnetic Button Component
const MagneticButton = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (clientX - left - width / 2) * 0.3;
    const y = (clientY - top - height / 2) * 0.3;
    setPosition({ x, y });
  };
  
  const reset = () => setPosition({ x: 0, y: 0 });
  
  return (
    <motion.button
      ref={ref}
      className={className}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 350, damping: 15 }}
    >
      {children}
    </motion.button>
  );
};

// Browser Mockup with Parallax
const BrowserMockup = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  
  const springY = useSpring(y, { stiffness: 100, damping: 30 });
  const springScale = useSpring(scale, { stiffness: 100, damping: 30 });
  
  return (
    <motion.div
      ref={ref}
      style={{ y: springY, scale: springScale, opacity }}
      className="w-full max-w-4xl mx-auto mt-16"
    >
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Browser Header */}
        <div className="bg-gray-50 px-4 py-3 flex items-center gap-2 border-b border-gray-100">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 mx-4">
            <div className="bg-white rounded-lg px-4 py-1.5 text-center text-gray-500 text-sm">
              shipazti.com/dashboard
            </div>
          </div>
        </div>
        
        {/* Browser Content */}
        <div className="p-8 bg-gradient-to-br from-gray-50 to-white">
          <div className="flex gap-6 justify-center flex-wrap">
            {[
              { label: 'תקציב כולל', value: '₪150,000', color: 'text-gray-800' },
              { label: 'הוצאות עד כה', value: '₪87,340', color: 'text-red-500' },
              { label: 'נשאר', value: '₪62,660', color: 'text-green-500' },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="bg-white rounded-xl p-6 shadow-lg min-w-[180px]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: smoothEasing }}
                whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
              >
                <p className="text-gray-500 text-sm mb-1">{item.label}</p>
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Feature Card with 3D Tilt
const FeatureCard = ({ icon, title, description, delay = 0 }: {
  icon: string;
  title: string;
  description: string;
  delay?: number;
}) => {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  
  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const { left, top, width, height } = card.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    setRotateX(-y * 20);
    setRotateY(x * 20);
  };
  
  const reset = () => {
    setRotateX(0);
    setRotateY(0);
  };
  
  return (
    <RevealOnScroll delay={delay}>
      <motion.div
        className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 cursor-pointer"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateX, rotateY }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onMouseMove={handleMouse}
        onMouseLeave={reset}
        whileHover={{ 
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderColor: 'rgba(255,255,255,0.2)'
        }}
      >
        <motion.div 
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-3xl mb-6"
          style={{ transform: 'translateZ(40px)' }}
        >
          {icon}
        </motion.div>
        <h3 className="text-xl font-bold text-white mb-3" style={{ transform: 'translateZ(30px)' }}>
          {title}
        </h3>
        <p className="text-white/70 leading-relaxed" style={{ transform: 'translateZ(20px)' }}>
          {description}
        </p>
      </motion.div>
    </RevealOnScroll>
  );
};

// Glow Effect Button
const GlowButton = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.button
      className="relative px-10 py-5 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg rounded-full overflow-hidden group"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 opacity-0 group-hover:opacity-100 blur-xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
      
      <span className="relative z-10 flex items-center gap-2">
        {children}
        <motion.span
          animate={{ x: [0, 5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          ←
        </motion.span>
      </span>
    </motion.button>
  );
};

// Glass Card
const GlassCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  return (
    <motion.div
      className={`bg-white/10 backdrop-blur-xl rounded-3xl p-10 border border-white/20 ${className}`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: smoothEasing }}
      whileHover={{ 
        backgroundColor: 'rgba(255,255,255,0.15)',
        boxShadow: '0 30px 60px rgba(0,0,0,0.3)'
      }}
    >
      {children}
    </motion.div>
  );
};

// Main Page Component
export default function DemoV2Page() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <div ref={containerRef} className="min-h-screen bg-white overflow-hidden" dir="rtl">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-blue-500 origin-left z-50"
        style={{ scaleX }}
      />

      {/* Hero Section */}
      <section className="min-h-screen relative flex flex-col items-center justify-center px-6 py-20">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50" />
        
        {/* Blobs */}
        <AnimatedBlob 
          color="linear-gradient(135deg, #4CAF50, #81C784)" 
          size={500} 
          position={{ top: '-10%', right: '-10%' }} 
          delay={0}
        />
        <AnimatedBlob 
          color="linear-gradient(135deg, #2196F3, #64B5F6)" 
          size={400} 
          position={{ bottom: '-5%', left: '-5%' }} 
          delay={2}
        />
        <AnimatedBlob 
          color="linear-gradient(135deg, #9C27B0, #BA68C8)" 
          size={350} 
          position={{ top: '40%', left: '5%' }} 
          delay={4}
        />

        {/* Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Logo */}
          <RevealOnScroll>
            <div className="flex items-center justify-center gap-3 mb-8">
              <motion.div 
                className="w-14 h-14 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
                whileHover={{ rotate: 10, scale: 1.1 }}
              >
                🏠
              </motion.div>
              <span className="text-3xl font-bold text-gray-800">ShiputzAI</span>
            </div>
          </RevealOnScroll>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-800 mb-6 leading-tight">
            <AnimatedText text="ניהול שיפוצים" delay={0.3} />
            <br />
            <span className="bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
              <AnimatedText text="חכם" delay={0.6} />
            </span>
            <br />
            <AnimatedText text="בעזרת בינה מלאכותית" delay={0.7} />
          </h1>

          {/* Subtitle */}
          <RevealOnScroll delay={0.9}>
            <p className="text-xl text-gray-600 mb-12 leading-relaxed max-w-2xl mx-auto">
              עוקבים אחרי התקציב, סורקים קבלות באוטומט,
              <br />
              ומדמים איך הבית ייראה - הכל במקום אחד
            </p>
          </RevealOnScroll>

          {/* Floating Pills */}
          <div className="relative h-32 mb-12">
            <FloatingPill color="linear-gradient(135deg, #4CAF50, #66BB6A)" delay={1.0} x={-30} y={-15} rotation={-5}>
              📊 מעקב תקציב
            </FloatingPill>
            <FloatingPill color="linear-gradient(135deg, #2196F3, #42A5F5)" delay={1.1} x={5} y={10} rotation={3}>
              🧾 סריקת קבלות
            </FloatingPill>
            <FloatingPill color="linear-gradient(135deg, #9C27B0, #AB47BC)" delay={1.2} x={35} y={-20} rotation={-8}>
              🎨 הדמיות AI
            </FloatingPill>
            <FloatingPill color="linear-gradient(135deg, #FF9800, #FFB74D)" delay={1.3} x={-15} y={25} rotation={6}>
              💬 עוזר חכם
            </FloatingPill>
            <FloatingPill color="linear-gradient(135deg, #607D8B, #78909C)" delay={1.4} x={25} y={20} rotation={-3}>
              📋 ניתוח הצעות מחיר
            </FloatingPill>
          </div>

          {/* CTA Button */}
          <RevealOnScroll delay={1.5}>
            <GlowButton>התחל בחינם</GlowButton>
          </RevealOnScroll>

          {/* Browser Mockup */}
          <BrowserMockup />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-gray-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <RevealOnScroll>
            <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-20">
              למה <span className="text-green-400">ShiputzAI</span>?
            </h2>
          </RevealOnScroll>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="📸"
              title="סריקה אוטומטית"
              description="צלם קבלה והמערכת תזהה אוטומטית את הפרטים - ספק, סכום, פריטים ומע״מ"
              delay={0}
            />
            <FeatureCard
              icon="🎨"
              title="הדמיות AI"
              description="העלה תמונה של החדר וקבל הדמיה של איך הוא ייראה אחרי השיפוץ"
              delay={0.1}
            />
            <FeatureCard
              icon="💰"
              title="השוואת מחירים"
              description="בדוק אם ההצעת מחיר שקיבלת סבירה בהשוואה למחירי השוק"
              delay={0.2}
            />
          </div>

          {/* Glass CTA Card */}
          <div className="mt-20">
            <GlassCard className="text-center max-w-2xl mx-auto">
              <motion.div
                className="text-5xl mb-6"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                🎁
              </motion.div>
              <h3 className="text-2xl font-bold text-white mb-4">התחל בחינם</h3>
              <p className="text-white/70 mb-8">
                הרשם עכשיו וקבל גישה מלאה למערכת + הדמיית AI אחת במתנה
              </p>
              <GlowButton>הרשם עכשיו</GlowButton>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 border-t border-white/10">
        <p className="text-center text-white/50 text-sm">
          Demo V2 — Built with Framer Motion + GSAP
        </p>
      </footer>
    </div>
  );
}
