// ── Professional Casino Slot Symbols ─────────────────────────────────────────
// Uses CSS classes + inline styles instead of SVG <defs> gradients
// so multiple instances of the same symbol render correctly.

export const SLOT_SYMBOLS = {
  // Diamond — cyan/blue, rarest
  diamond: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="59" rx="16" ry="3" fill="#000" opacity="0.3" />
      {/* main body */}
      <path d="M32 6 L54 24 L32 58 L10 24 Z" fill="#38bdf8" />
      {/* top-left facet — lightest */}
      <path d="M32 6 L10 24 L32 24 Z" fill="#e0f9ff" opacity="0.9" />
      {/* top-right facet */}
      <path d="M32 6 L54 24 L32 24 Z" fill="#7dd3fc" opacity="0.85" />
      {/* bottom-left facet — dark */}
      <path d="M10 24 L32 24 L32 58 Z" fill="#0369a1" opacity="0.9" />
      {/* bottom-right facet — darkest */}
      <path d="M54 24 L32 24 L32 58 Z" fill="#075985" opacity="0.95" />
      {/* center inner facet */}
      <path d="M20 24 L44 24 L32 44 Z" fill="#67e8f9" opacity="0.4" />
      {/* top shine */}
      <path d="M29 9 L32 6 L35 9 L32 19 Z" fill="#fff" opacity="0.7" />
      <path
        d="M24 16 L32 8 L36 14"
        stroke="#fff"
        strokeWidth="1"
        opacity="0.3"
        fill="none"
        strokeLinecap="round"
      />
      {/* outline */}
      <path
        d="M32 6 L54 24 L32 58 L10 24 Z"
        fill="none"
        stroke="#0891b2"
        strokeWidth="1.5"
      />
      <line
        x1="10"
        y1="24"
        x2="54"
        y2="24"
        stroke="#0891b2"
        strokeWidth="0.8"
        opacity="0.5"
      />
    </svg>
  ),

  // BAR — silver/steel
  bar: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="59" rx="18" ry="2.5" fill="#000" opacity="0.25" />
      {/* body */}
      <rect x="7" y="17" width="50" height="32" rx="7" fill="#6b7280" />
      {/* top highlight band */}
      <rect
        x="7"
        y="17"
        width="50"
        height="13"
        rx="7"
        fill="#e5e7eb"
        opacity="0.55"
      />
      {/* bottom shadow */}
      <rect
        x="7"
        y="38"
        width="50"
        height="11"
        rx="7"
        fill="#1f2937"
        opacity="0.4"
      />
      {/* shine streak */}
      <rect
        x="11"
        y="20"
        width="24"
        height="5"
        rx="2.5"
        fill="#fff"
        opacity="0.3"
      />
      {/* BAR text */}
      <text
        x="32"
        y="41"
        textAnchor="middle"
        fontFamily="'Arial Black', 'Impact', sans-serif"
        fontSize="18"
        fontWeight="900"
        fill="#111827"
        letterSpacing="3"
      >
        BAR
      </text>
      {/* outline */}
      <rect
        x="7"
        y="17"
        width="50"
        height="32"
        rx="7"
        fill="none"
        stroke="#4b5563"
        strokeWidth="1.5"
      />
      {/* top edge */}
      <rect
        x="8"
        y="18"
        width="48"
        height="2"
        rx="1"
        fill="#fff"
        opacity="0.2"
      />
    </svg>
  ),

  // Star — gold
  star: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="59" rx="14" ry="2.5" fill="#000" opacity="0.25" />
      {/* outer glow layer */}
      <path
        d="M32 7 L37 22 L53 22 L40 31.5 L45 47 L32 38 L19 47 L24 31.5 L11 22 L27 22 Z"
        fill="#f59e0b"
        opacity="0.25"
        transform="scale(1.06) translate(-1.9 -1.9)"
      />
      {/* main star */}
      <path
        d="M32 7 L37 22 L53 22 L40 31.5 L45 47 L32 38 L19 47 L24 31.5 L11 22 L27 22 Z"
        fill="#f59e0b"
      />
      {/* inner lighter layer */}
      <path
        d="M32 11 L36 23 L50 23 L39 31 L43 45 L32 37 L21 45 L25 31 L14 23 L28 23 Z"
        fill="#fde047"
        opacity="0.5"
      />
      {/* top shine */}
      <path d="M30 10 L32 7 L34 10 L32 19 Z" fill="#fff" opacity="0.65" />
      {/* outline */}
      <path
        d="M32 7 L37 22 L53 22 L40 31.5 L45 47 L32 38 L19 47 L24 31.5 L11 22 L27 22 Z"
        fill="none"
        stroke="#d97706"
        strokeWidth="1.2"
      />
    </svg>
  ),

  // Grapes — purple
  grapes: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* stem */}
      <path
        d="M32 8 Q37 12 35 17"
        stroke="#65a30d"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* leaf */}
      <path d="M35 10 Q42 5 44 12 Q39 15 35 10Z" fill="#4ade80" />
      <path
        d="M35 10 Q42 5 44 12"
        stroke="#16a34a"
        strokeWidth="0.8"
        fill="none"
      />
      {/* grape circles — dark base */}
      {[
        [32, 52],
        [23, 43],
        [32, 43],
        [41, 43],
        [19, 33],
        [28, 33],
        [37, 33],
        [46, 33],
        [23, 23],
        [32, 23],
        [41, 23],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="7" fill="#7e22ce" />
          <circle cx={cx} cy={cy} r="7" fill="#9333ea" opacity="0.8" />
          <circle cx={cx - 2} cy={cy - 2} r="2.5" fill="#fff" opacity="0.28" />
          <circle cx={cx - 1} cy={cy - 1} r="1.2" fill="#fff" opacity="0.45" />
        </g>
      ))}
    </svg>
  ),

  // Bell — classic casino gold bell
  bell: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="59" rx="12" ry="2.5" fill="#000" opacity="0.25" />
      {/* bell body — main */}
      <path
        d="M32 11 C19 11 13 23 13 35 C13 45 17 51 23 53 L41 53 C47 51 51 45 51 35 C51 23 45 11 32 11 Z"
        fill="#f59e0b"
      />
      {/* left highlight */}
      <path
        d="M32 13 C22 13 17 23 17 33 C17 41 20 47 25 50 L32 50 C26 47 22 41 22 33 C22 23 26 15 32 13 Z"
        fill="#fde047"
        opacity="0.45"
      />
      {/* right shadow */}
      <path
        d="M32 13 C42 13 47 23 47 33 C47 41 44 47 39 50 L32 50 C38 47 42 41 42 33 C42 23 38 15 32 13 Z"
        fill="#d97706"
        opacity="0.35"
      />
      {/* horizontal ribs */}
      <path
        d="M19 37 Q32 39.5 45 37"
        stroke="#b45309"
        strokeWidth="1.2"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M17 43 Q32 46 47 43"
        stroke="#b45309"
        strokeWidth="1.2"
        fill="none"
        opacity="0.5"
      />
      {/* top knob */}
      <circle
        cx="32"
        cy="11"
        r="4.5"
        fill="#d97706"
        stroke="#92400e"
        strokeWidth="1.2"
      />
      <circle cx="32" cy="11" r="2" fill="#fde047" />
      {/* clapper */}
      <circle
        cx="32"
        cy="55"
        r="4.5"
        fill="#d97706"
        stroke="#92400e"
        strokeWidth="1.5"
      />
      <circle cx="32" cy="55" r="2" fill="#fbbf24" />
      {/* outline */}
      <path
        d="M32 11 C19 11 13 23 13 35 C13 45 17 51 23 53 L41 53 C47 51 51 45 51 35 C51 23 45 11 32 11 Z"
        fill="none"
        stroke="#b45309"
        strokeWidth="1.5"
      />
    </svg>
  ),

  // Lemon — yellow
  lemon: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="59" rx="13" ry="2.5" fill="#000" opacity="0.25" />
      {/* body */}
      <ellipse
        cx="32"
        cy="34"
        rx="19"
        ry="22"
        fill="#fde047"
        transform="rotate(-8 32 34)"
      />
      {/* highlight */}
      <ellipse
        cx="26"
        cy="25"
        rx="7"
        ry="9"
        fill="#fef9c3"
        opacity="0.55"
        transform="rotate(-8 26 25)"
      />
      {/* shadow side */}
      <ellipse
        cx="38"
        cy="42"
        rx="8"
        ry="10"
        fill="#ca8a04"
        opacity="0.3"
        transform="rotate(-8 38 42)"
      />
      {/* left tip */}
      <path d="M14 30 Q9 32 11 38 Q15 33 14 30Z" fill="#fde047" />
      {/* right tip */}
      <path d="M50 30 Q55 32 53 38 Q49 33 50 30Z" fill="#fde047" />
      {/* leaf */}
      <path d="M32 12 Q39 5 45 9 Q41 15 32 13Z" fill="#4ade80" />
      <path
        d="M32 12 Q39 5 45 9"
        stroke="#16a34a"
        strokeWidth="1"
        fill="none"
      />
      {/* stem */}
      <line
        x1="32"
        y1="12"
        x2="32"
        y2="16"
        stroke="#65a30d"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* segment lines */}
      <path
        d="M32 14 L32 54"
        stroke="#ca8a04"
        strokeWidth="0.7"
        opacity="0.2"
        transform="rotate(-8 32 34)"
      />
      {/* outline */}
      <ellipse
        cx="32"
        cy="34"
        rx="19"
        ry="22"
        fill="none"
        stroke="#ca8a04"
        strokeWidth="1.5"
        transform="rotate(-8 32 34)"
      />
    </svg>
  ),

  // Cherry — red, most common
  cherry: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* stems */}
      <path
        d="M22 30 Q24 18 32 14 Q40 18 42 30"
        stroke="#65a30d"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* leaf */}
      <path d="M32 14 Q37 7 43 10 Q40 16 32 14Z" fill="#4ade80" />
      <path
        d="M32 14 Q37 7 43 10"
        stroke="#16a34a"
        strokeWidth="0.8"
        fill="none"
      />
      {/* left cherry */}
      <circle cx="20" cy="41" r="13" fill="#dc2626" />
      <circle cx="20" cy="41" r="13" fill="#ef4444" opacity="0.6" />
      <circle cx="16" cy="36" r="4" fill="#fff" opacity="0.3" />
      <circle cx="15" cy="35" r="2" fill="#fff" opacity="0.5" />
      <circle
        cx="20"
        cy="41"
        r="13"
        fill="none"
        stroke="#991b1b"
        strokeWidth="1.2"
      />
      {/* right cherry */}
      <circle cx="44" cy="41" r="13" fill="#b91c1c" />
      <circle cx="44" cy="41" r="13" fill="#ef4444" opacity="0.5" />
      <circle cx="40" cy="36" r="4" fill="#fff" opacity="0.3" />
      <circle cx="39" cy="35" r="2" fill="#fff" opacity="0.5" />
      <circle
        cx="44"
        cy="41"
        r="13"
        fill="none"
        stroke="#7f1d1d"
        strokeWidth="1.2"
      />
    </svg>
  ),

  // Seven — red/gold on dark circle
  seven: (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="59" rx="14" ry="2.5" fill="#000" opacity="0.25" />
      {/* background circle */}
      <circle
        cx="32"
        cy="32"
        r="28"
        fill="#1a0500"
        stroke="#d97706"
        strokeWidth="2"
      />
      <circle
        cx="32"
        cy="32"
        r="23"
        fill="none"
        stroke="#f59e0b"
        strokeWidth="0.7"
        opacity="0.3"
      />
      {/* 7 body — drawn as filled path */}
      <path
        d="M17 15 L47 15 L47 19 L29 53 L24 53 L41 19 L17 19 Z"
        fill="#ef4444"
        stroke="#7f1d1d"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      {/* gold top bar highlight */}
      <rect
        x="17"
        y="15"
        width="30"
        height="4"
        rx="1"
        fill="#fbbf24"
        opacity="0.7"
      />
      {/* shine on 7 */}
      <path d="M19 15 L35 15 L33 19 L17 19 Z" fill="#fff" opacity="0.18" />
      {/* sparkles */}
      <circle cx="46" cy="13" r="2.2" fill="#fde047" opacity="0.9" />
      <circle cx="18" cy="17" r="1.5" fill="#fbbf24" opacity="0.7" />
      <circle cx="50" cy="22" r="1.2" fill="#fef9c3" opacity="0.6" />
    </svg>
  ),
};

// Weighted reel pool
export const SYM_IDS = [
  "cherry",
  "cherry",
  "cherry",
  "cherry",
  "cherry",
  "cherry",
  "lemon",
  "lemon",
  "lemon",
  "lemon",
  "lemon",
  "bell",
  "bell",
  "bell",
  "bell",
  "grapes",
  "grapes",
  "grapes",
  "star",
  "star",
  "bar",
  "diamond",
];

export const SYM_PAYOUTS = {
  "diamond-diamond-diamond": 40,
  "bar-bar-bar": 25,
  "star-star-star": 15,
  "grapes-grapes-grapes": 10,
  "bell-bell-bell": 7,
  "lemon-lemon-lemon": 5,
  "cherry-cherry-cherry": 3,
};

export const SYM_LABELS = {
  diamond: "Diamond",
  bar: "BAR",
  star: "Star",
  grapes: "Grapes",
  bell: "Bell",
  lemon: "Lemon",
  cherry: "Cherry",
};
