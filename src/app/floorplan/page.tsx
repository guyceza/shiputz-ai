"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import CreditBadge from "@/components/CreditBadge";
import { trackAction, clearAction } from "@/lib/track-action";
import { trackAcquisitionEvent } from "@/lib/acquisition-tracking";

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

const DEMO_FLOORPLANS = [
  {
    key: "option-1",
    title: "שרטוט 1",
    source: "/examples/floorplan-demo-option-1.jpg",
  },
  {
    key: "option-2",
    title: "שרטוט 2",
    source: "/examples/floorplan-demo-option-2.jpg",
  },
] as const;

const FLOORPLAN_WINNING_AD_IMAGE = "/examples/floorplan-winning-ad.jpg";
const FLOORPLAN_DEMO_RESUME_KEY = "floorplan_demo_resume";

type DemoFloorplanKey = typeof DEMO_FLOORPLANS[number]["key"];

type FloorplanDemoResumeAction = "room" | "own";

interface FloorplanDemoResumeState {
  action: FloorplanDemoResumeAction;
  demoKey: DemoFloorplanKey;
  uploadedImage: string;
  floorplanResult: string;
  selectedStyle: string | null;
  customStyle: string;
  floorplanNotes: string;
  createdAt: number;
}

const STEPS = [
  { num: 1, label: "תוכנית" },
  { num: 2, label: "חדרים" },
  { num: 3, label: "פעולה" },
];

type Phase = "upload" | "floorplan-ready" | "floorplan" | "room-actions" | "furniture-click" | "furniture-select" | "furniture-result" | "video-select" | "video-result";

interface ClickMarker { x: number; y: number; }
interface RoomInfo { room: string; roomHe: string; description: string; dimensions?: { width: number; height: number }; }
interface VideoHistoryItem {
  id: string;
  videoUrl: string;
  fromRoomHe: string;
  toRoomHe: string;
  createdAt: string;
}

const ROOM_PURPOSES = [
  { key: "bedroom", label: "חדר שינה", icon: "🛏️" },
  { key: "living-room", label: "סלון", icon: "🛋️" },
  { key: "kitchen", label: "מטבח", icon: "🍳" },
  { key: "bathroom", label: "אמבטיה", icon: "🚿" },
  { key: "office", label: "חדר עבודה", icon: "💻" },
  { key: "kids-room", label: "חדר ילדים", icon: "🧸" },
  { key: "dining", label: "פינת אוכל", icon: "🍽️" },
  { key: "laundry", label: "מכבסה", icon: "🧺" },
  { key: "storage", label: "מחסן", icon: "📦" },
  { key: "balcony", label: "מרפסת", icon: "🌿" },
  { key: "entrance", label: "כניסה", icon: "🚪" },
  { key: "guest-room", label: "חדר אורחים", icon: "🛎️" },
];
interface FurnitureInfo { item: string; itemHe: string; description: string; suggestions: string[]; }
interface RoomPhoto { id: string; roomName: string; roomNameHe: string; imageData: string; }

