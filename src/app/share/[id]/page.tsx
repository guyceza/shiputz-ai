import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function getVisualization(id: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data, error } = await supabase
    .from("visualizations")
    .select("id, before_image_url, after_image_url, description, created_at")
    .eq("id", id)
    .single();
  
  if (error || !data) return null;
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const viz = await getVisualization(id);
  if (!viz) return { title: "הדמיה לא נמצאה" };

  const desc = viz.description || "הדמיית שיפוץ ב-AI";
  return {
    title: `הדמיית שיפוץ — ${desc} | ShiputzAI`,
    description: `תראו את ההדמיה הזו! ${desc}. צרו הדמיית שיפוץ בחינם ב-ShiputzAI.`,
    openGraph: {
      title: `הדמיית שיפוץ — ${desc}`,
      description: `תראו מה ShiputzAI עשה 😍 הדמיית שיפוץ ב-AI!`,
      images: viz.after_image_url ? [{ url: viz.after_image_url, width: 1024, height: 1024 }] : [],
      url: `https://shipazti.com/share/${id}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `הדמיית שיפוץ — ${desc}`,
      images: viz.after_image_url ? [viz.after_image_url] : [],
    },
  };
}

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viz = await getVisualization(id);
  
  if (!viz) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#fafafa]" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold text-gray-900">
            ShiputzAI
          </Link>
          <Link
            href="/visualize"
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            צור הדמיה בחינם
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Badge */}
        <div className="text-center mb-6">
          <span className="inline-block bg-gray-900 text-white text-xs font-bold px-4 py-1.5 rounded-full">
            הדמיית שיפוץ ב-AI
          </span>
        </div>

        {/* Before / After */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {viz.before_image_url && (
            <div>
              <p className="text-xs text-gray-400 text-center mb-2">לפני</p>
              <img 
                src={viz.before_image_url} 
                alt="לפני" 
                className="w-full rounded-xl border border-gray-200"
              />
            </div>
          )}
          {viz.after_image_url && (
            <div>
              <p className="text-xs text-gray-400 text-center mb-2">אחרי</p>
              <img 
                src={viz.after_image_url} 
                alt="אחרי" 
                className="w-full rounded-xl border border-gray-200"
              />
            </div>
          )}
        </div>

        {/* Description */}
        {viz.description && (
          <p className="text-center text-gray-600 mb-8">
            &ldquo;{viz.description}&rdquo;
          </p>
        )}

        {/* CTA */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            רוצה לראות איך החדר שלך ייראה?
          </h2>
          <p className="text-gray-500 mb-6">
            העלה תמונה וקבל הדמיית שיפוץ + הערכת עלויות — בחינם
          </p>
          <Link
            href="/visualize"
            className="inline-block bg-gray-900 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-800 transition-colors"
          >
            נסה בחינם — 30 שניות ⚡
          </Link>
        </div>
      </div>
    </div>
  );
}
