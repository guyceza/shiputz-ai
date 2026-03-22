"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import "./pascal-editor.css";

const PascalEditor = dynamic(
  () => import("@pascal-app/editor").then((mod) => ({ default: mod.Editor })),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
          <p className="text-gray-400">טוען עורך תלת-ממדי...</p>
        </div>
      </div>
    ),
  }
);

type SceneGraph = { nodes: Record<string, unknown>; rootNodeIds: string[] };

// Hard-coded test scene: a simple room (4 walls)
function createTestScene(): SceneGraph {
  const nodes: Record<string, any> = {
    "site_test001": {
      object: "node", id: "site_test001", type: "site", name: "Site",
      parentId: null, visible: true, children: ["building_test001"],
      boundary: [], metadata: {},
    },
    "building_test001": {
      object: "node", id: "building_test001", type: "building", name: "Building",
      parentId: "site_test001", visible: true, children: ["level_test001"],
      metadata: {},
    },
    "level_test001": {
      object: "node", id: "level_test001", type: "level", name: "Level 0",
      parentId: "building_test001", visible: true,
      children: ["wall_test001", "wall_test002", "wall_test003", "wall_test004"],
      elevation: 0, height: 2.8, level: 0, metadata: {},
    },
    "wall_test001": {
      object: "node", id: "wall_test001", type: "wall", name: "Wall 1",
      parentId: "level_test001", visible: true, children: [],
      start: [0, 0], end: [5, 0], thickness: 0.15, height: 2.8,
      frontSide: "unknown", backSide: "unknown", metadata: {},
    },
    "wall_test002": {
      object: "node", id: "wall_test002", type: "wall", name: "Wall 2",
      parentId: "level_test001", visible: true, children: [],
      start: [5, 0], end: [5, 4], thickness: 0.15, height: 2.8,
      frontSide: "unknown", backSide: "unknown", metadata: {},
    },
    "wall_test003": {
      object: "node", id: "wall_test003", type: "wall", name: "Wall 3",
      parentId: "level_test001", visible: true, children: [],
      start: [5, 4], end: [0, 4], thickness: 0.15, height: 2.8,
      frontSide: "unknown", backSide: "unknown", metadata: {},
    },
    "wall_test004": {
      object: "node", id: "wall_test004", type: "wall", name: "Wall 4",
      parentId: "level_test001", visible: true, children: [],
      start: [0, 4], end: [0, 0], thickness: 0.15, height: 2.8,
      frontSide: "unknown", backSide: "unknown", metadata: {},
    },
  };
  return { nodes, rootNodeIds: ["site_test001"] };
}

