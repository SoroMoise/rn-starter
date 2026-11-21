import type { ReactNode } from 'react'
import type { IconName } from '@/lib/icons'

const PATHS: Record<IconName, ReactNode> = {
  bolt: <path d="M13 2.5 5 13.5h6l-1 8 8-11h-6l1-8Z" />,
  sliders: (
    <>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3 3 8l9 5 9-5-9-5Z" />
      <path d="m3 12.5 9 5 9-5M3 16.5l9 5 9-5" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16v-5a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.3 7.5 9.5 4.4-1.2 7.5-4.9 7.5-9.5V6L12 3Z" />
      <path d="m8.8 12 2.2 2.2 4.2-4.4" />
    </>
  ),
  offline: (
    <path d="M10.5 3.5a1.5 1.5 0 0 1 3 0V9l7 4v2l-7-2v4.5l2.5 2V21L12 20l-4 1v-1.5l2.5-2V13l-7 2v-2l7-4V3.5Z" />
  ),
  userOff: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.4 3.6-5.5 7-5.5s6.2 2.1 7 5.5M3.5 3.5l17 17" />
    </>
  ),
  ban: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m6 6 12 12" />
    </>
  ),
  infinity: (
    <path d="M12 12c-2-2.5-3.5-4-5.5-4a4 4 0 0 0 0 8c2 0 3.5-1.5 5.5-4Zm0 0c2 2.5 3.5 4 5.5 4a4 4 0 0 0 0-8c-2 0-3.5 1.5-5.5 4Z" />
  ),
  diamond: (
    <>
      <path d="M6.5 4h11l3.5 5-9 11L3 9l3.5-5Z" />
      <path d="M3 9h18M9.5 4 8 9l4 11 4-11-1.5-5" />
    </>
  ),
  gift: (
    <>
      <rect x="3.5" y="8" width="17" height="4" rx="1" />
      <path d="M5 12v8h14v-8M12 8v12M12 8c-1.5-3-5-3.5-5-1.2C7 8 9 8 12 8Zm0 0c1.5-3 5-3.5 5-1.2C17 8 15 8 12 8Z" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  play: <path d="M8 5.5v13l10.5-6.5L8 5.5Z" fill="currentColor" stroke="none" />,
  phone: (
    <>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path d="M10.5 18.5h3" />
    </>
  ),
  book: (
    <>
      <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v14H6.5A1.5 1.5 0 0 0 5 18.5v-14Z" />
      <path d="M5 18.5A1.5 1.5 0 0 0 6.5 20H19v-3M9 7h6" />
    </>
  ),
  bulb: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5M12 7.5h.01" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </>
  ),
  download: <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  cross: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="m4.5 12.5 4.5 4.5L19.5 6.5" />,
  chevronRight: <path d="m9 5 7 7-7 7" />,
  chevronDown: <path d="m5 9 7 7 7-7" />,
  arrowRight: <path d="M4 12h15M13 6l6 6-6 6" />,
  sparkle: (
    <path d="M12 3.5 13.9 10.1 20.5 12 13.9 13.9 12 20.5 10.1 13.9 3.5 12 10.1 10.1 12 3.5Z" />
  ),
  rss: (
    <>
      <path d="M5 11a8 8 0 0 1 8 8M5 5a14 14 0 0 1 14 14" />
      <circle cx="6" cy="18" r="1.5" />
    </>
  ),
}

export function Icon({
  name,
  size = 24,
  className,
  label,
}: {
  name: IconName
  size?: number
  className?: string
  label?: string
}) {
  return (
    <svg
      className={className ? `icon ${className}` : 'icon'}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false">
      {PATHS[name]}
    </svg>
  )
}
