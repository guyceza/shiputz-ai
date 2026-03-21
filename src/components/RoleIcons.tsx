"use client";

// Animated SVG icons for each role — lightweight, no external dependencies

export function HomeownerIcon({ animate }: { animate?: boolean }) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <style>{`
        @keyframes smoke { 0%,100%{opacity:0;transform:translateY(0)} 50%{opacity:0.6;transform:translateY(-6px)} }
        @keyframes door-glow { 0%,100%{fill:#F59E0B} 50%{fill:#FBBF24} }
        .smoke1 { animation: smoke 3s ease-in-out infinite; }
        .smoke2 { animation: smoke 3s ease-in-out infinite 1s; }
        .door { animation: ${animate ? 'door-glow 2s ease-in-out infinite' : 'none'}; }
      `}</style>
      {/* House body */}
      <rect x="18" y="38" width="44" height="30" rx="2" fill="#3B82F6" opacity="0.9" />
      {/* Roof */}
      <polygon points="40,12 10,42 70,42" fill="#1E40AF" />
      {/* Door */}
      <rect className="door" x="34" y="48" width="12" height="20" rx="1" fill="#F59E0B" />
      <circle cx="43" cy="58" r="1.5" fill="#92400E" />
      {/* Windows */}
      <rect x="22" y="45" width="9" height="9" rx="1" fill="#BFDBFE" opacity="0.9" />
      <rect x="49" y="45" width="9" height="9" rx="1" fill="#BFDBFE" opacity="0.9" />
      <line x1="26.5" y1="45" x2="26.5" y2="54" stroke="#3B82F6" strokeWidth="0.8" />
      <line x1="22" y1="49.5" x2="31" y2="49.5" stroke="#3B82F6" strokeWidth="0.8" />
      <line x1="53.5" y1="45" x2="53.5" y2="54" stroke="#3B82F6" strokeWidth="0.8" />
      <line x1="49" y1="49.5" x2="58" y2="49.5" stroke="#3B82F6" strokeWidth="0.8" />
      {/* Chimney */}
      <rect x="52" y="18" width="8" height="20" rx="1" fill="#1E3A5F" />
      {/* Smoke */}
      <circle className="smoke1" cx="56" cy="14" r="3" fill="#94A3B8" opacity="0" />
      <circle className="smoke2" cx="58" cy="10" r="2.5" fill="#94A3B8" opacity="0" />
    </svg>
  );
}

export function DesignerIcon({ animate }: { animate?: boolean }) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <style>{`
        @keyframes paint-stroke { 0%{stroke-dashoffset:40} 100%{stroke-dashoffset:0} }
        @keyframes palette-spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        .brush-stroke { stroke-dasharray: 40; animation: ${animate ? 'paint-stroke 2s ease-in-out infinite' : 'none'}; }
      `}</style>
      {/* Color palette */}
      <ellipse cx="35" cy="45" rx="22" ry="18" fill="#F3E8FF" stroke="#8B5CF6" strokeWidth="2" />
      <circle cx="25" cy="38" r="4" fill="#EC4899" />
      <circle cx="35" cy="34" r="4" fill="#F59E0B" />
      <circle cx="45" cy="38" r="4" fill="#10B981" />
      <circle cx="28" cy="50" r="4" fill="#3B82F6" />
      <circle cx="40" cy="52" r="4" fill="#8B5CF6" />
      {/* Palette hole */}
      <ellipse cx="38" cy="44" rx="4" ry="3" fill="white" />
      {/* Paint brush */}
      <line x1="52" y1="20" x2="65" y2="55" stroke="#92400E" strokeWidth="3" strokeLinecap="round" />
      <path className="brush-stroke" d="M63,52 Q68,58 65,62 Q62,66 58,60" fill="#8B5CF6" stroke="#7C3AED" strokeWidth="1.5" />
    </svg>
  );
}

export function ArchitectIcon({ animate }: { animate?: boolean }) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <style>{`
        @keyframes draw-line { 0%{stroke-dashoffset:60} 100%{stroke-dashoffset:0} }
        .blueprint-line { stroke-dasharray: 60; animation: ${animate ? 'draw-line 2s ease-in-out infinite' : 'none'}; }
      `}</style>
      {/* Blueprint paper */}
      <rect x="8" y="12" width="64" height="56" rx="3" fill="#1E3A5F" />
      <rect x="12" y="16" width="56" height="48" rx="2" fill="#1E4976" />
      {/* Floor plan lines */}
      <rect x="16" y="20" width="24" height="18" fill="none" stroke="#60A5FA" strokeWidth="1.5" />
      <rect x="42" y="20" width="22" height="18" fill="none" stroke="#60A5FA" strokeWidth="1.5" />
      <rect x="16" y="40" width="16" height="20" fill="none" stroke="#60A5FA" strokeWidth="1.5" />
      <rect x="34" y="40" width="30" height="20" fill="none" stroke="#60A5FA" strokeWidth="1.5" />
      {/* Door arcs */}
      <path d="M26,38 A6,6 0 0,1 32,38" fill="none" stroke="#93C5FD" strokeWidth="1" />
      <path d="M48,38 A5,5 0 0,0 43,38" fill="none" stroke="#93C5FD" strokeWidth="1" />
      {/* Measurement line */}
      <path className="blueprint-line" d="M16,64 L64,64" fill="none" stroke="#FBBF24" strokeWidth="1" strokeDasharray="3,2" />
      {/* Ruler/triangle */}
      <polygon points="58,10 72,10 72,24" fill="#EC4899" opacity="0.8" />
      <line x1="60" y1="12" x2="70" y2="12" stroke="white" strokeWidth="0.5" />
      <line x1="70" y1="12" x2="70" y2="22" stroke="white" strokeWidth="0.5" />
    </svg>
  );
}

