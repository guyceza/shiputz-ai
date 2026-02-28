"use client";

import { useEffect, useRef, useState, Suspense, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture, Html, Preload } from "@react-three/drei";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// ============================================
// Types
// ============================================
interface PriceTag {
  name: string;
  price: string;
  x: number;
  z: number;
  height: number;
}

interface RoomScene {
  title: string;
  image: string;
  tags: PriceTag[];
}

const SCENES: RoomScene[] = [
  {
    title: "סלון מודרני",
    image: "/popup-book/living-room.jpg",
    tags: [
      { name: "ספה מעוצבת", price: "₪4,200", x: -0.5, z: 0.15, height: 0.7 },
      { name: "שולחן קפה", price: "₪1,800", x: 0.1, z: 0.45, height: 0.5 },
      { name: "מנורת רצפה", price: "₪890", x: 0.6, z: -0.15, height: 0.9 },
      { name: "שטיח צמר", price: "₪2,100", x: 0.0, z: 0.65, height: 0.25 },
    ]
  },
  {
    title: "מטבח חלומי",
    image: "/popup-book/kitchen.jpg",
    tags: [
      { name: "אי מטבח", price: "₪8,500", x: -0.1, z: 0.2, height: 0.6 },
      { name: "תאורה תלויה", price: "₪1,200", x: 0.2, z: -0.4, height: 1.1 },
      { name: "כיסאות בר", price: "₪2,400", x: -0.55, z: 0.3, height: 0.7 },
      { name: "מדפים", price: "₪1,600", x: 0.65, z: -0.1, height: 0.85 },
    ]
  },
  {
    title: "חדר שינה",
    image: "/popup-book/bedroom.jpg",
    tags: [
      { name: "מיטה זוגית", price: "₪5,900", x: 0.0, z: 0.05, height: 0.5 },
      { name: "שידות לילה", price: "₪1,400", x: -0.7, z: 0.1, height: 0.65 },
      { name: "מנורת לילה", price: "₪650", x: 0.7, z: -0.1, height: 0.8 },
      { name: "ארון קיר", price: "₪7,200", x: 0.55, z: -0.45, height: 1.0 },
    ]
  }
];

