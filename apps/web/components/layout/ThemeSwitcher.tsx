'use client'

import { useSyncExternalStore, type ReactNode } from 'react'
import type { CommonContent } from '@/content/types'
import {
  DARK_QUERY,
  FORCED_THEME_COLOR_ID,
  THEME_COLOR,
  THEME_MODES,
  THEME_STORAGE_KEY,
  type ThemeMode,
} from '@/lib/theme'

const CHANGE_EVENT = 'site-theme-change'

let memoryMode: ThemeMode | null = null

function readMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : 'system'
  } catch {
    return memoryMode ?? 'system'
  }
}

function applyMode(mode: ThemeMode) {
  const root = document.documentElement
  const forced = document.getElementById(FORCED_THEME_COLOR_ID)
  if (mode === 'system') {
    delete root.dataset.theme
    forced?.remove()
    return
  }
  root.dataset.theme = mode
  const meta = forced ?? document.createElement('meta')
  meta.setAttribute('name', 'theme-color')
  meta.id = FORCED_THEME_COLOR_ID
  meta.setAttribute('content', THEME_COLOR[mode])
  if (!forced) document.head.prepend(meta)
}

function setMode(mode: ThemeMode) {
  memoryMode = mode
  try {
    if (mode === 'system') localStorage.removeItem(THEME_STORAGE_KEY)
    else localStorage.setItem(THEME_STORAGE_KEY, mode)
  } catch {}
  applyMode(mode)
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia(DARK_QUERY)
  const reapply = () => {
    applyMode(readMode())
    onChange()
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY || event.key === null) reapply()
  }

  media.addEventListener('change', reapply)
  window.addEventListener('storage', onStorage)
  window.addEventListener(CHANGE_EVENT, onChange)
  return () => {
    media.removeEventListener('change', reapply)
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(CHANGE_EVENT, onChange)
  }
}

const ICONS: Record<ThemeMode, ReactNode> = {
  light: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4m0-12.8-1.4 1.4m-10 10-1.4 1.4" />
    </>
  ),
  dark: <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />,
  system: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8m-4-4v4" />
    </>
  ),
}

export function ThemeSwitcher({ labels }: { labels: CommonContent['theme'] }) {
  const mode = useSyncExternalStore(subscribe, readMode, () => 'system')

  return (
    <div role="group" aria-label={labels.label} className="switcher">
      {THEME_MODES.map((item) => (
        <button
          key={item}
          type="button"
          className="switcher-item switcher-item--icon"
          aria-pressed={item === mode}
          aria-label={labels[item]}
          title={labels[item]}
          onClick={() => setMode(item)}>
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false">
            {ICONS[item]}
          </svg>
        </button>
      ))}
    </div>
  )
}
