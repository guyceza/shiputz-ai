"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";

interface Room3DViewerProps {
  modelUrl: string;
  roomWidth?: number;
  roomLength?: number;
  houseWidth?: number;
  houseLength?: number;
  startPosition?: { x: number; y: number; z: number };
  startRotation?: number; // Y rotation in radians
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
  // Use house dimensions if provided, otherwise room dimensions
  const boundaryWidth = houseWidth || roomWidth;
  const boundaryLength = houseLength || roomLength;
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fullscreen toggle function
  const toggleFullscreen = async () => {
    if (!wrapperRef.current) return;
    
    try {
      if (!document.fullscreenElement) {
        await wrapperRef.current.requestFullscreen();
        setIsFullscreen(true);
        // Lock screen orientation to landscape on mobile
        if (screen.orientation && 'lock' in screen.orientation) {
          try {
            await (screen.orientation as any).lock('landscape');
          } catch (e) {
            // Orientation lock not supported, ignore
          }
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

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    // Check if mobile
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    setIsMobile(mobile);

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    // Start position - use custom or default to center of largest room
    if (startPosition) {
      camera.position.set(startPosition.x, startPosition.y, startPosition.z);
    } else {
      // Default: start in the living room area (first room, usually largest)
      const defaultX = Math.min(3, boundaryWidth / 2);
      const defaultZ = Math.min(3, boundaryLength / 2);
      camera.position.set(defaultX, 1.6, defaultZ);
    }
    // Apply starting rotation if provided
    if (startRotation !== undefined) {
      camera.rotation.y = startRotation;
    }

    // Renderer with high quality settings
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
    // Ambient light for base illumination
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    // Main ceiling light
    const ceilingLight = new THREE.PointLight(0xfff5e6, 1, 10);
    ceilingLight.position.set(roomWidth / 2, 2.7, roomLength / 2);
    ceilingLight.castShadow = true;
    ceilingLight.shadow.mapSize.width = 1024;
    ceilingLight.shadow.mapSize.height = 1024;
    scene.add(ceilingLight);

    // Window light (directional, like sun)
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(roomWidth / 2, 3, -2);
    sunLight.target.position.set(roomWidth / 2, 0, roomLength / 2);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.1;
    sunLight.shadow.camera.far = 20;
    sunLight.shadow.camera.left = -5;
    sunLight.shadow.camera.right = 5;
    sunLight.shadow.camera.top = 5;
    sunLight.shadow.camera.bottom = -5;
    scene.add(sunLight);
    scene.add(sunLight.target);

    // Fill light from back
    const fillLight = new THREE.DirectionalLight(0xfff0e0, 0.3);
    fillLight.position.set(roomWidth / 2, 2, roomLength + 2);
    scene.add(fillLight);

    // Controls
    const controls = new PointerLockControls(camera, renderer.domElement);

    // Movement
    const moveSpeed = 3;
    const velocity = new THREE.Vector3();
    const direction = new THREE.Vector3();
    const keys = { w: false, a: false, s: false, d: false };

    // Touch controls for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    let touchMoveX = 0;
    let touchMoveY = 0;

    // Load GLTF model
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        
        // Enable shadows on all meshes
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        scene.add(model);
        setLoading(false);
        onLoad?.();
      },
      (progress) => {
        console.log("Loading:", (progress.loaded / progress.total) * 100 + "%");
      },
      (error: unknown) => {
        console.error("GLTF load error:", error);
        setLoading(false);
        const errorMessage = error instanceof Error ? error.message : "Failed to load 3D model";
        onError?.(errorMessage);
      }
    );

    // Event handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          keys.w = true;
          break;
        case "KeyA":
        case "ArrowLeft":
          keys.a = true;
          break;
        case "KeyS":
        case "ArrowDown":
          keys.s = true;
          break;
        case "KeyD":
        case "ArrowRight":
          keys.d = true;
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          keys.w = false;
          break;
        case "KeyA":
        case "ArrowLeft":
          keys.a = false;
          break;
        case "KeyS":
        case "ArrowDown":
          keys.s = false;
          break;
        case "KeyD":
        case "ArrowRight":
          keys.d = false;
          break;
      }
    };

    const handleClick = () => {
      if (!mobile) {
        controls.lock();
      }
    };

    const handleLockChange = () => {
      setIsLocked(controls.isLocked);
    };

    // Touch handlers for mobile
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchMoveX = (e.touches[0].clientX - touchStartX) * 0.01;
        touchMoveY = (e.touches[0].clientY - touchStartY) * 0.01;
        
