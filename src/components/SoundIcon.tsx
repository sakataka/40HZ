import type { ReactNode } from 'react';

/** Hand-drawn 24px stroke icons, one per sound, so the library can be scanned without reading. */
const PATHS: Record<string, ReactNode> = {
  'breath-resonance': (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4" />
    </>
  ),
  'breath-sigh': (
    <>
      <path d="M4 15c2-5 4-5 6-2.5S13 9 15 9s3 3 5 6" />
      <path d="M4 19h16" />
    </>
  ),
  'breath-bedtime': <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5Z" />,
  'noise-ocean': (
    <>
      <path d="M3 10c2.2-2 4.3-2 6.5 0s4.3 2 6.5 0 3.5-2 5 0" />
      <path d="M3 15c2.2-2 4.3-2 6.5 0s4.3 2 6.5 0 3.5-2 5 0" />
    </>
  ),
  'noise-wind': (
    <>
      <path d="M3 9h11a3 3 0 1 0-3-3" />
      <path d="M3 13h15a3 3 0 1 1-3 3" />
      <path d="M3 17h6" />
    </>
  ),
  recommended: <path d="M3 12h3l2.5-6 4 12 4-12L19 12h2" />,
  gentle: <path d="M3 12h3c1.5 0 1.5-4 3-4s1.5 8 3 8 1.5-8 3-8 1.5 4 3 4h3" />,
  exploratory: <path d="M3 16h3V8h4v8h4V8h4v8h3" />,
  'noise-pink': <path d="M5 10v4M9 7v10M13 9v6M17 6v12M21 11v2M1 11v2" />,
  'noise-brown': <path d="M4 12v4M8 13v3M12 11v5M16 13v3M20 12v4" />,
  'noise-rain': (
    <>
      <path d="M7 4l-2 5M13 4l-2 5M19 4l-2 5" />
      <path d="M10 13l-2 5M16 13l-2 5" />
    </>
  ),
  'noise-fire': (
    <path d="M12 21c-3.6 0-6-2.4-6-5.6 0-3.4 2.6-5 3.4-8.4 1.9 1.4 2.4 3.2 2.3 4.6 1-.7 1.7-2 1.8-3.4 2.3 1.9 3.5 4.3 3.5 7.1 0 3.3-2.4 5.7-5 5.7Z" />
  ),
};

export function SoundIcon({ profileId, size = 24 }: { profileId: string; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      className="sound-glyph"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[profileId] ?? PATHS.recommended}
    </svg>
  );
}
