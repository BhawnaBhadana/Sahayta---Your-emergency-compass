export default function StatCard({ label, value, sub, tone = 'primary', icon }) {
  const toneClasses = {
    primary: 'bg-primary-50 text-primary-700 border-primary-200',
    accent: 'bg-accent-50 text-accent-700 border-accent-200',
    secondary: 'bg-secondary-50 text-secondary-700 border-secondary-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  };
  return (
    <div className={`rounded-xl border p-4 shadow-minimal ${toneClasses[tone] || toneClasses.primary}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium opacity-80">{label}</p>
        {icon && <span className="text-xl" aria-hidden="true">{icon}</span>}
      </div>
      <p className="mt-1 text-3xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs opacity-70">{sub}</p>}
    </div>
  );
}
