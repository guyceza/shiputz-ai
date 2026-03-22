"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";

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

function UploadScreen({ onScene, onSkip }: { onScene: (s: SceneGraph) => void; onSkip: () => void }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/floorplan/to-pascal", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Analysis failed");
      const data = await res.json();
      console.log("Pascal SceneGraph:", JSON.stringify(data.sceneGraph, null, 2));
      onScene(data.sceneGraph);
    } catch (err) {
      alert("שגיאה בניתוח התוכנית. נסה שוב.");
      setUploading(false);
    }
  }, [onScene]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="max-w-lg w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🏗️ עורך תלת-ממדי</h1>
          <p className="text-gray-400">העלה תוכנית דירה ← AI ינתח ← מודל 3D מוכן לעריכה</p>
        </div>

        <div
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
            ${uploading ? "border-emerald-500 bg-emerald-500/10" : "border-gray-600 hover:border-emerald-500 hover:bg-gray-900"}`}
          onClick={() => !uploading && fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) handleUpload(file);
          }}
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
              <p className="text-emerald-400 font-medium">מנתח תוכנית... (10-20 שניות)</p>
            </>
          ) : (
            <>
              <div className="text-5xl mb-4">📐</div>
              <p className="text-white font-medium text-lg mb-2">גרור תוכנית לכאן</p>
              <p className="text-gray-500 text-sm">או לחץ לבחירת קובץ</p>
            </>
          )}
        </div>

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

        <div className="flex gap-2 mt-4">
          <button
            className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition"
            onClick={onSkip}
          >
            התחל מאפס →
          </button>
          <button
            className="flex-1 py-3 rounded-xl bg-emerald-800 text-emerald-300 hover:bg-emerald-700 transition"
            onClick={() => onScene(createTestScene())}
          >
            🧪 טען חדר בדיקה
          </button>
        </div>
      </div>
    </div>
  );
}

function EditorWithScene({ initialScene }: { initialScene: SceneGraph | null }) {
  const sceneRef = useRef(initialScene);

  const onLoad = useCallback(async (): Promise<SceneGraph | null> => {
    console.log("onLoad called, scene:", sceneRef.current ? "YES" : "null");
    if (sceneRef.current) {
      console.log("Returning scene with", Object.keys(sceneRef.current.nodes).length, "nodes");
      console.log("Root IDs:", sceneRef.current.rootNodeIds);
      console.log("Node types:", Object.values(sceneRef.current.nodes).map((n: any) => `${n.id}:${n.type}`));
    }
    return sceneRef.current;
  }, []);

  return (
    <div className="h-screen w-screen">
      <PascalEditor onLoad={onLoad} />
    </div>
  );
}

export default function Editor3DPage() {
  const [mode, setMode] = useState<"upload" | "editor">("upload");
  const [scene, setScene] = useState<SceneGraph | null>(null);

  if (mode === "upload") {
    return (
      <UploadScreen
        onScene={(s) => { setScene(s); setMode("editor"); }}
        onSkip={() => { setScene(null); setMode("editor"); }}
      />
    );
  }

  // Key forces remount when different scene
  return <EditorWithScene key={JSON.stringify(scene?.rootNodeIds)} initialScene={scene} />;
}