function UploadScreen({ onScene, onSkip, onLoadProject }: { 
  onScene: (s: SceneGraph, name?: string) => void; 
  onSkip: () => void;
  onLoadProject: (name: string, scene: SceneGraph) => void;
}) {
  const [projects] = useState(() => getSavedProjects());
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (file: File) => {
    setUploading(true);
    setProgress(0);
    setStatusText("מעלה תמונה...");
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev < 30) { setStatusText("מעלה תמונה..."); return prev + 3; }
        if (prev < 70) { setStatusText("AI מנתח קירות, חדרים, דלתות..."); return prev + 2; }
        if (prev < 90) { setStatusText("בונה מודל תלת-ממדי..."); return prev + 1; }
        return prev;
      });
    }, 300);

    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/floorplan/to-pascal", {
        method: "POST",
        body: formData,
      });
      clearInterval(progressInterval);
      if (!res.ok) throw new Error("Analysis failed");
      setProgress(95);
      setStatusText("טוען לעורך...");
      const data = await res.json();
      setProgress(100);
      onScene(data.sceneGraph);
    } catch (err) {
      clearInterval(progressInterval);
      alert("שגיאה בניתוח התוכנית. נסה שוב.");
      setUploading(false);
      setProgress(0);
    }
  }, [onScene]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-white">
      <div className="max-w-lg w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🏗️ עורך תלת-ממדי</h1>
          <p className="text-gray-500">העלה תוכנית דירה ← AI ינתח ← מודל 3D מוכן לעריכה</p>
        </div>

        {uploading ? (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-10 text-center">
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-emerald-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-gray-500 text-sm mt-2">{progress}%</p>
            </div>
            <p className="text-gray-700 font-medium">{statusText}</p>
          </div>
        ) : (
          <div
            className="border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-2xl p-12 text-center cursor-pointer transition-all hover:bg-emerald-50"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) handleUpload(file);
            }}
          >
            <div className="text-5xl mb-4">📐</div>
            <p className="text-gray-800 font-medium text-lg mb-2">גרור תוכנית לכאן</p>
            <p className="text-gray-400 text-sm">או לחץ לבחירת קובץ</p>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
          }}
        />

        {!uploading && (
          <button
            className="w-full mt-4 py-3 rounded-xl bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition border border-gray-200"
            onClick={onSkip}
          >
            התחל מאפס →
          </button>
        )}

        {projects.length > 0 && !uploading && (
          <div className="mt-6">
            <h3 className="text-gray-500 text-sm mb-2 text-right">פרויקטים שמורים:</h3>
            <div className="space-y-2">
              {projects.map((p) => (
                <button
                  key={p.name}
                  className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 transition"
                  onClick={() => onLoadProject(p.name, p.scene)}
                >
                  <span className="text-gray-400 text-xs">
                    {new Date(p.date).toLocaleDateString('he-IL')}
                  </span>
                  <span className="text-gray-800 font-medium">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function useApplyScene(scene: SceneGraph | null) {
  const applied = useRef(false);
  
  useEffect(() => {
    if (!scene || applied.current) return;
    
    const timer = setTimeout(async () => {
      try {
        const core = await import("@pascal-app/core");
        const useScene = core.useScene;
        const state = useScene.getState();
        
        // Get current default scene's level ID
        const nodes = state.nodes as Record<string, any>;
        const rootId = state.rootNodeIds[0];
        const siteNode = nodes[rootId];
        const buildingId = siteNode?.children?.[0];
        const buildingNode = typeof buildingId === 'string' ? nodes[buildingId] : buildingId;
        const levelId = buildingNode?.children?.[0];
        const actualLevelId = typeof levelId === 'string' ? levelId : levelId?.id;
        
        console.log("Found level:", actualLevelId);
        
        // Delete ALL existing children of the level (walls, doors, windows, items, zones)
        const levelNode = nodes[actualLevelId];
        const childIds = levelNode?.children || [];
        for (const childId of childIds) {
          const cId = typeof childId === 'string' ? childId : (childId as any)?.id;
          if (cId && nodes[cId]) {
            // Also delete grandchildren (doors/windows inside walls)
            const childNode = nodes[cId] as any;
            if (childNode.children) {
              for (const gcId of childNode.children) {
                const gcIdStr = typeof gcId === 'string' ? gcId : gcId?.id;
                if (gcIdStr) state.deleteNode(gcIdStr as any);
              }
            }
            state.deleteNode(cId as any);
          }
        }
        console.log("Cleared all existing elements");
        
        // Create walls first
        const wallNodes = Object.values(scene.nodes).filter((n: any) => n.type === 'wall');
        console.log("Creating", wallNodes.length, "walls");
        
        // Map old wall IDs to new ones (since createNode may change IDs)
        const wallIdMap: Record<string, string> = {};
        
        for (const wall of wallNodes as any[]) {
          const wallNode = {
            ...wall,
            parentId: actualLevelId,
            // Keep children references for doors/windows
            children: wall.children || [],
          };
          state.createNode(wallNode as any, actualLevelId);
          wallIdMap[wall.id] = wall.id;
          console.log(`Created wall: ${wall.name}`);
        }
        
        // Create doors (children of walls)
        const doorNodes = Object.values(scene.nodes).filter((n: any) => n.type === 'door');
        for (const door of doorNodes as any[]) {
          const parentWallId = door.parentId;
          if (parentWallId && wallIdMap[parentWallId]) {
            state.createNode({ ...door } as any, wallIdMap[parentWallId]);
            console.log(`Created door: ${door.name} on ${parentWallId}`);
          }
        }
        
        // Create windows (children of walls)
        const windowNodes = Object.values(scene.nodes).filter((n: any) => n.type === 'window');
        for (const win of windowNodes as any[]) {
          const parentWallId = win.parentId;
          if (parentWallId && wallIdMap[parentWallId]) {
            state.createNode({ ...win } as any, wallIdMap[parentWallId]);
            console.log(`Created window: ${win.name} on ${parentWallId}`);
          }
        }
        
        applied.current = true;
        const totalNodes = Object.keys(useScene.getState().nodes).length;
        console.log(`Done! ${wallNodes.length} walls, ${doorNodes.length} doors, ${windowNodes.length} windows (${totalNodes} total)`);
      } catch (e) {
        console.error("Failed to apply scene:", e);
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [scene]);
}

// Project save/load
function getSavedProjects(): { name: string; date: string; scene: SceneGraph }[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('pascal-projects') || '[]');
  } catch { return []; }
}

function saveProject(name: string, scene: SceneGraph) {
  const projects = getSavedProjects();
  const existing = projects.findIndex(p => p.name === name);
  const entry = { name, date: new Date().toISOString(), scene };
  if (existing >= 0) projects[existing] = entry;
  else projects.push(entry);
  localStorage.setItem('pascal-projects', JSON.stringify(projects));
}

function EditorWithScene({ initialScene, projectName }: { initialScene: SceneGraph | null; projectName: string }) {
  useApplyScene(initialScene);
  const [showSave, setShowSave] = useState(false);
  const [saveName, setSaveName] = useState(projectName);

  // Auto-save current scene periodically
  useEffect(() => {
    if (!projectName) return;
    const interval = setInterval(async () => {
      try {
        const core = await import("@pascal-app/core");
        const state = core.useScene.getState();
        const scene = { nodes: state.nodes as any, rootNodeIds: state.rootNodeIds as any };
        saveProject(projectName, scene);
      } catch {}
    }, 30000); // auto-save every 30s
    return () => clearInterval(interval);
  }, [projectName]);

  const handleSave = async () => {
    try {
      const core = await import("@pascal-app/core");
      const state = core.useScene.getState();
      const scene = { nodes: state.nodes as any, rootNodeIds: state.rootNodeIds as any };
      saveProject(saveName || 'ללא שם', scene);
      setShowSave(false);
      alert(`פרויקט "${saveName}" נשמר!`);
    } catch {}
  };

  return (
    <div className="h-screen w-screen relative">
      <PascalEditor />
      
      {/* Save button */}
      <button
        className="absolute top-4 left-4 z-50 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium transition"
        onClick={() => setShowSave(!showSave)}
      >
        💾 שמור
      </button>
      
      {showSave && (
        <div className="absolute top-14 left-4 z-50 bg-gray-900 border border-gray-700 rounded-xl p-4 shadow-xl w-64">
          <input
            className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 mb-2"
            placeholder="שם הפרויקט..."
            value={saveName}
            onChange={e => setSaveName(e.target.value)}
            dir="rtl"
          />
          <button
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg py-2 text-sm font-medium"
            onClick={handleSave}
          >
            שמור פרויקט
          </button>
        </div>
      )}
    </div>
  );
}

export default function Editor3DPage() {
  const [mode, setMode] = useState<"upload" | "editor">("upload");
  const [scene, setScene] = useState<SceneGraph | null>(null);
  const [projectName, setProjectName] = useState("פרויקט חדש");

  if (mode === "upload") {
    return (
      <UploadScreen
        onScene={(s) => { 
          setScene(s); 
          setProjectName("פרויקט " + new Date().toLocaleDateString('he-IL'));
          setMode("editor"); 
        }}
        onSkip={() => { setScene(null); setMode("editor"); }}
        onLoadProject={(name, s) => {
          setScene(s);
          setProjectName(name);
          setMode("editor");
        }}
      />
    );
  }

  return <EditorWithScene key={projectName} initialScene={scene} projectName={projectName} />;
}
