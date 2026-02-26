"use client";

import { useEffect, useState, useRef } from "react";

function useCountUp(end: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) {
      setHasStarted(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [hasStarted, startOnView]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      setCount(Math.floor(easeOut * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, hasStarted]);

  return { count, ref };
}

function formatNumber(num: number, prefix: string = "", suffix: string = "") {
  return `${prefix}${num.toLocaleString('he-IL')}${suffix}`;
}

export default function StatsCounter() {
  const stat1 = useCountUp(10847320, 2500);
  const stat2 = useCountUp(130, 2000);
  const stat3 = useCountUp(580, 2200);
  const stat4 = useCountUp(12850, 2300);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center mt-12 mb-4 max-w-4xl mx-auto">
      <div ref={stat1.ref} className="group p-4 rounded-2xl hover-lift cursor-default">
        <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 group-hover:scale-110 group-hover:text-emerald-600 transition-all duration-300">
          ₪{stat1.count.toLocaleString('he-IL')}<span className="text-gray-400">+</span>
        </p>
        <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">תקציבים הוזנו עד עכשיו</p>
      </div>
      <div ref={stat2.ref} className="group p-4 rounded-2xl hover-lift cursor-default">
        <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 group-hover:scale-110 group-hover:text-emerald-600 transition-all duration-300">
          {stat2.count.toLocaleString('he-IL')}<span className="text-gray-400">+</span>
        </p>
        <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">משפצים פעילים</p>
      </div>
      <div ref={stat3.ref} className="group p-4 rounded-2xl hover-lift cursor-default">
        <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 group-hover:scale-110 group-hover:text-emerald-600 transition-all duration-300">
          {stat3.count.toLocaleString('he-IL')}<span className="text-gray-400">+</span>
        </p>
        <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">הצעות מחיר נותחו</p>
      </div>
      <div ref={stat4.ref} className="group p-4 rounded-2xl hover-lift cursor-default">
        <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 group-hover:scale-110 group-hover:text-emerald-600 transition-all duration-300">
          {stat4.count.toLocaleString('he-IL')}<span className="text-gray-400">+</span>
        </p>
        <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">טיפים נקראו</p>
      </div>
    </div>
  );
}
