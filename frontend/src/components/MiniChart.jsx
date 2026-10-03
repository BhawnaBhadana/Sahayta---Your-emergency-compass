/** Minimal dependency-free bar chart for small time-series (incidents/day etc.) */
export function BarChart({ data, labelKey = 'day', valueKey = 'count', height = 120 }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-end gap-1.5" style={{ height }} role="img" aria-label="Bar chart of incident counts over time">
        {data.map((d, i) => (
          <div key={i} className="flex flex-1 min-w-[18px] flex-col items-center justify-end gap-1">
            <div
              className="w-full rounded-t bg-primary-500"
              style={{ height: `${Math.max(4, (d[valueKey] / max) * (height - 20))}px` }}
              title={`${d[labelKey]}: ${d[valueKey]}`}
            />
            <span className="text-[9px] text-text-tertiary">{typeof d[labelKey] === 'string' ? d[labelKey].slice(5) : d[labelKey]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Horizontal stacked percent bar, e.g. severity distribution. */
export function DistributionBar({ segments }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface">
        {segments.map((seg) => (
          <div key={seg.label} style={{ width: `${(seg.value / total) * 100}%`, backgroundColor: seg.color }} title={`${seg.label}: ${seg.value}`} />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-text-secondary">
        {segments.map((seg) => (
          <span key={seg.label} className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: seg.color }} aria-hidden="true" />
            {seg.label} ({seg.value})
          </span>
        ))}
      </div>
    </div>
  );
}
