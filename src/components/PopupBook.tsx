"use client";

import { useEffect, useRef, useState, useMemo, Suspense } from "react";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { Environment, useTexture, Html } from "@react-three/drei";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

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
      { name: "ספה מעוצבת", price: "₪4,200", x: -0.6, z: 0.1, height: 0.8 },
      { name: "שולחן קפה", price: "₪1,800", x: 0.0, z: 0.4, height: 0.6 },
      { name: "מנורת רצפה", price: "₪890", x: 0.7, z: -0.2, height: 1.0 },
      { name: "שטיח צמר", price: "₪2,100", x: 0.0, z: 0.7, height: 0.3 },
    ]
  },
  {
    title: "מטבח חלומי",
    image: "/popup-book/kitchen.jpg",
    tags: [
      { name: "אי מטבח", price: "₪8,500", x: -0.1, z: 0.2, height: 0.7 },
      { name: "תאורה תלויה", price: "₪1,200", x: 0.2, z: -0.5, height: 1.2 },
      { name: "כיסאות בר", price: "₪2,400", x: -0.6, z: 0.3, height: 0.8 },
      { name: "מדפים", price: "₪1,600", x: 0.7, z: -0.1, height: 0.9 },
    ]
  },
  {
    title: "חדר שינה",
    image: "/popup-book/bedroom.jpg",
    tags: [
      { name: "מיטה זוגית", price: "₪5,900", x: 0.0, z: 0.0, height: 0.6 },
      { name: "שידות לילה", price: "₪1,400", x: -0.8, z: 0.1, height: 0.7 },
      { name: "מנורת לילה", price: "₪650", x: 0.8, z: -0.1, height: 0.9 },
      { name: "ארון קיר", price: "₪7,200", x: 0.6, z: -0.5, height: 1.1 },
    ]
  }
];

// ============================================
// 3D Book Page Component
// ============================================
function BookPage({ 
  position, 
  rotation, 
  textureUrl, 
  isBack = false,
  color = "#F5F0EB"
}: { 
  position: [number, number, number];
  rotation: [number, number, number];
  textureUrl?: string;
  isBack?: boolean;
  color?: string;
}) {
  const texture = useTexture(textureUrl || "/popup-book/cover.jpg");
  
  const material = useMemo(() => {
    if (textureUrl) {
      return new THREE.MeshStandardMaterial({ 
        map: texture, 
        side: isBack ? THREE.BackSide : THREE.FrontSide,
        roughness: 0.8,
        metalness: 0.0,
      });
    }
    return new THREE.MeshStandardMaterial({ 
      color: new THREE.Color(color),
      side: isBack ? THREE.BackSide : THREE.FrontSide,
      roughness: 0.9,
      metalness: 0.0,
    });
  }, [texture, textureUrl, isBack, color]);

  return (
    <mesh position={position} rotation={rotation} material={material}>
      <planeGeometry args={[2.4, 1.7]} />
    </mesh>
  );
}

