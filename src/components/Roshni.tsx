// Roshni: GapLens' pocket-torch guide. Original SVG, flat fills only (one accent: amber).
type Mood = "idle" | "searching" | "found" | "worried" | "sleeping";

export function Roshni({ mood = "idle", size = 120, className = "" }: { mood?: Mood; size?: number; className?: string }) {
  const beamOn = mood === "searching" || mood === "found" || mood === "idle";
  const eyesClosed = mood === "sleeping";
  return (
    <svg width={size} height={size * 1.5} viewBox="0 0 120 180" className={className} role="img"
      aria-label={mood === "searching" ? "Roshni is searching your sources" : mood === "worried" ? "Roshni looks worried" : "Roshni, the GapLens torch"}>
      {/* beam: flat translucent amber cone */}
      {beamOn && (
        <g className={mood === "searching" ? "roshni-beam-sweep" : ""} style={{ transformOrigin: "60px 108px" }}>
          <path d="M42 112 L-6 180 L126 180 L78 112 Z" fill="#FBBF24" opacity={mood === "found" ? 0.22 : 0.12} />
        </g>
      )}
      <g className={mood === "sleeping" ? "" : "bob"}>
        {/* arms */}
        <path d="M30 62 q-12 4 -14 16" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M90 62 q12 4 14 16" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round" fill="none" />
        {/* body */}
        <rect x="32" y="14" width="56" height="78" rx="18" fill={mood === "worried" || mood === "sleeping" ? "#8A6A1C" : "#FBBF24"} />
        <rect x="32" y="64" width="56" height="10" fill="#1A2332" />
        <circle cx="76" cy="69" r="2.5" fill="#FBBF24" />
        {/* lens ring + face */}
        <rect x="38" y="90" width="44" height="22" rx="8" fill="#1A2332" />
        <rect x="42" y="94" width="36" height="14" rx="6" fill={beamOn ? "#FBBF24" : "#2C384E"} />
        {eyesClosed ? (
          <>
            <path d="M46 36 q5 4 10 0" stroke="#0E1524" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M64 36 q5 4 10 0" stroke="#0E1524" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="51" cy="36" r="4.2" fill="#0E1524" />
            <circle cx="69" cy="36" r="4.2" fill="#0E1524" />
          </>
        )}
        {mood === "worried" ? (
          <path d="M52 52 q8 -6 16 0" stroke="#0E1524" strokeWidth="3" fill="none" strokeLinecap="round" />
        ) : mood === "found" ? (
          <path d="M50 47 q10 10 20 0" stroke="#0E1524" strokeWidth="3.4" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M53 48 q7 6 14 0" stroke="#0E1524" strokeWidth="3" fill="none" strokeLinecap="round" />
        )}
        {mood === "sleeping" && <text x="92" y="18" fill="#94A3B8" fontSize="14" fontFamily="sans-serif">z</text>}
      </g>
    </svg>
  );
}
