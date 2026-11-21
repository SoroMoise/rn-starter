'use client'

import { useEffect, useRef, type ReactNode } from 'react'

export function MobileMenu({ children }: { children: ReactNode }) {
  const menu = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    const details = menu.current
    if (!details) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !details.open) return
      details.open = false
      details.querySelector('summary')?.focus()
    }
    const onPointerDown = (event: PointerEvent) => {
      if (details.open && event.target instanceof Node && !details.contains(event.target)) {
        details.open = false
      }
    }
    const onClick = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest('a')) details.open = false
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    details.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
      details.removeEventListener('click', onClick)
    }
  }, [])

  return (
    <details ref={menu} className="mobile-menu">
      {children}
    </details>
  )
}
