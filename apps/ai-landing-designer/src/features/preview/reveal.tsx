import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { BASE_CURVE } from '@/engine/rules'

/** B7 scroll reveal: rise Spacing-400 (32px) and fade in once, on IntersectionObserver. */
export function Reveal({
  root,
  ms,
  children,
  className,
}: {
  root: RefObject<HTMLElement | null>
  ms: number
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { root: root.current, rootMargin: '0px 0px -10% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [root])
  return (
    <div
      ref={ref}
      className={`${className ?? ''} motion-reduce:!translate-y-0`}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity ${ms}ms ${BASE_CURVE}, transform ${ms}ms ${BASE_CURVE}`,
      }}
    >
      {children}
    </div>
  )
}

/** B11 tagline reveal: each word goes from ~30% to full colour as it crosses a trigger line. */
export function TaglineReveal({
  root,
  lines,
  className,
  ms,
}: {
  root: RefObject<HTMLElement | null>
  lines: string[]
  className: string
  ms: number
}) {
  const ref = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const words = el.querySelectorAll<HTMLSpanElement>('[data-word]')
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            ;(e.target as HTMLElement).dataset.on = '1'
            io.unobserve(e.target)
          }
        }
      },
      // trigger line sits 45% up from the bottom of the preview viewport
      { root: root.current, rootMargin: '0px 0px -45% 0px', threshold: 1 },
    )
    words.forEach((w) => io.observe(w))
    return () => io.disconnect()
  }, [root, lines])
  return (
    <p ref={ref} className={className} style={{ textWrap: 'balance' }}>
      {lines.map((line, li) => (
        <span key={li} className="block">
          {line.split(' ').map((w, wi) => (
            <span
              key={wi}
              data-word
              className="opacity-30 data-[on]:opacity-100"
              style={{ transition: `opacity ${ms}ms ${BASE_CURVE}` }}
            >
              {w}{' '}
            </span>
          ))}
        </span>
      ))}
    </p>
  )
}
