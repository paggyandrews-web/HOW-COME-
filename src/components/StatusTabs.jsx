import { REVISION_BUCKET_META } from '../utils/paperStatus'

const ORDER = ['not-started', 'pending', 'completed']

/**
 * Not Started / Revision Pending / Revision Completed — the 3-tab status
 * filter used at the top of the Papers, Full 100, and Mock Tests lists.
 * Colors come from REVISION_BUCKET_META (red / amber / green) so the tabs,
 * the paper-card badges, and RevisionDots all agree on what each color means.
 *
 * There's no separate "All" tab by design — tapping the already-active tab
 * clears the filter back to showing everything, so the strip stays exactly
 * three tabs wide.
 */
export default function StatusTabs({ value, onChange, counts, loading }) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by revision status">
      {ORDER.map(key => {
        const meta = REVISION_BUCKET_META[key]
        const active = value === key
        const count = counts?.[key]
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(active ? '' : key)}
            className="rounded-lg px-3 py-2 text-xs font-bold flex items-center gap-1.5"
            style={{
              background: active ? meta.bg : 'transparent',
              border: `1.5px solid ${active ? meta.color : 'var(--border)'}`,
              color: active ? meta.color : 'var(--text2)',
              cursor: 'pointer',
              touchAction: 'manipulation',
            }}
          >
            <span
              aria-hidden="true"
              style={{ width: 7, height: 7, borderRadius: '50%', background: meta.color, flexShrink: 0 }}
            />
            {meta.label}
            {!loading && count != null && <span style={{ opacity: 0.75 }}>({count})</span>}
          </button>
        )
      })}
    </div>
  )
}
