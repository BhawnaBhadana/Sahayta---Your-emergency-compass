export function LoadingState({ label = 'Loading data...' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-text-secondary" role="status" aria-live="polite">
      <svg className="h-5 w-5 animate-spin text-primary-600" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', description, icon = '📭' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-text-secondary">
      <div className="text-4xl" aria-hidden="true">{icon}</div>
      <p className="font-semibold text-text-primary">{title}</p>
      {description && <p className="max-w-sm text-sm">{description}</p>}
    </div>
  );
}

export function ErrorState({ message = 'Unable to load data. Please try again.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center" role="alert">
      <div className="text-4xl" aria-hidden="true">⚠️</div>
      <p className="font-semibold text-accent-700">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-outline">Try again</button>
      )}
    </div>
  );
}
