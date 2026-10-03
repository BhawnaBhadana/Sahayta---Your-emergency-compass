import { useState } from 'react';
import { DISASTER_CATEGORIES, EMERGENCY_KIT_ITEMS } from '../data/preparedness';

const PHASES = [
  { key: 'before', label: 'Before', icon: '🧭' },
  { key: 'during', label: 'During', icon: '⚡' },
  { key: 'after', label: 'After', icon: '🔧' },
];

export default function Preparedness() {
  const [category, setCategory] = useState('flood');
  const data = DISASTER_CATEGORIES[category];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-text-primary">Disaster Preparedness Academy</h1>
      <p className="mb-4 text-sm text-text-secondary">Know what to do before, during, and after common disasters.</p>

      <div className="mb-6 flex flex-wrap gap-2">
        {Object.entries(DISASTER_CATEGORIES).map(([key, c]) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={`rounded-full border px-4 py-2 text-sm font-medium ${category === key ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-surface-100 text-text-secondary'}`}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PHASES.map((phase) => (
          <div key={phase.key} className="card">
            <h2 className="font-bold text-text-primary">{phase.icon} {phase.label}</h2>
            <ul className="mt-3 space-y-2 text-sm text-text-secondary">
              {data[phase.key].map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-secondary-600" aria-hidden="true">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="card mt-6">
        <h2 className="font-bold text-text-primary">🎒 Emergency Kit Checklist</h2>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {EMERGENCY_KIT_ITEMS.map((item) => (
            <label key={item} className="flex items-center gap-2 text-sm text-text-secondary">
              <input type="checkbox" className="h-4 w-4 rounded border-surface-100 text-primary-600 focus:ring-primary-600" />
              {item}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
