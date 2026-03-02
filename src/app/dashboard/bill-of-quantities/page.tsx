"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LoadingScreen from "@/components/LoadingScreen";
import FlappyBirdGame from "@/components/FlappyBirdGame";

// Types
interface BOQSummary {
  totalArea: { label: string; value: string; unit: string };
  rooms: { label: string; value: string; unit: string };
  walls: { label: string; value: string; unit: string };
  doors: { label: string; value: string; unit: string };
  windows: { label: string; value: string; unit: string };
}

interface BOQItem {
  category: string;
  description: string;
  quantity: string;
  unit: string;
  notes: string;
  source?: string; // "תכנית" | "הערכה" | "חישוב"
}

interface BOQResult {
  summary: BOQSummary;
  items: BOQItem[];
  notes: string[];
  accuracyScore?: number;
  error?: string;
  suggestion?: string;
  disclaimer?: string;
}

// Accuracy calculation based on provided inputs
interface AccuracyInputs {
  hasBlueprint: boolean;
  hasScale: boolean;
  hasCeilingHeight: boolean;
  hasWallType: boolean;
  hasWallThickness: boolean;
  hasFloorType: boolean;
  hasElectricalPoints: boolean;
  hasPlumbingPlan: boolean;
}

const calculateAccuracy = (inputs: AccuracyInputs): number => {
  let score = 0;
  if (inputs.hasBlueprint) score += 27;
  if (inputs.hasScale) score += 22;
  if (inputs.hasCeilingHeight) score += 9;
  if (inputs.hasWallType) score += 8;
  if (inputs.hasWallThickness) score += 5;
  if (inputs.hasFloorType) score += 5;
  if (inputs.hasElectricalPoints) score += 7;
  if (inputs.hasPlumbingPlan) score += 7;
  return Math.min(score, 90); // מקסימום 90%
};

// Tips to show during loading
const loadingTips = [
  "טיפ: כתב כמויות מפורט עוזר למנוע הפתעות בהמשך הפרויקט",
  "טיפ: השוו לפחות 3 הצעות מחיר לפני שסוגרים עם קבלן",
  "טיפ: הוסיפו 10-15% לכמויות כרזרבה לביטחון",
  "טיפ: תמיד דרשו מהקבלן כתב כמויות מפורט לפני תחילת העבודה",
  "טיפ: תעדו את התקדמות הפרויקט בתמונות לאורך הדרך",
  "טיפ: קראו את החוזה בעיון לפני החתימה",
  "טיפ: בקשו המלצות מלקוחות קודמים של הקבלן",
  "טיפ: הגדירו לוח זמנים ברור עם אבני דרך",
];

const getAccuracyLabel = (score: number): string => {
  if (score < 35) return "הערכה ראשונית";
  if (score < 65) return "דיוק בינוני";
  return "דיוק גבוה";
};

const getAccuracyColor = (score: number): string => {
  if (score < 35) return "bg-red-500";
  if (score < 65) return "bg-yellow-500";
  return "bg-green-500";
};

const getAccuracyTextColor = (score: number): string => {
  if (score < 35) return "text-red-600";
  if (score < 65) return "text-yellow-600";
  return "text-green-600";
};

