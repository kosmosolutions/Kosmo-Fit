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
        <radialGradient id="wk-bg" cx="65%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.4" />
          <stop offset="60%" stopColor="#7c3aed" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="wk-bar" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="50%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        <linearGradient id="wk-plate" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>

      <rect width="96" height="96" rx="20" fill="url(#wk-bg)" />

      {/* Motion lines */}
      <g stroke="#a78bfa" strokeOpacity="0.35" strokeLinecap="round" strokeWidth="2">
        <line x1="10" y1="34" x2="20" y2="34" />
        <line x1="10" y1="48" x2="24" y2="48" />
        <line x1="10" y1="62" x2="20" y2="62" />
      </g>

      {/* Dumbbell — bar */}
      <rect x="30" y="44" width="36" height="8" rx="2" fill="url(#wk-bar)" />
      {/* Left plates */}
      <rect x="24" y="34" width="8" height="28" rx="2" fill="url(#wk-plate)" />
      <rect x="18" y="38" width="6" height="20" rx="2" fill="url(#wk-plate)" />
      {/* Right plates */}
      <rect x="64" y="34" width="8" height="28" rx="2" fill="url(#wk-plate)" />
      <rect x="72" y="38" width="6" height="20" rx="2" fill="url(#wk-plate)" />
      {/* End caps */}
      <rect x="16" y="42" width="2" height="12" rx="1" fill="#475569" />
      <rect x="78" y="42" width="2" height="12" rx="1" fill="#475569" />

      {/* Highlight on bar */}
      <rect x="32" y="45.5" width="32" height="1.5" rx="0.75" fill="#fff" fillOpacity="0.5" />
    </svg>
  );
}
