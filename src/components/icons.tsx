import type { ReactNode } from "react";

type IconProps = { className?: string };

const SPOKES = [0, 45, 90, 135, 180, 225, 270, 315];

export function ShipWheel({ className, children }: IconProps & { children?: ReactNode }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        <circle cx="32" cy="32" r="19" strokeWidth="3" />
        <circle cx="32" cy="32" r="14.5" strokeWidth="1.4" />
        {SPOKES.map((deg) => (
          <g key={deg} transform={`rotate(${deg} 32 32)`}>
            <line x1="32" y1="5" x2="32" y2="17.5" strokeWidth="3" />
            <circle cx="32" cy="5" r="2.4" fill="currentColor" stroke="none" />
          </g>
        ))}
      </g>
      {children ?? <circle cx="32" cy="32" r="4" fill="currentColor" />}
    </svg>
  );
}

export function HelmLogo({ className }: IconProps) {
  return (
    <ShipWheel className={className}>
      <text
        x="32"
        y="45"
        textAnchor="middle"
        fontFamily="'Playfair Display', Georgia, serif"
        fontWeight="900"
        fontSize="38"
        fill="currentColor"
        stroke="#120c07"
        strokeWidth="2.4"
        paintOrder="stroke"
      >
        ฿
      </text>
    </ShipWheel>
  );
}

export function BeriTarget({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeLinecap="round">
        <circle cx="50" cy="50" r="33" strokeWidth="8" />
        <circle cx="50" cy="50" r="23" strokeWidth="2.6" />
        <path d="M50 2 V20 M50 80 V98 M2 50 H20 M80 50 H98" strokeWidth="4.5" />
      </g>
      <text
        x="50"
        y="63"
        textAnchor="middle"
        fontFamily="'Playfair Display', Georgia, serif"
        fontWeight="900"
        fontSize="36"
        fill="currentColor"
      >
        ฿
      </text>
    </svg>
  );
}

export function StrawHatIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
        <ellipse cx="32" cy="40" rx="27" ry="9" fill="#ecd6a6" />
        <path d="M17 39 C16 21 48 21 47 39 C40 42 24 42 17 39Z" fill="#ecd6a6" />
        <path d="M17.4 34.5 C25 37.5 39 37.5 46.6 34.5 L46.9 38.2 C39 41.4 25 41.4 17.1 38.2Z" fill="#9c3424" />
      </g>
      <path d="M12 41 C20 45 44 45 52 41" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

export function CompassIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <g fill="none" stroke="currentColor">
        <circle cx="32" cy="32" r="21" strokeWidth="2.2" />
        <circle cx="32" cy="32" r="15" strokeWidth="1.1" />
      </g>
      <path d="M32 4 L36 28 L60 32 L36 36 L32 60 L28 36 L4 32 L28 28Z" fill="currentColor" opacity="0.22" />
      <path d="M32 10 L35.5 32 L32 54 L28.5 32Z M10 32 L32 28.5 L54 32 L32 35.5Z" fill="currentColor" />
      <circle cx="32" cy="32" r="2.6" fill="#ecd6a6" />
    </svg>
  );
}

export function DiamondIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
        <path d="M12 25 L21 12 H43 L52 25 L32 53Z" />
        <path d="M12 25 H52 M21 12 L27 25 L32 53 L37 25 L43 12 M27 25 L32 12 L37 25" strokeWidth="1.6" />
      </g>
    </svg>
  );
}

export function SkullIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 40" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="3.6" strokeLinecap="round">
        <path d="M8 33 L40 9 M8 9 L40 33" />
      </g>
      <g fill="currentColor">
        <circle cx="6" cy="7" r="2.6" />
        <circle cx="42" cy="7" r="2.6" />
        <circle cx="6" cy="35" r="2.6" />
        <circle cx="42" cy="35" r="2.6" />
        <path d="M24 6 C15.5 6 12 12 12 17.5 C12 21.5 14 24 16.5 25 V30 H31.5 V25 C34 24 36 21.5 36 17.5 C36 12 32.5 6 24 6Z" />
      </g>
      <g fill="#e3c899">
        <circle cx="19.5" cy="17.5" r="3.4" />
        <circle cx="28.5" cy="17.5" r="3.4" />
        <path d="M24 21.5 L26 25 H22Z" />
      </g>
    </svg>
  );
}

