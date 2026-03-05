"use client";

import { useState, useRef, useCallback } from "react";

const STYLES = [
  { key: "modern-cabin", nameHe: "בקתה מודרנית", desc: "עץ חם, קורות חשופות, חלונות גדולים", color: "from-amber-800 to-amber-600", emoji: "🏡" },
  { key: "scandinavian", nameHe: "סקנדינבי", desc: "מינימליזם, לבן ואלון בהיר", color: "from-gray-200 to-gray-100", textDark: true, emoji: "🌿" },
  { key: "industrial", nameHe: "אינדוסטריאלי", desc: "לבנים חשופות, מתכת, בטון", color: "from-zinc-800 to-zinc-600", emoji: "🏭" },
  { key: "mediterranean", nameHe: "ים-תיכוני", desc: "טרקוטה, קשתות, קירות לבנים", color: "from-orange-700 to-yellow-600", emoji: "☀️" },
  { key: "japandi", nameHe: "ג׳פנדי", desc: "יפני-סקנדינבי, במבוק ועץ", color: "from-stone-700 to-stone-500", emoji: "🎋" },
  { key: "luxury-modern", nameHe: "יוקרה מודרנית", desc: "שיש, זהב, ריהוט מעצבים", color: "from-yellow-700 to-yellow-500", emoji: "✨" },
  { key: "boho", nameHe: "בוהמייני", desc: "טקסטילים, שטיחים, ראטאן", color: "from-rose-700 to-orange-500", emoji: "🌺" },
  { key: "classic", nameHe: "קלאסי אלגנטי", desc: "עיטורים, פרקט, נברשות", color: "from-indigo-900 to-indigo-700", emoji: "👑" },
];

type Phase = "upload" | "floorplan" | "room-view" | "furniture-select" | "furniture-result";

interface ClickMarker {
  x: number;
  y: number;
}

interface RoomInfo {
  room: string;
  roomHe: string;
  description: string;
}

interface FurnitureInfo {
  item: string;
  itemHe: string;
  description: string;
  suggestions: string[];
}

interface RoomPhoto {
  roomName: string;
  roomNameHe: string;
  imageData: string;
}

