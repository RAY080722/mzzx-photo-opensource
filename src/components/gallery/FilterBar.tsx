import { motion } from 'framer-motion'
import { Search, RotateCcw } from 'lucide-react'
import { GRADES, CLASSES } from '@/types'
import { useStore } from '@/store/useStore'
import { Select, type SelectOption } from '@/components/ui/Select'

const gradeOptions: SelectOption[] = [
  { value: null, label: '全部年级' },
  ...GRADES.map((g) => ({ value: g, label: `${g}级` })),
]
const classOptions: SelectOption[] = [
  { value: null, label: '全部班级' },
  ...CLASSES.map((c) => ({ value: c, label: `${c}班` })),
]

export function FilterBar() {
  const filters = useStore((s) => s.filters)
  const setFilters = useStore((s) => s.setFilters)
  const reset = useStore((s) => s.resetFilters)
  const active = Boolean(filters.search || filters.grade != null || filters.class != null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="glass mb-10 rounded-2xl p-3"
    >
      <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
        {/* 搜索：手机整行 / 桌面自适应 */}
        <div className="relative col-span-2 sm:min-w-[180px] sm:flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fg-muted)]" />
          <input
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            placeholder="按姓名搜索"
            className="field pl-10"
          />
        </div>

        <Select
          value={filters.grade}
          onChange={(v) => setFilters({ grade: v as number | null })}
          options={gradeOptions}
          placeholder="全部年级"
          ariaLabel="选择年级"
          className="col-span-1 sm:w-auto"
        />
        <Select
          value={filters.class}
          onChange={(v) => setFilters({ class: v as number | null })}
          options={classOptions}
          placeholder="全部班级"
          ariaLabel="选择班级"
          className="col-span-1 sm:w-auto"
        />

        {/* 排序 + 重置：手机整行 / 桌面随行 */}
        <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
          <div className="flex flex-1 rounded-full bg-[var(--bg-alt)] p-1 sm:flex-none">
            {(['latest', 'likes'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilters({ sort: mode })}
                className={`relative flex-1 rounded-full px-5 py-2 text-sm font-medium transition-colors sm:flex-none ${
                  filters.sort === mode ? 'text-[var(--fg)]' : 'text-[var(--fg-muted)]'
                }`}
              >
                {filters.sort === mode && (
                  <motion.span
                    layoutId="sort-thumb"
                    className="absolute inset-0 rounded-full bg-[var(--card-bg)] shadow"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative">{mode === 'latest' ? '最新' : '最热'}</span>
              </button>
            ))}
          </div>
          <button
            onClick={reset}
            disabled={!active}
            className="rounded-full p-2.5 text-[var(--fg-muted)] transition hover:bg-[var(--bg-alt)] disabled:opacity-35"
            aria-label="重置筛选"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}