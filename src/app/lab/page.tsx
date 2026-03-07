"use client";

import { useState, useRef } from "react";

type Tool = "color-palette" | "style-matcher" | "room-measure";

const TOOLS: { id: Tool; name: string; description: string }[] = [
  { id: "color-palette", name: "פלטת צבעים", description: "זיהוי צבעים + 3 פלטות מומלצות + המלצת צבע נירלט/טמבור" },
  { id: "style-matcher", name: "Style Matcher", description: "זיהוי סגנון עיצוב + רשימת קניות לשחזור הסגנון" },
  { id: "room-measure", name: "מדידת חדר", description: "הערכת מידות חדר + חישוב חומרים (אריחים, צבע, פנלים)" },
];

export default function LabPage() {
  const [activeTool, setActiveTool] = useState<Tool>("color-palette");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setImage(reader.result as string); setResult(null); setError(""); };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!image) return;
    setLoading(true); setResult(null); setError("");
    try {
      const res = await fetch(`/api/ai-tools/${activeTool}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setImage(null); setResult(null); setError(""); };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">LAB</span>
            <h1 className="text-3xl font-bold text-gray-900">כלים חדשים — בדיקה פנימית</h1>
          </div>
          <p className="text-gray-500">דף זה לא נגיש למשתמשים. לבדיקה בלבד.</p>
        </div>

        {/* Tool selector */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              onClick={() => { setActiveTool(tool.id); setResult(null); setError(""); }}
              className={`flex-shrink-0 px-5 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTool === tool.id
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              {tool.name}
            </button>
          ))}
        </div>

        {/* Tool description */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            {TOOLS.find(t => t.id === activeTool)?.name}
          </h2>
          <p className="text-gray-500 text-sm">
            {TOOLS.find(t => t.id === activeTool)?.description}
          </p>
        </div>

        {/* Upload */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          {!image ? (
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-gray-400 transition-colors">
                <div className="text-4xl mb-3">📸</div>
                <p className="text-gray-600 font-medium mb-1">העלו תמונה של חדר</p>
                <p className="text-gray-400 text-sm">JPG, PNG, WebP — עד 10MB</p>
              </div>
              <input type="file" accept="image/*" onChange={handleImage} className="hidden" ref={fileRef} />
            </label>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden">
                <img src={image} alt="uploaded" className="w-full max-h-[400px] object-contain bg-gray-100" />
                <button
                  onClick={reset}
                  className="absolute top-3 left-3 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
                >
                  ✕
                </button>
              </div>
              <button
                onClick={analyze}
                disabled={loading}
                className="w-full bg-gray-900 text-white py-4 rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {loading ? "מנתח..." : "נתח תמונה"}
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Results */}
        {result && activeTool === "color-palette" && <ColorPaletteResult data={result} />}
        {result && activeTool === "style-matcher" && <StyleMatcherResult data={result} />}
        {result && activeTool === "room-measure" && <RoomMeasureResult data={result} />}

        {/* Raw JSON */}
        {result && (
          <details className="mt-6">
            <summary className="text-gray-400 text-sm cursor-pointer hover:text-gray-600">Raw JSON</summary>
            <pre className="bg-gray-900 text-green-400 rounded-xl p-4 mt-2 overflow-x-auto text-xs" dir="ltr">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

function ColorPaletteResult({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      {/* Current colors */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">צבעים נוכחיים</h3>
        <div className="flex gap-3 flex-wrap">
          {data.currentColors?.map((c: any, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg border" style={{ backgroundColor: c.hex }} />
              <div>
                <div className="text-sm font-medium text-gray-900">{c.name}</div>
                <div className="text-xs text-gray-400">{c.hex}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Palettes */}
      {data.palettes?.map((palette: any, i: number) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-1">{palette.name}</h3>
          <p className="text-gray-500 text-sm mb-4">{palette.description}</p>
          <div className="flex gap-2 mb-3">
            {palette.colors?.map((c: any, j: number) => (
              <div key={j} className="flex-1 text-center">
                <div className="h-16 rounded-lg mb-2" style={{ backgroundColor: c.hex }} />
                <div className="text-xs font-medium text-gray-900">{c.name}</div>
                <div className="text-[10px] text-gray-400">{c.usage}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Paint recommendation */}
      {data.paintRecommendation && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-900 mb-2">המלצת צבע</h3>
          <p className="text-gray-700">
            <span className="font-medium">{data.paintRecommendation.brand}</span> — {data.paintRecommendation.shade}
            {data.paintRecommendation.code && <span className="text-gray-400 mr-2">({data.paintRecommendation.code})</span>}
          </p>
        </div>
      )}
    </div>
  );
}

function StyleMatcherResult({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      {/* Style header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-gray-900">{data.style}</h3>
          <span className="text-sm text-gray-400">{data.styleEnglish} · {data.confidence}% ביטחון</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.characteristics?.map((c: string, i: number) => (
            <span key={i} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">{c}</span>
          ))}
        </div>
      </div>

      {/* Materials */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-3">חומרים מזוהים</h3>
        <div className="grid grid-cols-2 gap-3">
          {data.materials?.map((m: any, i: number) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3">
              <div className="font-medium text-gray-900 text-sm">{m.name}</div>
              <div className="text-xs text-gray-500">{m.usage}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Shopping list */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-3">רשימת קניות לשחזור הסגנון</h3>
        <div className="space-y-3">
          {data.shoppingList?.map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <div className="font-medium text-gray-900 text-sm">{item.item}</div>
                <div className="text-xs text-gray-500">{item.description} · {item.material}</div>
              </div>
              <div className="text-sm font-medium text-gray-600">{item.priceRange}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-3">טיפים לשחזור</h3>
        <ul className="space-y-2">
          {data.tips?.map((tip: string, i: number) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-gray-400 mt-0.5">→</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function RoomMeasureResult({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      {/* Dimensions */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">מידות משוערות</h3>
          <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">ביטחון: {data.confidence}%</span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-gray-900">{data.dimensions?.length}</div>
            <div className="text-sm text-gray-500">אורך (מ')</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-gray-900">{data.dimensions?.width}</div>
            <div className="text-sm text-gray-500">רוחב (מ')</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-gray-900">{data.dimensions?.height}</div>
            <div className="text-sm text-gray-500">גובה (מ')</div>
          </div>
        </div>
      </div>

      {/* Calculations */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">חישובים</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-500 text-sm">שטח רצפה</span>
            <span className="font-semibold text-gray-900">{data.calculations?.floorArea} מ"ר</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-500 text-sm">שטח קירות</span>
            <span className="font-semibold text-gray-900">{data.calculations?.wallArea} מ"ר</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-500 text-sm">נפח</span>
            <span className="font-semibold text-gray-900">{data.calculations?.volume} מ"ק</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-500 text-sm">היקף</span>
            <span className="font-semibold text-gray-900">{data.calculations?.perimeter} מ'</span>
          </div>
        </div>
      </div>

      {/* Materials */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">חישוב חומרים</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div>
              <div className="font-medium text-gray-900 text-sm">אריחי רצפה 60×60</div>
              <div className="text-xs text-gray-500">{data.materials?.tiles60x60?.note}</div>
            </div>
            <div className="text-lg font-bold text-gray-900">{data.materials?.tiles60x60?.quantity} יח'</div>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div>
              <div className="font-medium text-gray-900 text-sm">צבע לקירות</div>
              <div className="text-xs text-gray-500">{data.materials?.paintLiters?.note}</div>
            </div>
            <div className="text-lg font-bold text-gray-900">{data.materials?.paintLiters?.quantity} ליטר</div>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="font-medium text-gray-900 text-sm">פנלים/לישטים</div>
              <div className="text-xs text-gray-500">{data.materials?.baseboardMeters?.note}</div>
            </div>
            <div className="text-lg font-bold text-gray-900">{data.materials?.baseboardMeters?.quantity} מ'</div>
          </div>
        </div>
      </div>

      {/* Clues */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h3 className="font-semibold text-gray-900 mb-2">רמזים שזוהו</h3>
        <div className="flex flex-wrap gap-2">
          {data.cluesUsed?.map((c: string, i: number) => (
            <span key={i} className="bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs">{c}</span>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">{data.disclaimer}</p>
      </div>
    </div>
  );
}