const createRoomPhotoId = (roomName: string) =>
  `room-${Date.now()}-${roomName}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeRoomPhoto = (photo: Partial<RoomPhoto> & Omit<RoomPhoto, "id">): RoomPhoto => ({
  ...photo,
  id: photo.id || createRoomPhotoId(photo.roomName),
});

const getRoomDisplayName = (photo: RoomPhoto, photos: RoomPhoto[]) => {
  const sameTypeRooms = photos.filter((item) => item.roomNameHe === photo.roomNameHe);
  if (sameTypeRooms.length <= 1) return photo.roomNameHe;
  const index = sameTypeRooms.findIndex((item) => item.id === photo.id);
  return `${photo.roomNameHe} ${index + 1}`;
};

const hasHebrewText = (text?: string) => /[\u0590-\u05FF]/.test(text || "");

const getRoomDescriptionHe = (room?: RoomInfo | null) => {
  if (!room) return "";
  if (hasHebrewText(room.description)) return room.description;

  const dimensions = room.dimensions ? ` בגודל משוער של ${room.dimensions.width}×${room.dimensions.height} מ׳` : "";
  return `${room.roomHe}${dimensions}, לפי האזור שנבחר בתוכנית.`;
};

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

const getStoredUserEmail = () => {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem("user") || "{}")?.email || null; }
  catch { return null; }
};

export default function FloorplanPage() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [videoIntent, setVideoIntent] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Check URL param on mount + load saved rooms
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "video") {
      setVideoIntent(true);
      setPhase("upload");
    }
    if (params.get("fresh") === "1") {
      localStorage.removeItem(FLOORPLAN_DEMO_RESUME_KEY);
    }
    const storedEmail = getStoredUserEmail();
    setUserEmail(storedEmail);
    setAuthChecked(true);
    try {
      const savedVideos = JSON.parse(localStorage.getItem("floorplan_video_history") || "[]");
      if (Array.isArray(savedVideos)) setVideoHistory(savedVideos);
    } catch {
      setVideoHistory([]);
    }

    // Generate or restore session ID
    let sessionId = sessionStorage.getItem("floorplan_session_id");
    if (!sessionId) {
      sessionId = `fp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem("floorplan_session_id", sessionId);
    }
    setFloorplanSessionId(sessionId);

    // Load saved rooms for this user
    const loadRooms = async () => {
      const email = storedEmail;
      if (!email) { setRoomsLoaded(true); return; }
      const roomGroupsCacheKey = `floorplan_room_groups_${email}`;
      try {
        const cachedRaw = localStorage.getItem(roomGroupsCacheKey);
        if (cachedRaw !== null) {
          const cachedGroups = JSON.parse(cachedRaw);
          if (Array.isArray(cachedGroups)) {
            setAllUserRooms(cachedGroups.map((group: any) => ({
              ...group,
              rooms: Array.isArray(group.rooms) ? group.rooms.map((room: any) => normalizeRoomPhoto(room)) : [],
            })));
            setRoomsLoaded(true);
          }
        }
      } catch {
        localStorage.removeItem(roomGroupsCacheKey);
      }
      try {
        // Load rooms for current session
        const res = await fetch(`/api/floorplan/rooms?userId=${encodeURIComponent(email)}&sessionId=${encodeURIComponent(sessionId!)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.rooms?.length > 0) {
            const photos: RoomPhoto[] = data.rooms.map((r: any) => ({
              id: String(r.id || `${r.session_id}-${r.room_name}-${r.created_at || r.image_url}`),
              roomName: r.room_name,
              roomNameHe: r.room_name_he,
              imageData: r.image_url,
            }));
            setAllRoomPhotos(photos);
          }
        }

        // Load ALL rooms for video page (grouped by session)
        const allRes = await fetch(`/api/floorplan/rooms?userId=${encodeURIComponent(email)}`);
        if (allRes.ok) {
          const allData = await allRes.json();
          if (allData.rooms?.length > 0) {
            const grouped: Record<string, RoomPhoto[]> = {};
            for (const r of allData.rooms) {
              if (!grouped[r.session_id]) grouped[r.session_id] = [];
              grouped[r.session_id].push({
                id: String(r.id || `${r.session_id}-${r.room_name}-${r.created_at || r.image_url}`),
                roomName: r.room_name,
                roomNameHe: r.room_name_he,
                imageData: r.image_url,
              });
            }
            const groups = Object.entries(grouped).map(([sid, rooms]) => ({ sessionId: sid, rooms }));
            setAllUserRooms(groups);
            localStorage.setItem(roomGroupsCacheKey, JSON.stringify(groups));
          } else {
            setAllUserRooms([]);
            localStorage.setItem(roomGroupsCacheKey, "[]");
          }
        }

        const videoRes = await fetch(`/api/floorplan/video-history?userId=${encodeURIComponent(email)}`);
        if (videoRes.ok) {
          const videoData = await videoRes.json();
          if (Array.isArray(videoData.videos)) {
            const videos: VideoHistoryItem[] = videoData.videos.map((video: any) => ({
              id: video.id,
              videoUrl: video.video_url,
              fromRoomHe: video.from_room_he || "חדר התחלה",
              toRoomHe: video.to_room_he || "חדר סיום",
              createdAt: video.created_at,
            }));
            setVideoHistory(videos);
            localStorage.setItem("floorplan_video_history", JSON.stringify(videos));
          }
        }
      } catch (e) { console.error("Failed to load rooms:", e); }
      finally { setRoomsLoaded(true); }
    };
    loadRooms();
  }, []);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [customStyle, setCustomStyle] = useState("");
  const [floorplanNotes, setFloorplanNotes] = useState("");

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [floorplanResult, setFloorplanResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [selectedDemoFloorplan, setSelectedDemoFloorplan] = useState<DemoFloorplanKey>(DEMO_FLOORPLANS[0].key);

  const [floorplanClick, setFloorplanClick] = useState<ClickMarker | null>(null);
  const [detectedRoom, setDetectedRoom] = useState<RoomInfo | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(false);
  const [currentRoomPhoto, setCurrentRoomPhoto] = useState<RoomPhoto | null>(null);
  const [allRoomPhotos, setAllRoomPhotos] = useState<RoomPhoto[]>([]);
  const [floorplanSessionId, setFloorplanSessionId] = useState<string>("");

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
  const [allUserRooms, setAllUserRooms] = useState<{sessionId: string; rooms: RoomPhoto[]}[]>([]);
  const [videoHistory, setVideoHistory] = useState<VideoHistoryItem[]>([]);
  const [roomsLoaded, setRoomsLoaded] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loadingLabel, setLoadingLabel] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const furnitureInputRef = useRef<HTMLInputElement>(null);
  const floorplanImgRef = useRef<HTMLImageElement>(null);
  const roomImgRef = useRef<HTMLImageElement>(null);
  const styleSectionRef = useRef<HTMLDivElement>(null);

  const getEmail = useCallback(() => userEmail || getStoredUserEmail(), [userEmail]);
  const isLoggedIn = Boolean(getEmail());

  const getStyleLabel = useCallback(() => customStyle || STYLES.find((s) => s.key === selectedStyle)?.nameHe || "", [customStyle, selectedStyle]);

  const getStyleInstruction = useCallback(() => {
    const baseStyle = customStyle || selectedStyle || "";
    const notes = floorplanNotes.trim();
    return notes ? `${baseStyle}. דגשים לשינויים: ${notes}` : baseStyle;
  }, [customStyle, selectedStyle, floorplanNotes]);

  const trackFloorplanEvent = useCallback((eventName: string, targetUrl = "/floorplan") => {
    trackAcquisitionEvent("cta_click", { eventName, targetUrl });
  }, []);

  const getVideoRoomPhoto = useCallback((roomId: string | null) => {
    if (!roomId) return undefined;
    return allRoomPhotos.find((photo) => photo.id === roomId) || allRoomPhotos.find((photo) => photo.roomName === roomId);
  }, [allRoomPhotos]);

  const shouldBlurDemoRoom = false;

  const startDemoFloorplan = (demoKey: DemoFloorplanKey = selectedDemoFloorplan) => {
    const demo = DEMO_FLOORPLANS.find((item) => item.key === demoKey) || DEMO_FLOORPLANS[0];
    trackFloorplanEvent("floorplan_demo_start");
    setSelectedDemoFloorplan(demo.key);
    setDemoMode(true);
    setUploadedFile(null);
    setUploadedImage(demo.source);
    setFloorplanResult(null);
    setAllRoomPhotos([]);
    setCurrentRoomPhoto(null);
    setFloorplanClick(null);
    setError(null);
    setPhase("upload");
    window.setTimeout(() => styleSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
  };

  const resetToOwnFloorplanUpload = () => {
    localStorage.removeItem(FLOORPLAN_DEMO_RESUME_KEY);
    setDemoMode(false);
    setPhase("upload");
    setFloorplanResult(null);
    setUploadedImage(null);
    setUploadedFile(null);
    setSelectedStyle(null);
    setCustomStyle("");
    setFloorplanNotes("");
    setAllRoomPhotos([]);
    setCurrentRoomPhoto(null);
    setFloorplanClick(null);
    setError(null);
    const newSession = `fp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem("floorplan_session_id", newSession);
    setFloorplanSessionId(newSession);
  };

  const continueDemoAfterSignup = (action: FloorplanDemoResumeAction) => {
    if (action === "room") {
      trackFloorplanEvent("floorplan_room_click");
      setPhase("floorplan");
      return;
    }

    if (isLoggedIn) {
      resetToOwnFloorplanUpload();
      return;
    }

    trackFloorplanEvent("floorplan_signup_wall_seen", "/signup?redirect=/floorplan");
    const redirect = "/floorplan?fresh=1";
    localStorage.removeItem(FLOORPLAN_DEMO_RESUME_KEY);
    localStorage.setItem("authRedirect", redirect);
    window.location.href = `/signup?redirect=${encodeURIComponent(redirect)}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("resume") !== "demo-room") return;

    try {
      const raw = localStorage.getItem(FLOORPLAN_DEMO_RESUME_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as FloorplanDemoResumeState;
      const isRecent = Date.now() - Number(saved.createdAt || 0) < 1000 * 60 * 60 * 12;
      const demo = DEMO_FLOORPLANS.find((item) => item.key === saved.demoKey);
      if (!isRecent || saved.action !== "room" || !saved.floorplanResult || !demo) {
        localStorage.removeItem(FLOORPLAN_DEMO_RESUME_KEY);
        return;
      }

      setSelectedDemoFloorplan(saved.demoKey);
      setDemoMode(true);
      setUploadedFile(null);
      setUploadedImage(saved.uploadedImage || demo.source);
      setFloorplanResult(saved.floorplanResult);
      setSelectedStyle(saved.selectedStyle);
      setCustomStyle(saved.customStyle || "");
      setFloorplanNotes(saved.floorplanNotes || "");
      setAllRoomPhotos([]);
      setCurrentRoomPhoto(null);
      setFloorplanClick(null);
      setDetectedRoom(null);
      setVideoClickMode(false);
      setError(null);
      setPhase("floorplan");
    } catch (error) {
      console.error("Failed to restore floorplan demo resume:", error);
      localStorage.removeItem(FLOORPLAN_DEMO_RESUME_KEY);
    }
  }, []);

  const currentStep = () => {
    if (phase === "upload") return 1;
    if (phase === "floorplan-ready" || phase === "floorplan") return 2;
    return 3;
  };

  const isAnyLoading = loading || loadingRoom || loadingFurniture || swapping || videoLoading;

  // Shared: submit video + poll for result
  // Resize image to 1280x720 JPEG - handles both data URLs and remote URLs
  const resizeToJpeg = async (src: string): Promise<Blob> => {
    // For remote URLs: fetch as blob, convert to data URL, THEN load in Image
    // This avoids CORS canvas tainting issues
    let dataUrl = src;
    if (src.startsWith("http")) {
      const resp = await fetch(src);
      if (!resp.ok) throw new Error(`Failed to fetch image: ${resp.status}`);
      const blob = await resp.blob();
      if (blob.size === 0) throw new Error("Fetched image is empty");
      dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 1280; canvas.height = 720;
          const ctx = canvas.getContext("2d")!;
          const scale = Math.max(1280 / img.width, 720 / img.height);
          const w = img.width * scale; const h = img.height * scale;
          ctx.drawImage(img, (1280 - w) / 2, (720 - h) / 2, w, h);
          canvas.toBlob((b) => {
            if (b && b.size > 0) resolve(b);
            else reject(new Error("Canvas toBlob returned empty"));
          }, "image/jpeg", 0.85);
        } catch (e) { reject(e); }
      };
      img.onerror = () => reject(new Error("Failed to load image for resize"));
      img.src = dataUrl;
    });
  };

  const submitAndPollVideo = async (fd: FormData): Promise<string> => {
    setVideoProgress("שולח לייצור סרטון...");
    const res = await fetch("/api/floorplan/video", { method: "POST", body: fd });
    const data = await res.json();
    checkCredits(res, data);
    if (!res.ok) throw new Error(data.error || "Video generation failed");
    
    const predictionId = data.predictionId;
    if (!predictionId) throw new Error("No prediction ID");

    // Poll every 4 seconds from client
    for (let i = 0; i < 75; i++) { // 75 * 4s = 5 min max
      await new Promise((r) => setTimeout(r, 4000));
      
      const pollRes = await fetch(`/api/floorplan/video?id=${predictionId}`);
      const pollData = await pollRes.json();

      if (pollData.status === "succeeded") {
        if (pollData.videoUrl) {
          setVideoResult(pollData.videoUrl);
          setPhase("video-result");
          return pollData.videoUrl;
        }
        throw new Error("No video URL in response");
      }

      if (pollData.status === "failed" || pollData.error) {
        throw new Error(pollData.error || "Video generation failed");
      }

      // Update progress
      const progress = pollData.progress;
      if (progress) {
        setVideoProgress(`מייצר סרטון... ${progress}%`);
      } else {
        const elapsed = Math.min(Math.round((i * 4) / 60 * 100), 95);
        setVideoProgress(`מייצר סרטון... ${elapsed}%`);
      }
    }
    throw new Error("Video generation timed out");
  };

  const saveVideoHistory = useCallback((item: Omit<VideoHistoryItem, "id" | "createdAt"> & { prompt?: string }) => {
    const nextItem: VideoHistoryItem = {
      ...item,
      id: `video_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };
    setVideoHistory((prev) => {
      const next = [nextItem, ...prev].slice(0, 12);
      localStorage.setItem("floorplan_video_history", JSON.stringify(next));
      return next;
    });
    const email = getEmail();
    if (email) {
      fetch("/api/floorplan/video-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: email,
          videoUrl: item.videoUrl,
          fromRoomHe: item.fromRoomHe,
          toRoomHe: item.toRoomHe,
          prompt: item.prompt || null,
        }),
      }).catch((e) => console.error("Failed to save video history:", e));
    }
  }, []);

  const startVideoFromRoomGroup = (sessionId: string, rooms: RoomPhoto[]) => {
    setFloorplanSessionId(sessionId);
    setAllRoomPhotos(rooms.map((room) => normalizeRoomPhoto(room)));
    setCurrentRoomPhoto(null);
    setVideoFromRoom(null);
    setVideoToRoom(null);
    setVideoClickMode(false);
    setVideoClickA(null);
    setVideoClickB(null);
    setPhase("video-select");
  };

  // Save room photo to DB (fire and forget)
  const saveRoomToDB = useCallback((photo: RoomPhoto) => {
    const email = getEmail();
    if (!email || !floorplanSessionId) return;
    fetch("/api/floorplan/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: email,
        sessionId: floorplanSessionId,
        roomName: photo.roomName,
        roomNameHe: photo.roomNameHe,
        imageData: photo.imageData,
        style: getStyleInstruction(),
      }),
    })
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        const cachedPhoto = data.imageUrl ? { ...photo, imageData: data.imageUrl, id: data.roomId || photo.id } : photo;
        setAllUserRooms((prev) => {
          const next = [...prev];
          const groupIndex = next.findIndex((group) => group.sessionId === floorplanSessionId);
          if (groupIndex >= 0) {
            const rooms = next[groupIndex].rooms.filter((room) => room.id !== cachedPhoto.id);
            next[groupIndex] = { ...next[groupIndex], rooms: [...rooms, cachedPhoto] };
          } else {
            next.unshift({ sessionId: floorplanSessionId, rooms: [cachedPhoto] });
          }
          localStorage.setItem(`floorplan_room_groups_${email}`, JSON.stringify(next));
          return next;
        });
      })
      .catch((e) => console.error("Failed to save room:", e));
  }, [floorplanSessionId, getStyleInstruction]);

  // === File handlers ===
  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDemoMode(false);
    setUploadedFile(file);
    setFloorplanResult(null);
    setError(null);
    setPhase("upload");
    const reader = new FileReader();
    reader.onload = (ev) => { setUploadedImage(ev.target?.result as string); trackAction('floorplan', '/floorplan'); };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setDemoMode(false);
    setUploadedFile(file);
    setFloorplanResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => { setUploadedImage(ev.target?.result as string); trackAction('floorplan', '/floorplan'); };
    reader.readAsDataURL(file);
  }, []);

  // === Step 1 ===
  const generateFloorplan = async () => {
    const selectedDemo = DEMO_FLOORPLANS.find((item) => item.key === selectedDemoFloorplan);
    const isDemoGeneration = demoMode && !!selectedDemo && uploadedImage === selectedDemo.source;
    if ((!uploadedFile && !isDemoGeneration) || (!selectedStyle && !customStyle)) return;
    if (isDemoGeneration) {
      setLoading(true);
      setLoadingLabel("ה-AI יוצר הדמיית דוגמה...");
      setError(null);
      try {
        const formData = new FormData();
        formData.append("demo", "true");
        formData.append("demoKey", selectedDemoFloorplan);
        formData.append("style", getStyleInstruction());
        const res = await fetch("/api/floorplan", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "AI generation failed");
        if (!data.image) throw new Error(data.text || "No image returned");
        const result = `data:${data.image.mimeType};base64,${data.image.data}`;
        setFloorplanResult(result);
        setPhase("floorplan-ready");
        trackFloorplanEvent("floorplan_demo_complete");
        clearAction();
      } catch (err: any) {
        setError(err.message || "AI generation failed");
      } finally {
        setLoading(false);
        setLoadingLabel("");
      }
      return;
    }

    const file = uploadedFile;
    if (!file) return;

    const email = getEmail();
    if (!email) {
      trackFloorplanEvent("floorplan_signup_wall_seen", videoIntent ? "/signup?redirect=/floorplan?mode=video" : "/signup?redirect=/floorplan");
      window.location.href = `/signup?redirect=${encodeURIComponent(videoIntent ? "/floorplan?mode=video" : "/floorplan")}`;
      return;
    }
    setLoading(true);
    setLoadingLabel("יוצר הדמיה מלמעלה...");
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("style", getStyleInstruction());
      formData.append("email", email);
      const res = await fetch("/api/floorplan", { method: "POST", body: formData });
      const data = await res.json();
      checkCredits(res, data); if (!res.ok) throw new Error(data.error || "AI generation failed");
      if (data.image) {
        const result = `data:${data.image.mimeType};base64,${data.image.data}`;
        setFloorplanResult(result);
        if (videoIntent) {
          setVideoClickMode(true);
          setVideoClickA(null);
          setVideoClickB(null);
          setPhase("floorplan");
        } else {
          setPhase("floorplan-ready");
        }
        clearAction();
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
      if (demoMode && !getEmail()) fd1.append("demoRoom", "true");
      const detectRes = await fetch("/api/floorplan/detect-room", { method: "POST", body: fd1 });
      const roomInfo = await detectRes.json();
      checkCredits(detectRes, roomInfo); if (!detectRes.ok) throw new Error(roomInfo.error);
      setDetectedRoom(roomInfo);
      setLoadingLabel(`יוצר צילום של ה${roomInfo.roomHe}...`);
      const fd2 = new FormData();
      fd2.append("floorplan", blob, "floorplan.png");
      fd2.append("room", roomInfo.room);
      fd2.append("style", getStyleInstruction() || "modern-cabin");
      fd2.append("email", getEmail() || "");
      if (demoMode && !getEmail()) fd2.append("demoRoom", "true");
      const roomRes = await fetch("/api/floorplan/room", { method: "POST", body: fd2 });
      const roomData = await roomRes.json();
      checkCredits(roomRes, roomData); if (!roomRes.ok) throw new Error(roomData.error);
      if (roomData.image) {
        const photo: RoomPhoto = {
          id: createRoomPhotoId(roomInfo.room),
          roomName: roomInfo.room, roomNameHe: roomInfo.roomHe,
          imageData: `data:${roomData.image.mimeType};base64,${roomData.image.data}`,
        };
        setCurrentRoomPhoto(photo);
        setAllRoomPhotos((prev) => [...prev, photo]);
        saveRoomToDB(photo);
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
      // Both clicks ready - generate both rooms in parallel
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
          if (demoMode && !email) fd1.append("demoRoom", "true");
          const detectRes = await fetch("/api/floorplan/detect-room", { method: "POST", body: fd1 });
          const roomInfo = await detectRes.json();
          if (!detectRes.ok) throw new Error(roomInfo.error);

          const fd2 = new FormData();
          fd2.append("floorplan", blob, "floorplan.png");
          fd2.append("room", roomInfo.room);
          fd2.append("style", getStyleInstruction() || "modern-cabin");
          fd2.append("email", email);
          if (demoMode && !email) fd2.append("demoRoom", "true");
          const roomRes = await fetch("/api/floorplan/room", { method: "POST", body: fd2 });
          const roomData = await roomRes.json();
          if (!roomRes.ok) throw new Error(roomData.error);

          return {
            id: createRoomPhotoId(roomInfo.room),
            roomName: roomInfo.room,
            roomNameHe: roomInfo.roomHe,
            imageData: `data:${roomData.image.mimeType};base64,${roomData.image.data}`,
          } as RoomPhoto;
        };

        const [roomA, roomB] = await Promise.all([
          generateRoom(videoClickA),
          generateRoom(click),
        ]);

        // Add to allRoomPhotos + save to DB
        setAllRoomPhotos((prev) => {
          return [...prev, roomA, roomB];
        });
        saveRoomToDB(roomA);
        saveRoomToDB(roomB);

        // Go directly to video select with these 2 rooms pre-selected
        setVideoFromRoom(roomA.id);
        setVideoToRoom(roomB.id);
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
    const fromPhoto = getVideoRoomPhoto(videoFromRoom);
    const toPhoto = getVideoRoomPhoto(videoToRoom);
    if (!fromPhoto || !toPhoto) return;
    setVideoLoading(true);
    setVideoResult(null);
    setVideoProgress("מכין תמונות...");
    setLoadingLabel("מייצר סרטון סיור...");
    setError(null);
    try {
      setVideoProgress("ממיר תמונות...");
      const firstBlob = await resizeToJpeg(fromPhoto.imageData);
      const lastBlob = await resizeToJpeg(toPhoto.imageData);
      const fd = new FormData();
      fd.append("firstFrame", firstBlob, "first.jpg");
      fd.append("lastFrame", lastBlob, "last.jpg");
      const basePrompt = `Smooth steadicam walkthrough from a ${fromPhoto.roomName} into a ${toPhoto.roomName}. The camera starts inside the ${fromPhoto.roomName}, turns toward a real visible doorway, and exits only through that doorway. It then physically follows the natural apartment path through a bright hallway or corridor if one is needed, and enters the ${toPhoto.roomName} only through its doorway. The route must respect normal apartment architecture: walls remain solid and continuous, doorframes remain visible, and the camera never passes through, dissolves through, cuts through, erases, opens, breaks, or morphs any wall. If the two rooms are not directly adjacent, show the hallway/corridor connection between them. Keep floor, ceiling, side walls, corners, and doorframes visible throughout the move so the viewer understands the path. Photorealistic interior design showcase, bright warm natural daylight, fluid cinematic camera, never stopping.`;
      const fullPrompt = videoCustomPrompt.trim() ? `${basePrompt} Additional details: ${videoCustomPrompt.trim()}` : basePrompt;
      fd.append("prompt", fullPrompt);
      fd.append("email", getEmail() || "");
      const videoUrl = await submitAndPollVideo(fd);
      saveVideoHistory({
        videoUrl,
        fromRoomHe: fromPhoto.roomNameHe,
        toRoomHe: toPhoto.roomNameHe,
        prompt: videoCustomPrompt.trim(),
      });
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
                if (s.num === 2 && floorplanResult) {
                  setCurrentRoomPhoto(null);
                  if (videoIntent) {
                    setVideoClickMode(true);
                    setPhase("floorplan");
                  } else {
                    setPhase("floorplan-ready");
                  }
                }
                if (s.num === 3 && allRoomPhotos.length > 0) {
                  if (!currentRoomPhoto) setCurrentRoomPhoto(allRoomPhotos[allRoomPhotos.length - 1]);
                  setPhase(videoIntent ? "video-select" : "room-actions");
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
      {!videoLoading && <ProgressBar active={isAnyLoading} label={loadingLabel} />}

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
                {videoIntent ? (
                  <>מסרטון סיור ל<span className="text-emerald-600">דירה זורמת</span></>
                ) : (
                  <>מתוכנית קומה ל<span className="text-emerald-600">חדרים ומוצרים</span></>
                )}
              </h1>
              <p className="text-gray-500 max-w-lg mx-auto">
                {videoIntent
                  ? "התחילו מתוכנית קומה, בחרו סגנון, ואז סמנו שני חדרים על ההדמיה מלמעלה ליצירת סיור."
                  : "ראו מהר איך שרטוט הופך להדמיה, לחדרים מעוצבים ולרעיונות למוצרים שאפשר לחפש אחר כך"}
              </p>
            </div>

            {videoIntent && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">היסטוריית תוכניות וחדרים</h3>
                    <p className="text-sm text-gray-500 mt-1">בחרו הדמיה קיימת עם חדרים שכבר נוצרו, או העלו תוכנית חדשה למטה.</p>
                  </div>
                  {!roomsLoaded ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Spinner className="h-4 w-4" />
                      טוען היסטוריה...
                    </div>
                  ) : allUserRooms.filter((group) => group.rooms.length >= 2).length > 0 ? (
                    <div className="space-y-3">
                      {allUserRooms.filter((group) => group.rooms.length >= 2).slice(0, 4).map((group, index) => (
                        <button
                          key={group.sessionId}
                          onClick={() => startVideoFromRoomGroup(group.sessionId, group.rooms)}
                          className="w-full bg-white border border-gray-200 hover:border-gray-900 rounded-xl p-3 text-right transition-all"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs text-gray-400">הדמיה {index + 1}</span>
                            <span className="text-xs font-medium text-emerald-700">{group.rooms.length} חדרים</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5 mt-2">
                            {group.rooms.slice(0, 4).map((room, roomIndex) => (
                              <img
                                key={`${group.sessionId}-${room.roomName}-${roomIndex}`}
                                src={room.imageData}
                                alt={room.roomNameHe}
                                className="aspect-[4/3] w-full rounded-lg object-cover"
                              />
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">בחרו שני חדרים מההדמיה הזאת לסרטון</p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">אין עדיין תוכניות עם שני חדרים מוכנים. העלו תוכנית חדשה והמערכת תעביר אתכם לבחירת שני חדרים.</p>
                  )}
                </div>

                <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">היסטוריית סרטונים</h3>
                    <p className="text-sm text-gray-500 mt-1">סרטונים שנוצרו במכשיר הזה יופיעו כאן לצפייה או הורדה.</p>
                  </div>
                  {videoHistory.length > 0 ? (
                    <div className="space-y-3">
                      {videoHistory.slice(0, 4).map((video) => (
                        <div key={video.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                          <video src={video.videoUrl} controls className="w-full aspect-video bg-black" />
                          <div className="p-3 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{video.fromRoomHe} → {video.toRoomHe}</p>
                              <p className="text-xs text-gray-400">{new Date(video.createdAt).toLocaleDateString("he-IL")}</p>
                            </div>
                            <a href={video.videoUrl} download="walkthrough.mp4" className="text-xs font-medium text-gray-900 hover:text-emerald-700">
                              הורדה
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">עדיין אין סרטונים שמורים במכשיר הזה.</p>
                  )}
                </div>
              </div>
            )}

            {!videoIntent && (
              <div className="rounded-[28px] border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="mx-auto mb-5 max-w-lg overflow-hidden rounded-3xl border border-gray-100 bg-gray-950 shadow-sm">
                  <img
                    src={FLOORPLAN_WINNING_AD_IMAGE}
                    alt="מתוכנית קומה להדמיית AI של בית מעוצב"
                    className="h-auto w-full object-contain"
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-[1fr_520px] md:items-start">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-500">דוגמה חינמית ללא הרשמה</p>
                    <h2 className="mt-1 text-xl font-black text-gray-900">נסו דוגמה: שרטוט → חדר → מוצרים</h2>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">
                      התחילו משרטוט מובנה, בחרו סגנון, קבלו הדמיה מלמעלה ואז לחצו על חדר כדי לראות אותו מבפנים. הדוגמה לא דורשת הרשמה ולא משתמשת בקרדיטים.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {DEMO_FLOORPLANS.map((demo) => {
                      const selected = demoMode && selectedDemoFloorplan === demo.key;
                      return (
                        <button
                          key={demo.key}
                          type="button"
                          onClick={() => startDemoFloorplan(demo.key)}
                          disabled={loading}
                          className={`group overflow-hidden rounded-2xl border bg-white text-right shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                            selected ? "border-gray-950 ring-2 ring-gray-950/10" : "border-gray-200 hover:border-gray-400 hover:shadow-md"
                          }`}
                        >
                          <div className="flex aspect-[3/4] w-full items-center justify-center bg-gray-50 p-2">
                            <img src={demo.source} alt={demo.title} className="h-full w-full object-contain transition-transform group-hover:scale-[1.04]" />
                          </div>
                          <div className="flex items-center justify-between px-3 py-2">
                            <span className="text-xs font-bold text-gray-900">{demo.title}</span>
                            <span className="text-[11px] font-bold text-gray-500">
                              {selected ? "נבחר" : "בחרו"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Upload area */}
            <div>
              <label className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
                <span className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs">א</span>
                {videoIntent ? "העלאת תוכנית קומה" : "או העלאת תוכנית קומה משלכם"}
              </label>
              <div
                className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all cursor-pointer sm:p-6 ${
                  uploadedImage ? "border-emerald-300 bg-emerald-50/50" : "border-gray-300 hover:border-gray-400 bg-gray-50"
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                {uploadedImage ? (
                  <div className="space-y-2">
                    <img src={uploadedImage} alt="Floor plan" className="mx-auto max-h-[420px] w-auto max-w-full rounded-xl object-contain shadow-sm md:max-h-[520px]" />
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
            <div ref={styleSectionRef}>
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
              <div className="mt-3">
                <label className="mb-1.5 block text-xs font-semibold text-gray-500">פירוט לשינויים (אופציונלי)</label>
                <textarea
                  value={floorplanNotes}
                  onChange={(e) => setFloorplanNotes(e.target.value)}
                  placeholder="למשל: לפתוח את הסלון, להוסיף אי במטבח, יותר אור טבעי, לשמור על שני חדרי שינה..."
                  className="min-h-24 w-full resize-none rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-gray-400 focus:outline-none"
                  dir="rtl"
                />
              </div>
            </div>

            <button onClick={generateFloorplan} disabled={(!uploadedFile && !demoMode) || (!selectedStyle && !customStyle) || loading}
              className={`w-full py-4 rounded-full font-bold text-lg transition-all ${
                (!uploadedFile && !demoMode) || (!selectedStyle && !customStyle) || loading
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-900 text-white hover:bg-gray-800 shadow-xl hover:shadow-2xl"
              }`}>
              {loading ? (
                <span className="flex items-center justify-center gap-2"><Spinner className="h-5 w-5" /> יוצר הדמיה...</span>
              ) : demoMode ? "נסו דוגמה עכשיו →" : !isLoggedIn && uploadedFile ? "הירשמו כדי ליצור מתוכנית משלכם →" : videoIntent ? "צור תוכנית ובחר 2 חדרים →" : "צור הדמיה →"}
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">
              {!authChecked
                ? "דוגמה מובנית ללא קרדיטים"
                : isLoggedIn
                ? "דוגמה מובנית ללא קרדיטים · העלאת תוכנית משלכם משתמשת בקרדיטים"
                : "דוגמה מובנית ללא קרדיטים · העלאת תוכנית משלכם דורשת הרשמה"}
            </p>

            {loading && demoMode && (
              <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/70 p-4 text-right shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm">
                    <Spinner className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900">הדמו עובר עכשיו דרך ה-AI</p>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">
                      מנתח את שרטוט הדוגמה, מיישם את הסגנון שבחרתם ומחזיר הדמיה חדשה.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* How it works */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <h3 className="text-base font-bold text-gray-900 mb-3">איך זה עובד?</h3>
              <div className="text-gray-500 text-sm space-y-2">
                <p><strong className="text-gray-700">1.</strong> העלו תוכנית קומה, בחרו סגנון - קבלו הדמיה מלמעלה</p>
                <p><strong className="text-gray-700">2.</strong> לחצו על חדר בהדמיה - ה-AI יוצר צילום פנים ריאליסטי</p>
                <p><strong className="text-gray-700">3.</strong> החליפו רהיטים או צרו סרטון סיור בדירה</p>
              </div>
            </div>
          </>
        )}

        {/* ======== STEP 2: Floorplan ready - choose action ======== */}
        {phase === "floorplan-ready" && floorplanResult && (
          <>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">ההדמיה מוכנה</h2>
              <p className="text-gray-500">מה תרצו לעשות עם התוכנית?</p>
              <p className="text-xs text-gray-400">הדמיית AI להמחשה בלבד</p>
            </div>

            {demoMode ? (
              <div className="mx-auto max-w-3xl overflow-hidden rounded-[28px] border-2 border-emerald-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
                <div className="bg-gradient-to-l from-emerald-50 via-white to-sky-50 px-4 py-3 text-center">
                  <p className="text-xs font-black text-emerald-700">דוגמת ההדמיה</p>
                  <p className="mt-1 text-sm font-bold text-gray-900">{getStyleLabel()}</p>
                </div>
                <div className="bg-white p-2 sm:p-4">
                  <img
                    src={floorplanResult}
                    alt="הדמיית דוגמה מוכנה"
                    className="aspect-[900/620] w-full rounded-2xl object-contain"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-w-3xl mx-auto">
                <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                  <img src={uploadedImage!} alt="Original" className="w-full" />
                  <div className="text-center text-xs text-gray-400 py-1.5 bg-gray-50">תוכנית מקורית</div>
                </div>
                <div className="rounded-2xl overflow-hidden border-2 border-emerald-200 shadow-sm">
                  <img src={floorplanResult} alt="Rendering" className="w-full" />
                  <div className="text-center text-xs text-emerald-600 py-1.5 bg-emerald-50">
                    {getStyleLabel()}
                  </div>
                </div>
              </div>
            )}

            {demoMode ? (
              <div className="mx-auto max-w-3xl rounded-[28px] border border-emerald-200 bg-gradient-to-l from-emerald-50 via-white to-sky-50 p-5 text-center shadow-sm">
                <p className="text-xs font-black text-emerald-700">הדוגמה הסתיימה ללא שימוש בקרדיטים</p>
                <h3 className="mt-2 text-2xl font-black leading-tight text-gray-950">
                  רוצים לראות איך חדר ספציפי נראה?
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  אפשר להמשיך מהדוגמה שכבר יצרתם, או להתחיל מחדש עם שרטוט אמיתי שלכם.
                </p>
                {!isLoggedIn && (
                  <p className="mt-2 text-xs font-bold text-gray-500">
                    את החדר הראשון בדוגמה אפשר לראות בלי הרשמה. המשך עם תוכנית אמיתית דורש הרשמה.
                  </p>
                )}
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => continueDemoAfterSignup("room")}
                    className="group rounded-2xl border-2 border-gray-950 bg-gray-950 p-4 text-right text-white shadow-lg transition-all hover:bg-gray-800"
                  >
                    <span className="block text-base font-black">לראות חדר מתוך הדוגמה</span>
                    <span className="mt-1 block text-xs leading-relaxed text-white/70">
                      {isLoggedIn
                        ? "תעברו ישר לבחירת חדר על ההדמיה הזאת."
                        : "תעברו ישר לבחירת חדר על ההדמיה הזאת, בלי הרשמה ובלי קרדיטים."}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => continueDemoAfterSignup("own")}
                    className="rounded-2xl border border-gray-200 bg-white p-4 text-right shadow-sm transition-all hover:border-gray-400 hover:shadow-md"
                  >
                    <span className="block text-base font-black text-gray-950">לנסות על השרטוט שלי</span>
                    <span className="mt-1 block text-xs leading-relaxed text-gray-500">
                      {isLoggedIn
                        ? "נפתח לכם את מסך ההעלאה מחדש, נקי מהדוגמה."
                        : "אחרי ההרשמה תחזרו ל־Floorplan נקי ותעלו תוכנית משלכם."}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
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
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
              <Link
                href="/visualize"
                onClick={() => trackFloorplanEvent("floorplan_to_visualize_click", "/visualize")}
                className="bg-white border-2 border-gray-200 hover:border-gray-900 rounded-2xl p-4 text-center transition-all"
              >
                <div className="font-bold text-gray-900 text-sm">רוצים רק לעצב חדר?</div>
                <div className="text-xs text-gray-400 mt-1">עברו להדמיה רגילה ומהירה</div>
              </Link>
              <Link
                href="/shop-look"
                onClick={() => trackFloorplanEvent("floorplan_to_shoplook_click", "/shop-look")}
                className="bg-white border-2 border-gray-200 hover:border-gray-900 rounded-2xl p-4 text-center transition-all"
              >
                <div className="font-bold text-gray-900 text-sm">מצאו מוצרים דומים</div>
                <div className="text-xs text-gray-400 mt-1">המשיכו ל-Shop the Look</div>
              </Link>
            </div>

            {/* Room thumbnails if any */}
            {allRoomPhotos.length > 0 && (
              <div className="space-y-3 max-w-3xl mx-auto">
                <h3 className="text-sm font-semibold text-gray-500">חדרים שנוצרו ({allRoomPhotos.length})</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                  {allRoomPhotos.map((photo) => (
                    <button key={photo.id} onClick={() => { setCurrentRoomPhoto(photo); setPhase("room-actions"); }}
                      className="rounded-xl overflow-hidden border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all">
                      <img src={photo.imageData} alt={photo.roomNameHe} className="w-full aspect-[4/3] object-cover" />
                      <div className="text-center text-[10px] text-gray-500 py-1 bg-gray-50">{getRoomDisplayName(photo, allRoomPhotos)}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Start fresh */}
            <div className="text-center">
              <button onClick={resetToOwnFloorplanUpload}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors">תוכנית חדשה</button>
            </div>
          </>
        )}

        {/* ======== STEP 2b: Floorplan - click rooms ======== */}
        {phase === "floorplan" && floorplanResult && (
          <>
            <div className="flex items-center justify-between mb-2">
              {videoClickMode ? (
                <button onClick={() => { setVideoClickMode(false); setVideoClickA(null); setVideoClickB(null); }}
                  className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200">ביטול מצב סרטון</button>
              ) : <div />}
              <button onClick={() => { setPhase(videoIntent ? "upload" : "floorplan-ready"); setVideoClickMode(false); }}
                className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200">← חזרה</button>
            </div>

            {videoClickMode ? (
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-center">
                <p className="text-purple-800 font-medium text-sm">
                  {!videoClickA ? "🎬 לחצו על החדר הראשון (A) - תחילת הסרטון" :
                   generatingBothRooms ? "מזהה ויוצר 2 חדרים במקביל..." :
                   "עכשיו לחצו על החדר השני (B) - סוף הסרטון"}
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
                    ? `🎬 מצב סרטון - ${videoClickA ? "1/2 נבחרו" : "בחרו חדר A"}`
                    : `${getStyleLabel()} - לחצו על חדר`}
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
                  {allRoomPhotos.map((photo) => (
                    <button key={photo.id} onClick={() => { setCurrentRoomPhoto(photo); setPhase("room-actions"); }}
                      className="rounded-xl overflow-hidden border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all">
                      <img src={photo.imageData} alt={photo.roomNameHe} className="w-full aspect-[4/3] object-cover" />
                      <div className="text-center text-[10px] text-gray-500 py-1 bg-gray-50">{getRoomDisplayName(photo, allRoomPhotos)}</div>
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

            {/* Room Info Card */}
            <div className="max-w-2xl mx-auto bg-gray-50 rounded-2xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{ROOM_PURPOSES.find(r => r.key === currentRoomPhoto.roomName || r.label === currentRoomPhoto.roomNameHe)?.icon || "🏠"}</span>
                  <span className="font-medium text-gray-900">{currentRoomPhoto.roomNameHe}</span>
                </div>
                {detectedRoom?.dimensions && (
                  <span className="text-sm text-gray-500 font-mono">
                    {detectedRoom.dimensions.width}×{detectedRoom.dimensions.height} מ׳
                  </span>
                )}
              </div>
              {detectedRoom && (
                <p className="text-sm text-gray-500 mb-3">{getRoomDescriptionHe(detectedRoom)}</p>
              )}
              {/* Change Purpose */}
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs text-gray-400 self-center ml-1">שנה ייעוד:</span>
                {ROOM_PURPOSES.filter(r => r.label !== currentRoomPhoto.roomNameHe).slice(0, 6).map(r => (
                  <button
                    key={r.key}
                    onClick={async () => {
                      setCurrentRoomPhoto({ ...currentRoomPhoto, roomName: r.key, roomNameHe: r.label });
                      setDetectedRoom(detectedRoom ? { ...detectedRoom, room: r.key, roomHe: r.label } : null);
                      // Re-generate room with new purpose
                      setLoadingRoom(true);
                      setLoadingLabel(`מייצר ${r.label}...`);
                      setPhase("floorplan");
                      try {
                        const blob = await (await fetch(floorplanResult!)).blob();
                        const fd = new FormData();
                        fd.append("floorplan", blob, "floorplan.png");
                        fd.append("room", r.key);
                        fd.append("style", getStyleInstruction() || "modern-cabin");
                        fd.append("email", getEmail() || "");
                        if (demoMode && !getEmail()) fd.append("demoRoom", "true");
                        const res = await fetch("/api/floorplan/room", { method: "POST", body: fd });
                        const data = await res.json();
                        checkCredits(res, data); if (!res.ok) throw new Error(data.error);
                        if (data.image) {
                          const photo: RoomPhoto = {
                            id: currentRoomPhoto.id,
                            roomName: r.key, roomNameHe: r.label,
                            imageData: `data:${data.image.mimeType};base64,${data.image.data}`,
                          };
                          setCurrentRoomPhoto(photo);
                          setAllRoomPhotos(prev => {
                            const filtered = prev.filter(p => p.id !== currentRoomPhoto.id);
                            return [...filtered, photo];
                          });
                          saveRoomToDB(photo);
                          setPhase("room-actions");
                        }
                      } catch (err: any) { setError(err.message); setPhase("room-actions"); }
                      finally { setLoadingRoom(false); setLoadingLabel(""); }
                    }}
                    className="text-xs px-2.5 py-1 bg-white border border-gray-200 rounded-full hover:border-gray-900 hover:bg-gray-50 transition-all text-gray-600 hover:text-gray-900"
                  >
                    {r.icon} {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm max-w-2xl mx-auto bg-gray-100">
              <img
                src={currentRoomPhoto.imageData}
                alt={currentRoomPhoto.roomNameHe}
                className={`w-full transition-all duration-500 ${shouldBlurDemoRoom ? "scale-[1.03] blur-md brightness-90" : ""}`}
              />
              {shouldBlurDemoRoom && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/20 px-5 text-center backdrop-blur-[1px]">
                  <div className="max-w-sm rounded-[24px] border border-white/70 bg-white/90 px-5 py-4 shadow-xl">
                    <p className="text-xs font-black text-emerald-700">תצוגה מקדימה מהדוגמה</p>
                    <h3 className="mt-1 text-lg font-black text-gray-950">רוצים לראות חדר ברור מהשרטוט שלכם?</h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">
                      העלו תוכנית אמיתית וקבלו צילום פנים מלא לפי הסגנון שבחרתם.
                    </p>
                    <button
                      type="button"
                      onClick={resetToOwnFloorplanUpload}
                      className="mt-3 inline-flex items-center justify-center rounded-full bg-gray-950 px-5 py-2.5 text-sm font-black text-white transition-colors hover:bg-gray-800"
                    >
                      לנסות על השרטוט שלי
                    </button>
                  </div>
                </div>
              )}
            </div>

            {!shouldBlurDemoRoom && <p className="text-center text-gray-500 text-sm">מה תרצו לעשות עם החדר?</p>}

            {!shouldBlurDemoRoom && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
              <button
                onClick={() => {
                  if (demoMode && !isLoggedIn) {
                    trackFloorplanEvent("floorplan_signup_wall_seen", "/signup?redirect=/floorplan");
                    window.location.href = `/signup?redirect=${encodeURIComponent("/floorplan?fresh=1")}`;
                    return;
                  }
                  setPhase("furniture-click"); setRoomClick(null); setDetectedFurniture(null);
                }}
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
                  if (demoMode && !isLoggedIn) {
                    trackFloorplanEvent("floorplan_signup_wall_seen", "/signup?redirect=/floorplan");
                    window.location.href = `/signup?redirect=${encodeURIComponent("/floorplan?fresh=1")}`;
                    return;
                  }
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
                    : `צרו עוד ${2 - allRoomPhotos.length} חדר/ים - לחצו לחזור`}
                </div>
              </button>
            </div>}

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
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">או - תארו מה אתם רוצים</h3>
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
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">או - העלו רהיט ספציפי</h3>
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
                    (!selectedSuggestion && !furnitureFile && !customFurnitureText?.trim()) || swapping ? "bg-gray-200 text-gray-400"
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
                    {selected === 0 && "בחרו את החדר הראשון - תחילת הסרטון"}
                    {selected === 1 && "עכשיו בחרו את החדר השני - סוף הסרטון"}
                    {selected === 2 && "מעולה - לחצו ליצירת הסרטון"}
                  </p>
                  <p className="text-gray-400 text-xs">המצלמה תזוז מחדר אחד לשני - מעבר חלק, בלי חתכים</p>
                </div>
              );
            })()}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
              {allRoomPhotos.map((photo) => {
                const label = getRoomDisplayName(photo, allRoomPhotos);
                const isFrom = videoFromRoom === photo.id || videoFromRoom === photo.roomName;
                const isTo = videoToRoom === photo.id || videoToRoom === photo.roomName;
                const isSelected = isFrom || isTo;
                return (
                  <button key={photo.id} onClick={() => {
                    if (isFrom) { setVideoFromRoom(null); return; }
                    if (isTo) { setVideoToRoom(null); return; }
                    if (!videoFromRoom) { setVideoFromRoom(photo.id); }
                    else if (!videoToRoom) { setVideoToRoom(photo.id); }
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
                      {label}
                      {isFrom && " - התחלה"}
                      {isTo && " - סיום"}
                    </div>
                  </button>
                );
              })}
            </div>

            {videoFromRoom && videoToRoom && (
              <div className="flex items-center justify-center gap-3 text-sm">
                <span className="px-3 py-1.5 bg-gray-100 rounded-full text-gray-700 font-medium">
                  {(() => {
                    const photo = getVideoRoomPhoto(videoFromRoom);
                    return photo ? getRoomDisplayName(photo, allRoomPhotos) : "";
                  })()}
                </span>
                <span className="text-gray-300">→</span>
                <span className="px-3 py-1.5 bg-gray-100 rounded-full text-gray-700 font-medium">
                  {(() => {
                    const photo = getVideoRoomPhoto(videoToRoom);
                    return photo ? getRoomDisplayName(photo, allRoomPhotos) : "";
                  })()}
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

            <button onClick={() => {
              if (videoIntent || !currentRoomPhoto) {
                if (floorplanResult) {
                  setVideoClickMode(true);
                  setPhase("floorplan");
                } else {
                  setPhase("upload");
                }
                return;
              }
              setPhase("room-actions");
            }}
              className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">← חזרה</button>
          </>
        )}

        {/* ======== Video result ======== */}
        {phase === "video-result" && videoResult && (
          <>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-gray-900">הסרטון מוכן</h2>
              <p className="text-gray-500 text-sm">
                {(() => {
                  const fromPhoto = getVideoRoomPhoto(videoFromRoom);
                  const toPhoto = getVideoRoomPhoto(videoToRoom);
                  return `${fromPhoto ? getRoomDisplayName(fromPhoto, allRoomPhotos) : ""} → ${toPhoto ? getRoomDisplayName(toPhoto, allRoomPhotos) : ""}`;
                })()}
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
              <button onClick={() => {
                if (videoIntent) {
                  if (floorplanResult) {
                    setVideoClickMode(true);
                    setPhase("floorplan");
                  } else {
                    setPhase("upload");
                  }
                } else {
                  setPhase("floorplan-ready");
                }
                setCurrentRoomPhoto(null);
              }}
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
