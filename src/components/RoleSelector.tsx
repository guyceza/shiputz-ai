"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

export interface Role {
  key: string;
  label: string;
  description: string;
  animationUrl: string;
  color: string;
  tools: string[]; // which tools to show for this role
}

const ALL_TOOLS = ["visualize", "floorplan", "video-tour", "style-match", "shop-look", "boq", "quotes", "receipts", "chat"];

const ROLES: Role[] = [
  {
    key: "homeowner",
    label: "בעל/ת בית",
    description: "מתכנן/ת שיפוץ או עיצוב מחדש",
    animationUrl: "",
    color: "#3B82F6",
    // Everything EXCEPT BOQ — contractor/designer prepares that
    tools: ALL_TOOLS.filter(t => t !== "boq"),
  },
  {
    key: "designer",
    label: "מעצב/ת פנים",
    description: "עיצוב ותכנון חללים ללקוחות",
    animationUrl: "",
    color: "#8B5CF6",
    // Everything — designers do styling, BOQ, quotes, the works
    tools: [...ALL_TOOLS],
  },
  {
    key: "architect",
    label: "אדריכל/ית",
    description: "תכנון אדריכלי ובנייה",
    animationUrl: "",
    color: "#EC4899",
    // Everything — in Israel architects also do interior design & styling
    tools: [...ALL_TOOLS],
  },
  {
    key: "contractor",
    label: "קבלן שיפוצים",
    description: "ביצוע עבודות שיפוץ ובנייה",
    animationUrl: "",
    color: "#F59E0B",
    // Everything EXCEPT style-match & shop-look — contractors don't do styling
    tools: ALL_TOOLS.filter(t => !["style-match", "shop-look"].includes(t)),
  },
  {
    key: "realtor",
    label: "סוכן/ת נדל״ן",
    description: "הצגת פוטנציאל לנכסים",
    animationUrl: "",
    color: "#10B981",
    // Presentation only — no project management / financial tools
    tools: ["visualize", "floorplan", "video-tour", "style-match", "chat"],
  },
  {
    key: "other",
    label: "אחר",
    description: "סתם מתעניין/ת",
    animationUrl: "",
    color: "#6B7280",
    // Everything
    tools: [...ALL_TOOLS],
  },
];

// Helper: get role by key
export function getRoleByKey(key: string): Role | undefined {
  return ROLES.find(r => r.key === key);
}

// Helper: check if a tool is available for a role
export function isToolAvailable(roleKey: string | undefined | null, tool: string): boolean {
  if (!roleKey) return true; // no role = show everything
  const role = getRoleByKey(roleKey);
  if (!role) return true;
  return role.tools.includes(tool);
}

const LOTTIE_PATHS: Record<string, string> = {
  homeowner: "/lottie/homeowner.json",
  designer: "/lottie/designer.json",
  architect: "/lottie/architect.json",
  contractor: "/lottie/contractor.json",
  realtor: "/lottie/realtor.json",
  other: "/lottie/other.json",
};

interface Props {
  onSelect: (role: Role) => void;
}

export default function RoleSelector({ onSelect }: Props) {
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [animationData, setAnimationData] = useState<Record<string, any>>({});

  // Load all Lottie animations on mount
  useState(() => {
    Object.entries(LOTTIE_PATHS).forEach(([key, path]) => {
      fetch(path)
        .then(res => res.json())
        .then(data => {
          setAnimationData(prev => ({ ...prev, [key]: data }));
        })
        .catch(() => {});
    });
  });

  const handleSelect = (role: Role) => {
    setSelectedRole(role.key);
    setTimeout(() => onSelect(role), 400);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">מי אתה?</h2>
        <p className="text-gray-500">בחר את התפקיד שלך — נתאים את החוויה עבורך</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
        {ROLES.map((role) => (
          <button
            key={role.key}
            onClick={() => handleSelect(role)}
            onMouseEnter={() => setHoveredRole(role.key)}
            onMouseLeave={() => setHoveredRole(null)}
            className={`relative p-5 rounded-2xl border-2 transition-all duration-300 ${
              selectedRole === role.key
                ? "scale-105 shadow-xl"
                : hoveredRole === role.key
                ? "scale-[1.02] shadow-lg"
                : "shadow-sm hover:shadow-md"
            }`}
            style={{
              borderColor: selectedRole === role.key || hoveredRole === role.key ? role.color : "transparent",
              background: selectedRole === role.key
                ? `linear-gradient(135deg, ${role.color}15, ${role.color}05)`
                : undefined,
            }}
          >
            {/* Lottie animation */}
            <div className="w-20 h-20 mx-auto mb-3">
              {animationData[role.key] ? (
                <Lottie
                  animationData={animationData[role.key]}
                  loop={hoveredRole === role.key || selectedRole === role.key}
                  autoplay={hoveredRole === role.key || selectedRole === role.key}
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <div className="w-full h-full rounded-full flex items-center justify-center text-3xl"
                  style={{ background: `${role.color}15` }}>
                  {role.key === "homeowner" && "🏠"}
                  {role.key === "designer" && "🎨"}
                  {role.key === "architect" && "📐"}
                  {role.key === "contractor" && "🔨"}
                  {role.key === "realtor" && "🏢"}
                  {role.key === "other" && "✨"}
                </div>
              )}
            </div>

            <div className="text-center">
              <div className="font-semibold text-gray-900 dark:text-white text-sm">{role.label}</div>
              <div className="text-xs text-gray-500 mt-1">{role.description}</div>
            </div>

            {/* Selected checkmark */}
            {selectedRole === role.key && (
              <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm"
                style={{ background: role.color }}>
                ✓
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export { ROLES };
export type { Role as RoleType };
