"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import CreditBadge from "@/components/CreditBadge";

function checkCredits(res: Response, data: any) {
  if (res.status === 402 || data?.creditError) {
    const msg = `אין מספיק קרדיטים (נדרש: ${data?.required || '?'}, יתרה: ${data?.balance || 0})`;
    window.open('/pricing', '_blank');
    throw new Error(msg);
  }
}

const STYLES = [
  { key: "modern-cabin", nameHe: "בקתה מודרנית", desc: "עץ חם, קורות חשופות, חלונות גדולים" },
  { key: "scandinavian", nameHe: "סקנדינבי", desc: "מינימליזם, לבן ואלון בהיר" },
  { key: "industrial", nameHe: "אינדוסטריאלי", desc: "לבנים חשופות, מתכת, בטון" },
  { key: "mediterranean", nameHe: "ים-תיכוני", desc: "טרקוטה, קשתות, קירות לבנים" },
  { key: "japandi", nameHe: "ג׳פנדי", desc: "יפני-סקנדינבי, במבוק ועץ" },
  { key: "luxury-modern", nameHe: "יוקרה מודרנית", desc: "שיש, זהב, ריהוט מעצבים" },
  { key: "boho", nameHe: "בוהמייני", desc: "טקסטילים, שטיחים, ראטאן" },
  { key: "classic", nameHe: "קלאסי אלגנטי", desc: "עיטורים, פרקט, נברשות" },
];

const STEPS = [
  { num: 1, label: "תוכנית" },
  { num: 2, label: "חדרים" },
  { num: 3, label: "פעולה" },
];

type Phase = "upload" | "floorplan-ready" | "floorplan" | "room-actions" | "furniture-click" | "furniture-select" | "furniture-result" | "video-upload" | "video-select" | "video-result";

interface ClickMarker { x: number; y: number; }
interface RoomInfo { room: string; roomHe: string; description: string; }
interface FurnitureInfo { item: string; itemHe: string; description: string; suggestions: string[]; }
interface RoomPhoto { roomName: string; roomNameHe: string; imageData: string; }

// Spinner
const Spinner = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