export default function FloorplanPage() {
  // Phase & navigation
  const [phase, setPhase] = useState<Phase>("upload");
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

  // Step 1: Upload
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [floorplanResult, setFloorplanResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Step 2: Room click
  const [floorplanClick, setFloorplanClick] = useState<ClickMarker | null>(null);
  const [detectedRoom, setDetectedRoom] = useState<RoomInfo | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(false);
  const [currentRoomPhoto, setCurrentRoomPhoto] = useState<RoomPhoto | null>(null);
  const [allRoomPhotos, setAllRoomPhotos] = useState<RoomPhoto[]>([]);

  // Step 3: Furniture click
  const [roomClick, setRoomClick] = useState<ClickMarker | null>(null);
  const [detectedFurniture, setDetectedFurniture] = useState<FurnitureInfo | null>(null);
  const [loadingFurniture, setLoadingFurniture] = useState(false);
  const [furnitureImage, setFurnitureImage] = useState<string | null>(null);
  const [furnitureFile, setFurnitureFile] = useState<File | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [furnitureResult, setFurnitureResult] = useState<string | null>(null);
  const [swapping, setSwapping] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const furnitureInputRef = useRef<HTMLInputElement>(null);
  const floorplanImgRef = useRef<HTMLImageElement>(null);
  const roomImgRef = useRef<HTMLImageElement>(null);

  const getEmail = () => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u)?.email : null;
    } catch {
      return null;
    }
  };

  // === File handlers ===
  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    setFloorplanResult(null);
    setError(null);
    setPhase("upload");
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setUploadedFile(file);
    setFloorplanResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  // === Step 1: Generate floor plan ===
  const generateFloorplan = async () => {
    if (!uploadedFile || !selectedStyle) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", uploadedFile);
      formData.append("style", selectedStyle);
      formData.append("email", getEmail() || "");
      const res = await fetch("/api/floorplan", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.image) {
        setFloorplanResult(`data:${data.image.mimeType};base64,${data.image.data}`);
        setPhase("floorplan");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // === Step 2: Click on floor plan → detect room → generate room photo ===
  const handleFloorplanClick = async (e: React.MouseEvent<HTMLImageElement>) => {
    if (loadingRoom) return;
    const img = floorplanImgRef.current;
    if (!img) return;

    const rect = img.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setFloorplanClick({ x, y });
    setDetectedRoom(null);
    setLoadingRoom(true);
    setError(null);

    try {
      // 1. Detect which room was clicked
      const blob = await (await fetch(floorplanResult!)).blob();
      const fd1 = new FormData();
      fd1.append("image", blob, "floorplan.png");
      fd1.append("clickX", x.toFixed(1));
      fd1.append("clickY", y.toFixed(1));
      fd1.append("email", getEmail() || "");

      const detectRes = await fetch("/api/floorplan/detect-room", { method: "POST", body: fd1 });
      const roomInfo = await detectRes.json();
      if (!detectRes.ok) throw new Error(roomInfo.error);
      setDetectedRoom(roomInfo);

      // 2. Generate room photo
      const fd2 = new FormData();
      fd2.append("floorplan", blob, "floorplan.png");
      fd2.append("room", roomInfo.room);
      fd2.append("style", selectedStyle || "modern-cabin");
      fd2.append("email", getEmail() || "");

      const roomRes = await fetch("/api/floorplan/room", { method: "POST", body: fd2 });
      const roomData = await roomRes.json();
      if (!roomRes.ok) throw new Error(roomData.error);

      if (roomData.image) {
        const photo: RoomPhoto = {
          roomName: roomInfo.room,
          roomNameHe: roomInfo.roomHe,
          imageData: `data:${roomData.image.mimeType};base64,${roomData.image.data}`,
        };
        setCurrentRoomPhoto(photo);
        setAllRoomPhotos((prev) => [...prev, photo]);
        setPhase("room-view");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingRoom(false);
    }
  };

  // === Step 3: Click on furniture in room photo ===
  const handleRoomClick = async (e: React.MouseEvent<HTMLImageElement>) => {
    if (loadingFurniture) return;
    const img = roomImgRef.current;
    if (!img || !currentRoomPhoto) return;

    const rect = img.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setRoomClick({ x, y });
    setDetectedFurniture(null);
    setSelectedSuggestion(null);
    setFurnitureImage(null);
    setFurnitureFile(null);
    setFurnitureResult(null);
    setLoadingFurniture(true);
    setError(null);

    try {
      const blob = await (await fetch(currentRoomPhoto.imageData)).blob();
      const fd = new FormData();
      fd.append("image", blob, "room.png");
      fd.append("clickX", x.toFixed(1));
      fd.append("clickY", y.toFixed(1));
      fd.append("email", getEmail() || "");

      const res = await fetch("/api/floorplan/detect-furniture", { method: "POST", body: fd });
      const info = await res.json();
      if (!res.ok) throw new Error(info.error);
      setDetectedFurniture(info);
      setPhase("furniture-select");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingFurniture(false);
    }
  };

  // === Step 3b: Swap furniture ===
  const doSwap = async () => {
    if (!currentRoomPhoto || (!selectedSuggestion && !furnitureFile) || !detectedFurniture) return;
    setSwapping(true);
    setError(null);

    try {
      const roomBlob = await (await fetch(currentRoomPhoto.imageData)).blob();
      const instruction = selectedSuggestion
        ? `Replace the ${detectedFurniture.item} with: ${selectedSuggestion}. Keep everything else exactly the same.`
        : `Replace the ${detectedFurniture.item} with the furniture shown in the second image. Keep everything else exactly the same.`;

      if (selectedSuggestion && !furnitureFile) {
        // Text-only swap (no furniture image) — use room endpoint with modified prompt
        const fd = new FormData();
        fd.append("roomImage", roomBlob, "room.png");
        // Create a dummy 1x1 transparent PNG for the furniture slot
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        const dummyBlob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), "image/png")
        );
        fd.append("furnitureImage", dummyBlob, "placeholder.png");
        fd.append("instruction", instruction);
        fd.append("email", getEmail() || "");

        const res = await fetch("/api/floorplan/furniture", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (data.image) {
          setFurnitureResult(`data:${data.image.mimeType};base64,${data.image.data}`);
          setPhase("furniture-result");
        }
      } else if (furnitureFile) {
        const fd = new FormData();
        fd.append("roomImage", roomBlob, "room.png");
        fd.append("furnitureImage", furnitureFile);
        fd.append("instruction", instruction);
        fd.append("email", getEmail() || "");

        const res = await fetch("/api/floorplan/furniture", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (data.image) {
          setFurnitureResult(`data:${data.image.mimeType};base64,${data.image.data}`);
          setPhase("furniture-result");
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSwapping(false);
    }
  };

  // === Breadcrumb ===
  const Breadcrumb = () => (
    <div className="flex items-center gap-2 text-xs text-white/40 mb-4 flex-wrap">
      <button onClick={() => setPhase("upload")} className="hover:text-white/70">📐 תוכנית</button>
      {floorplanResult && (
        <>
          <span>←</span>
          <button onClick={() => { setPhase("floorplan"); setCurrentRoomPhoto(null); }} className="hover:text-white/70">🏠 הדמיה מלמעלה</button>
        </>
      )}
      {currentRoomPhoto && (phase === "room-view" || phase === "furniture-select" || phase === "furniture-result") && (
        <>
          <span>←</span>
          <button onClick={() => { setPhase("room-view"); setDetectedFurniture(null); setFurnitureResult(null); }} className="hover:text-white/70">
            🚪 {currentRoomPhoto.roomNameHe}
          </button>
        </>
      )}
      {detectedFurniture && (phase === "furniture-select" || phase === "furniture-result") && (
        <>
          <span>←</span>
          <span className="text-green-400">{detectedFurniture.itemHe}</span>
        </>
      )}
    </div>
  );

  // === Click marker component ===
  const ClickPin = ({ marker }: { marker: ClickMarker }) => (
    <div
      className="absolute pointer-events-none z-10"
      style={{ left: `${marker.x}%`, top: `${marker.y}%`, transform: "translate(-50%, -100%)" }}
    >
      <div className="flex flex-col items-center">
        <div className="w-6 h-6 bg-green-400 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>
        <div className="w-0.5 h-2 bg-green-400" />
      </div>
    </div>
  );

  // === Render ===
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" dir="rtl">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold">
            <span className="text-green-400">Floor Plan</span> Studio
          </h1>
          <span className="text-[10px] text-white/20 border border-white/10 rounded px-1.5 py-0.5">BETA</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {phase !== "upload" && <Breadcrumb />}

        {/* === PHASE: Upload === */}
        {phase === "upload" && (
          <>
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold">
                מתוכנית קומה ל<span className="text-green-400">דירה מעוצבת</span>
              </h2>
              <p className="text-white/50 max-w-lg mx-auto">
                העלו תוכנית → לחצו על חדר בהדמיה → קבלו צילום ריאליסטי → לחצו על רהיט להחלפה
              </p>
              <div className="flex justify-center gap-6 text-sm text-white/40">
                <span>📐 → 🏠 הדמיה</span>
                <span>👆 → 🚪 חדר</span>
                <span>👆 → 🪑 רהיט</span>
              </div>
            </div>

            {/* Upload area */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                uploadedImage ? "border-green-500/50 bg-green-500/5" : "border-white/20 hover:border-white/40 bg-white/5"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
              {uploadedImage ? (
                <div className="space-y-3">
                  <img src={uploadedImage} alt="Floor plan" className="max-h-64 mx-auto rounded-lg" />
                  <p className="text-sm text-white/50">לחץ להחלפה</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-5xl">📐</div>
                  <p className="text-white/70 text-lg">גרור תוכנית קומה או לחץ לבחירה</p>
                </div>
              )}
            </div>

            {/* Style picker */}
            <div>
              <h3 className="text-sm font-semibold text-white/70 mb-2">סגנון עיצוב</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setSelectedStyle(s.key)}
                    className={`rounded-lg p-3 text-right transition-all border-2 ${
                      selectedStyle === s.key ? "border-green-400 ring-1 ring-green-400/30" : "border-transparent hover:border-white/20"
                    } bg-gradient-to-br ${s.color}`}
                  >
                    <span className="text-xl">{s.emoji}</span>
                    <div className={`font-bold text-xs mt-1 ${s.textDark ? "text-gray-800" : "text-white"}`}>{s.nameHe}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generateFloorplan}
              disabled={!uploadedFile || !selectedStyle || loading}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                !uploadedFile || !selectedStyle || loading
                  ? "bg-white/10 text-white/30 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-lg shadow-green-500/20"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  יוצר הדמיה מלמעלה...
                </span>
              ) : (
                "🚀 התחל"
              )}
            </button>

            {/* About */}
            <div className="bg-white/5 rounded-2xl p-6 space-y-3">
              <h3 className="text-lg font-bold text-green-400">איך זה עובד?</h3>
              <div className="text-white/60 text-sm space-y-2">
                <p><strong className="text-white/80">שלב 1:</strong> העלו תוכנית קומה → בחרו סגנון → קבלו הדמיה מלמעלה (מבט ציפור)</p>
                <p><strong className="text-white/80">שלב 2:</strong> לחצו על כל חדר בהדמיה → ה-AI מזהה את החדר ויוצר צילום פנים ריאליסטי</p>
                <p><strong className="text-white/80">שלב 3:</strong> לחצו על רהיט בצילום → ה-AI מזהה אותו ומציע חלופות → בחרו או העלו רהיט חדש</p>
                <p className="text-white/40 text-xs">מושלם לאדריכלים, מעצבי פנים וקבלנים.</p>
              </div>
            </div>
          </>
        )}

        {/* === PHASE: Floor plan result — click on rooms === */}
        {phase === "floorplan" && floorplanResult && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">
                  הדמיה מלמעלה — <span className="text-green-400">לחץ על חדר</span>
                </h2>
              </div>
              <p className="text-white/40 text-sm">
                לחצו על אזור בהדמיה כדי ליצור צילום פנים ריאליסטי של החדר
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl overflow-hidden border border-white/10">
                <img src={uploadedImage!} alt="Original" className="w-full" />
                <div className="text-center text-xs text-white/40 py-1 bg-white/5">תוכנית מקורית</div>
              </div>

              <div className="rounded-xl overflow-hidden border border-green-500/30 relative">
                <img
                  ref={floorplanImgRef}
                  src={floorplanResult}
                  alt="Rendering"
                  className={`w-full ${loadingRoom ? "opacity-50" : "cursor-crosshair"}`}
                  onClick={handleFloorplanClick}
                />
                {floorplanClick && <ClickPin marker={floorplanClick} />}
                {loadingRoom && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="bg-black/80 rounded-xl px-6 py-4 text-center">
                      <svg className="animate-spin h-8 w-8 text-green-400 mx-auto mb-2" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <p className="text-sm text-white/70">
                        {detectedRoom ? `יוצר צילום של ה${detectedRoom.roomHe}...` : "מזהה חדר..."}
                      </p>
                    </div>
                  </div>
                )}
                <div className="text-center text-xs text-green-400 py-1 bg-green-500/5">
                  {STYLES.find((s) => s.key === selectedStyle)?.nameHe} — לחץ על חדר 👆
                </div>
              </div>
            </div>

            {/* Previously generated room thumbnails */}
            {allRoomPhotos.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white/50">חדרים שכבר נוצרו</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                  {allRoomPhotos.map((photo, i) => (
                    <button
                      key={i}
                      onClick={() => { setCurrentRoomPhoto(photo); setPhase("room-view"); }}
                      className="rounded-lg overflow-hidden border border-white/10 hover:border-green-500/50 transition-colors"
                    >
                      <img src={photo.imageData} alt={photo.roomNameHe} className="w-full aspect-[4/3] object-cover" />
                      <div className="text-center text-[10px] text-white/50 py-0.5 bg-white/5">{photo.roomNameHe}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* === PHASE: Room view — click on furniture === */}
        {(phase === "room-view" || phase === "furniture-select" || phase === "furniture-result") && currentRoomPhoto && (
          <>
            <div className="space-y-2">
              <h2 className="text-lg font-bold">
                {currentRoomPhoto.roomNameHe} — {phase === "room-view" && <span className="text-green-400">לחץ על רהיט להחלפה</span>}
                {phase === "furniture-select" && <span className="text-green-400">בחר רהיט חלופי</span>}
                {phase === "furniture-result" && <span className="text-green-400">תוצאה</span>}
              </h2>
              {phase === "room-view" && (
                <p className="text-white/40 text-sm">לחצו על רהיט בצילום כדי לזהות ולהחליף אותו</p>
              )}
            </div>

            {/* Room photo with click */}
            {phase === "room-view" && (
              <div className="rounded-xl overflow-hidden border border-green-500/30 relative max-w-2xl mx-auto">
                <img
                  ref={roomImgRef}
                  src={currentRoomPhoto.imageData}
                  alt={currentRoomPhoto.roomNameHe}
                  className={`w-full ${loadingFurniture ? "opacity-50" : "cursor-crosshair"}`}
                  onClick={handleRoomClick}
                />
                {roomClick && <ClickPin marker={roomClick} />}
                {loadingFurniture && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="bg-black/80 rounded-xl px-6 py-4 text-center">
                      <svg className="animate-spin h-8 w-8 text-green-400 mx-auto mb-2" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <p className="text-sm text-white/70">מזהה רהיט...</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Furniture selection */}
            {phase === "furniture-select" && detectedFurniture && (
              <div className="space-y-4">
                {/* Detected item */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-lg">🪑</div>
                    <div>
                      <div className="font-bold">{detectedFurniture.itemHe}</div>
                      <div className="text-xs text-white/50">{detectedFurniture.description}</div>
                    </div>
                  </div>
                </div>

                {/* AI Suggestions */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-white/70">הצעות AI</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {detectedFurniture.suggestions.map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => { setSelectedSuggestion(sug); setFurnitureImage(null); setFurnitureFile(null); }}
                        className={`text-right rounded-lg p-3 border transition-all text-sm ${
                          selectedSuggestion === sug
                            ? "bg-green-500/15 border-green-500/50 text-green-400"
                            : "bg-white/5 border-white/10 text-white/60 hover:border-white/30"
                        }`}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Or upload custom furniture */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-white/70">או — העלאת רהיט ספציפי</h3>
                  <div
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                      furnitureImage ? "border-green-500/50 bg-green-500/5" : "border-white/20 hover:border-white/40"
                    }`}
                    onClick={() => furnitureInputRef.current?.click()}
                  >
                    <input
                      ref={furnitureInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setFurnitureFile(f);
                        setSelectedSuggestion(null);
                        const reader = new FileReader();
                        reader.onload = (ev) => setFurnitureImage(ev.target?.result as string);
                        reader.readAsDataURL(f);
                      }}
                    />
                    {furnitureImage ? (
                      <img src={furnitureImage} alt="Furniture" className="max-h-28 mx-auto rounded" />
                    ) : (
                      <p className="text-white/40 text-sm py-2">📷 העלה תמונת רהיט</p>
                    )}
                  </div>
                </div>

                {/* Swap button */}
                <button
                  onClick={doSwap}
                  disabled={(!selectedSuggestion && !furnitureFile) || swapping}
                  className={`w-full py-3 rounded-xl font-bold transition-all ${
                    (!selectedSuggestion && !furnitureFile) || swapping
                      ? "bg-white/10 text-white/30"
                      : "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/20"
                  }`}
                >
                  {swapping ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      מחליף {detectedFurniture.itemHe}...
                    </span>
                  ) : (
                    `🔄 החלף ${detectedFurniture.itemHe}`
                  )}
                </button>
              </div>
            )}

            {/* Furniture result — before/after */}
            {phase === "furniture-result" && furnitureResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl overflow-hidden border border-white/10">
                    <img src={currentRoomPhoto.imageData} alt="Before" className="w-full" />
                    <div className="text-center text-xs text-white/40 py-1 bg-white/5">לפני</div>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-green-500/30">
                    <img src={furnitureResult} alt="After" className="w-full" />
                    <div className="text-center text-xs text-green-400 py-1 bg-green-500/5">אחרי</div>
                  </div>
                </div>
                <div className="flex justify-center gap-3">
                  <a href={furnitureResult} download="furniture-swap.png" className="px-5 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-sm text-green-400">
                    📥 הורד
                  </a>
                  <button
                    onClick={() => { setPhase("room-view"); setFurnitureResult(null); setDetectedFurniture(null); setRoomClick(null); }}
                    className="px-5 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
                  >
                    🪑 החלף רהיט נוסף
                  </button>
                  <button
                    onClick={() => { setPhase("floorplan"); setCurrentRoomPhoto(null); }}
                    className="px-5 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
                  >
                    🏠 חזרה להדמיה
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-center text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
