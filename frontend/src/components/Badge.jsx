import { severityMeta, VERIFICATION_STATUS_STYLE } from '../utils/constants';

const SEVERITY_ICON = { low: 'ℹ', medium: '▲', high: '⚠', critical: '⛔' };

export function SeverityBadge({ severity }) {
  const meta = severityMeta(severity);
  return (
    <span className={`badge border ${meta.color}`}>
      <span aria-hidden="true">{SEVERITY_ICON[severity] || 'ℹ'}</span> {meta.label}
    </span>
  );
}

export function VerificationBadge({ status }) {
  const meta = VERIFICATION_STATUS_STYLE[status] || VERIFICATION_STATUS_STYLE.unverified;
  return <span className={`badge ${meta.cls}`}>{meta.label}</span>;
}

export function StatusPill({ status }) {
  return <span className="badge bg-primary-100 text-primary-800 border border-primary-200">{status?.replace(/_/g, ' ')}</span>;
}