export function ContractorIcon({ animate }: { animate?: boolean }) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <style>{`
        @keyframes hammer-hit { 0%,70%,100%{transform:rotate(0deg)} 80%{transform:rotate(-30deg)} 90%{transform:rotate(5deg)} }
        .hammer { transform-origin: 55px 25px; animation: ${animate ? 'hammer-hit 1.5s ease-in-out infinite' : 'none'}; }
      `}</style>
      {/* Hard hat */}
      <ellipse cx="40" cy="22" rx="20" ry="10" fill="#F59E0B" />
      <rect x="20" y="20" width="40" height="6" rx="1" fill="#D97706" />
      <rect x="35" y="12" width="10" height="10" rx="5" fill="#FBBF24" />
      {/* Hammer */}
      <g className="hammer">
        <line x1="42" y1="35" x2="62" y2="55" stroke="#92400E" strokeWidth="3" strokeLinecap="round" />
        <rect x="58" y="50" width="14" height="8" rx="2" fill="#6B7280" transform="rotate(-45, 65, 54)" />
      </g>
      {/* Bricks */}
      <rect x="10" y="60" width="18" height="8" rx="1" fill="#DC2626" opacity="0.8" />
      <rect x="30" y="60" width="18" height="8" rx="1" fill="#EF4444" opacity="0.8" />
      <rect x="50" y="60" width="18" height="8" rx="1" fill="#DC2626" opacity="0.8" />
      <rect x="20" y="52" width="18" height="8" rx="1" fill="#EF4444" opacity="0.7" />
      <rect x="40" y="52" width="18" height="8" rx="1" fill="#DC2626" opacity="0.7" />
    </svg>
  );
}

export function RealtorIcon({ animate }: { animate?: boolean }) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <style>{`
        @keyframes key-swing { 0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(5deg)} }
        .key { transform-origin: 55px 30px; animation: ${animate ? 'key-swing 2s ease-in-out infinite' : 'none'}; }
      `}</style>
      {/* Building */}
      <rect x="12" y="25" width="30" height="43" rx="2" fill="#10B981" opacity="0.9" />
      <rect x="16" y="30" width="8" height="6" rx="1" fill="#D1FAE5" />
      <rect x="28" y="30" width="8" height="6" rx="1" fill="#D1FAE5" />
      <rect x="16" y="40" width="8" height="6" rx="1" fill="#D1FAE5" />
      <rect x="28" y="40" width="8" height="6" rx="1" fill="#D1FAE5" />
      <rect x="16" y="50" width="8" height="6" rx="1" fill="#D1FAE5" />
      <rect x="28" y="50" width="8" height="6" rx="1" fill="#D1FAE5" />
      <rect x="22" y="58" width="10" height="10" rx="1" fill="#065F46" />
      {/* Key */}
      <g className="key">
        <circle cx="58" cy="28" r="8" fill="none" stroke="#F59E0B" strokeWidth="3" />
        <line x1="58" y1="36" x2="58" y2="55" stroke="#F59E0B" strokeWidth="3" />
        <line x1="58" y1="48" x2="64" y2="48" stroke="#F59E0B" strokeWidth="3" />
        <line x1="58" y1="42" x2="62" y2="42" stroke="#F59E0B" strokeWidth="2" />
      </g>
      {/* For sale sign */}
      <rect x="50" y="58" width="20" height="10" rx="2" fill="#DC2626" />
      <text x="60" y="66" textAnchor="middle" fill="white" fontSize="5" fontWeight="bold">SALE</text>
    </svg>
  );
}

export function OtherIcon({ animate }: { animate?: boolean }) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <style>{`
        @keyframes sparkle1 { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.2)} }
        @keyframes sparkle2 { 0%,100%{opacity:1;transform:scale(1.2)} 50%{opacity:0.3;transform:scale(0.8)} }
        .sp1 { transform-origin: center; animation: ${animate ? 'sparkle1 2s ease-in-out infinite' : 'none'}; }
        .sp2 { transform-origin: center; animation: ${animate ? 'sparkle2 2s ease-in-out infinite' : 'none'}; }
      `}</style>
      {/* Magnifying glass */}
      <circle cx="35" cy="35" r="16" fill="none" stroke="#6B7280" strokeWidth="4" />
      <circle cx="35" cy="35" r="12" fill="#F3F4F6" />
      <line x1="47" y1="47" x2="62" y2="62" stroke="#6B7280" strokeWidth="5" strokeLinecap="round" />
      {/* Sparkles */}
      <path className="sp1" d="M30,30 L32,26 L34,30 L38,32 L34,34 L32,38 L30,34 L26,32 Z" fill="#FBBF24" />
      <path className="sp2" d="M18,18 L19.5,15 L21,18 L24,19.5 L21,21 L19.5,24 L18,21 L15,19.5 Z" fill="#8B5CF6" />
      <path className="sp1" d="M50,20 L51,18 L52,20 L54,21 L52,22 L51,24 L50,22 L48,21 Z" fill="#EC4899" />
    </svg>
  );
}

// Map role key to component
export const ROLE_ICON_MAP: Record<string, React.ComponentType<{ animate?: boolean }>> = {
  homeowner: HomeownerIcon,
  designer: DesignerIcon,
  architect: ArchitectIcon,
  contractor: ContractorIcon,
  realtor: RealtorIcon,
  other: OtherIcon,
};
