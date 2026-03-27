export function TampaHero({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 200"
      className={className}
      aria-hidden="true"
    >
      {/* Sky gradient */}
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#065f46" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="sunset" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
          <stop offset="70%" stopColor="#f59e0b" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="400" height="200" fill="url(#sky)" />

      {/* Sunset glow */}
      <ellipse cx="320" cy="120" rx="100" ry="80" fill="url(#sunset)" />

      {/* Sun */}
      <circle cx="320" cy="115" r="18" fill="#f59e0b" opacity="0.6" />
      <circle cx="320" cy="115" r="12" fill="#fbbf24" opacity="0.4" />

      {/* Tampa skyline silhouette */}
      <g opacity="0.15" fill="#34d399">
        <rect x="240" y="85" width="12" height="50" />
        <rect x="255" y="75" width="10" height="60" />
        <rect x="268" y="90" width="14" height="45" />
        <rect x="285" y="70" width="8" height="65" rx="2" />
        <rect x="296" y="82" width="16" height="53" />
        <rect x="315" y="88" width="11" height="47" />
        <rect x="329" y="78" width="9" height="57" />
      </g>

      {/* Water line */}
      <rect x="0" y="135" width="400" height="65" fill="url(#water)" />

      {/* Water ripple lines */}
      <g stroke="#34d399" strokeWidth="0.5" opacity="0.15" fill="none">
        <path d="M0 145 Q50 142 100 145 T200 145 T300 145 T400 145" />
        <path d="M0 155 Q60 152 120 155 T240 155 T360 155 T400 155" />
        <path d="M0 165 Q40 162 80 165 T160 165 T240 165 T320 165 T400 165" />
      </g>

      {/* Pirate ship */}
      <g transform="translate(120, 95)">
        {/* Hull */}
        <path d="M-40 40 Q-45 25 -30 15 L50 15 Q65 25 60 40 Z"
          fill="#1e293b" stroke="#34d399" strokeWidth="1.2" />
        <path d="M-30 15 L50 15" stroke="#34d399" strokeWidth="0.8" opacity="0.5" />

        {/* Main mast */}
        <line x1="10" y1="15" x2="10" y2="-45" stroke="#34d399" strokeWidth="1.5" />
        {/* Crow's nest */}
        <rect x="4" y="-48" width="12" height="5" rx="1" fill="#1e293b" stroke="#34d399" strokeWidth="0.8" />

        {/* Pirate flag on top */}
        <g transform="translate(10, -60)">
          <rect x="0" y="0" width="18" height="12" rx="1" fill="#34d399" opacity="0.9" />
          {/* Skull */}
          <circle cx="6" cy="5" r="1.2" fill="#0f172a" />
          <circle cx="12" cy="5" r="1.2" fill="#0f172a" />
          <line x1="5" y1="9" x2="13" y2="9" stroke="#0f172a" strokeWidth="1" strokeLinecap="round" />
          {/* Crossbones (tiny golf clubs!) */}
          <line x1="2" y1="2" x2="16" y2="10" stroke="#0f172a" strokeWidth="0.7" />
          <line x1="16" y1="2" x2="2" y2="10" stroke="#0f172a" strokeWidth="0.7" />
        </g>

        {/* Main sail */}
        <path d="M12 -40 Q30 -30 28 -5 L12 -5 Z" fill="#34d399" opacity="0.12" stroke="#34d399" strokeWidth="0.5" />

        {/* Fore sail */}
        <line x1="-20" y1="15" x2="-20" y2="-20" stroke="#34d399" strokeWidth="1" />
        <path d="M-18 -18 Q-5 -12 -5 5 L-18 5 Z" fill="#34d399" opacity="0.1" stroke="#34d399" strokeWidth="0.5" />

        {/* Rear mast */}
        <line x1="40" y1="15" x2="40" y2="-25" stroke="#34d399" strokeWidth="1" />
        <path d="M42 -22 Q55 -16 53 0 L42 0 Z" fill="#34d399" opacity="0.1" stroke="#34d399" strokeWidth="0.5" />

        {/* Rigging */}
        <line x1="-20" y1="-18" x2="10" y2="-45" stroke="#34d399" strokeWidth="0.3" opacity="0.3" />
        <line x1="40" y1="-22" x2="10" y2="-45" stroke="#34d399" strokeWidth="0.3" opacity="0.3" />
      </g>

      {/* Left palm tree */}
      <g transform="translate(35, 70)">
        {/* Trunk */}
        <path d="M0 65 Q3 40 -2 20 Q-4 10 0 0" stroke="#34d399" strokeWidth="2.5" fill="none" opacity="0.5" />
        {/* Fronds */}
        <path d="M0 0 Q-25 -5 -30 10" stroke="#34d399" strokeWidth="1.2" fill="none" opacity="0.35" />
        <path d="M0 0 Q-20 -15 -28 -5" stroke="#34d399" strokeWidth="1.2" fill="none" opacity="0.35" />
        <path d="M0 0 Q5 -20 20 -15" stroke="#34d399" strokeWidth="1.2" fill="none" opacity="0.35" />
        <path d="M0 0 Q15 -10 25 0" stroke="#34d399" strokeWidth="1.2" fill="none" opacity="0.35" />
        <path d="M0 0 Q-10 -20 -5 -25" stroke="#34d399" strokeWidth="1.2" fill="none" opacity="0.35" />
        {/* Coconuts */}
        <circle cx="-2" cy="3" r="1.5" fill="#34d399" opacity="0.3" />
        <circle cx="2" cy="4" r="1.5" fill="#34d399" opacity="0.3" />
      </g>

      {/* Right palm tree */}
      <g transform="translate(370, 80)">
        <path d="M0 55 Q-2 35 2 15 Q3 8 0 0" stroke="#34d399" strokeWidth="2" fill="none" opacity="0.4" />
        <path d="M0 0 Q-20 -8 -25 5" stroke="#34d399" strokeWidth="1" fill="none" opacity="0.25" />
        <path d="M0 0 Q-15 -15 -22 -5" stroke="#34d399" strokeWidth="1" fill="none" opacity="0.25" />
        <path d="M0 0 Q10 -18 22 -10" stroke="#34d399" strokeWidth="1" fill="none" opacity="0.25" />
        <path d="M0 0 Q15 -5 20 5" stroke="#34d399" strokeWidth="1" fill="none" opacity="0.25" />
      </g>

      {/* Golf flag on small island */}
      <g transform="translate(330, 128)">
        <ellipse cx="0" cy="6" rx="12" ry="3" fill="#34d399" opacity="0.15" />
        <line x1="0" y1="6" x2="0" y2="-12" stroke="#34d399" strokeWidth="1" opacity="0.5" />
        <path d="M0 -12 L8 -8 L0 -4 Z" fill="#f59e0b" opacity="0.5" />
        <circle cx="0" cy="6" r="1.5" fill="#34d399" opacity="0.3" />
      </g>

      {/* Stars */}
      <g fill="#34d399" opacity="0.2">
        <circle cx="30" cy="15" r="1" />
        <circle cx="80" cy="25" r="0.8" />
        <circle cx="150" cy="10" r="1.2" />
        <circle cx="200" cy="30" r="0.7" />
        <circle cx="260" cy="18" r="0.9" />
        <circle cx="180" cy="45" r="0.6" />
        <circle cx="50" cy="50" r="0.8" />
        <circle cx="350" cy="30" r="1" />
        <circle cx="380" cy="15" r="0.7" />
      </g>
    </svg>
  );
}

export function PirateFlag({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
    >
      {/* Mast / golf flagstick */}
      <line x1="12" y1="6" x2="12" y2="44" stroke="#34d399" strokeWidth="2" />
      {/* Flag */}
      <path d="M12 6 Q28 10 28 16 Q28 22 12 26 Z" fill="#34d399" opacity="0.8" />
      {/* Skull on flag */}
      <circle cx="18" cy="13" r="1.5" fill="#0f172a" />
      <circle cx="22" cy="13" r="1.5" fill="#0f172a" />
      <line x1="17" y1="18" x2="23" y2="18" stroke="#0f172a" strokeWidth="1" strokeLinecap="round" />
      {/* Golf ball at base */}
      <circle cx="12" cy="44" r="3" fill="#34d399" opacity="0.3" />
    </svg>
  );
}