        // Rotate camera based on touch movement
        camera.rotation.y -= touchMoveX;
        camera.rotation.x -= touchMoveY;
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
        
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        // Two finger touch - move forward
        keys.w = true;
      }
    };

    const handleTouchEnd = () => {
      keys.w = false;
      touchMoveX = 0;
      touchMoveY = 0;
    };

    // Add event listeners
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    container.addEventListener("click", handleClick);
    controls.addEventListener("lock", handleLockChange);
    controls.addEventListener("unlock", handleLockChange);

    if (mobile) {
      container.addEventListener("touchstart", handleTouchStart);
      container.addEventListener("touchmove", handleTouchMove);
      container.addEventListener("touchend", handleTouchEnd);
    }

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

      // Movement - merge keyboard keys with mobile virtual buttons
      if (controls.isLocked || mobile) {
        velocity.x -= velocity.x * 10 * delta;
        velocity.z -= velocity.z * 10 * delta;

        // Get mobile virtual button state
        const mobileKeys = (window as any).__mobileKeys || {};
        const w = keys.w || mobileKeys.w;
        const s = keys.s || mobileKeys.s;
        const a = keys.a || mobileKeys.a;
        const d = keys.d || mobileKeys.d;

        direction.z = Number(w) - Number(s);
        direction.x = Number(d) - Number(a);
        direction.normalize();

        if (w || s) velocity.z -= direction.z * moveSpeed * delta;
        if (a || d) velocity.x -= direction.x * moveSpeed * delta;

        controls.moveRight(-velocity.x);
        controls.moveForward(-velocity.z);

        // Keep camera at standing height
        camera.position.y = 1.6;

        // Boundary checking (use house dimensions if available)
        camera.position.x = Math.max(0.3, Math.min(boundaryWidth - 0.3, camera.position.x));
        camera.position.z = Math.max(0.3, Math.min(boundaryLength - 0.3, camera.position.z));
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      container.removeEventListener("click", handleClick);
      controls.removeEventListener("lock", handleLockChange);
      controls.removeEventListener("unlock", handleLockChange);
      window.removeEventListener("resize", handleResize);

      if (mobile) {
        container.removeEventListener("touchstart", handleTouchStart);
        container.removeEventListener("touchmove", handleTouchMove);
        container.removeEventListener("touchend", handleTouchEnd);
      }

      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [modelUrl, roomWidth, roomLength, onLoad, onError]);

  return (
    <div ref={wrapperRef} className="relative w-full h-full bg-black">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Fullscreen button */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-20 bg-gray-900/80 hover:bg-gray-800 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors"
        title={isFullscreen ? "צא ממסך מלא" : "מסך מלא"}
      >
        {isFullscreen ? (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-sm hidden sm:inline">יציאה</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span className="text-sm hidden sm:inline">מסך מלא</span>
          </>
        )}
      </button>
      
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-3">🏠</div>
            <p className="text-white">טוען מודל תלת-ממדי...</p>
          </div>
        </div>
      )}

      {/* Instructions overlay */}
      {!loading && !isLocked && !isMobile && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer">
          <div className="text-center text-white p-6 bg-gray-900/90 rounded-xl max-w-sm">
            <p className="text-2xl mb-4">🏠</p>
            <p className="text-lg font-semibold mb-2">לחצו להתחיל סיור</p>
            <p className="text-sm text-gray-400">
              WASD או חצים לתנועה<br />
              עכבר להסתכל מסביב<br />
              ESC לצאת
            </p>
          </div>
        </div>
      )}

      {/* Mobile controls - virtual joystick */}
      {!loading && isMobile && (
        <div className="absolute bottom-8 left-4 z-20">
          <div className="grid grid-cols-3 gap-1">
            <div />
            <button
              className="w-14 h-14 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center active:bg-white/40 touch-none"
              onTouchStart={() => { (window as any).__mobileKeys = { ...(window as any).__mobileKeys, w: true }; }}
              onTouchEnd={() => { (window as any).__mobileKeys = { ...(window as any).__mobileKeys, w: false }; }}
            >
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4l-8 8h16z" />
              </svg>
            </button>
            <div />
            <button
              className="w-14 h-14 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center active:bg-white/40 touch-none"
              onTouchStart={() => { (window as any).__mobileKeys = { ...(window as any).__mobileKeys, a: true }; }}
              onTouchEnd={() => { (window as any).__mobileKeys = { ...(window as any).__mobileKeys, a: false }; }}
            >
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 12l8-8v16z" />
              </svg>
            </button>
            <div className="w-14 h-14" />
            <button
              className="w-14 h-14 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center active:bg-white/40 touch-none"
              onTouchStart={() => { (window as any).__mobileKeys = { ...(window as any).__mobileKeys, d: true }; }}
              onTouchEnd={() => { (window as any).__mobileKeys = { ...(window as any).__mobileKeys, d: false }; }}
            >
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 12l-8 8V4z" />
              </svg>
            </button>
            <div />
            <button
              className="w-14 h-14 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center active:bg-white/40 touch-none"
              onTouchStart={() => { (window as any).__mobileKeys = { ...(window as any).__mobileKeys, s: true }; }}
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
      {!loading && isMobile && (
        <div className="absolute bottom-8 right-4 z-20 bg-gray-900/60 text-white text-xs px-3 py-2 rounded-lg">
          גררו על המסך<br/>להסתכל מסביב
        </div>
      )}

      {/* Controls reminder when locked */}
      {isLocked && (
        <div className="absolute top-4 left-4 bg-gray-900/70 text-white text-xs px-3 py-2 rounded-lg">
          WASD לתנועה • ESC לצאת
        </div>
      )}
    </div>
  );
}
