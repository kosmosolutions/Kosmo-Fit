// Self-contained programmatic illustrations for the overview log tiles.
// Same constraint as TemplateHero — Canva is blocked by the sandbox network
// policy, so the art ships as inline SVG: stable, no network, themable.

export function MealTileArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 96"
      className={className}
      aria-hidden="true"
      role="img"
    >
      <defs>
        <radialGradient id="meal-bg" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
          <stop offset="60%" stopColor="#0ea5e9" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="meal-apple" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>
        <linearGradient id="meal-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>

      <rect width="96" height="96" rx="20" fill="url(#meal-bg)" />

      {/* Plate */}
      <ellipse cx="48" cy="74" rx="32" ry="5" fill="#fff" fillOpacity="0.08" />
      <ellipse cx="48" cy="72" rx="30" ry="4" fill="#fff" fillOpacity="0.16" />

      {/* Apple body — two lobes */}
      <path
        d="M48 28c-6-6-18-5-22 4-5 11 2 24 12 30 4 2 7 2 10 0 10-6 17-19 12-30-4-9-16-10-22-4z"
        fill="url(#meal-apple)"
      />
      {/* Highlight */}
      <ellipse
        cx="38"
        cy="40"
        rx="5"
        ry="8"
        fill="#fff"
        fillOpacity="0.28"
        transform="rotate(-20 38 40)"
      />
      {/* Stem */}
      <path
        d="M48 28c0-4 1-7 3-9"
        stroke="#451a03"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Leaf */}
      <path
        d="M51 22c4-3 10-3 13 1-3 4-9 5-13 3-1-1-1-3 0-4z"
        fill="url(#meal-leaf)"
      />
    </svg>
  );
}

export function WorkoutTileArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 96"
      className={className}
      aria-hidden="true"
      role="img"
    >
      <defs>
        <radialGradient id="wk-bg" cx="50%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#7c3aed" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#4c1d95" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="wk-bell" cx="40%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="55%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4c1d95" />
        </radialGradient>
        <linearGradient id="wk-handle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
      </defs>

      <rect width="96" height="96" rx="20" fill="url(#wk-bg)" />

      {/* Floor shadow */}
      <ellipse cx="48" cy="80" rx="28" ry="4" fill="#000" fillOpacity="0.35" />

      {/* Handle — fat U so it reads at 64px */}
      <path
        d="M30 38c0-10 8-18 18-18s18 8 18 18v6h-8v-6c0-5.5-4.5-10-10-10s-10 4.5-10 10v6h-8v-6z"
        fill="url(#wk-handle)"
        stroke="#475569"
        strokeWidth="1"
      />

      {/* Bell body */}
      <path
        d="M22 56c0-9 11.6-16 26-16s26 7 26 16c0 13-11.6 22-26 22S22 69 22 56z"
        fill="url(#wk-bell)"
      />

      {/* Top highlight */}
      <ellipse
        cx="38"
        cy="50"
        rx="9"
        ry="4"
        fill="#fff"
        fillOpacity="0.45"
      />

      {/* Lower sheen */}
      <path
        d="M28 64c4 6 12 9 20 9s16-3 20-9"
        stroke="#fff"
        strokeOpacity="0.18"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
