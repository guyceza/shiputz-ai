"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

interface Room3DViewerProps {
  modelUrl: string;
  roomWidth?: number;
  roomLength?: number;
  houseWidth?: number;
  houseLength?: number;
  startPosition?: { x: number; y: number; z: number };
  startRotation?: number;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

export default function Room3DViewer({
  modelUrl,
  roomWidth = 4,
  roomLength = 5,
  houseWidth,
  houseLength,
  startPosition,
  startRotation,
  onLoad,
  onError,
}: Room3DViewerProps) {
  const boundaryWidth = houseWidth || roomWidth;
  const boundaryLength = houseLength || roomLength;
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const modelBoundsRef = useRef<{ min: THREE.Vector3; max: THREE.Vector3; center: THREE.Vector3 } | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const eulerRef = useRef<THREE.Euler>(new THREE.Euler(0, 0, 0, 'YXZ'));
  const [loading, setLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const resetCamera = () => {
    if (!cameraRef.current || !modelBoundsRef.current) return;
    const { center } = modelBoundsRef.current;
    cameraRef.current.position.set(center.x, 1.6, center.z);
    eulerRef.current.set(0, 0, 0);
    cameraRef.current.quaternion.setFromEuler(eulerRef.current);
  };

  const toggleFullscreen = async () => {
    if (!wrapperRef.current) return;
    
    try {
      if (!document.fullscreenElement) {
        await wrapperRef.current.requestFullscreen();
        setIsFullscreen(true);
        if (screen.orientation && 'lock' in screen.orientation) {
          try {
            await (screen.orientation as any).lock('landscape');
          } catch (e) {}
        }
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        if (screen.orientation && 'unlock' in screen.orientation) {
          (screen.orientation as any).unlock();
        }
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    setIsMobile(mobile);

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.set(0, 1.6, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const ceilingLight = new THREE.PointLight(0xfff5e6, 1, 10);
    ceilingLight.position.set(roomWidth / 2, 2.7, roomLength / 2);
    ceilingLight.castShadow = true;
    scene.add(ceilingLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(roomWidth / 2, 3, -2);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0xfff0e0, 0.3);
    fillLight.position.set(roomWidth / 2, 2, roomLength + 2);
    scene.add(fillLight);

    // Movement state
    const moveSpeed = 3;
    const lookSpeed = 0.003;
    const velocity = new THREE.Vector3();
    const direction = new THREE.Vector3();
    const keys = { w: false, a: false, s: false, d: false };

    // Mouse/touch look state
    let isDragging = false;
    let previousMouseX = 0;
    let previousMouseY = 0;
    const euler = eulerRef.current;
    const PI_2 = Math.PI / 2;

    // Load GLTF model
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        console.log('Model loaded:', { center, size });
        
        modelBoundsRef.current = { min: box.min.clone(), max: box.max.clone(), center: center.clone() };
        
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        scene.add(model);
        
        // Start position
        const startX = box.min.x + 2;
        const startZ = center.z;
        
        if (startPosition) {
          camera.position.set(startPosition.x, startPosition.y, startPosition.z);
        } else {
          camera.position.set(startX, 1.6, startZ);
        }
        
        if (startRotation !== undefined) {
          euler.y = startRotation;
          camera.quaternion.setFromEuler(euler);
        }
        
        setLoading(false);
        onLoad?.();
      },
      undefined,
      (error: unknown) => {
        console.error("GLTF load error:", error);
        setLoading(false);
        onError?.(error instanceof Error ? error.message : "Failed to load 3D model");
      }
    );

    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW": case "ArrowUp": keys.w = true; break;
        case "KeyA": case "ArrowLeft": keys.a = true; break;
        case "KeyS": case "ArrowDown": keys.s = true; break;
        case "KeyD": case "ArrowRight": keys.d = true; break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW": case "ArrowUp": keys.w = false; break;
        case "KeyA": case "ArrowLeft": keys.a = false; break;
        case "KeyS": case "ArrowDown": keys.s = false; break;
        case "KeyD": case "ArrowRight": keys.d = false; break;
      }
    };

    // Mouse handlers - drag to look
    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMouseX = e.clientX;
      previousMouseY = e.clientY;
      setShowInstructions(false);
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - previousMouseX;
      const deltaY = e.clientY - previousMouseY;
      
      euler.y -= deltaX * lookSpeed;
      euler.x -= deltaY * lookSpeed;
      euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x));
      
