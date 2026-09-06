"use client";

export type MascotPose =
  | "wave"
  | "point"
  | "thumbsUp"
  | "sleep"
  | "coin"
  | "worried"
  | "cheer"
  | "peek";

interface MascotProps {
  pose?: MascotPose;
  size?: number;
  className?: string;
  animate?: boolean;
}

// น้องออม — a round, orange Wichian-Mat-inspired Thai cat with a coin-shaped
// chest marking and folded ear tips. Original silhouette: no bow, no
// accessory borrowed from any existing mascot. Body language communicated
// through arm position + eye shape rather than added props, so poses stay
// visually consistent across the app.

export function Mascot({ pose = "wave", size = 120, className = "", animate = true }: MascotProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="น้องออม มาสคอตแมวส้ม"
    >
      <defs>
        <linearGradient id="ag-fur" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F5A94E" />
          <stop offset="100%" stopColor="#E78132" />
        </linearGradient>
      </defs>

      {/* ground shadow */}
      <ellipse cx="100" cy="182" rx="46" ry="8" fill="#00233D" opacity="0.08" />

      {/* tail */}
      <path
        d={pose === "sleep" ? "M150 150 Q180 140 172 110 Q168 95 150 100" : "M148 158 Q186 150 182 108 Q180 84 156 92"}
        stroke="url(#ag-fur)"
        strokeWidth="16"
        strokeLinecap="round"
        fill="none"
      />

      {/* body */}
      <ellipse cx="100" cy="140" rx="52" ry="42" fill="url(#ag-fur)" />

      {/* chest coin patch — signature mark */}
      <circle cx="100" cy="146" r="20" fill="#FFFDF7" />
      <circle cx="100" cy="146" r="20" fill="none" stroke="#E78132" strokeWidth="2" opacity="0.35" />
      <text x="100" y="152" fontSize="18" textAnchor="middle" fill="#E78132" fontWeight="700" fontFamily="IBM Plex Sans Thai, sans-serif">฿</text>

      {/* head */}
      <circle cx="100" cy="82" r="46" fill="url(#ag-fur)" />

      {/* ears — folded rounded tips, distinctive silhouette */}
      <path d="M60 52 Q54 24 78 34 Q70 50 66 60 Z" fill="#E78132" />
      <path d="M140 52 Q146 24 122 34 Q130 50 134 60 Z" fill="#E78132" />
      <path d="M66 44 Q64 30 76 36" fill="none" stroke="#FFD9A8" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      <path d="M134 44 Q136 30 124 36" fill="none" stroke="#FFD9A8" strokeWidth="3" strokeLinecap="round" opacity="0.7" />

      {/* face marking - lighter muzzle */}
      <ellipse cx="100" cy="96" rx="24" ry="16" fill="#FFF3DE" opacity="0.85" />

      {/* eyes */}
      {pose === "sleep" ? (
        <>
          <path d="M78 82 Q86 88 94 82" stroke="#102A3A" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M106 82 Q114 88 122 82" stroke="#102A3A" strokeWidth="4" strokeLinecap="round" fill="none" />
        </>
      ) : pose === "worried" ? (
        <>
          <ellipse className={animate ? "ag-mascot-eye" : ""} cx="86" cy="80" rx="6" ry="8" fill="#102A3A" />
          <ellipse className={animate ? "ag-mascot-eye" : ""} cx="114" cy="80" rx="6" ry="8" fill="#102A3A" />
          <path d="M80 68 Q86 64 92 68" stroke="#102A3A" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M108 68 Q114 64 120 68" stroke="#102A3A" strokeWidth="3" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <ellipse className={animate ? "ag-mascot-eye" : ""} cx="86" cy="80" rx="6.5" ry="8.5" fill="#102A3A" />
          <ellipse className={animate ? "ag-mascot-eye" : ""} cx="114" cy="80" rx="6.5" ry="8.5" fill="#102A3A" />
          <circle cx="88.5" cy="77" r="2" fill="#FFFDF7" />
          <circle cx="116.5" cy="77" r="2" fill="#FFFDF7" />
        </>
      )}

      {/* nose */}
      <path d="M96 92 L104 92 L100 97 Z" fill="#F36B5F" />

      {/* mouth */}
      {pose === "worried" ? (
        <path d="M92 104 Q100 100 108 104" stroke="#102A3A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      ) : (
        <path d="M90 100 Q100 108 110 100" stroke="#102A3A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      )}

      {/* whiskers */}
      <path d="M56 92 L74 90 M56 100 L74 98" stroke="#102A3A" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
      <path d="M144 92 L126 90 M144 100 L126 98" stroke="#102A3A" strokeWidth="2" strokeLinecap="round" opacity="0.55" />

      {/* cheeks */}
      <ellipse cx="76" cy="94" rx="7" ry="4.5" fill="#F36B5F" opacity="0.35" />
      <ellipse cx="124" cy="94" rx="7" ry="4.5" fill="#F36B5F" opacity="0.35" />

      {/* arms — pose specific */}
      {pose === "wave" && (
        <path d="M138 130 Q160 118 156 96" stroke="url(#ag-fur)" strokeWidth="15" strokeLinecap="round" fill="none" />
      )}
      {pose === "point" && (
        <path d="M138 128 Q168 122 178 108" stroke="url(#ag-fur)" strokeWidth="15" strokeLinecap="round" fill="none" />
      )}
      {pose === "thumbsUp" && (
        <>
          <path d="M136 132 Q158 128 160 106" stroke="url(#ag-fur)" strokeWidth="15" strokeLinecap="round" fill="none" />
          <circle cx="161" cy="102" r="8" fill="#F5A94E" />
        </>
      )}
      {pose === "cheer" && (
        <>
          <path d="M64 130 Q44 112 52 90" stroke="url(#ag-fur)" strokeWidth="15" strokeLinecap="round" fill="none" />
          <path d="M136 130 Q156 112 148 90" stroke="url(#ag-fur)" strokeWidth="15" strokeLinecap="round" fill="none" />
        </>
      )}
      {pose === "coin" && (
        <>
          <path d="M136 128 Q152 116 148 100" stroke="url(#ag-fur)" strokeWidth="15" strokeLinecap="round" fill="none" />
          <circle cx="149" cy="94" r="11" fill="#FFD64F" stroke="#E78132" strokeWidth="2" className={animate ? "ag-animate-coin" : ""} />
          <text x="149" y="98" fontSize="11" textAnchor="middle" fill="#E78132" fontWeight="700">฿</text>
        </>
      )}
      {pose === "peek" && (
        <path d="M64 132 Q50 122 54 108" stroke="url(#ag-fur)" strokeWidth="15" strokeLinecap="round" fill="none" />
      )}

      {/* left arm default (rests on body) unless cheer already drew it */}
      {pose !== "cheer" && (
        <path d="M64 132 Q52 138 58 152" stroke="url(#ag-fur)" strokeWidth="15" strokeLinecap="round" fill="none" />
      )}
    </svg>
  );
}
