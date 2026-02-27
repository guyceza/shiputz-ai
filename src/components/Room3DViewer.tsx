"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

interface Room3DViewerProps {
  modelUrl: string;
  houseWidth?: number;
  houseLength?: number;
  startPosition?: { x: number; y: number; z: number };
  onLoad?: () => void;
  onError?: (error: string) => void;
}

export default function Room3DViewer({
  modelUrl,
  houseWidth = 10,
  houseLength = 10,
  startPosition,
  onLoad,
  onError,
}: Room3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    bounds: { minX: number; maxX: number; minZ: number; maxZ: number } | null;
    euler: THREE.Euler;
    keys: { w: boolean; a: boolean; s: boolean; d: boolean };
  } | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Reset camera position
  const resetCamera = useCallback(() => {
    if (!sceneRef.current?.bounds) return;
    const { bounds, camera, euler } = sceneRef.current;
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2;
    camera.position.set(centerX, 1.6, centerZ);
    euler.set(0, 0, 0);
    camera.quaternion.setFromEuler(euler);
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(async () => {
    if (!wrapperRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await wrapperRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobile);

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(houseWidth / 2, 1.6, houseLength / 2);

    // Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch (e) {
      setError("שגיאה ביצירת WebGL. נסה דפדפן אחר.");
      setLoading(false);
      onError?.("WebGL not supported");
      return;
    }
    
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(5, 10, 5);
    sun.castShadow = true;
    scene.add(sun);

    // State
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    const keys = { w: false, a: false, s: false, d: false };
    let bounds: { minX: number; maxX: number; minZ: number; maxZ: number } | null = null;

    sceneRef.current = { scene, camera, renderer, bounds, euler, keys };

    // Load model
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        
        // Calculate bounds from model
        const box = new THREE.Box3().setFromObject(model);
        bounds = {
          minX: box.min.x + 0.5,
          maxX: box.max.x - 0.5,
          minZ: box.min.z + 0.5,
          maxZ: box.max.z - 0.5,
        };
        
        if (sceneRef.current) {
          sceneRef.current.bounds = bounds;
        }
        
        console.log('Model loaded, bounds:', bounds);
        
        // Enable shadows
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        scene.add(model);
        
        // Set start position
        if (startPosition) {
          camera.position.set(startPosition.x, startPosition.y, startPosition.z);
        } else {
          // Start in center of bounds
          camera.position.set(
            (bounds.minX + bounds.maxX) / 2,
            1.6,
            (bounds.minZ + bounds.maxZ) / 2
          );
        }
        
        console.log('Camera at:', camera.position);
        
        setLoading(false);
        setError(null);
        onLoad?.();
      },
      undefined,
      (err) => {
        console.error("Model load error:", err);
        setLoading(false);
        setError("שגיאה בטעינת המודל");
        onError?.("Failed to load model");
      }
    );

    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyW" || e.code === "ArrowUp") keys.w = true;
      if (e.code === "KeyA" || e.code === "ArrowLeft") keys.a = true;
      if (e.code === "KeyS" || e.code === "ArrowDown") keys.s = true;
      if (e.code === "KeyD" || e.code === "ArrowRight") keys.d = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "KeyW" || e.code === "ArrowUp") keys.w = false;
      if (e.code === "KeyA" || e.code === "ArrowLeft") keys.a = false;
      if (e.code === "KeyS" || e.code === "ArrowDown") keys.s = false;
      if (e.code === "KeyD" || e.code === "ArrowRight") keys.d = false;
    };

    // Mouse/touch look
    let isDragging = false;
    let prevX = 0, prevY = 0;
    const lookSpeed = 0.003;
    const PI_2 = Math.PI / 2;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
      setShowInstructions(false);
    };
    const handleMouseUp = () => { isDragging = false; };
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      euler.y -= (e.clientX - prevX) * lookSpeed;
      euler.x -= (e.clientY - prevY) * lookSpeed;
      euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x));
      camera.quaternion.setFromEuler(euler);
      prevX = e.clientX;
      prevY = e.clientY;
    };

    // Touch handlers
    let touchId: number | null = null;
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        // Only use right side of screen for looking (left has joystick)
        if (touch.clientX > window.innerWidth * 0.4) {
          isDragging = true;
          touchId = touch.identifier;
          prevX = touch.clientX;
          prevY = touch.clientY;
          setShowInstructions(false);
        }
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || touchId === null) return;
      for (const touch of Array.from(e.touches)) {
        if (touch.identifier === touchId) {
          euler.y -= (touch.clientX - prevX) * lookSpeed * 1.5;
          euler.x -= (touch.clientY - prevY) * lookSpeed * 1.5;
          euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x));
          camera.quaternion.setFromEuler(euler);
          prevX = touch.clientX;
          prevY = touch.clientY;
          break;
        }
      }
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (touchId !== null) {
        const found = Array.from(e.touches).some(t => t.identifier === touchId);
        if (!found) {
          isDragging = false;
          touchId = null;
        }
      }
    };

    // Prevent context menu
    const preventContext = (e: Event) => e.preventDefault();

    // Event listeners
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    container.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("touchstart", handleTouchStart, { passive: false });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("contextmenu", preventContext);

    // Resize handler
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // Animation loop
    const moveSpeed = 3;
    let lastTime = performance.now();

    const animate = () => {
      requestAnimationFrame(animate);
      
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1); // Cap delta to prevent huge jumps
      lastTime = now;

      // Get mobile keys
      const mobileKeys = (window as any).__mobileKeys || {};
      const w = keys.w || mobileKeys.w;
      const s = keys.s || mobileKeys.s;
      const a = keys.a || mobileKeys.a;
      const d = keys.d || mobileKeys.d;

      // Calculate movement
      if (w || s || a || d) {
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        forward.y = 0;
        forward.normalize();
        
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        right.y = 0;
        right.normalize();

        const velocity = new THREE.Vector3();
        if (w) velocity.add(forward);
        if (s) velocity.sub(forward);
        if (d) velocity.add(right);
        if (a) velocity.sub(right);
        
        velocity.normalize().multiplyScalar(moveSpeed * delta);
        
        // Apply movement
        const newX = camera.position.x + velocity.x;
        const newZ = camera.position.z + velocity.z;
        
        // Clamp to bounds BEFORE applying
        if (bounds) {
          camera.position.x = Math.max(bounds.minX, Math.min(bounds.maxX, newX));
          camera.position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, newZ));
        } else {
          camera.position.x = newX;
          camera.position.z = newZ;
        }
      }

      // Always keep at standing height
      camera.position.y = 1.6;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      container.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("contextmenu", preventContext);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      sceneRef.current = null;
    };
  }, [modelUrl, houseWidth, houseLength, startPosition, onLoad, onError]);

  // Error state
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white text-center p-4">
        <div>
          <p className="text-2xl mb-4">😕</p>
          <p className="text-lg mb-2">משהו השתבש</p>
          <p className="text-sm text-gray-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 rounded-lg"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative w-full h-full bg-black">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      
      {/* Control buttons */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <button
          onClick={resetCamera}
          className="bg-gray-900/80 hover:bg-gray-800 text-white px-3 py-2 rounded-lg flex items-center gap-2"
          title="אפס מיקום"
        >
          🏠
        </button>
        <button
          onClick={toggleFullscreen}
          className="bg-gray-900/80 hover:bg-gray-800 text-white px-3 py-2 rounded-lg flex items-center gap-2"
        >
          {isFullscreen ? "✕" : "⛶"}
        </button>
      </div>
      
      {/* Loading */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 z-30">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-3">🏠</div>
            <p className="text-white">טוען מודל...</p>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!loading && showInstructions && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/60 z-20 cursor-pointer"
          onClick={() => setShowInstructions(false)}
          onTouchStart={() => setShowInstructions(false)}
        >
          <div className="text-center text-white p-6 bg-gray-900/90 rounded-xl max-w-xs">
            <p className="text-3xl mb-3">🏠</p>
            <p className="text-lg font-semibold mb-2">לחצו להתחיל</p>
            <p className="text-sm text-gray-400">
              {isMobile ? "גררו להסתכל • חצים לתנועה" : "גררו להסתכל • WASD לתנועה"}
            </p>
          </div>
        </div>
      )}

      {/* Mobile joystick */}
      {!loading && isMobile && (
        <div className="absolute bottom-6 left-4 z-20 pointer-events-auto">
          <div className="grid grid-cols-3 gap-1">
            <div />
            <button
              className="w-16 h-16 bg-white/30 rounded-xl flex items-center justify-center active:bg-white/50 select-none"
              onTouchStart={(e) => { e.stopPropagation(); (window as any).__mobileKeys = { ...(window as any).__mobileKeys, w: true }; }}
              onTouchEnd={(e) => { e.stopPropagation(); (window as any).__mobileKeys = { ...(window as any).__mobileKeys, w: false }; }}
            >
              <span className="text-white text-2xl">▲</span>
            </button>
            <div />
            <button
              className="w-16 h-16 bg-white/30 rounded-xl flex items-center justify-center active:bg-white/50 select-none"
              onTouchStart={(e) => { e.stopPropagation(); (window as any).__mobileKeys = { ...(window as any).__mobileKeys, a: true }; }}
              onTouchEnd={(e) => { e.stopPropagation(); (window as any).__mobileKeys = { ...(window as any).__mobileKeys, a: false }; }}
            >
              <span className="text-white text-2xl">◀</span>
            </button>
            <div className="w-16 h-16" />
            <button
              className="w-16 h-16 bg-white/30 rounded-xl flex items-center justify-center active:bg-white/50 select-none"
              onTouchStart={(e) => { e.stopPropagation(); (window as any).__mobileKeys = { ...(window as any).__mobileKeys, d: true }; }}
              onTouchEnd={(e) => { e.stopPropagation(); (window as any).__mobileKeys = { ...(window as any).__mobileKeys, d: false }; }}
            >
              <span className="text-white text-2xl">▶</span>
            </button>
            <div />
            <button
              className="w-16 h-16 bg-white/30 rounded-xl flex items-center justify-center active:bg-white/50 select-none"
              onTouchStart={(e) => { e.stopPropagation(); (window as any).__mobileKeys = { ...(window as any).__mobileKeys, s: true }; }}
              onTouchEnd={(e) => { e.stopPropagation(); (window as any).__mobileKeys = { ...(window as any).__mobileKeys, s: false }; }}
            >
              <span className="text-white text-2xl">▼</span>
            </button>
            <div />
          </div>
        </div>
      )}
      
      {/* Hint */}
      {!loading && isMobile && !showInstructions && (
        <div className="absolute bottom-6 right-4 z-10 bg-gray-900/60 text-white text-xs px-3 py-2 rounded-lg">
          👆 גררו להסתכל
        </div>
      )}
    </div>
  );
}
