"use client";

// A small library of original flat-vector illustrations with a slight
// isometric tilt, built from simple geometric shapes (slip, phone, coins,
// wallet, card, graph) per the brand brief. Used across onboarding and
// empty states.

export function IllustrationQuickEntry({ size = 200 }: { size?: number }) {
  return (
    <svg viewBox="0 0 240 220" width={size} height={size} role="img" aria-label="ภาพประกอบการจดรายการอย่างรวดเร็ว">
      <ellipse cx="120" cy="200" rx="80" ry="10" fill="#00233D" opacity="0.06" />
      {/* phone body, slight isometric tilt */}
      <g transform="rotate(-6 120 110)">
        <rect x="70" y="30" width="100" height="170" rx="20" fill="#00233D" />
        <rect x="78" y="46" width="84" height="130" rx="10" fill="#FFFDF7" />
        {/* transaction list rows on screen */}
        <rect x="90" y="62" width="60" height="18" rx="9" fill="#EAF1F7" />
        <circle cx="99" cy="71" r="6" fill="#E78132" />
        <rect x="90" y="86" width="60" height="18" rx="9" fill="#EAF1F7" />
        <circle cx="99" cy="95" r="6" fill="#1689F5" />
        <rect x="90" y="110" width="60" height="18" rx="9" fill="#EAF1F7" />
        <circle cx="99" cy="119" r="6" fill="#20B978" />
        {/* big tappable "+" button */}
        <circle cx="120" cy="152" r="16" fill="#1689F5" />
        <path d="M120 145 V159 M113 152 H127" stroke="#FFFDF7" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="120" cy="184" r="6" fill="#EAF1F7" />
      </g>
      {/* tapping finger */}
      <path d="M186 130 Q196 118 190 104" stroke="#F5A94E" strokeWidth="14" strokeLinecap="round" fill="none" />
      <circle cx="188" cy="100" r="9" fill="#F5A94E" />
      {/* floating coin */}
      <circle cx="50" cy="150" r="10" fill="#1689F5" opacity="0.85" />
    </svg>
  );
}

export function IllustrationSpendingClarity({ size = 200 }: { size?: number }) {
  return (
    <svg viewBox="0 0 240 220" width={size} height={size} role="img" aria-label="ภาพประกอบเห็นเงินไปไหน">
      <ellipse cx="120" cy="200" rx="80" ry="10" fill="#00233D" opacity="0.06" />
      {/* isometric donut chart card */}
      <g transform="translate(50 30)">
        <rect x="0" y="0" width="140" height="150" rx="22" fill="#FFFDF7" stroke="#EAF1F7" strokeWidth="2" />
        <circle cx="70" cy="65" r="42" fill="none" stroke="#EAF1F7" strokeWidth="18" />
        <circle cx="70" cy="65" r="42" fill="none" stroke="#E78132" strokeWidth="18" strokeDasharray="90 264" strokeLinecap="round" transform="rotate(-90 70 65)" />
        <circle cx="70" cy="65" r="42" fill="none" stroke="#1689F5" strokeWidth="18" strokeDasharray="60 264" strokeDashoffset="-90" strokeLinecap="round" transform="rotate(-90 70 65)" />
        <circle cx="70" cy="65" r="42" fill="none" stroke="#20B978" strokeWidth="18" strokeDasharray="50 264" strokeDashoffset="-150" strokeLinecap="round" transform="rotate(-90 70 65)" />
        <rect x="24" y="122" width="92" height="8" rx="4" fill="#EAF1F7" />
        <rect x="24" y="122" width="60" height="8" rx="4" fill="#FFD64F" />
      </g>
      {/* magnifier accent */}
      <circle cx="188" cy="150" r="18" fill="none" stroke="#00233D" strokeWidth="6" />
      <line x1="200" y1="163" x2="212" y2="175" stroke="#00233D" strokeWidth="6" strokeLinecap="round" />
      <circle cx="30" cy="60" r="9" fill="#F36B5F" opacity="0.85" />
    </svg>
  );
}

export function IllustrationPlanSave({ size = 200 }: { size?: number }) {
  return (
    <svg viewBox="0 0 240 220" width={size} height={size} role="img" aria-label="ภาพประกอบวางแผนออมเงิน">
      <ellipse cx="120" cy="200" rx="80" ry="10" fill="#00233D" opacity="0.06" />
      {/* wallet, isometric */}
      <g transform="translate(40 60)">
        <path d="M0 40 L70 20 L160 40 L160 110 L90 130 L0 110 Z" fill="#E78132" />
        <path d="M0 40 L70 20 L160 40 L90 60 Z" fill="#F5A94E" />
        <rect x="66" y="58" width="48" height="30" rx="6" fill="#FFD64F" stroke="#00233D" strokeWidth="2" />
        <circle cx="90" cy="73" r="5" fill="#00233D" />
      </g>
      {/* rising coin stack */}
      <g transform="translate(150 90)">
        <ellipse cx="20" cy="70" rx="20" ry="7" fill="#FFD64F" />
        <ellipse cx="20" cy="58" rx="20" ry="7" fill="#FFE083" />
        <ellipse cx="20" cy="46" rx="20" ry="7" fill="#FFD64F" />
        <ellipse cx="20" cy="34" rx="20" ry="7" fill="#FFE083" />
      </g>
      {/* growth arrow */}
      <path d="M40 130 L90 90 L120 110 L180 50" stroke="#20B978" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M164 50 L180 50 L180 66" stroke="#20B978" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IllustrationEmptyState({ size = 160 }: { size?: number }) {
  return (
    <svg viewBox="0 0 200 180" width={size} height={size} role="img" aria-label="ยังไม่มีรายการ">
      <ellipse cx="100" cy="160" rx="60" ry="8" fill="#00233D" opacity="0.05" />
      <rect x="50" y="50" width="100" height="90" rx="18" fill="#EAF1F7" />
      <rect x="66" y="70" width="68" height="8" rx="4" fill="#FFFDF7" />
      <rect x="66" y="86" width="50" height="8" rx="4" fill="#FFFDF7" />
      <rect x="66" y="102" width="60" height="8" rx="4" fill="#FFFDF7" />
      <circle cx="140" cy="46" r="18" fill="#FFD64F" />
      <text x="140" y="52" fontSize="18" textAnchor="middle" fill="#E78132" fontWeight="700">+</text>
    </svg>
  );
}

export function IllustrationCreditCard({ size = 120, colorFrom = "#4E2E7F", colorTo = "#2E1B4D" }: { size?: number; colorFrom?: string; colorTo?: string }) {
  const id = `grad-${colorFrom.replace("#", "")}`;
  return (
    <svg viewBox="0 0 180 110" width={size} height={(size * 110) / 180} role="img" aria-label="บัตรเครดิต">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={colorFrom} />
          <stop offset="100%" stopColor={colorTo} />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="176" height="106" rx="16" fill={`url(#${id})`} />
      <rect x="20" y="30" width="30" height="22" rx="4" fill="#FFD64F" opacity="0.9" />
      <rect x="20" y="76" width="70" height="8" rx="4" fill="#FFFDF7" opacity="0.85" />
      <rect x="20" y="60" width="50" height="7" rx="3.5" fill="#FFFDF7" opacity="0.6" />
    </svg>
  );
}