      camera.quaternion.setFromEuler(euler);
      
      previousMouseX = e.clientX;
      previousMouseY = e.clientY;
    };

    // Touch handlers
    let touchId: number | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        // Only start drag if touch is in the right half (look area) or if there's no joystick
        const isLookArea = touch.clientX > window.innerWidth * 0.4;
        if (isLookArea || !mobile) {
          isDragging = true;
          touchId = touch.identifier;
          previousMouseX = touch.clientX;
          previousMouseY = touch.clientY;
          setShowInstructions(false);
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || touchId === null) return;
      
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        if (touch.identifier === touchId) {
          const deltaX = touch.clientX - previousMouseX;
          const deltaY = touch.clientY - previousMouseY;
          
          euler.y -= deltaX * lookSpeed * 1.5; // Slightly faster on mobile
          euler.x -= deltaY * lookSpeed * 1.5;
          euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x));
          
          camera.quaternion.setFromEuler(euler);
          
          previousMouseX = touch.clientX;
          previousMouseY = touch.clientY;
          break;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchId !== null) {
        let found = false;
        for (let i = 0; i < e.touches.length; i++) {
          if (e.touches[i].identifier === touchId) {
            found = true;
            break;
          }
        }
        if (!found) {
          isDragging = false;
          touchId = null;
        }
      }
    };

    // Prevent context menu on long press
    const handleContextMenu = (e: Event) => {
      e.preventDefault();
    };

    // Add event listeners
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    container.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("touchstart", handleTouchStart, { passive: false });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("contextmenu", handleContextMenu);

    // Handle resize
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // Animation loop
    let prevTime = performance.now();

    const animate = () => {
      requestAnimationFrame(animate);

      const time = performance.now();
      const delta = (time - prevTime) / 1000;
      prevTime = time;

      // Friction
      velocity.x -= velocity.x * 8 * delta;
      velocity.z -= velocity.z * 8 * delta;

      // Get mobile virtual button state
      const mobileKeys = (window as any).__mobileKeys || {};
      const w = keys.w || mobileKeys.w;
      const s = keys.s || mobileKeys.s;
      const a = keys.a || mobileKeys.a;
      const d = keys.d || mobileKeys.d;

      // Calculate direction
      direction.z = Number(w) - Number(s);
      direction.x = Number(d) - Number(a);
      direction.normalize();

      if (w || s) velocity.z -= direction.z * moveSpeed * delta;
      if (a || d) velocity.x -= direction.x * moveSpeed * delta;

      // Apply movement relative to camera direction
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(camera.quaternion);
      forward.y = 0;
      forward.normalize();

      const right = new THREE.Vector3(1, 0, 0);
      right.applyQuaternion(camera.quaternion);
      right.y = 0;
      right.normalize();

      camera.position.addScaledVector(forward, -velocity.z);
      camera.position.addScaledVector(right, -velocity.x);

      // Keep at standing height
      camera.position.y = 1.6;
      
      // Clamp to bounds
      const bounds = modelBoundsRef.current;
      if (bounds) {
        const margin = 0.5;
        camera.position.x = Math.max(bounds.min.x + margin, Math.min(bounds.max.x - margin, camera.position.x));
        camera.position.z = Math.max(bounds.min.z + margin, Math.min(bounds.max.z - margin, camera.position.z));
      }

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
      container.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("resize", handleResize);

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [modelUrl, roomWidth, roomLength, startPosition, startRotation, onLoad, onError, boundaryWidth, boundaryLength]);

  return (
    <div ref={wrapperRef} className="relative w-full h-full bg-black">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      
      {/* Control buttons */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <button
          onClick={resetCamera}
          className="bg-gray-900/80 hover:bg-gray-800 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors"
          title="אפס מיקום"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-sm hidden sm:inline">אפס</span>
        </button>
        
        <button
          onClick={toggleFullscreen}
          className="bg-gray-900/80 hover:bg-gray-800 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors"
          title={isFullscreen ? "צא ממסך מלא" : "מסך מלא"}
        >
          {isFullscreen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          )}
          <span className="text-sm hidden sm:inline">{isFullscreen ? "יציאה" : "מסך מלא"}</span>
        </button>
      </div>
      
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-30">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-3">🏠</div>
            <p className="text-white">טוען מודל תלת-ממדי...</p>
          </div>
        </div>
      )}

      {/* Instructions overlay */}
      {!loading && showInstructions && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/50 z-20 cursor-pointer"
          onClick={() => setShowInstructions(false)}
          onTouchStart={() => setShowInstructions(false)}
        >
          <div className="text-center text-white p-6 bg-gray-900/90 rounded-xl max-w-sm">
            <p className="text-2xl mb-4">🏠</p>
            <p className="text-lg font-semibold mb-2">לחצו להתחיל סיור</p>
            {isMobile ? (
              <p className="text-sm text-gray-400">
                גררו על המסך להסתכל מסביב<br />
                השתמשו בכפתורים לתנועה
              </p>
            ) : (
              <p className="text-sm text-gray-400">
                גררו את העכבר להסתכל מסביב<br />
                WASD או חצים לתנועה
              </p>
            )}
          </div>
        </div>
      )}

      {/* Mobile controls - virtual joystick */}
      {!loading && isMobile && (
        <div className="absolute bottom-8 left-4 z-20">
          <div className="grid grid-cols-3 gap-1">
            <div />
            <button
              className="w-14 h-14 bg-white/30 backdrop-blur rounded-lg flex items-center justify-center active:bg-white/50 touch-none select-none"
              onTouchStart={(e) => { e.preventDefault(); (window as any).__mobileKeys = { ...(window as any).__mobileKeys, w: true }; }}
              onTouchEnd={() => { (window as any).__mobileKeys = { ...(window as any).__mobileKeys, w: false }; }}
            >
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4l-8 8h16z" />
              </svg>
            </button>
            <div />
            <button
              className="w-14 h-14 bg-white/30 backdrop-blur rounded-lg flex items-center justify-center active:bg-white/50 touch-none select-none"
              onTouchStart={(e) => { e.preventDefault(); (window as any).__mobileKeys = { ...(window as any).__mobileKeys, a: true }; }}
              onTouchEnd={() => { (window as any).__mobileKeys = { ...(window as any).__mobileKeys, a: false }; }}
            >
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 12l8-8v16z" />
              </svg>
            </button>
            <div className="w-14 h-14" />
            <button
              className="w-14 h-14 bg-white/30 backdrop-blur rounded-lg flex items-center justify-center active:bg-white/50 touch-none select-none"
              onTouchStart={(e) => { e.preventDefault(); (window as any).__mobileKeys = { ...(window as any).__mobileKeys, d: true }; }}
              onTouchEnd={() => { (window as any).__mobileKeys = { ...(window as any).__mobileKeys, d: false }; }}
            >
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 12l-8 8V4z" />
              </svg>
            </button>
            <div />
            <button
              className="w-14 h-14 bg-white/30 backdrop-blur rounded-lg flex items-center justify-center active:bg-white/50 touch-none select-none"
              onTouchStart={(e) => { e.preventDefault(); (window as any).__mobileKeys = { ...(window as any).__mobileKeys, s: true }; }}
              onTouchEnd={() => { (window as any).__mobileKeys = { ...(window as any).__mobileKeys, s: false }; }}
            >
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 20l8-8H4z" />
              </svg>
            </button>
            <div />
          </div>
        </div>
      )}
      
      {/* Mobile look hint */}
      {!loading && isMobile && !showInstructions && (
        <div className="absolute bottom-8 right-4 z-20 bg-gray-900/60 text-white text-xs px-3 py-2 rounded-lg">
          👆 גררו להסתכל
        </div>
      )}

      {/* Desktop controls reminder */}
      {!loading && !isMobile && !showInstructions && (
        <div className="absolute top-4 left-4 z-10 bg-gray-900/70 text-white text-xs px-3 py-2 rounded-lg">
          גררו להסתכל • WASD לתנועה
        </div>
      )}
    </div>
  );
}
