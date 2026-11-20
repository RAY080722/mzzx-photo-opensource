import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'

export interface SelectOption {
  value: string | number | null
  label: string
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  className = '',
  ariaLabel,
}: {
  value: string | number | null
  onChange: (v: string | number | null) => void
  options: SelectOption[]
  placeholder: string
  className?: string
  ariaLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const current = options.find((o) => o.value === value)

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel ?? placeholder}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="field flex items-center justify-between gap-2 text-left"
      >
        <span className={current ? '' : 'text-[var(--fg-muted)]'}>{current ? current.label : placeholder}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--fg-muted)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
            className="glass absolute left-0 top-[calc(100%+6px)] z-30 max-h-64 w-full min-w-[9rem] overflow-auto rounded-xl p-1"
          >
            {options.map((o) => (
              <li key={String(o.value)}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.value)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-[var(--bg-alt)] ${
                    o.value === value ? 'font-medium text-[var(--accent)]' : ''
                  }`}
                >
                  <span>{o.label}</span>
                  {o.value === value && <Check className="h-4 w-4 shrink-0" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}