export function PosterScroll({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 80" aria-hidden="true">
      <path
        d="M15 3 C5 5 4 15 10 17 C14 18 14.5 13 11 12.5 M10 17 C3.5 22 3.5 35 9 40 C3.5 45 3.5 58 10 63 M10 63 C14.5 62.5 14 67.5 10.5 68 M10 63 C4 65 5 75 15 77"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CompassRose({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 200 200" aria-hidden="true">
      <g fill="none" stroke="currentColor">
        <circle cx="100" cy="100" r="92" strokeWidth="1.2" />
        <circle cx="100" cy="100" r="78" strokeWidth="0.8" />
        <circle cx="100" cy="100" r="40" strokeWidth="0.8" />
        {Array.from({ length: 32 }, (_, i) => (
          <line key={i} x1="100" y1="8" x2="100" y2={i % 4 === 0 ? 24 : 15} transform={`rotate(${i * 11.25} 100 100)`} />
        ))}
      </g>
      <path d="M100 14 L110 90 L186 100 L110 110 L100 186 L90 110 L14 100 L90 90Z" fill="currentColor" opacity="0.7" />
      <path d="M100 44 L106 94 L156 100 L106 106 L100 156 L94 106 L44 100 L94 94Z" fill="currentColor" transform="rotate(45 100 100)" opacity="0.45" />
    </svg>
  );
}

export function CliffsArt({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 360 200" aria-hidden="true">
      <path
        d="M90 200 L118 150 L130 156 L150 96 L164 104 L178 52 L190 60 L198 30 L212 74 L226 66 L240 118 L256 112 L282 168 L300 160 L330 200Z"
        fill="currentColor"
      />
      <path d="M20 200 C60 190 80 196 120 192 M250 196 C290 188 320 194 360 190" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M60 52 q6 -6 12 0 q6 -6 12 0" />
        <path d="M96 30 q4 -4 8 0 q4 -4 8 0" />
        <path d="M40 80 q4 -4 8 0 q4 -4 8 0" />
        <path d="M118 62 q3 -3 6 0 q3 -3 6 0" />
        <path d="M78 98 q3 -3 6 0 q3 -3 6 0" />
      </g>
    </svg>
  );
}

function Stroke({ className, d, size = 24 }: IconProps & { d: string; size?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const WalletIcon = (p: IconProps) => (
  <Stroke {...p} size={18} d="M4 7.5h14.5a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18V6.5A1.5 1.5 0 0 1 5.5 5H17M16 13.5h.01" />
);
export const EditIcon = (p: IconProps) => (
  <Stroke {...p} d="M11 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V13M18.4 3.6a2 2 0 0 1 2.9 2.9L12 15.8l-3.6.8.8-3.6Z" />
);
export const ArrowRight = (p: IconProps) => <Stroke {...p} size={18} d="M5 12h14M13 6l6 6-6 6" />;
export const ChevronLeft = (p: IconProps) => <Stroke {...p} size={30} d="M15 4 7 12l8 8" />;
export const ChevronRight = (p: IconProps) => <Stroke {...p} size={30} d="M9 4l8 8-8 8" />;
export const ChevronDown = (p: IconProps) => <Stroke {...p} size={16} d="M6 9l6 6 6-6" />;
export const CopyIcon = (p: IconProps) => (
  <Stroke {...p} size={17} d="M9 9h10.5v10.5H9zM15 9V4.5H4.5V15H9" />
);
export const CheckIcon = (p: IconProps) => <Stroke {...p} size={17} d="M5 12.5l4.5 4.5L19 7.5" />;
export const LogoutIcon = (p: IconProps) => (
  <Stroke {...p} size={17} d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14M10 16l-4-4 4-4M6 12h10" />
);
export const CloseIcon = (p: IconProps) => <Stroke {...p} size={20} d="M6 6l12 12M18 6 6 18" />;
export const EyeIcon = (p: IconProps) => (
  <Stroke {...p} d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
);
export const UploadCloudIcon = (p: IconProps) => (
  <Stroke {...p} size={30} d="M7.5 18.5H6.8a4.3 4.3 0 0 1-.6-8.6 6 6 0 0 1 11.6 1.3 3.7 3.7 0 0 1 0 7.3h-1.3M12 20v-8.5M8.8 14.6 12 11.4l3.2 3.2" />
);
export const ShieldIcon = (p: IconProps) => (
  <Stroke {...p} size={18} d="M12 3 4.5 6v5.5c0 4.6 3.1 8.1 7.5 9.5 4.4-1.4 7.5-4.9 7.5-9.5V6L12 3ZM8.8 12l2.2 2.2 4.3-4.4" />
);
export const LockIcon = (p: IconProps) => (
  <Stroke {...p} size={26} d="M6.5 10.5h11a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19v-7a1.5 1.5 0 0 1 1.5-1.5ZM8.5 10.5V7.8a3.5 3.5 0 0 1 7 0v2.7M12 14.5v2" />
);

export function VerifiedBadge({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
      <circle cx="8" cy="8" r="7.5" fill="#2f8a46" />
      <path d="M4.6 8.2 7 10.4l4.4-4.6" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BeriCoin({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="15" fill="#2a1a0e" />
      <circle cx="16" cy="16" r="12.2" fill="none" stroke="#d6a04a" strokeWidth="1.4" />
      <text
        x="16"
        y="22.5"
        textAnchor="middle"
        fontFamily="'Playfair Display', Georgia, serif"
        fontWeight="900"
        fontSize="18"
        fill="#ebc57f"
      >
        ฿
      </text>
    </svg>
  );
}

export function WantedMiniIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 60" aria-hidden="true">
      <path d="M4 3h40l-2 6 2 6-2 8 2 7-2 8 2 7-2 7 2 6H4l2-6-2-7 2-7-2-8 2-7-2-8 2-6Z" fill="#e8d1a0" stroke="currentColor" strokeWidth="2" />
      <text x="24" y="15" textAnchor="middle" fontFamily="'Playfair Display', serif" fontWeight="900" fontSize="9.5" fill="currentColor">
        WANTED
      </text>
      <rect x="11" y="19" width="26" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="24" cy="26.5" r="4" fill="currentColor" />
      <path d="M16 39c1.5-5 5-7 8-7s6.5 2 8 7Z" fill="currentColor" />
      <path d="M12 45h24M15 50h18" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function WalletBadgeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
        <path d="M13 18.5h20a2 2 0 0 1 2 2V32a2 2 0 0 1-2 2H15a2 2 0 0 1-2-2V17a2.5 2.5 0 0 1 2.5-2.5H31" />
        <path d="M35 23h-5.5a2.5 2.5 0 0 0 0 5H35Z" />
      </g>
    </svg>
  );
}
export const RefreshIcon = (p: IconProps) => (
  <Stroke {...p} size={18} d="M20 11a8 8 0 0 0-14.6-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.6 4.5L20 16M20 20v-4h-4" />
);

export function MetaMaskIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#f6851b" />
      <path
        fill="#fffdf8"
        d="M8.2 22.6 6.4 10.2 12.6 16.1 16 8.4l3.4 7.7 6.2-5.9-1.8 12.4-4.6-2.2L16 24.4l-3.2-4-4.6 2.2Z"
      />
      <path fill="#e2761b" d="M12.8 20.4 16 24.4l3.2-4-3.2-1.8-3.2 1.8Z" />
    </svg>
  );
}

export function PhantomIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#ab9ff2" />
      <path
        d="M6.5 22.4C6.5 15.2 11.6 9 18.3 9c5.2 0 7.9 3.6 7.9 7.6 0 3.6-2.6 6.2-6 6.2h-.6c-1 0-1.5.8-2.1 1.8-.7 1.1-1.6 2.2-3 2.2-1.7 0-2.4-1.3-3-2.6-.4-.9-.9-1.5-1.8-1.5-1 0-1.6.8-2.2 1.3-.5.4-1 .5-1-.6Z"
        fill="#fffdf8"
      />
      <ellipse cx="17.2" cy="15.6" rx="1.2" ry="1.9" fill="#3c315b" />
      <ellipse cx="21.6" cy="15.6" rx="1.2" ry="1.9" fill="#3c315b" />
    </svg>
  );
}
