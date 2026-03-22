"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Text, Html } from "@react-three/drei";
import { useCallback, useRef, useMemo } from "react";
import * as THREE from "three";

interface Wall {
  start: [number, number];
  end: [number, number];
  thickness: number;
}

interface Room {
  name: string;
  polygon: [number, number][];
  type: string;
}

interface Door {
  position: [number, number];
  width: number;
  rotation?: number;
}

interface Window_ {
  position: [number, number];
  width: number;
}

export interface FloorplanData {
  walls: Wall[];
  rooms: Room[];
  doors: Door[];
  windows: Window_[];
  dimensions: { width: number; height: number };
}

interface FloorplanViewerProps {
  data: FloorplanData;
  selectedRoom: string | null;
  onSelectRoom: (name: string | null) => void;
  onScreenshot?: (dataUrl: string) => void;
}

const ROOM_COLORS: Record<string, string> = {
  bedroom: "#8b9dc3",
  bathroom: "#7ec8e3",
  kitchen: "#f4a460",
  living: "#98d98e",
  hallway: "#d3d3d3",
  balcony: "#c5e1a5",
  storage: "#bcaaa4",
  laundry: "#b0bec5",
  entrance: "#ffe082",
};

const WALL_HEIGHT = 2.7;
const WALL_COLOR = "#f5f0e8";
const SELECTED_COLOR = "#ffd700";

function WallMesh({ wall }: { wall: Wall }) {
  const [sx, sy] = wall.start;
  const [ex, ey] = wall.end;
  const thickness = wall.thickness || 0.15;

  const dx = ex - sx;
  const dy = ey - sy;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  const cx = (sx + ex) / 2;
  const cy = (sy + ey) / 2;

  return (
    <mesh
      position={[cx, WALL_HEIGHT / 2, cy]}
      rotation={[0, -angle, 0]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[length, WALL_HEIGHT, thickness]} />
      <meshStandardMaterial color={WALL_COLOR} />
    </mesh>
  );
}

function RoomFloor({
  room,
  isSelected,
  onClick,
}: {
  room: Room;
  isSelected: boolean;
  onClick: () => void;
}) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    if (room.polygon.length < 3) return s;
    s.moveTo(room.polygon[0][0], room.polygon[0][1]);
    for (let i = 1; i < room.polygon.length; i++) {
      s.lineTo(room.polygon[i][0], room.polygon[i][1]);
    }
    s.closePath();
    return s;
  }, [room.polygon]);

  const baseColor = ROOM_COLORS[room.type] || "#e0e0e0";
  const color = isSelected ? SELECTED_COLOR : baseColor;

  // Calculate center for label
  const center = useMemo(() => {
    if (room.polygon.length === 0) return [0, 0] as [number, number];
    const cx =
      room.polygon.reduce((s, p) => s + p[0], 0) / room.polygon.length;
    const cy =
      room.polygon.reduce((s, p) => s + p[1], 0) / room.polygon.length;
    return [cx, cy] as [number, number];
  }, [room.polygon]);

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        receiveShadow
      >
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={isSelected ? 0.8 : 0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Room label */}
      <Html
        position={[center[0], 0.1, center[1]]}
        center
        distanceFactor={15}
        style={{ pointerEvents: "none" }}
      >
        <div
          className="bg-black/70 text-white px-2 py-1 rounded text-xs whitespace-nowrap font-medium"
          dir="rtl"
        >
          {room.name}
        </div>
      </Html>
    </group>
  );
}

function DoorMesh({ door }: { door: Door }) {
  const [x, y] = door.position;
  const width = door.width || 0.9;

  return (
    <mesh position={[x, 1.0, y]} rotation={[0, door.rotation || 0, 0]}>
      <boxGeometry args={[width, 2.0, 0.08]} />
      <meshStandardMaterial color="#8B4513" transparent opacity={0.7} />
    </mesh>
  );
}

function WindowMesh({ window: win }: { window: Window_ }) {
  const [x, y] = win.position;
  const width = win.width || 1.2;

  return (
    <mesh position={[x, 1.5, y]}>
      <boxGeometry args={[width, 1.0, 0.08]} />
      <meshStandardMaterial
        color="#87CEEB"
        transparent
        opacity={0.4}
      />
    </mesh>
  );
}

function ScreenshotHelper({
  onScreenshot,
}: {
  onScreenshot?: (dataUrl: string) => void;
}) {
  const { gl, scene, camera } = useThree();

  // Expose screenshot function globally
  if (onScreenshot && typeof window !== "undefined") {
    (window as unknown as Record<string, unknown>).__takeFloorplanScreenshot = () => {
      gl.render(scene, camera);
      const dataUrl = gl.domElement.toDataURL("image/png");
      onScreenshot(dataUrl);
      return dataUrl;
    };
  }

  return null;
}

function Scene({
  data,
  selectedRoom,
  onSelectRoom,
  onScreenshot,
}: FloorplanViewerProps) {
  const { width, height } = data.dimensions;
  const centerX = width / 2;
  const centerZ = height / 2;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[centerX + 10, 15, centerZ + 10]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight
        position={[centerX - 5, 10, centerZ - 5]}
        intensity={0.3}
      />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, -0.01, centerZ]} receiveShadow>
        <planeGeometry args={[width + 4, height + 4]} />
        <meshStandardMaterial color="#f0ece3" />
      </mesh>

      {/* Room floors */}
      {data.rooms.map((room, i) => (
        <RoomFloor
          key={`room-${i}`}
          room={room}
          isSelected={selectedRoom === room.name}
          onClick={() =>
            onSelectRoom(selectedRoom === room.name ? null : room.name)
          }
        />
      ))}

      {/* Walls */}
      {data.walls.map((wall, i) => (
        <WallMesh key={`wall-${i}`} wall={wall} />
      ))}

      {/* Doors */}
      {data.doors?.map((door, i) => (
        <DoorMesh key={`door-${i}`} door={door} />
      ))}

      {/* Windows */}
      {data.windows?.map((win, i) => (
        <WindowMesh key={`win-${i}`} window={win} />
      ))}

      {/* Controls */}
      <OrbitControls
        target={[centerX, 1, centerZ]}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={3}
        maxDistance={30}
      />

      {/* Screenshot helper */}
      <ScreenshotHelper onScreenshot={onScreenshot} />
    </>
  );
}

export default function FloorplanViewer(props: FloorplanViewerProps) {
  return (
    <div className="w-full h-full min-h-[400px] rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
      <Canvas
        shadows
        camera={{
          position: [
            props.data.dimensions.width / 2 + 8,
            12,
            props.data.dimensions.height / 2 + 8,
          ],
          fov: 50,
        }}
        gl={{ preserveDrawingBuffer: true }}
      >
        <Scene {...props} />
      </Canvas>
    </div>
  );
}