export default function BillOfQuantitiesPage() {
  const router = useRouter();
  
  // Auth state
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // Upload state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form inputs
  const [scale, setScale] = useState<string>("");
  const [ceilingHeight, setCeilingHeight] = useState<string>("2.70");
  const [buildingType, setBuildingType] = useState<string>("");
  const [wallType, setWallType] = useState<string>("");
  const [wallThickness, setWallThickness] = useState<string>("");
  const [floorType, setFloorType] = useState<string>("");
  const [hasElectricalPlan, setHasElectricalPlan] = useState<boolean>(false);
  const [hasPlumbingPlan, setHasPlumbingPlan] = useState<boolean>(false);
  const [additionalNotes, setAdditionalNotes] = useState<string>("");
  
  // Results state
  const [generating, setGenerating] = useState(false);
  const [showBOQGame, setShowBOQGame] = useState(false);
  const [result, setResult] = useState<BOQResult | null>(null);
  const [error, setError] = useState<string>("");
  
  // Loading state
  const [countdown, setCountdown] = useState(60);
  const [currentTip, setCurrentTip] = useState(0);
  
  // Calculate accuracy
  const accuracyInputs: AccuracyInputs = {
    hasBlueprint: !!uploadedImage,
    hasScale: !!scale,
    hasCeilingHeight: !!ceilingHeight && ceilingHeight !== "2.70",
    hasWallType: !!wallType,
    hasWallThickness: !!wallThickness,
    hasFloorType: !!floorType,
    hasElectricalPoints: hasElectricalPlan,
    hasPlumbingPlan: hasPlumbingPlan,
  };
  
  const accuracyScore = calculateAccuracy(accuracyInputs);
  const accuracyLabel = getAccuracyLabel(accuracyScore);
  const accuracyColor = getAccuracyColor(accuracyScore);
  const accuracyTextColor = getAccuracyTextColor(accuracyScore);

  // Countdown timer and tip rotation during generation
  useEffect(() => {
    if (!generating) {
      setCountdown(60);
      setCurrentTip(0);
      return;
    }
    
    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    
    // Tip rotation every 5 seconds
    const tipInterval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % loadingTips.length);
    }, 5000);
    
    return () => {
      clearInterval(countdownInterval);
      clearInterval(tipInterval);
    };
  }, [generating]);

  // Check auth and premium status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = localStorage.getItem("user");
        
        if (userData) {
          const user = JSON.parse(userData);
          if (!user.id) {
            router.push("/login?redirect=/dashboard/bill-of-quantities");
            return;
          }
          
          setUserEmail(user.email);
          
          // Check premium status
          if (user.email) {
            const email = encodeURIComponent(user.email);
            const premiumRes = await fetch(`/api/users?email=${email}`);
            if (premiumRes.ok) {
              const premiumData = await premiumRes.json();
              setIsPremium(premiumData.purchased === true);
            }
          }
        } else {
          // Try Supabase session
          const { getSession } = await import("@/lib/auth");
          const session = await getSession();
          
          if (!session?.user) {
            router.push("/login?redirect=/dashboard/bill-of-quantities");
            return;
          }
          
          setUserEmail(session.user.email || null);
          
          // Check premium
          if (session.user.email) {
            const email = encodeURIComponent(session.user.email);
            const premiumRes = await fetch(`/api/users?email=${email}`);
            if (premiumRes.ok) {
              const premiumData = await premiumRes.json();
              setIsPremium(premiumData.purchased === true);
            }
          }
        }
      } catch (e) {
        console.error("Auth check error:", e);
        router.push("/login?redirect=/dashboard/bill-of-quantities");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);

  // File handling
  const processFile = useCallback((file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('יש להעלות תמונה (JPG, PNG, WebP) או PDF');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('הקובץ גדול מדי. גודל מקסימלי: 10MB');
      return;
    }
    
    setError('');
    setUploadedFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // Generate BOQ
  const handleGenerate = async () => {
    if (!uploadedImage) {
      setError("יש להעלות תכנית תחילה");
      return;
    }
    
    setGenerating(true);
    setShowBOQGame(true);
    setError("");
    setResult(null);
    
    try {
      const res = await fetch('/api/bill-of-quantities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: uploadedImage,
          fileName: uploadedFileName,
          scale,
          ceilingHeight: parseFloat(ceilingHeight) || 2.70,
          buildingType,
          wallType,
          wallThickness,
          floorType,
          hasElectricalPlan,
          hasPlumbingPlan,
          additionalNotes,
          accuracyScore
        })
      });
      
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
        if (data.suggestion) {
          setError(`${data.error}\n${data.suggestion}`);
        }
      } else {
        setResult({ ...data, accuracyScore });
      }
    } catch (err) {
      setError("שגיאה בחיבור לשרת. נסה שוב.");
    }
    
    setGenerating(false);
  };

  // Export functions
  const handleExportPDF = async () => {
    if (!result) return;
    
    // Create print-friendly content
    const printContent = `
      <html dir="rtl">
        <head>
          <title>כתב כמויות - ShiputzAI</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1a1a1a; border-bottom: 2px solid #1a1a1a; padding-bottom: 10px; }
            h2 { color: #333; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
            th { background: #f5f5f5; font-weight: bold; }
            .summary-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin: 20px 0; }
            .summary-item { text-align: center; padding: 15px; background: #f9f9f9; border-radius: 8px; }
            .summary-value { font-size: 24px; font-weight: bold; color: #1a1a1a; }
            .summary-label { font-size: 12px; color: #666; margin-top: 5px; }
            .notes { background: #fff8e1; padding: 15px; border-radius: 8px; margin-top: 20px; }
            .accuracy { font-size: 14px; color: #666; margin-bottom: 20px; }
            @media print { body { print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <h1>כתב כמויות</h1>
          <p class="accuracy">דיוק הערכה: ${accuracyScore}% - ${accuracyLabel}</p>
          
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-value">${result.summary.totalArea.value}</div>
              <div class="summary-label">${result.summary.totalArea.label} (${result.summary.totalArea.unit})</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${result.summary.rooms.value}</div>
              <div class="summary-label">${result.summary.rooms.label}</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${result.summary.walls.value}</div>
              <div class="summary-label">${result.summary.walls.label} (${result.summary.walls.unit})</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${result.summary.doors.value}</div>
              <div class="summary-label">${result.summary.doors.label}</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${result.summary.windows.value}</div>
              <div class="summary-label">${result.summary.windows.label}</div>
            </div>
          </div>
          
          <h2>פירוט כמויות</h2>
          <table>
            <thead>
              <tr>
                <th>קטגוריה</th>
                <th>תיאור</th>
                <th>כמות</th>
                <th>יחידה</th>
                <th>הערות</th>
              </tr>
            </thead>
            <tbody>
              ${result.items.map(item => `
                <tr>
                  <td>${item.category}</td>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td>${item.unit}</td>
                  <td>${item.notes}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          ${result.notes && result.notes.length > 0 ? `
            <div class="notes">
              <h3>הערות והמלצות</h3>
              <ul>
                ${result.notes.map(note => `<li>${note}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          <p style="margin-top: 30px; font-size: 12px; color: #999;">
            נוצר ב-ShiputzAI | ${new Date().toLocaleDateString('he-IL')}
          </p>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleExportExcel = () => {
    if (!result) return;
    
    // Create CSV content
    let csv = '\ufeff'; // BOM for Hebrew
    csv += 'קטגוריה,תיאור,כמות,יחידה,הערות\n';
    
    result.items.forEach(item => {
      csv += `"${item.category}","${item.description}","${item.quantity}","${item.unit}","${item.notes}"\n`;
    });
    
    // Summary
    csv += '\n\nסיכום\n';
    csv += `${result.summary.totalArea.label},${result.summary.totalArea.value},${result.summary.totalArea.unit}\n`;
    csv += `${result.summary.rooms.label},${result.summary.rooms.value}\n`;
    csv += `${result.summary.walls.label},${result.summary.walls.value},${result.summary.walls.unit}\n`;
    csv += `${result.summary.doors.label},${result.summary.doors.value},${result.summary.doors.unit}\n`;
    csv += `${result.summary.windows.label},${result.summary.windows.value},${result.summary.windows.unit}\n`;
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `כתב-כמויות-${new Date().toLocaleDateString('he-IL')}.csv`;
    link.click();
  };

  // Reset form
  const handleReset = () => {
    setUploadedImage(null);
    setUploadedFileName("");
    setResult(null);
    setError("");
    setScale("");
    setCeilingHeight("2.70");
    setBuildingType("");
    setWallType("");
    setWallThickness("");
    setFloorType("");
    setHasElectricalPlan(false);
    setHasPlumbingPlan(false);
    setAdditionalNotes("");
  };

  // Loading state
  if (isLoading) {
    return <LoadingScreen text="טוען..." />;
  }

  // Premium gate
  if (!isPremium) {
    return (
      <div className="min-h-screen bg-white" dir="rtl">
        <nav className="h-11 border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
            <Link href="/" className="text-base font-semibold text-gray-900">ShiputzAI</Link>
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">חזרה לדשבורד</Link>
          </div>
        </nav>
        
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">📋</span>
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-4">כתב כמויות AI</h1>
          <p className="text-gray-500 mb-8">
            הפיצ'ר הזה זמין למשתמשי Premium בלבד.
            <br />
            שדרג את החשבון שלך כדי לקבל גישה לכל הכלים המתקדמים.
          </p>
          
          <div className="bg-gray-50 rounded-2xl p-8 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">מה תקבל עם Premium?</h2>
            <ul className="space-y-3 text-right">
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">כתב כמויות אוטומטי מתכניות</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">ייצוא ל-PDF ו-Excel</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">ניתוח הצעות מחיר</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">סריקת קבלות אוטומטית</span>
              </li>
            </ul>
          </div>
          
          <Link
            href="/checkout"
            className="inline-block bg-gray-900 text-white px-8 py-4 rounded-full text-base font-medium hover:bg-gray-800 transition-colors"
          >
            שדרג ל-Premium
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Navigation */}
      <nav className="h-11 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-base font-semibold text-gray-900">ShiputzAI</Link>
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">דשבורד</Link>
          </div>
          <span className="text-xs text-purple-600 bg-purple-50 px-3 py-1 rounded-full">Premium ✨</span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">כתב כמויות AI</h1>
          <p className="text-gray-500">העלה תכנית ו קבל כתב כמויות מפורט אוטומטית</p>
        </div>

        {/* Accuracy Meter */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">מד דיוק ההערכה</span>
            <span className={`text-sm font-semibold ${accuracyTextColor}`}>
              {accuracyScore}% - {accuracyLabel}
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${accuracyColor}`}
              style={{ width: `${accuracyScore}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            הוסף פרטים נוספים לשיפור דיוק ההערכה
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Upload & Inputs */}
          <div className="space-y-6">
            {/* File Upload */}
            <div className="border border-gray-200 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">העלאת תכנית</h2>
              
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragOver 
                    ? 'border-gray-900 bg-gray-50' 
                    : uploadedImage 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                {uploadedImage ? (
                  <div>
                    {uploadedImage.startsWith('data:image') ? (
                      <img 
                        src={uploadedImage} 
                        alt="תכנית" 
                        className="max-h-40 mx-auto mb-4 rounded-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">📄</span>
                      </div>
                    )}
                    <p className="text-sm text-green-600 font-medium">{uploadedFileName}</p>
                    <p className="text-xs text-gray-400 mt-1">לחץ להחלפה</p>
                  </div>
                ) : (
                  <div>
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📐</span>
                    </div>
                    <p className="text-gray-900 font-medium mb-1">גרור תכנית לכאן</p>
                    <p className="text-sm text-gray-500">או לחץ לבחירת קובץ</p>
                    <p className="text-xs text-gray-400 mt-2">תמיכה ב-JPG, PNG, PDF</p>
                  </div>
                )}
              </div>
              
              {uploadedImage && (
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <span>✓</span> תכנית הועלתה (+30% לדיוק)
                </p>
              )}
            </div>

            {/* Additional Inputs */}
            <div className="border border-gray-200 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">פרטים נוספים (אופציונלי)</h2>
              
              <div className="space-y-4">
                {/* Scale */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">סקאלה</label>
                  <select
                    value={scale}
                    onChange={(e) => setScale(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
                  >
                    <option value="">לא ידוע</option>
                    <option value="1:50">1:50</option>
                    <option value="1:100">1:100</option>
                    <option value="1:200">1:200</option>
                    <option value="other">אחר</option>
                  </select>
                  {scale && <p className="text-xs text-green-600 mt-1">✓ +25% לדיוק</p>}
                </div>

                {/* Ceiling Height */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">גובה תקרה (מ׳)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={ceilingHeight}
                    onChange={(e) => setCeilingHeight(e.target.value)}
                    placeholder="2.70"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
                  />
                  {ceilingHeight && ceilingHeight !== "2.70" && (
                    <p className="text-xs text-green-600 mt-1">✓ +10% לדיוק</p>
                  )}
                </div>

                {/* Building Type */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">סוג מבנה</label>
                  <select
                    value={buildingType}
                    onChange={(e) => setBuildingType(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
                  >
                    <option value="">בחר סוג</option>
                    <option value="apartment">דירה</option>
                    <option value="house">בית פרטי</option>
                    <option value="office">משרד</option>
                    <option value="commercial">מסחרי</option>
                  </select>
                </div>

                {/* Wall Type */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">סוג קירות</label>
                  <select
                    value={wallType}
                    onChange={(e) => setWallType(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
                  >
                    <option value="">לא ידוע</option>
                    <option value="blocks">בלוקים</option>
                    <option value="concrete">בטון</option>
                    <option value="drywall">גבס</option>
                    <option value="brick">לבנים</option>
                  </select>
                  {wallType && <p className="text-xs text-green-600 mt-1">✓ +8% לדיוק</p>}
                </div>

                {/* Wall Thickness */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">עובי קירות (ס״מ)</label>
                  <select
                    value={wallThickness}
                    onChange={(e) => setWallThickness(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
                  >
                    <option value="">לא ידוע</option>
                    <option value="10">10 ס״מ (מחיצות)</option>
                    <option value="15">15 ס״מ</option>
                    <option value="20">20 ס״מ (קיר חוץ)</option>
                    <option value="25">25 ס״מ</option>
                  </select>
                  {wallThickness && <p className="text-xs text-green-600 mt-1">✓ +5% לדיוק</p>}
                </div>

                {/* Floor Type */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">סוג ריצוף קיים</label>
                  <select
                    value={floorType}
                    onChange={(e) => setFloorType(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
                  >
                    <option value="">לא ידוע</option>
                    <option value="tiles">אריחים</option>
                    <option value="parquet">פרקט</option>
                    <option value="concrete">בטון</option>
                    <option value="marble">שיש</option>
                  </select>
                  {floorType && <p className="text-xs text-green-600 mt-1">✓ +5% לדיוק</p>}
                </div>

                {/* Checkboxes */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasElectricalPlan}
                      onChange={(e) => setHasElectricalPlan(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    <span className="text-sm text-gray-700">התכנית כוללת נקודות חשמל</span>
                    {hasElectricalPlan && <span className="text-xs text-green-600">+7%</span>}
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasPlumbingPlan}
                      onChange={(e) => setHasPlumbingPlan(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    <span className="text-sm text-gray-700">התכנית כוללת אינסטלציה</span>
                    {hasPlumbingPlan && <span className="text-xs text-green-600">+10%</span>}
                  </label>
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">הערות נוספות</label>
                  <textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="מידע נוסף שעשוי לעזור..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!uploadedImage || generating}
              className="w-full bg-gray-900 text-white py-4 rounded-xl text-base font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  מנתח תכנית... ({countdown} שניות)
                </span>
              ) : (
                'צור כתב כמויות'
              )}
            </button>
            
            {/* Flappy Bird + Loading Tips */}
            {showBOQGame && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                <FlappyBirdGame 
                  isReady={!!result} 
                  onShowResult={() => setShowBOQGame(false)} 
                />
                {generating && (
                  <p className="text-sm text-gray-600 transition-all duration-300 mt-2">
                    {loadingTips[currentTip]}
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-600 whitespace-pre-line">{error}</p>
              </div>
            )}
          </div>

          {/* Right Column - Results */}
          <div>
            {result ? (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="border border-gray-200 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">סיכום</h2>
                    <span className={`text-xs px-2 py-1 rounded-full ${accuracyColor} text-white`}>
                      {accuracyScore}% דיוק
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-3">
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <div className="text-2xl font-bold text-gray-900">{result.summary.totalArea.value}</div>
                      <div className="text-xs text-gray-500">{result.summary.totalArea.label}</div>
                      <div className="text-xs text-gray-400">{result.summary.totalArea.unit}</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <div className="text-2xl font-bold text-gray-900">{result.summary.rooms.value}</div>
                      <div className="text-xs text-gray-500">{result.summary.rooms.label}</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <div className="text-2xl font-bold text-gray-900">{result.summary.walls.value}</div>
                      <div className="text-xs text-gray-500">{result.summary.walls.label}</div>
                      <div className="text-xs text-gray-400">{result.summary.walls.unit}</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <div className="text-2xl font-bold text-gray-900">{result.summary.doors.value}</div>
                      <div className="text-xs text-gray-500">{result.summary.doors.label}</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <div className="text-2xl font-bold text-gray-900">{result.summary.windows.value}</div>
                      <div className="text-xs text-gray-500">{result.summary.windows.label}</div>
                    </div>
                  </div>
                </div>

                {/* Detailed Table */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">פירוט כמויות</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">קטגוריה</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">תיאור</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">כמות</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">יחידה</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">הערות</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">מקור</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {result.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">{item.category}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{item.description}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{item.unit}</td>
                            <td className="px-4 py-3 text-sm text-gray-400">{item.notes}</td>
                            <td className="px-4 py-3 text-xs">
                              <span className={`px-2 py-1 rounded-full ${
                                item.source === 'תכנית' ? 'bg-green-100 text-green-700' :
                                item.source === 'חישוב' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {item.source || 'הערכה'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Notes */}
                {result.notes && result.notes.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-amber-800 mb-3">הערות והמלצות</h3>
                    <ul className="space-y-2">
                      {result.notes.map((note, idx) => (
                        <li key={idx} className="text-sm text-amber-700 flex items-start gap-2">
                          <span>•</span>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Disclaimer */}
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-red-800 mb-2">⚠️ הצהרה חשובה</h3>
                  <p className="text-sm text-red-700">
                    {result.disclaimer || "כתב כמויות זה הינו הערכה ראשונית בלבד, המבוססת על ניתוח אוטומטי של התכנית. אין להסתמך עליו לצורך חתימת חוזה או התחייבות כספית. לקבלת כתב כמויות מדויק, יש לפנות למודד כמויות מוסמך עם תכניות מלאות (אדריכלות, קונסטרוקציה, חשמל, אינסטלציה)."}
                  </p>
                </div>

                {/* Export Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleExportPDF}
                    className="flex-1 bg-gray-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>📄</span> ייצוא PDF
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="flex-1 bg-white border border-gray-200 text-gray-900 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>📊</span> ייצוא Excel
                  </button>
                </div>

                {/* Reset Button */}
                <button
                  onClick={handleReset}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
                >
                  ← התחל מחדש
                </button>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📋</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">התוצאות יופיעו כאן</h3>
                <p className="text-sm text-gray-500">
                  העלה תכנית ולחץ על &quot;צור כתב כמויות&quot; כדי לקבל ניתוח מפורט
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