// Progress bar
const ProgressBar = ({ active, label }: { active: boolean; label: string }) => {
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) return;
    setDone(false);
    setPct(3);
    const t = setInterval(() => {
      setPct((p) => {
        if (p >= 95) return 95;
        const jump = p < 20 ? 1.5 + Math.random() * 2
          : p < 50 ? 0.8 + Math.random() * 1.5
          : p < 75 ? 0.4 + Math.random() * 0.8
          : 0.1 + Math.random() * 0.3;
        return Math.min(p + jump, 95);
      });
    }, 600);
    return () => clearInterval(t);
  }, [active]);

  useEffect(() => {
    if (!active && pct > 0) {
      setPct(100);
      setDone(true);
      const t = setTimeout(() => { setPct(0); setDone(false); }, 1500);
      return () => clearTimeout(t);
    }
  }, [active]);

  if (pct === 0 && !active) return null;

  return (
    <div className="fixed top-11 left-0 right-0 z-[90]">
      <div className="h-1 bg-gray-100 w-full">
        <div
          className={`h-full transition-all duration-700 ease-out ${done ? "bg-emerald-500" : "bg-gradient-to-r from-emerald-400 to-emerald-600"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-center gap-3 py-2.5 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        {done ? (
          <span className="text-sm font-medium text-emerald-600">סיימנו ✓</span>
        ) : (
          <>
            <Spinner className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <span className="text-sm font-mono font-bold text-emerald-600">{Math.round(pct)}%</span>
          </>
        )}
      </div>
    </div>
  );
};

export default function FloorplanPage() {
  const [phase, setPhase] = useState<Phase>("upload");

  // Check URL param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "video") setPhase("video-upload");
  }, []);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [customStyle, setCustomStyle] = useState("");

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [floorplanResult, setFloorplanResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [floorplanClick, setFloorplanClick] = useState<ClickMarker | null>(null);
  const [detectedRoom, setDetectedRoom] = useState<RoomInfo | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(false);
  const [currentRoomPhoto, setCurrentRoomPhoto] = useState<RoomPhoto | null>(null);
  const [allRoomPhotos, setAllRoomPhotos] = useState<RoomPhoto[]>([]);

  const [roomClick, setRoomClick] = useState<ClickMarker | null>(null);
  const [detectedFurniture, setDetectedFurniture] = useState<FurnitureInfo | null>(null);
  const [loadingFurniture, setLoadingFurniture] = useState(false);
  const [furnitureImage, setFurnitureImage] = useState<string | null>(null);
  const [furnitureFile, setFurnitureFile] = useState<File | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [customFurnitureText, setCustomFurnitureText] = useState<string | null>(null);
  const [furnitureResult, setFurnitureResult] = useState<string | null>(null);
  const [swapping, setSwapping] = useState(false);

  const [videoFromRoom, setVideoFromRoom] = useState<string | null>(null);
  const [videoToRoom, setVideoToRoom] = useState<string | null>(null);
  const [videoClickMode, setVideoClickMode] = useState(false);
  const [videoClickA, setVideoClickA] = useState<ClickMarker | null>(null);
  const [videoClickB, setVideoClickB] = useState<ClickMarker | null>(null);
  const [generatingBothRooms, setGeneratingBothRooms] = useState(false);
  const [videoCustomPrompt, setVideoCustomPrompt] = useState("");
  const [videoResult, setVideoResult] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoProgress, setVideoProgress] = useState("");
  const [videoFirstImage, setVideoFirstImage] = useState<string | null>(null);
  const [videoLastImage, setVideoLastImage] = useState<string | null>(null);
  const videoFirstInputRef = useRef<HTMLInputElement>(null);
  const videoLastInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [loadingLabel, setLoadingLabel] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const furnitureInputRef = useRef<HTMLInputElement>(null);
  const floorplanImgRef = useRef<HTMLImageElement>(null);
  const roomImgRef = useRef<HTMLImageElement>(null);

  const getEmail = () => {
    try { return JSON.parse(localStorage.getItem("user") || "{}")?.email || null; }
    catch { return null; }
  };

  const currentStep = () => {
    if (phase === "upload") return 1;
    if (phase === "floorplan-ready" || phase === "floorplan") return 2;
    return 3;
  };

  const isAnyLoading = loading || loadingRoom || loadingFurniture || swapping || videoLoading;

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

  // === Step 1 ===
  const generateFloorplan = async () => {
    if (!uploadedFile || !selectedStyle) return;
    setLoading(true);
    setLoadingLabel("יוצר הדמיה מלמעלה...");
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", uploadedFile);
      formData.append("style", customStyle || selectedStyle);
      formData.append("email", getEmail() || "");
      const res = await fetch("/api/floorplan", { method: "POST", body: formData });
      const data = await res.json();
      checkCredits(res, data); if (!res.ok) throw new Error(data.error || "AI generation failed");
      if (data.image) {
        setFloorplanResult(`data:${data.image.mimeType};base64,${data.image.data}`);
        setPhase("floorplan-ready");
      } else throw new Error(data.text || "No image returned");
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); setLoadingLabel(""); }
  };

  // === Step 2 ===
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
    setLoadingLabel("מזהה חדר...");
    setError(null);
    try {
      const blob = await (await fetch(floorplanResult!)).blob();
      const fd1 = new FormData();
      fd1.append("image", blob, "floorplan.png");
      fd1.append("clickX", x.toFixed(1));
      fd1.append("clickY", y.toFixed(1));
      fd1.append("email", getEmail() || "");
      const detectRes = await fetch("/api/floorplan/detect-room", { method: "POST", body: fd1 });
      const roomInfo = await detectRes.json();
      checkCredits(detectRes, roomInfo); if (!detectRes.ok) throw new Error(roomInfo.error);
      setDetectedRoom(roomInfo);
      setLoadingLabel(`יוצר צילום של ה${roomInfo.roomHe}...`);
      const fd2 = new FormData();
      fd2.append("floorplan", blob, "floorplan.png");
      fd2.append("room", roomInfo.room);
      fd2.append("style", customStyle || selectedStyle || "modern-cabin");
      fd2.append("email", getEmail() || "");
      const roomRes = await fetch("/api/floorplan/room", { method: "POST", body: fd2 });
      const roomData = await roomRes.json();
      checkCredits(roomRes, roomData); if (!roomRes.ok) throw new Error(roomData.error);
      if (roomData.image) {
        const photo: RoomPhoto = {
          roomName: roomInfo.room, roomNameHe: roomInfo.roomHe,
          imageData: `data:${roomData.image.mimeType};base64,${roomData.image.data}`,
        };
        setCurrentRoomPhoto(photo);
        setAllRoomPhotos((prev) => {
          if (prev.some(p => p.roomName === photo.roomName)) return prev;
          return [...prev, photo];
        });
        setPhase("room-actions");
      }
    } catch (err: any) { setError(err.message); }
    finally { setLoadingRoom(false); setLoadingLabel(""); }
  };

  // === Video click mode: select 2 rooms from floorplan ===
  const handleVideoFloorplanClick = async (e: React.MouseEvent<HTMLImageElement>) => {
    if (loadingRoom || generatingBothRooms) return;
    const img = floorplanImgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const click = { x, y };

    if (!videoClickA) {
      setVideoClickA(click);
    } else if (!videoClickB) {
      setVideoClickB(click);
      // Both clicks ready — generate both rooms in parallel
      setGeneratingBothRooms(true);
      setLoadingLabel("מזהה ויוצר 2 חדרים...");
      setError(null);
      try {
        const blob = await (await fetch(floorplanResult!)).blob();
        const email = getEmail() || "";

        const generateRoom = async (clickPos: ClickMarker) => {
          const fd1 = new FormData();
          fd1.append("image", blob, "floorplan.png");
          fd1.append("clickX", clickPos.x.toFixed(1));
          fd1.append("clickY", clickPos.y.toFixed(1));
          fd1.append("email", email);
          const detectRes = await fetch("/api/floorplan/detect-room", { method: "POST", body: fd1 });
          const roomInfo = await detectRes.json();
          if (!detectRes.ok) throw new Error(roomInfo.error);

          const fd2 = new FormData();
          fd2.append("floorplan", blob, "floorplan.png");
          fd2.append("room", roomInfo.room);
          fd2.append("style", customStyle || selectedStyle || "modern-cabin");
          fd2.append("email", email);
          const roomRes = await fetch("/api/floorplan/room", { method: "POST", body: fd2 });
          const roomData = await roomRes.json();
          if (!roomRes.ok) throw new Error(roomData.error);

          return {
            roomName: roomInfo.room,
            roomNameHe: roomInfo.roomHe,
            imageData: `data:${roomData.image.mimeType};base64,${roomData.image.data}`,
          } as RoomPhoto;
        };

        const [roomA, roomB] = await Promise.all([
          generateRoom(videoClickA),
          generateRoom(click),
        ]);

        // Add to allRoomPhotos
        setAllRoomPhotos((prev) => {
          const updated = [...prev];
          if (!updated.some(p => p.roomName === roomA.roomName)) updated.push(roomA);
          if (!updated.some(p => p.roomName === roomB.roomName)) updated.push(roomB);
          return updated;
        });

        // Go directly to video select with these 2 rooms pre-selected
        setVideoFromRoom(roomA.roomName);
        setVideoToRoom(roomB.roomName);
        setPhase("video-select");
      } catch (err: any) { setError(err.message); }
      finally { setGeneratingBothRooms(false); setLoadingLabel(""); setVideoClickA(null); setVideoClickB(null); }
    }
  };

  // === Step 3: Furniture ===
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
    setLoadingLabel("מזהה רהיט...");
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
      checkCredits(res, info); if (!res.ok) throw new Error(info.error);
      setDetectedFurniture(info);
      setPhase("furniture-select");
    } catch (err: any) { setError(err.message); }
    finally { setLoadingFurniture(false); setLoadingLabel(""); }
  };

  const doSwap = async () => {
    if (!currentRoomPhoto || (!selectedSuggestion && !furnitureFile && !customFurnitureText?.trim()) || !detectedFurniture) return;
    setSwapping(true);
    setLoadingLabel(`מחליף ${detectedFurniture.itemHe}...`);
    setError(null);
    try {
      const roomBlob = await (await fetch(currentRoomPhoto.imageData)).blob();
      const instruction = customFurnitureText?.trim()
        ? `Replace the ${detectedFurniture.item} with: ${customFurnitureText.trim()}. Keep everything else exactly the same.`
        : selectedSuggestion
        ? `Replace the ${detectedFurniture.item} with: ${selectedSuggestion}. Keep everything else exactly the same.`
        : `Replace the ${detectedFurniture.item} with the furniture shown in the second image. Keep everything else exactly the same.`;
      const fd = new FormData();
      fd.append("roomImage", roomBlob, "room.png");
      if (furnitureFile) {
        fd.append("furnitureImage", furnitureFile);
      } else {
        const canvas = document.createElement("canvas"); canvas.width = 1; canvas.height = 1;
        const dummyBlob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), "image/png"));
        fd.append("furnitureImage", dummyBlob, "placeholder.png");
      }
      fd.append("instruction", instruction);
      fd.append("email", getEmail() || "");
      const res = await fetch("/api/floorplan/furniture", { method: "POST", body: fd });
      const data = await res.json();
      checkCredits(res, data); if (!res.ok) throw new Error(data.error);
      if (data.image) {
        setFurnitureResult(`data:${data.image.mimeType};base64,${data.image.data}`);
        setPhase("furniture-result");
      }
    } catch (err: any) { setError(err.message); }
    finally { setSwapping(false); setLoadingLabel(""); }
  };

  // === Step 4: Video ===
  const generateVideo = async () => {
    if (!videoFromRoom || !videoToRoom) return;
    const fromPhoto = allRoomPhotos.find(p => p.roomName === videoFromRoom);
    const toPhoto = allRoomPhotos.find(p => p.roomName === videoToRoom);
    if (!fromPhoto || !toPhoto) return;
    setVideoLoading(true);
    setVideoResult(null);
    setVideoProgress("מכין תמונות...");
    setLoadingLabel("מייצר סרטון סיור...");
    setError(null);
    try {
      const resizeToJpeg = async (dataUrl: string): Promise<Blob> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = 1280; canvas.height = 720;
            const ctx = canvas.getContext("2d")!;
            const scale = Math.max(1280 / img.width, 720 / img.height);
            const w = img.width * scale; const h = img.height * scale;
            ctx.drawImage(img, (1280 - w) / 2, (720 - h) / 2, w, h);
            canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.85);
          };
          img.src = dataUrl;
        });
      };
      setVideoProgress("ממיר תמונות...");
      const firstBlob = await resizeToJpeg(fromPhoto.imageData);
      const lastBlob = await resizeToJpeg(toPhoto.imageData);
      setVideoProgress("שולח לייצור סרטון...");
      const fd = new FormData();
      fd.append("firstFrame", firstBlob, "first.jpg");
      fd.append("lastFrame", lastBlob, "last.jpg");
      const basePrompt = `Photorealistic architectural walkthrough video. The camera starts inside a ${fromPhoto.roomName} (shown in first frame) and smoothly moves through a doorway/hallway into a ${toPhoto.roomName} (shown in last frame). ONE continuous steadicam shot, no cuts, no transitions, no scene changes. The camera physically glides at eye level through the connected interior space. Warm natural daylight, interior design showcase quality. The first frame is the starting room and the last frame is the destination room.`;
      const fullPrompt = videoCustomPrompt.trim() ? `${basePrompt} Additional details: ${videoCustomPrompt.trim()}` : basePrompt;
      fd.append("prompt", fullPrompt);
      fd.append("email", getEmail() || "");
      setVideoProgress("מייצר סרטון... (עד דקה)");
      const res = await fetch("/api/floorplan/video", { method: "POST", body: fd });
      const data = await res.json();
      checkCredits(res, data); if (!res.ok) throw new Error(data.error || "Video generation failed");
      if (data.video) {
        setVideoResult(`data:${data.video.mimeType};base64,${data.video.data}`);
        setPhase("video-result");
      } else {
        throw new Error(data.error || "לא התקבל סרטון מהשרת");
      }
    } catch (err: any) { setError(err.message); }
    finally { setVideoLoading(false); setVideoProgress(""); setLoadingLabel(""); }
  };

  // === Step 4b: Direct video from uploaded images ===
  const generateDirectVideo = async () => {
    if (!videoFirstImage || !videoLastImage) return;
    setVideoLoading(true);
    setVideoResult(null);
    setVideoProgress("מכין תמונות...");
    setLoadingLabel("מייצר סרטון סיור...");
    setError(null);
    try {
      const resizeToJpeg = async (dataUrl: string): Promise<Blob> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = 1280; canvas.height = 720;
            const ctx = canvas.getContext("2d")!;
            const scale = Math.max(1280 / img.width, 720 / img.height);
            const w = img.width * scale; const h = img.height * scale;
            ctx.drawImage(img, (1280 - w) / 2, (720 - h) / 2, w, h);
            canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.85);
          };
          img.src = dataUrl;
        });
      };
      setVideoProgress("ממיר תמונות...");
      const firstBlob = await resizeToJpeg(videoFirstImage);
      const lastBlob = await resizeToJpeg(videoLastImage);
      setVideoProgress("שולח לייצור סרטון...");
      const fd = new FormData();
      fd.append("firstFrame", firstBlob, "first.jpg");
      fd.append("lastFrame", lastBlob, "last.jpg");
      const basePrompt = "Photorealistic architectural walkthrough video. The camera starts inside the room shown in the first frame and smoothly moves through the space to arrive at the room shown in the last frame. ONE continuous steadicam shot, no cuts, no transitions, no scene changes. The camera physically glides at eye level through the connected interior space. Warm natural daylight, interior design showcase quality.";
      const fullPrompt = videoCustomPrompt.trim() ? `${basePrompt} Additional details: ${videoCustomPrompt.trim()}` : basePrompt;
      fd.append("prompt", fullPrompt);
      fd.append("email", getEmail() || "");
      setVideoProgress("מייצר סרטון... (עד דקה)");
      const res = await fetch("/api/floorplan/video", { method: "POST", body: fd });
      const data = await res.json();
      checkCredits(res, data); if (!res.ok) throw new Error(data.error || "Video generation failed");
      if (data.video) {
        setVideoResult(`data:${data.video.mimeType};base64,${data.video.data}`);
        setPhase("video-result");
      } else {
        throw new Error(data.error || "לא התקבל סרטון מהשרת");
      }
    } catch (err: any) { setError(err.message); }
    finally { setVideoLoading(false); setVideoProgress(""); setLoadingLabel(""); }
  };

  // === Click pin ===
  const ClickPin = ({ marker }: { marker: ClickMarker }) => (
    <div className="absolute pointer-events-none z-10" style={{ left: `${marker.x}%`, top: `${marker.y}%`, transform: "translate(-50%, -100%)" }}>
      <div className="flex flex-col items-center">
        <div className="w-6 h-6 bg-emerald-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>
        <div className="w-0.5 h-2 bg-emerald-500" />
      </div>
    </div>
  );

  // === Stepper ===
  const StepBar = () => {
    const step = currentStep();
    return (
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center">
            <button
              onClick={() => {
                if (s.num === 1) setPhase("upload");
                if (s.num === 2 && floorplanResult) { setPhase("floorplan-ready"); setCurrentRoomPhoto(null); }
                if (s.num === 3 && allRoomPhotos.length > 0) {
                  if (!currentRoomPhoto) setCurrentRoomPhoto(allRoomPhotos[allRoomPhotos.length - 1]);
                  setPhase("room-actions");
                }
              }}
              disabled={(s.num === 2 && !floorplanResult) || (s.num === 3 && allRoomPhotos.length === 0)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                step === s.num
                  ? "bg-gray-900 text-white"
                  : step > s.num
                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                step === s.num ? "bg-white text-gray-900" : step > s.num ? "bg-emerald-200 text-emerald-800" : "bg-gray-200 text-gray-400"
              }`}>{step > s.num ? "✓" : s.num}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`w-6 sm:w-10 h-px mx-1 ${step > s.num ? "bg-emerald-300" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <ProgressBar active={isAnyLoading} label={loadingLabel} />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 h-11 bg-white/80 backdrop-blur-xl z-50 border-b border-gray-200/50">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="text-base font-semibold text-gray-900">ShiputzAI</Link>
          <div className="flex items-center gap-3">
            <CreditBadge />
            <span className="text-xs text-gray-900 bg-gray-100 px-3 py-1.5 rounded-full">Floor Plan Studio</span>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-12 space-y-8">
        <StepBar />

        {/* ======== STEP 1: Upload ======== */}
        {phase === "upload" && (
          <>
            <div className="text-center space-y-3">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
                מתוכנית קומה ל<span className="text-emerald-600">דירה מעוצבת</span>
              </h1>
              <p className="text-gray-500 max-w-lg mx-auto">
                העלו תוכנית קומה ובחרו סגנון עיצוב — ה-AI ייצור הדמיה מלמעלה של הדירה כולה
              </p>
            </div>

            {/* Upload area */}
            <div>
              <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                <span className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs">א</span>
                העלאת תוכנית קומה
              </label>
              <div
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                  uploadedImage ? "border-emerald-300 bg-emerald-50/50" : "border-gray-300 hover:border-gray-400 bg-gray-50"
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                {uploadedImage ? (
                  <div className="space-y-2">
                    <img src={uploadedImage} alt="Floor plan" className="max-h-52 mx-auto rounded-xl shadow-sm" />
                    <p className="text-xs text-gray-400">לחצו להחלפה</p>
                  </div>
                ) : (
                  <div className="space-y-2 py-4">
                    <div className="w-12 h-12 mx-auto rounded-full bg-gray-200 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                    </div>
                    <p className="text-gray-600 font-medium">גררו תוכנית קומה או לחצו לבחירה</p>
                    <p className="text-xs text-gray-400">PNG, JPG, WEBP</p>
                  </div>
                )}
              </div>
            </div>

            {/* Style selection */}
            <div>
              <label className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
                <span className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs">ב</span>
                בחירת סגנון עיצוב
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {STYLES.map((s) => (
                  <button key={s.key} onClick={() => { setSelectedStyle(s.key); setCustomStyle(""); }}
                    className={`rounded-xl p-3.5 text-right transition-all border-2 bg-white ${
                      selectedStyle === s.key && !customStyle
                        ? "border-gray-900 shadow-md"
                        : "border-gray-200 hover:border-gray-300"
                    }`}>
                    <div className="font-bold text-sm text-gray-900">{s.nameHe}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{s.desc}</div>
                  </button>
                ))}
              </div>
              <div className="mt-2">
                <input
                  type="text"
                  value={customStyle}
                  onChange={(e) => { setCustomStyle(e.target.value); if (e.target.value) setSelectedStyle("custom"); }}
                  placeholder="או כתבו סגנון משלכם... למשל: לופט ניו יורקי עם בטון ועץ כהה"
                  className={`w-full px-4 py-3 rounded-xl border-2 bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none transition-all ${
                    customStyle ? "border-gray-900 shadow-md" : "border-gray-200 focus:border-gray-400"
                  }`}
                  dir="rtl"
                />
              </div>
            </div>

            <button onClick={generateFloorplan} disabled={!uploadedFile || (!selectedStyle && !customStyle) || loading}
              className={`w-full py-4 rounded-full font-bold text-lg transition-all ${
                !uploadedFile || (!selectedStyle && !customStyle) || loading
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-900 text-white hover:bg-gray-800 shadow-xl hover:shadow-2xl"
              }`}>
              {loading ? <span className="flex items-center justify-center gap-2"><Spinner className="h-5 w-5" /> יוצר הדמיה...</span> : "צור הדמיה →"}
            </button>

            {/* How it works */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <h3 className="text-base font-bold text-gray-900 mb-3">איך זה עובד?</h3>
              <div className="text-gray-500 text-sm space-y-2">
                <p><strong className="text-gray-700">1.</strong> העלו תוכנית קומה, בחרו סגנון — קבלו הדמיה מלמעלה</p>
                <p><strong className="text-gray-700">2.</strong> לחצו על חדר בהדמיה — ה-AI יוצר צילום פנים ריאליסטי</p>
                <p><strong className="text-gray-700">3.</strong> החליפו רהיטים או צרו סרטון סיור בדירה</p>
              </div>
            </div>
          </>
        )}

        {/* ======== STEP 2: Floorplan ready — choose action ======== */}
        {phase === "floorplan-ready" && floorplanResult && (
          <>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">ההדמיה מוכנה</h2>
              <p className="text-gray-500">מה תרצו לעשות עם התוכנית?</p>
              <p className="text-xs text-gray-400">הדמיית AI להמחשה בלבד</p>
            </div>

            {/* Before / After side by side */}
            <div className="grid grid-cols-2 gap-3 max-w-3xl mx-auto">
              <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                <img src={uploadedImage!} alt="Original" className="w-full" />
                <div className="text-center text-xs text-gray-400 py-1.5 bg-gray-50">תוכנית מקורית</div>
              </div>
              <div className="rounded-2xl overflow-hidden border-2 border-emerald-200 shadow-sm">
                <img src={floorplanResult} alt="Rendering" className="w-full" />
                <div className="text-center text-xs text-emerald-600 py-1.5 bg-emerald-50">
                  {STYLES.find((s) => s.key === selectedStyle)?.nameHe}
                </div>
              </div>
            </div>

            {/* Action cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
              {/* Room photo */}
              <button onClick={() => setPhase("floorplan")}
                className="bg-white border-2 border-gray-200 hover:border-gray-900 rounded-2xl p-5 text-center transition-all group">
                <div className="w-11 h-11 mx-auto rounded-full bg-gray-100 group-hover:bg-gray-900 flex items-center justify-center transition-colors mb-3">
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
                </div>
                <div className="font-bold text-gray-900 text-sm">הדמיית חדר</div>
                <div className="text-xs text-gray-400 mt-1">לחצו על חדר וראו אותו מבפנים</div>
              </button>

              {/* Video */}
              <button onClick={() => {
                if (allRoomPhotos.length >= 2) { setVideoFromRoom(null); setVideoToRoom(null); setPhase("video-select"); }
                else { setVideoClickMode(true); setVideoClickA(null); setVideoClickB(null); setPhase("floorplan"); }
              }}
                className="bg-white border-2 border-gray-200 hover:border-emerald-500 rounded-2xl p-5 text-center transition-all group">
                <div className="w-11 h-11 mx-auto rounded-full bg-emerald-50 group-hover:bg-emerald-500 flex items-center justify-center transition-colors mb-3">
                  <svg className="w-5 h-5 text-emerald-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" /></svg>
                </div>
                <div className="font-bold text-gray-900 text-sm">סרטון סיור</div>
                <div className="text-xs text-gray-400 mt-1">לחצו על 2 חדרים בתוכנית</div>
              </button>

              {/* Furniture */}
              <button onClick={() => {
                if (allRoomPhotos.length > 0) {
                  if (!currentRoomPhoto) setCurrentRoomPhoto(allRoomPhotos[allRoomPhotos.length - 1]);
                  setPhase("furniture-click");
                  setRoomClick(null);
                  setDetectedFurniture(null);
                } else {
                  setPhase("floorplan");
                }
              }}
                className="bg-white border-2 border-gray-200 hover:border-gray-900 rounded-2xl p-5 text-center transition-all group">
                <div className="w-11 h-11 mx-auto rounded-full bg-gray-100 group-hover:bg-gray-900 flex items-center justify-center transition-colors mb-3">
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
                </div>
                <div className="font-bold text-gray-900 text-sm">החלפת רהיט</div>
                <div className="text-xs text-gray-400 mt-1">
                  {allRoomPhotos.length > 0
                    ? "בחרו רהיט והחליפו אותו"
                    : "צרו חדר קודם"}
                </div>
              </button>
            </div>

            {/* Room thumbnails if any */}
            {allRoomPhotos.length > 0 && (
              <div className="space-y-3 max-w-3xl mx-auto">
                <h3 className="text-sm font-semibold text-gray-500">חדרים שנוצרו ({allRoomPhotos.length})</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                  {allRoomPhotos.map((photo, i) => (
                    <button key={i} onClick={() => { setCurrentRoomPhoto(photo); setPhase("room-actions"); }}
                      className="rounded-xl overflow-hidden border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all">
                      <img src={photo.imageData} alt={photo.roomNameHe} className="w-full aspect-[4/3] object-cover" />
                      <div className="text-center text-[10px] text-gray-500 py-1 bg-gray-50">{photo.roomNameHe}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Start fresh */}
            <div className="text-center">
              <button onClick={() => { setPhase("upload"); setFloorplanResult(null); setUploadedImage(null); setUploadedFile(null); setAllRoomPhotos([]); }}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors">תוכנית חדשה</button>
            </div>
          </>
        )}

        {/* ======== STEP 2b: Floorplan — click rooms ======== */}
        {phase === "floorplan" && floorplanResult && (
          <>
            <div className="flex items-center justify-between mb-2">
              {videoClickMode ? (
                <button onClick={() => { setVideoClickMode(false); setVideoClickA(null); setVideoClickB(null); }}
                  className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200">ביטול מצב סרטון</button>
              ) : <div />}
              <button onClick={() => { setPhase("floorplan-ready"); setVideoClickMode(false); }}
                className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200">← חזרה</button>
            </div>

            {videoClickMode ? (
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-center">
                <p className="text-purple-800 font-medium text-sm">
                  {!videoClickA ? "🎬 לחצו על החדר הראשון (A) — תחילת הסרטון" :
                   generatingBothRooms ? "מזהה ויוצר 2 חדרים במקביל..." :
                   "עכשיו לחצו על החדר השני (B) — סוף הסרטון"}
                </p>
                <p className="text-purple-600/60 text-xs mt-1">שני החדרים ייוצרו במקביל ותעברו ישר ליצירת הסרטון</p>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                <p className="text-emerald-800 font-medium text-sm">לחצו על חדר בהדמיה כדי לראות אותו מבפנים</p>
                <p className="text-emerald-600/60 text-xs mt-1">ה-AI יזהה את החדר וייצור צילום פנים ריאליסטי</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                <img src={uploadedImage!} alt="Original" className="w-full" />
                <div className="text-center text-xs text-gray-400 py-1.5 bg-gray-50">תוכנית מקורית</div>
              </div>
              <div className={`rounded-2xl overflow-hidden border-2 shadow-sm relative ${videoClickMode ? "border-purple-200" : "border-emerald-200"}`}>
                <img ref={floorplanImgRef} src={floorplanResult} alt="Rendering"
                  className={`w-full ${(loadingRoom || generatingBothRooms) ? "opacity-50" : "cursor-crosshair"}`}
                  onClick={videoClickMode ? handleVideoFloorplanClick : handleFloorplanClick} />
                {!videoClickMode && floorplanClick && <ClickPin marker={floorplanClick} />}
                {videoClickA && <ClickPin marker={videoClickA} />}
                {videoClickB && <ClickPin marker={videoClickB} />}
                {(loadingRoom || generatingBothRooms) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                    <div className="bg-white rounded-2xl px-6 py-4 text-center shadow-xl border border-gray-100">
                      <Spinner className="h-8 w-8 text-emerald-600 mx-auto" />
                      <p className="text-sm text-gray-600 mt-2">
                        {generatingBothRooms ? "יוצר 2 חדרים במקביל..." :
                         detectedRoom ? `יוצר צילום של ה${detectedRoom.roomHe}...` : "מזהה חדר..."}
                      </p>
                    </div>
                  </div>
                )}
                <div className={`text-center text-xs py-1.5 ${videoClickMode ? "text-purple-600 bg-purple-50" : "text-emerald-600 bg-emerald-50"}`}>
                  {videoClickMode
                    ? `🎬 מצב סרטון — ${videoClickA ? "1/2 נבחרו" : "בחרו חדר A"}`
                    : `${customStyle || STYLES.find((s) => s.key === selectedStyle)?.nameHe || ""} — לחצו על חדר`}
                </div>
              </div>
            </div>

            {allRoomPhotos.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-500">חדרים שנוצרו ({allRoomPhotos.length})</h3>
                {allRoomPhotos.length >= 2 && (
                  <button onClick={() => { setVideoFromRoom(null); setVideoToRoom(null); setPhase("video-select"); }}
                    className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-full shadow-lg transition-all text-sm">
                    צור סרטון סיור בין {allRoomPhotos.length} חדרים →
                  </button>
                )}
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                  {allRoomPhotos.map((photo, i) => (
                    <button key={i} onClick={() => { setCurrentRoomPhoto(photo); setPhase("room-actions"); }}
                      className="rounded-xl overflow-hidden border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all">
                      <img src={photo.imageData} alt={photo.roomNameHe} className="w-full aspect-[4/3] object-cover" />
                      <div className="text-center text-[10px] text-gray-500 py-1 bg-gray-50">{photo.roomNameHe}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ======== STEP 3a: Room Actions Hub ======== */}
        {phase === "room-actions" && currentRoomPhoto && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{currentRoomPhoto.roomNameHe}</h2>
              <button onClick={() => setPhase("floorplan-ready")}
                className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors">← חזרה לתפריט</button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm max-w-2xl mx-auto">
              <img src={currentRoomPhoto.imageData} alt={currentRoomPhoto.roomNameHe} className="w-full" />
            </div>

            <p className="text-center text-gray-500 text-sm">מה תרצו לעשות עם החדר?</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
              <button
                onClick={() => { setPhase("furniture-click"); setRoomClick(null); setDetectedFurniture(null); }}
                className="bg-white border-2 border-gray-200 hover:border-gray-900 rounded-2xl p-6 text-center transition-all group"
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 group-hover:bg-gray-900 flex items-center justify-center transition-colors mb-3">
                  <svg className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
                </div>
                <div className="font-bold text-gray-900">החלפת רהיט</div>
                <div className="text-xs text-gray-400 mt-1">לחצו על רהיט בתמונה והחליפו אותו</div>
              </button>

              <button
                onClick={() => {
                  if (allRoomPhotos.length >= 2) { setVideoFromRoom(null); setVideoToRoom(null); setPhase("video-select"); }
                  else { setPhase("floorplan-ready"); setCurrentRoomPhoto(null); }
                }}
                className="bg-white border-2 border-gray-200 hover:border-emerald-500 rounded-2xl p-6 text-center transition-all group"
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 group-hover:bg-emerald-500 flex items-center justify-center transition-colors mb-3">
                  <svg className="w-6 h-6 text-emerald-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" /></svg>
                </div>
                <div className="font-bold text-gray-900">סרטון סיור</div>
                <div className="text-xs text-gray-400 mt-1">
                  {allRoomPhotos.length >= 2
                    ? `סיור וירטואלי בין ${allRoomPhotos.length} חדרים`
                    : `צרו עוד ${2 - allRoomPhotos.length} חדר/ים — לחצו לחזור`}
                </div>
              </button>
            </div>

            <div className="text-center">
              <button onClick={() => { setPhase("floorplan-ready"); setCurrentRoomPhoto(null); }}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors">← הוספת חדרים נוספים</button>
            </div>
          </>
        )}

        {/* ======== STEP 3b: Furniture click ======== */}
        {phase === "furniture-click" && currentRoomPhoto && (
          <>
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
              <p className="text-emerald-800 font-medium text-sm">לחצו על רהיט בתמונה להחלפה</p>
              <p className="text-emerald-600/60 text-xs mt-1">ה-AI יזהה את הרהיט ויציע חלופות</p>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{currentRoomPhoto.roomNameHe}</h2>
              <button onClick={() => setPhase("room-actions")}
                className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200">← חזרה</button>
            </div>

            <div className="rounded-2xl overflow-hidden border-2 border-emerald-200 relative max-w-2xl mx-auto shadow-sm">
              <img ref={roomImgRef} src={currentRoomPhoto.imageData} alt={currentRoomPhoto.roomNameHe}
                className={`w-full ${loadingFurniture ? "opacity-50" : "cursor-crosshair"}`}
                onClick={handleRoomClick} />
              {roomClick && <ClickPin marker={roomClick} />}
              {loadingFurniture && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                  <div className="bg-white rounded-2xl px-6 py-4 text-center shadow-xl border border-gray-100">
                    <Spinner className="h-8 w-8 text-emerald-600 mx-auto" />
                    <p className="text-sm text-gray-600 mt-2">מזהה רהיט...</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ======== STEP 3c: Furniture select + result ======== */}
        {(phase === "furniture-select" || phase === "furniture-result") && currentRoomPhoto && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{currentRoomPhoto.roomNameHe}</h2>
              <button onClick={() => setPhase("room-actions")}
                className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200">← חזרה</button>
            </div>

            {phase === "furniture-select" && detectedFurniture && (
              <div className="space-y-5">
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{detectedFurniture.itemHe}</div>
                    <div className="text-xs text-gray-500">{detectedFurniture.description}</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">בחרו חלופה</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {detectedFurniture.suggestions.map((sug, i) => (
                      <button key={i} onClick={() => { setSelectedSuggestion(sug); setFurnitureImage(null); setFurnitureFile(null); setCustomFurnitureText(null); }}
                        className={`text-right rounded-xl p-3 border-2 transition-all text-sm ${
                          selectedSuggestion === sug ? "bg-emerald-50 border-emerald-400 text-emerald-800" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}>{sug}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">או — תארו מה אתם רוצים</h3>
                  <input
                    type="text"
                    placeholder={`למשל: מיטה לבנה מעץ אלון בסגנון כפרי`}
                    value={customFurnitureText || ""}
                    onChange={(e) => { setCustomFurnitureText(e.target.value); if (e.target.value) { setSelectedSuggestion(null); setFurnitureImage(null); setFurnitureFile(null); } }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-right focus:outline-none focus:border-emerald-400 transition-colors"
                    dir="rtl"
                  />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">או — העלו רהיט ספציפי</h3>
                  <div className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                    furnitureImage ? "border-emerald-300 bg-emerald-50/50" : "border-gray-300 hover:border-gray-400"
                  }`} onClick={() => furnitureInputRef.current?.click()}>
                    <input ref={furnitureInputRef} type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; setFurnitureFile(f); setSelectedSuggestion(null); setCustomFurnitureText(null);
                        const reader = new FileReader(); reader.onload = (ev) => setFurnitureImage(ev.target?.result as string); reader.readAsDataURL(f); }} />
                    {furnitureImage ? <img src={furnitureImage} alt="Furniture" className="max-h-28 mx-auto rounded-xl" />
                      : <p className="text-gray-400 text-sm py-2">העלו תמונת רהיט</p>}
                  </div>
                </div>

                <button onClick={doSwap} disabled={(!selectedSuggestion && !furnitureFile && !customFurnitureText?.trim()) || swapping}
                  className={`w-full py-3.5 rounded-full font-bold transition-all ${
                    (!selectedSuggestion && !furnitureFile) || swapping ? "bg-gray-200 text-gray-400"
                      : "bg-gray-900 text-white hover:bg-gray-800 shadow-lg"
                  }`}>
                  {swapping ? <span className="flex items-center justify-center gap-2"><Spinner className="h-5 w-5" /> מחליף...</span>
                    : `החלף ${detectedFurniture.itemHe} →`}
                </button>

                <div className="flex justify-center gap-4 pt-1">
                  <button onClick={() => { setPhase("furniture-click"); setDetectedFurniture(null); setRoomClick(null); }}
                    className="text-sm text-gray-400 hover:text-gray-600">← חזרה לחדר</button>
                  <button onClick={() => setPhase("room-actions")}
                    className="text-sm text-emerald-600 hover:text-emerald-700">פעולות נוספות →</button>
                </div>
              </div>
            )}

            {phase === "furniture-result" && furnitureResult && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl overflow-hidden border border-gray-200">
                    <img src={currentRoomPhoto.imageData} alt="Before" className="w-full" />
                    <div className="text-center text-xs text-gray-400 py-1.5 bg-gray-50">לפני</div>
                  </div>
                  <div className="rounded-2xl overflow-hidden border-2 border-emerald-200">
                    <img src={furnitureResult} alt="After" className="w-full" />
                    <div className="text-center text-xs text-emerald-600 py-1.5 bg-emerald-50">אחרי</div>
                  </div>
                </div>
                <div className="flex justify-center gap-3 flex-wrap">
                  <a href={furnitureResult} download="furniture-swap.png"
                    className="px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800">הורד תמונה</a>
                  <button onClick={() => { setPhase("furniture-click"); setFurnitureResult(null); setDetectedFurniture(null); setRoomClick(null); }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200">רהיט נוסף</button>
                  <button onClick={() => setPhase("room-actions")}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200">פעולות נוספות</button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ======== STEP 4: Video select ======== */}
        {phase === "video-upload" && (
          <>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">סרטון סיור AI</h2>
              <p className="text-gray-500 text-sm">העלו שתי תמונות — חדר התחלה וחדר סיום — והסרטון ייוצר אוטומטית</p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
              {/* First frame */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-2 block text-center">תמונה ראשונה (התחלה)</label>
                <input ref={videoFirstInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setVideoFirstImage(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }} />
                <button onClick={() => videoFirstInputRef.current?.click()}
                  className={`w-full aspect-[4/3] rounded-2xl border-2 border-dashed overflow-hidden flex items-center justify-center transition-all ${
                    videoFirstImage ? "border-gray-900 bg-white" : "border-gray-300 hover:border-gray-400 bg-gray-50"
                  }`}>
                  {videoFirstImage ? (
                    <img src={videoFirstImage} alt="First frame" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <div className="text-3xl mb-2 opacity-40">A</div>
                      <p className="text-xs text-gray-400">לחצו להעלאה</p>
                    </div>
                  )}
                </button>
              </div>

              {/* Last frame */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-2 block text-center">תמונה שנייה (סיום)</label>
                <input ref={videoLastInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setVideoLastImage(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }} />
                <button onClick={() => videoLastInputRef.current?.click()}
                  className={`w-full aspect-[4/3] rounded-2xl border-2 border-dashed overflow-hidden flex items-center justify-center transition-all ${
                    videoLastImage ? "border-gray-900 bg-white" : "border-gray-300 hover:border-gray-400 bg-gray-50"
                  }`}>
                  {videoLastImage ? (
                    <img src={videoLastImage} alt="Last frame" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <div className="text-3xl mb-2 opacity-40">B</div>
                      <p className="text-xs text-gray-400">לחצו להעלאה</p>
                    </div>
                  )}
                </button>
              </div>
            </div>

            {videoFirstImage && videoLastImage && (
              <div className="flex items-center justify-center gap-3 text-sm">
                <span className="px-3 py-1.5 bg-gray-100 rounded-full text-gray-700 font-medium">חדר A</span>
                <span className="text-gray-300">→</span>
                <span className="px-3 py-1.5 bg-gray-100 rounded-full text-gray-700 font-medium">חדר B</span>
              </div>
            )}

            {/* Optional custom prompt */}
            <div className="max-w-2xl mx-auto">
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">הוספת פרטים (אופציונלי)</label>
              <input
                type="text"
                value={videoCustomPrompt}
                onChange={(e) => setVideoCustomPrompt(e.target.value)}
                placeholder="למשל: תאורה חמה, סגנון סינמטי, מעבר דרך מסדרון..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
                dir="rtl"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button onClick={generateDirectVideo} disabled={!videoFirstImage || !videoLastImage || videoLoading}
              className={`w-full py-4 rounded-full font-bold text-lg transition-all max-w-2xl mx-auto ${
                videoFirstImage && videoLastImage && !videoLoading
                  ? "bg-gray-900 hover:bg-gray-800 text-white shadow-lg"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}>
              {videoLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner className="h-5 w-5" />
                  {videoProgress || "מייצר סרטון..."}
                </span>
              ) : "🎬 צור סרטון סיור"}
            </button>

            <div className="text-center">
              <button onClick={() => { setPhase("upload"); setVideoFirstImage(null); setVideoLastImage(null); }}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors">← חזרה לתוכנית קומה</button>
            </div>
          </>
        )}

        {phase === "video-select" && (
          <>
            {(() => {
              const selected = (videoFromRoom ? 1 : 0) + (videoToRoom ? 1 : 0);
              return (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">{selected}/2</span>
                    <span className="text-gray-500 text-sm">חדרים נבחרו</span>
                  </div>
                  <p className="text-gray-700 font-medium text-sm">
                    {selected === 0 && "בחרו את החדר הראשון — תחילת הסרטון"}
                    {selected === 1 && "עכשיו בחרו את החדר השני — סוף הסרטון"}
                    {selected === 2 && "מעולה — לחצו ליצירת הסרטון"}
                  </p>
                  <p className="text-gray-400 text-xs">המצלמה תזוז מחדר אחד לשני — מעבר חלק, בלי חתכים</p>
                </div>
              );
            })()}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
              {allRoomPhotos.map((photo) => {
                const isFrom = videoFromRoom === photo.roomName;
                const isTo = videoToRoom === photo.roomName;
                const isSelected = isFrom || isTo;
                return (
                  <button key={photo.roomName} onClick={() => {
                    if (isFrom) { setVideoFromRoom(null); return; }
                    if (isTo) { setVideoToRoom(null); return; }
                    if (!videoFromRoom) { setVideoFromRoom(photo.roomName); }
                    else if (!videoToRoom) { setVideoToRoom(photo.roomName); }
                  }}
                    className={`rounded-2xl overflow-hidden border-2 transition-all relative ${
                      isSelected ? "border-gray-900 shadow-lg scale-[1.02]" : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                    }`}>
                    <img src={photo.imageData} alt={photo.roomNameHe} className="w-full aspect-[4/3] object-cover" />
                    {isSelected && (
                      <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold shadow-lg">
                        {isFrom ? "A" : "B"}
                      </div>
                    )}
                    <div className={`text-center text-xs py-1.5 ${
                      isSelected ? "bg-gray-900 text-white font-medium" : "bg-gray-50 text-gray-500"
                    }`}>
                      {photo.roomNameHe}
                      {isFrom && " — התחלה"}
                      {isTo && " — סיום"}
                    </div>
                  </button>
                );
              })}
            </div>

            {videoFromRoom && videoToRoom && (
              <div className="flex items-center justify-center gap-3 text-sm">
                <span className="px-3 py-1.5 bg-gray-100 rounded-full text-gray-700 font-medium">
                  {allRoomPhotos.find(p => p.roomName === videoFromRoom)?.roomNameHe}
                </span>
                <span className="text-gray-300">→</span>
                <span className="px-3 py-1.5 bg-gray-100 rounded-full text-gray-700 font-medium">
                  {allRoomPhotos.find(p => p.roomName === videoToRoom)?.roomNameHe}
                </span>
              </div>
            )}

            {/* Optional custom prompt */}
            <div className="max-w-2xl mx-auto">
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">הוספת פרטים (אופציונלי)</label>
              <input
                type="text"
                value={videoCustomPrompt}
                onChange={(e) => setVideoCustomPrompt(e.target.value)}
                placeholder="למשל: תאורה חמה, סגנון סינמטי, מעבר דרך מסדרון..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
                dir="rtl"
              />
            </div>

            <button onClick={generateVideo} disabled={!videoFromRoom || !videoToRoom || videoLoading}
              className={`w-full py-4 rounded-full font-bold text-lg transition-all ${
                !videoFromRoom || !videoToRoom || videoLoading
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-900 text-white hover:bg-gray-800 shadow-xl"
              }`}>
              {videoLoading ? (
                <span className="flex items-center justify-center gap-2"><Spinner className="h-5 w-5" /> {videoProgress || "מייצר סרטון..."}</span>
              ) : "צור סרטון סיור →"}
            </button>

            <button onClick={() => setPhase("room-actions")}
              className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">← חזרה</button>
          </>
        )}

        {/* ======== Video result ======== */}
        {phase === "video-result" && videoResult && (
          <>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-gray-900">הסרטון מוכן</h2>
              <p className="text-gray-500 text-sm">
                {allRoomPhotos.find(p => p.roomName === videoFromRoom)?.roomNameHe} → {allRoomPhotos.find(p => p.roomName === videoToRoom)?.roomNameHe}
              </p>
            </div>

            <div className="max-w-2xl mx-auto rounded-2xl overflow-hidden border border-gray-200 shadow-lg">
              <video src={videoResult} controls autoPlay loop className="w-full" />
            </div>

            <div className="flex justify-center gap-3 flex-wrap">
              <a href={videoResult} download="walkthrough.mp4"
                className="px-5 py-2.5 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800">הורד סרטון</a>
              <button onClick={() => { setVideoResult(null); setVideoFromRoom(null); setVideoToRoom(null); setPhase("video-select"); }}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200">סרטון נוסף</button>
              <button onClick={() => { setPhase("floorplan-ready"); setCurrentRoomPhoto(null); }}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200">חזרה להדמיה</button>
            </div>
          </>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-600 text-center text-sm">{error}</div>
        )}
      </div>
    </div>
  );
}