// ============================================
// Pop-up Element (rises from the page)
// ============================================
function PopupElement({ 
  tag, 
  progress, 
  index 
}: { 
  tag: PriceTag; 
  progress: number;
  index: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Stagger the appearance
  const staggerDelay = index * 0.08;
  const localProgress = Math.max(0, Math.min(1, (progress - 0.5 - staggerDelay) / 0.3));
  
  // Eased progress
  const eased = localProgress < 0.5 
    ? 4 * localProgress * localProgress * localProgress 
    : 1 - Math.pow(-2 * localProgress + 2, 3) / 2;

  const currentHeight = tag.height * eased;
  
  // Slight wobble after appearing
  const wobble = localProgress > 0.9 ? Math.sin(Date.now() * 0.002 + index) * 0.01 : 0;

  return (
    <group ref={groupRef} position={[tag.x, currentHeight / 2 + 0.01, tag.z]}>
      {/* Paper fold stand - the triangular support */}
      <mesh ref={meshRef} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.02, currentHeight, 0.15]} />
        <meshStandardMaterial color="#E8E4DF" roughness={0.9} />
      </mesh>
      
      {/* Paper fold base */}
      <mesh position={[0, -currentHeight / 2, 0]} rotation={[-Math.PI / 4, 0, 0]}>
        <planeGeometry args={[0.15, 0.1]} />
        <meshStandardMaterial color="#F0EDE8" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* Price tag (HTML overlay) */}
      {localProgress > 0.5 && (
        <Html
          position={[wobble, currentHeight / 2 + 0.15, 0]}
          center
          distanceFactor={3}
          style={{
            opacity: Math.min(1, (localProgress - 0.5) * 4),
            transition: "opacity 0.3s",
            pointerEvents: "auto",
          }}
        >
          <div className="group cursor-pointer">
            {/* String */}
            <div className="w-px h-4 bg-gray-400 mx-auto" />
            {/* Tag */}
            <div className="bg-white rounded-lg shadow-xl px-3 py-2 border border-gray-100 hover:border-amber-400 hover:shadow-amber-100 hover:scale-110 transition-all duration-200 whitespace-nowrap text-center">
              <p className="text-[10px] text-gray-400 font-medium leading-tight">{tag.name}</p>
              <p className="text-sm font-bold text-gray-900 leading-tight">{tag.price}</p>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================
// Main 3D Book Scene
// ============================================
function BookScene({ 
  progress, 
  scene 
}: { 
  progress: number;
  scene: RoomScene;
}) {
  const bookGroupRef = useRef<THREE.Group>(null);
  const coverRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  
  const coverTexture = useTexture("/popup-book/cover.jpg");
  const pageTexture = useTexture(scene.image);

  // Book open angle based on progress (0 = closed, 1 = fully open)
  const openProgress = Math.max(0, Math.min(1, progress * 2)); // First half of scroll opens book
  const openAngle = openProgress * Math.PI * 0.95; // Almost 180 degrees

  useFrame(() => {
    if (!bookGroupRef.current || !coverRef.current) return;
    
    // Subtle breathing animation
    bookGroupRef.current.rotation.y = Math.sin(Date.now() * 0.0005) * 0.02;
    
    // Cover rotation
    coverRef.current.rotation.y = -openAngle;
  });

  // Camera animation
  useFrame(() => {
    // Start from slightly above, move to reading angle
    const targetY = 2.5 + (1 - openProgress) * 1;
    const targetZ = 3.0 + (1 - openProgress) * 0.5;
    camera.position.y += (targetY - camera.position.y) * 0.05;
    camera.position.z += (targetZ - camera.position.z) * 0.05;
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 5, 2]} intensity={0.8} castShadow color="#FFF5E6" />
      <directionalLight position={[-2, 3, -1]} intensity={0.3} color="#E6F0FF" />
      <pointLight position={[0, 3, 0]} intensity={0.2} color="#FFFFFF" />

      {/* Book Group */}
      <group ref={bookGroupRef} position={[0, 0, 0]} rotation={[-0.3, 0, 0]}>
        
        {/* Back cover (stationary - right page) */}
        <mesh position={[0.6, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[1.2, 1.7]} />
          <meshStandardMaterial color="#3D5A3A" roughness={0.7} metalness={0.1} />
        </mesh>

        {/* Right page with scene image */}
        <mesh position={[0.6, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.15, 1.6]} />
          <meshStandardMaterial 
            map={pageTexture} 
            roughness={0.85} 
            metalness={0.0}
          />
        </mesh>

        {/* Left page (stationary) */}
        <mesh position={[-0.6, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.15, 1.6]} />
          <meshStandardMaterial color="#F5F0EB" roughness={0.9} />
        </mesh>

        {/* Left page back cover */}
        <mesh position={[-0.6, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.2, 1.7]} />
          <meshStandardMaterial color="#3D5A3A" roughness={0.7} metalness={0.1} side={THREE.BackSide} />
        </mesh>

        {/* Spine */}
        <mesh position={[0, 0.01, 0]}>
          <boxGeometry args={[0.06, 0.04, 1.7]} />
          <meshStandardMaterial color="#2D4A2A" roughness={0.6} metalness={0.15} />
        </mesh>

        {/* Page edges (right side) */}
        <mesh position={[1.2, 0.015, 0]}>
          <boxGeometry args={[0.02, 0.03, 1.6]} />
          <meshStandardMaterial color="#E8E4DF" roughness={0.9} />
        </mesh>

        {/* Front Cover (animated - hinged from spine) */}
        <group ref={coverRef} position={[0, 0.03, 0]}>
          {/* Cover front face */}
          <mesh position={[0.6, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
            <planeGeometry args={[1.2, 1.7]} />
            <meshStandardMaterial 
              map={coverTexture}
              roughness={0.7}
              metalness={0.05}
            />
          </mesh>
          
          {/* Cover back face (inside) */}
          <mesh position={[0.6, -0.005, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.2, 1.7]} />
            <meshStandardMaterial color="#DDD8D0" roughness={0.9} />
          </mesh>

          {/* Cover thickness */}
          <mesh position={[1.2, -0.0025, 0]}>
            <boxGeometry args={[0.01, 0.005, 1.7]} />
            <meshStandardMaterial color="#2D4A2A" roughness={0.7} />
          </mesh>
        </group>

        {/* Pop-up elements (only show when book is opening) */}
        {openProgress > 0.3 && scene.tags.map((tag, i) => (
          <PopupElement 
            key={`${scene.title}-${i}`}
            tag={tag} 
            progress={progress} 
            index={i} 
          />
        ))}
      </group>

      {/* Table surface */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#D4C4B0" roughness={0.95} metalness={0.0} />
      </mesh>
    </>
  );
}

// ============================================
// Main Component
// ============================================
export default function PopupBook() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [activeScene, setActiveScene] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const scene = SCENES[activeScene];
  const total = scene.tags.reduce((sum, t) => {
    return sum + parseInt(t.price.replace(/[₪,]/g, ""));
  }, 0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const trigger = ScrollTrigger.create({
      trigger: container,
      start: "top 80%",
      end: "bottom 20%",
      scrub: 0.5,
      onUpdate: (self) => {
        setProgress(self.progress);
        if (self.progress > 0.05) setIsVisible(true);
      },
      onLeaveBack: () => setIsVisible(false),
    });

    return () => trigger.kill();
  }, []);

  return (
    <section className="py-24 px-4 overflow-hidden" dir="rtl">
      <div className="max-w-4xl mx-auto text-center mb-12">
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
      <div className="flex justify-center gap-3 mb-8">
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

      <div ref={containerRef} className="min-h-[90vh]">
        {/* 3D Canvas */}
        <div className="sticky top-20 w-full max-w-3xl mx-auto" style={{ height: "60vh" }}>
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-gray-400 animate-pulse">טוען ספר...</div>
            </div>
          }>
            <Canvas
              shadows
              camera={{ position: [0, 3.5, 3.5], fov: 40 }}
              style={{ borderRadius: "1rem" }}
              gl={{ antialias: true, alpha: true }}
            >
              <BookScene progress={progress} scene={scene} />
            </Canvas>
          </Suspense>

          {/* Total price overlay */}
          <div 
            className="absolute bottom-4 left-1/2 -translate-x-1/2 transition-all duration-500"
            style={{ 
              opacity: progress > 0.7 ? 1 : 0,
              transform: `translateX(-50%) translateY(${progress > 0.7 ? 0 : 20}px)`
            }}
          >
            <div className="inline-flex items-center gap-3 bg-white/90 backdrop-blur-sm rounded-full px-7 py-3.5 shadow-lg border border-gray-100">
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