// ============================================
// Pop-up paper fold element
// ============================================
function PaperPopup({ 
  tag, 
  progress, 
  index 
}: { 
  tag: PriceTag; 
  progress: number;
  index: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const foldRef = useRef<THREE.Mesh>(null);
  
  const staggerDelay = index * 0.06;
  const localProgress = Math.max(0, Math.min(1, (progress - 0.45 - staggerDelay) / 0.35));
  
  // Smooth easing
  const eased = localProgress < 0.5
    ? 2 * localProgress * localProgress
    : 1 - Math.pow(-2 * localProgress + 2, 2) / 2;

  const currentHeight = tag.height * eased;
  // Paper fold angle (starts folded flat, unfolds upright)
  const foldAngle = (1 - eased) * Math.PI / 2;

  if (localProgress <= 0) return null;

  return (
    <group position={[tag.x, 0.025, tag.z]}>
      {/* Paper stand - thin vertical strip */}
      <mesh 
        ref={meshRef}
        position={[0, currentHeight / 2, 0]}
        rotation={[foldAngle, 0, 0]}
      >
        <boxGeometry args={[0.12, currentHeight, 0.008]} />
        <meshStandardMaterial 
          color="#F8F4EF" 
          roughness={0.95}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Fold crease at base */}
      <mesh 
        ref={foldRef}
        position={[0, 0.005, 0.04]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[0.12, 0.08]} />
        <meshStandardMaterial 
          color="#EDE8E0" 
          roughness={0.95}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Shadow on page */}
      <mesh position={[0.03, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, 0.2]} />
        <meshStandardMaterial 
          color="#000000" 
          transparent 
          opacity={0.06 * eased}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Price tag HTML overlay */}
      {localProgress > 0.6 && (
        <Html
          position={[0, currentHeight + 0.2, 0]}
          center
          distanceFactor={2.8}
          style={{
            opacity: Math.min(1, (localProgress - 0.6) * 3.5),
            pointerEvents: "auto",
            userSelect: "none",
          }}
        >
          <div className="cursor-pointer group">
            {/* Hanging string */}
            <div className="w-[1px] h-3 mx-auto" style={{ background: "linear-gradient(to bottom, #C8B89A, #A0906E)" }} />
            {/* Tag body */}
            <div className="relative bg-white rounded-lg shadow-lg px-3 py-1.5 border border-gray-200/60 group-hover:border-amber-400 group-hover:shadow-xl group-hover:scale-110 transition-all duration-200 text-center min-w-[70px]">
              {/* Hole */}
              <div className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-[5px] h-[5px] rounded-full border border-gray-300 bg-gray-50" />
              <p className="text-[9px] text-gray-400 font-medium leading-tight mb-0.5">{tag.name}</p>
              <p className="text-[13px] font-bold text-gray-900 leading-tight">{tag.price}</p>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================
// The 3D Book
// ============================================
function Book({ progress, scene }: { progress: number; scene: RoomScene }) {
  const coverGroupRef = useRef<THREE.Group>(null);
  const bookRef = useRef<THREE.Group>(null);
  
  // Load textures
  const coverTexture = useTexture("/popup-book/cover.jpg");
  const sceneTexture = useTexture(scene.image);
  
  // Make textures look better
  coverTexture.colorSpace = THREE.SRGBColorSpace;
  sceneTexture.colorSpace = THREE.SRGBColorSpace;

  // Open animation
  const openProgress = Math.max(0, Math.min(1, progress * 2.2));
  const openEased = openProgress < 0.5
    ? 4 * openProgress * openProgress * openProgress
    : 1 - Math.pow(-2 * openProgress + 2, 3) / 2;
  
  const coverAngle = openEased * Math.PI * 0.92;

  useFrame(() => {
    if (coverGroupRef.current) {
      coverGroupRef.current.rotation.y = -coverAngle;
    }
    if (bookRef.current) {
      // Very subtle float
      bookRef.current.rotation.z = Math.sin(Date.now() * 0.0003) * 0.005;
    }
  });

  const pageWidth = 1.3;
  const pageHeight = 1.8;
  const coverThickness = 0.02;

  return (
    <group ref={bookRef} rotation={[-0.45, 0, 0]} position={[0, 0, 0.2]}>
      
      {/* === BACK COVER (right, stationary) === */}
      <mesh position={[pageWidth / 2, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[pageWidth, pageHeight, coverThickness]} />
        <meshStandardMaterial color="#2C4A28" roughness={0.65} metalness={0.08} />
      </mesh>

      {/* === RIGHT PAGE (with scene image) === */}
      <mesh position={[pageWidth / 2, coverThickness / 2 + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[pageWidth - 0.06, pageHeight - 0.06]} />
        <meshStandardMaterial 
          map={sceneTexture} 
          roughness={0.82}
        />
      </mesh>

      {/* === LEFT PAGE (stationary, blank paper) === */}
      <mesh position={[-pageWidth / 2, coverThickness / 2 + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[pageWidth - 0.06, pageHeight - 0.06]} />
        <meshStandardMaterial color="#FAF7F2" roughness={0.92} />
      </mesh>
      {/* Left page back */}
      <mesh position={[-pageWidth / 2, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[pageWidth, pageHeight, 0.005]} />
        <meshStandardMaterial color="#F0EBE3" roughness={0.9} />
      </mesh>

      {/* === SPINE === */}
      <mesh position={[0, coverThickness / 2, 0]}>
        <boxGeometry args={[0.08, coverThickness * 2, pageHeight]} />
        <meshStandardMaterial color="#1E3A1A" roughness={0.55} metalness={0.12} />
      </mesh>

      {/* === PAGE EDGES (right side, visible layers) === */}
      <mesh position={[pageWidth + 0.01, coverThickness / 2, 0]}>
        <boxGeometry args={[0.015, coverThickness, pageHeight - 0.04]} />
        <meshStandardMaterial color="#E5E0D8" roughness={0.95} />
      </mesh>

      {/* === FRONT COVER (animated, hinges from spine) === */}
      <group ref={coverGroupRef} position={[0.04, coverThickness, 0]}>
        {/* Cover front */}
        <mesh position={[pageWidth / 2, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <boxGeometry args={[pageWidth, pageHeight, coverThickness]} />
          <meshStandardMaterial 
            map={coverTexture}
            roughness={0.65}
            metalness={0.05}
          />
        </mesh>
        {/* Cover inside (visible when flipping) */}
        <mesh position={[pageWidth / 2, -coverThickness / 2 - 0.001, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[pageWidth - 0.04, pageHeight - 0.04]} />
          <meshStandardMaterial color="#E0DAD0" roughness={0.9} />
        </mesh>
      </group>

      {/* === POP-UP ELEMENTS === */}
      {scene.tags.map((tag, i) => (
        <PaperPopup 
          key={`${scene.title}-${i}`}
          tag={tag} 
          progress={progress} 
          index={i} 
        />
      ))}
    </group>
  );
}

// ============================================
// Camera Controller
// ============================================
function CameraController({ progress }: { progress: number }) {
  const { camera } = useThree();
  
  useFrame(() => {
    // Smooth camera movement: starts high, comes closer as book opens
    const openP = Math.min(1, progress * 2);
    const targetY = 2.8 - openP * 0.5;
    const targetZ = 3.2 - openP * 0.3;
    
    camera.position.y += (targetY - camera.position.y) * 0.04;
    camera.position.z += (targetZ - camera.position.z) * 0.04;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// ============================================
// Main Component
// ============================================
export default function PopupBook() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [activeScene, setActiveScene] = useState(0);
  const [mounted, setMounted] = useState(false);

  const scene = SCENES[activeScene];
  const total = scene.tags.reduce((sum, t) => {
    return sum + parseInt(t.price.replace(/[₪,]/g, ""));
  }, 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const container = containerRef.current;
    if (!container) return;

    const trigger = ScrollTrigger.create({
      trigger: container,
      start: "top 70%",
      end: "bottom 30%",
      scrub: 0.8,
      onUpdate: (self) => {
        setProgress(self.progress);
      },
    });

    return () => trigger.kill();
  }, [mounted]);

  if (!mounted) return null;

  return (
    <section className="py-20 px-4 overflow-hidden" dir="rtl">
      <div className="max-w-4xl mx-auto text-center mb-10">
        <p className="text-sm text-gray-400 mb-3 tracking-wider">✦ חוויה אינטראקטיבית</p>
        <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-4">
          הדירה שלך, בסגנון{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-600 to-orange-500">
            Pop-Up
          </span>
        </h2>
        <p className="text-lg text-gray-500">
          גלול למטה וצפה בספר נפתח — עם מחירים לכל מוצר
        </p>
      </div>

      {/* Scene selector */}
      <div className="flex justify-center gap-3 mb-6">
        {SCENES.map((s, i) => (
          <button
            key={i}
            onClick={() => setActiveScene(i)}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
              activeScene === i
                ? "bg-gray-900 text-white shadow-lg shadow-gray-900/25"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      <div ref={containerRef} style={{ minHeight: "120vh" }}>
        <div className="sticky top-16 w-full max-w-3xl mx-auto" style={{ height: "70vh" }}>
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-2xl">
              <div className="text-gray-400 animate-pulse text-lg">📖 טוען ספר...</div>
            </div>
          }>
            <Canvas
              shadows
              camera={{ position: [0, 2.8, 3.2], fov: 38 }}
              style={{ borderRadius: "1rem", background: "linear-gradient(180deg, #F9F6F1 0%, #EDE8DF 100%)" }}
              gl={{ 
                antialias: true, 
                alpha: false,
                powerPreference: "high-performance",
              }}
              dpr={[1, 2]}
            >
              <CameraController progress={progress} />
              <Book progress={progress} scene={scene} />
              <Preload all />
            </Canvas>
          </Suspense>

          {/* Total price overlay */}
          <div 
            className="absolute bottom-6 left-1/2 transition-all duration-500"
            style={{ 
              opacity: progress > 0.75 ? 1 : 0,
              transform: `translateX(-50%) translateY(${progress > 0.75 ? 0 : 20}px)`
            }}
          >
            <div className="inline-flex items-center gap-3 bg-white/95 backdrop-blur-sm rounded-full px-7 py-3.5 shadow-lg border border-gray-100">
              <span className="text-sm text-gray-500">סה&quot;כ עיצוב החדר:</span>
              <span className="text-xl font-bold text-gray-900">
                {total.toLocaleString("he-IL")} ₪
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
