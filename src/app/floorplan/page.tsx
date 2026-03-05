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

const DEFAULT_ROOMS = [
  { id: "living", name: "סלון", nameEn: "living room", icon: "🛋️" },
  { id: "kitchen", name: "מטבח", nameEn: "kitchen", icon: "🍳" },
  { id: "bedroom", name: "חדר שינה", nameEn: "bedroom", icon: "🛏️" },
  { id: "bathroom", name: "חדר רחצה", nameEn: "bathroom", icon: "🚿" },
  { id: "office", name: "חדר עבודה", nameEn: "home office", icon: "💻" },
  { id: "dining", name: "פינת אוכל", nameEn: "dining room", icon: "🍽️" },
  { id: "entrance", name: "כניסה", nameEn: "entrance hallway", icon: "🚪" },
  { id: "balcony", name: "מרפסת", nameEn: "balcony", icon: "🌅" },
];

type Phase = "upload" | "floorplan" | "rooms" | "furniture";

interface RoomPhoto {
  roomId: string;
  imageData: string;
}

export default function FloorplanPage() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [floorplanResult, setFloorplanResult] = useState<string | null>(null);
  const [roomPhotos, setRoomPhotos] = useState<RoomPhoto[]>([]);
  const [activeRooms, setActiveRooms] = useState<string[]>(["living", "kitchen", "bedroom"]);
  const [loadingRoom, setLoadingRoom] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Furniture swap state
  const [furnitureMode, setFurnitureMode] = useState(false);
  const [selectedRoomForFurniture, setSelectedRoomForFurniture] = useState<string | null>(null);
  const [furnitureImage, setFurnitureImage] = useState<string | null>(null);
  const [furnitureFile, setFurnitureFile] = useState<File | null>(null);
  const [furnitureInstruction, setFurnitureInstruction] = useState("");
  const [furnitureResult, setFurnitureResult] = useState<string | null>(null);
  const [loadingFurniture, setLoadingFurniture] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const furnitureInputRef = useRef<HTMLInputElement>(null);

  const getEmail = () => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u)?.email : null;
    } catch { return null; }
  };

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    setFloorplanResult(null);
    setRoomPhotos([]);
    setError(null);
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
    setRoomPhotos([]);
    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  // Step 1: Generate top-down floorplan
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
        setPhase("rooms");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Generate room photo
  const generateRoomPhoto = async (roomId: string) => {
    if (!floorplanResult) return;
    setLoadingRoom(roomId);
    setError(null);
    try {
      const room = DEFAULT_ROOMS.find(r => r.id === roomId);
      if (!room) return;

      // Convert floorplan data URL to blob
      const resp = await fetch(floorplanResult);
      const blob = await resp.blob();

      const formData = new FormData();
      formData.append("floorplan", blob, "floorplan.png");
      formData.append("room", room.nameEn);
      formData.append("style", selectedStyle || "modern-cabin");
      formData.append("email", getEmail() || "");

      const res = await fetch("/api/floorplan/room", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.image) {
        const img = `data:${data.image.mimeType};base64,${data.image.data}`;
        setRoomPhotos(prev => [...prev.filter(p => p.roomId !== roomId), { roomId, imageData: img }]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingRoom(null);
    }
  };

  // Step 4: Furniture swap
  const swapFurniture = async () => {
    if (!selectedRoomForFurniture || !furnitureFile || !furnitureInstruction) return;
    setLoadingFurniture(true);
    setError(null);
    try {
      const roomPhoto = roomPhotos.find(p => p.roomId === selectedRoomForFurniture);
      if (!roomPhoto) return;

      const roomResp = await fetch(roomPhoto.imageData);
      const roomBlob = await roomResp.blob();

      const formData = new FormData();
      formData.append("roomImage", roomBlob, "room.png");
      formData.append("furnitureImage", furnitureFile);
      formData.append("instruction", furnitureInstruction);
      formData.append("email", getEmail() || "");

      const res = await fetch("/api/floorplan/furniture", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.image) {
        setFurnitureResult(`data:${data.image.mimeType};base64,${data.image.data}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingFurniture(false);
    }
  };

  const toggleRoom = (roomId: string) => {
    setActiveRooms(prev =>
      prev.includes(roomId) ? prev.filter(r => r !== roomId) : [...prev, roomId]
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" dir="rtl">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold">
            <span className="text-green-400">Floor Plan</span> Studio
          </h1>
          <div className="flex items-center gap-3">
            {/* Phase indicators */}
            {["upload", "rooms", "furniture"].map((p, i) => (
              <div key={p} className={`flex items-center gap-1.5 text-xs ${phase === p || (p === "upload" && phase === "upload") ? "text-green-400" : "text-white/30"}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  phase === p ? "bg-green-500 text-black" :
                  (["upload", "rooms", "furniture"].indexOf(phase) > i ? "bg-green-500/30 text-green-400" : "bg-white/10")
                }`}>{i + 1}</div>
                <span className="hidden sm:inline">{p === "upload" ? "תוכנית" : p === "rooms" ? "חדרים" : "ריהוט"}</span>
              </div>
            ))}
            <span className="text-[10px] text-white/20 border border-white/10 rounded px-1.5 py-0.5">BETA</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* === PHASE 1: Upload & Style === */}
        {(phase === "upload" || !floorplanResult) && (
          <>
            {/* Hero */}
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold">
                מתוכנית קומה ל<span className="text-green-400">הדמיית דירה מלאה</span>
              </h2>
              <p className="text-white/50 max-w-lg mx-auto">
                העלו תוכנית → בחרו סגנון → קבלו הדמיה מלמעלה + צילומים ריאליסטיים של כל חדר + החלפת רהיטים בלחיצה
              </p>
            </div>

            {/* Upload */}
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
                  <p className="text-xs text-white/40">PNG, JPG, WEBP</p>
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

            {/* Room selector */}
            <div>
              <h3 className="text-sm font-semibold text-white/70 mb-2">אילו חדרים יש בדירה?</h3>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_ROOMS.map(room => (
                  <button
                    key={room.id}
                    onClick={() => toggleRoom(room.id)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all border ${
                      activeRooms.includes(room.id)
                        ? "bg-green-500/20 border-green-500/50 text-green-400"
                        : "bg-white/5 border-white/10 text-white/40 hover:border-white/30"
                    }`}
                  >
                    {room.icon} {room.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
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
                  שלב 1 — יוצר הדמיה מלמעלה...
                </span>
              ) : "🚀 התחל תהליך הדמיה"}
            </button>
          </>
        )}

        {/* === PHASE 2: Rooms === */}
        {phase === "rooms" && floorplanResult && (
          <>
            {/* Top-down result */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="text-green-400">שלב 1 ✓</span> הדמיה מלמעלה
                </h2>
                <button onClick={() => { setPhase("upload"); setFloorplanResult(null); }} className="text-xs text-white/40 hover:text-white/60">
                  ← חזרה
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl overflow-hidden border border-white/10">
                  <img src={uploadedImage!} alt="Original" className="w-full" />
                  <div className="text-center text-xs text-white/40 py-1 bg-white/5">תוכנית מקורית</div>
                </div>
                <div className="rounded-xl overflow-hidden border border-green-500/30">
                  <img src={floorplanResult} alt="Rendering" className="w-full" />
                  <div className="text-center text-xs text-green-400 py-1 bg-green-500/5">
                    הדמיה — {STYLES.find(s => s.key === selectedStyle)?.nameHe}
                  </div>
                </div>
              </div>
            </div>

            {/* Room photos */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold">
                <span className="text-green-400">שלב 2</span> — צילומים ריאליסטיים לכל חדר
              </h2>
              <p className="text-white/50 text-sm">לחץ על חדר כדי ליצור צילום פנים ריאליסטי ממנו</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {activeRooms.map(roomId => {
                  const room = DEFAULT_ROOMS.find(r => r.id === roomId)!;
                  const photo = roomPhotos.find(p => p.roomId === roomId);
                  const isLoading = loadingRoom === roomId;

                  return (
                    <div key={roomId} className="space-y-2">
                      <button
                        onClick={() => !photo && !isLoading && generateRoomPhoto(roomId)}
                        disabled={isLoading}
                        className={`w-full aspect-[4/3] rounded-xl border-2 transition-all overflow-hidden ${
                          photo ? "border-green-500/30" :
                          isLoading ? "border-yellow-500/30 animate-pulse" :
                          "border-white/20 hover:border-green-500/50 cursor-pointer"
                        }`}
                      >
                        {photo ? (
                          <img src={photo.imageData} alt={room.name} className="w-full h-full object-cover" />
                        ) : isLoading ? (
                          <div className="flex flex-col items-center justify-center h-full bg-yellow-500/5">
                            <svg className="animate-spin h-8 w-8 text-yellow-500 mb-2" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <span className="text-yellow-500 text-xs">יוצר...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full bg-white/5 hover:bg-white/10">
                            <span className="text-3xl mb-1">{room.icon}</span>
                            <span className="text-white/50 text-xs">לחץ ליצירה</span>
                          </div>
                        )}
                      </button>
                      <div className="text-center text-sm">
                        <span className={photo ? "text-green-400" : "text-white/60"}>{room.icon} {room.name}</span>
                        {photo && (
                          <a href={photo.imageData} download={`${roomId}.png`} className="text-white/30 text-xs mr-2 hover:text-white/60">📥</a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Generate all rooms button */}
              {roomPhotos.length < activeRooms.length && (
                <button
                  onClick={async () => {
                    for (const roomId of activeRooms) {
                      if (!roomPhotos.find(p => p.roomId === roomId)) {
                        await generateRoomPhoto(roomId);
                      }
                    }
                  }}
                  disabled={!!loadingRoom}
                  className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  📸 צור צילומים לכל החדרים ({activeRooms.length - roomPhotos.length} נותרו)
                </button>
              )}
            </div>

            {/* Furniture swap section */}
            {roomPhotos.length > 0 && (
              <div className="space-y-4 border-t border-white/10 pt-8">
                <h2 className="text-lg font-bold">
                  <span className="text-green-400">שלב 3</span> — החלפת רהיטים
                </h2>
                <p className="text-white/50 text-sm">
                  בחר חדר, העלה תמונת רהיט חדש, וה-AI יחליף אותו בצילום
                </p>

                {/* Room selector for furniture */}
                <div className="flex flex-wrap gap-2">
                  {roomPhotos.map(({ roomId }) => {
                    const room = DEFAULT_ROOMS.find(r => r.id === roomId)!;
                    return (
                      <button
                        key={roomId}
                        onClick={() => { setSelectedRoomForFurniture(roomId); setFurnitureResult(null); }}
                        className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                          selectedRoomForFurniture === roomId
                            ? "bg-green-500/20 border-green-500/50 text-green-400"
                            : "bg-white/5 border-white/10 text-white/60 hover:border-white/30"
                        }`}
                      >
                        {room.icon} {room.name}
                      </button>
                    );
                  })}
                </div>

                {selectedRoomForFurniture && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Current room */}
                    <div className="space-y-2">
                      <p className="text-sm text-white/50">החדר הנוכחי</p>
                      <div className="rounded-xl overflow-hidden border border-white/10">
                        <img src={roomPhotos.find(p => p.roomId === selectedRoomForFurniture)?.imageData} alt="Room" className="w-full" />
                      </div>
                    </div>

                    {/* Furniture upload */}
                    <div className="space-y-3">
                      <p className="text-sm text-white/50">רהיט חדש</p>
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
                            setFurnitureResult(null);
                            const reader = new FileReader();
                            reader.onload = (ev) => setFurnitureImage(ev.target?.result as string);
                            reader.readAsDataURL(f);
                          }}
                        />
                        {furnitureImage ? (
                          <img src={furnitureImage} alt="Furniture" className="max-h-32 mx-auto rounded" />
                        ) : (
                          <div className="py-4">
                            <div className="text-2xl mb-1">🪑</div>
                            <p className="text-white/50 text-sm">העלה תמונת רהיט</p>
                          </div>
                        )}
                      </div>

                      <input
                        type="text"
                        value={furnitureInstruction}
                        onChange={(e) => setFurnitureInstruction(e.target.value)}
                        placeholder="מה להחליף? (למשל: החלף את הספה)"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm placeholder:text-white/30 focus:border-green-500/50 focus:outline-none"
                      />

                      <button
                        onClick={swapFurniture}
                        disabled={!furnitureFile || !furnitureInstruction || loadingFurniture}
                        className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all ${
                          !furnitureFile || !furnitureInstruction || loadingFurniture
                            ? "bg-white/10 text-white/30"
                            : "bg-green-500 hover:bg-green-400 text-black"
                        }`}
                      >
                        {loadingFurniture ? "מחליף רהיט..." : "🔄 החלף רהיט"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Furniture result */}
                {furnitureResult && (
                  <div className="space-y-2">
                    <p className="text-sm text-green-400 font-medium">תוצאה — אחרי החלפת רהיט</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl overflow-hidden border border-white/10">
                        <img src={roomPhotos.find(p => p.roomId === selectedRoomForFurniture)?.imageData} alt="Before" className="w-full" />
                        <div className="text-center text-xs text-white/40 py-1 bg-white/5">לפני</div>
                      </div>
                      <div className="rounded-xl overflow-hidden border border-green-500/30">
                        <img src={furnitureResult} alt="After" className="w-full" />
                        <div className="text-center text-xs text-green-400 py-1 bg-green-500/5">אחרי</div>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <a href={furnitureResult} download="furniture-swap.png" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm">📥 הורד</a>
                    </div>
                  </div>
                )}
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

        {/* About */}
        {phase === "upload" && (
          <div className="border-t border-white/10 pt-8">
            <div className="bg-white/5 rounded-2xl p-6 space-y-3">
              <h3 className="text-lg font-bold text-green-400">איך זה עובד?</h3>
              <div className="text-white/60 text-sm space-y-2">
                <p><strong className="text-white/80">שלב 1 — הדמיה מלמעלה:</strong> ה-AI מנתח את תוכנית הקומה ויוצר הדמיה פוטוריאליסטית (מבט ציפור) שמשמרת ממדים, קירות, חלונות ורהיטים בדיוק.</p>
                <p><strong className="text-white/80">שלב 2 — צילומי חדרים:</strong> לוחצים על כל חדר ומקבלים צילום פנים ריאליסטי ברמת אדריכלות — כאילו צלם מקצועי צילם את הדירה.</p>
                <p><strong className="text-white/80">שלב 3 — החלפת רהיטים:</strong> מעלים תמונת רהיט חדש וה-AI מחליף אותו בצילום — רואים בדיוק איך הספה/שולחן/מיטה ייראו בחלל.</p>
                <p className="text-white/40 text-xs">תהליך שהיה עולה $100K וחודשים — עכשיו תוך דקות.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
