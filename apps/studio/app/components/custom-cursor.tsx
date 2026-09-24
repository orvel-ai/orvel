'use client'

import { useEffect, useRef } from 'react'

const textInputSelector = 'input, textarea, [contenteditable="true"]'

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const cursor = cursorRef.current
    const pointerQuery = window.matchMedia('(pointer: fine)')

    if (!cursor || !pointerQuery.matches) {
      return
    }

    const root = document.documentElement
    let frame = 0
    let x = 0
    let y = 0

    const paint = () => {
      cursor.style.transform = `translate3d(${x - 1}px, ${y}px, 0)`
      frame = 0
    }

    const onPointerMove = (event: PointerEvent) => {
      x = event.clientX
      y = event.clientY
      cursor.dataset.visible = 'true'
      cursor.dataset.overTextInput = String(
        event.target instanceof Element &&
          Boolean(event.target.closest(textInputSelector)),
      )

      if (!frame) {
        frame = window.requestAnimationFrame(paint)
      }
    }

    const hideCursor = () => {
      cursor.dataset.visible = 'false'
    }

    const pressCursor = (event: PointerEvent) => {
      if (event.isPrimary) {
        cursor.dataset.pressed = 'true'
      }
    }

    const releaseCursor = () => {
      cursor.dataset.pressed = 'false'
    }

    root.classList.add('has-custom-cursor')
    document.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('pointerdown', pressCursor, { passive: true })
    document.addEventListener('pointerup', releaseCursor, { passive: true })
    document.addEventListener('pointercancel', releaseCursor, { passive: true })
    document.addEventListener('pointerleave', hideCursor)
    window.addEventListener('blur', releaseCursor)

    return () => {
      root.classList.remove('has-custom-cursor')
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerdown', pressCursor)
      document.removeEventListener('pointerup', releaseCursor)
      document.removeEventListener('pointercancel', releaseCursor)
      document.removeEventListener('pointerleave', hideCursor)
      window.removeEventListener('blur', releaseCursor)
      if (frame) {
        window.cancelAnimationFrame(frame)
      }
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      className="orvel-custom-cursor"
      data-over-text-input="false"
      data-pressed="false"
      data-visible="false"
      ref={cursorRef}
    >
      <span className="orvel-custom-cursor__art" />
    </div>
  )
}
