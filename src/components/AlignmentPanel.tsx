import type { CellStyle } from '../types';

interface AlignmentPanelProps {
  cellStyle: CellStyle;
  onUpdate: (style: Partial<CellStyle>) => void;
}

const H_ALIGN = [
  { value: 'left', label: 'Left', icon: 'M3 3h18v2H3zm0 4h12v2H3zm0 4h18v2H3zm0 4h12v2H3zm0 4h18v2H3z' },
  { value: 'center', label: 'Center', icon: 'M3 3h18v2H3zm3 4h12v2H6zm-3 4h18v2H3zm3 4h12v2H6zm-3 4h18v2H3z' },
  { value: 'right', label: 'Right', icon: 'M3 3h18v2H3zm6 4h12v2H9zm-6 4h18v2H3zm6 4h12v2H9zm-6 4h18v2H3z' },
  { value: 'justify', label: 'Justify', icon: 'M3 3h18v2H3zm0 4h18v2H3zm0 4h18v2H3zm0 4h18v2H3zm0 4h18v2H3z' },
];

const V_ALIGN = [
  { value: 'top', label: 'Top', icon: '⬆' },
  { value: 'middle', label: 'Middle', icon: '⬌' },
  { value: 'bottom', label: 'Bottom', icon: '⬇' },
];

export function AlignmentPanel({ cellStyle, onUpdate }: AlignmentPanelProps) {
  return (
    <div className="space-y-3">
      {/* Horizontal Alignment */}
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)] mb-2 block">Horizontal</label>
        <div className="flex gap-1">
          {H_ALIGN.map(({ value, label, icon }) => (
            <button
              key={value}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg border transition-all
                ${cellStyle.textAlign === value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                  : 'border-[var(--border)] hover:border-blue-300 text-[var(--text-secondary)]'
                }`}
              onClick={() => onUpdate({ textAlign: value as any })}
              title={label}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d={icon} />
              </svg>
              <span className="text-[9px]">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Vertical Alignment */}
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)] mb-2 block">Vertical</label>
        <div className="flex gap-1">
          {V_ALIGN.map(({ value, label, icon }) => (
            <button
              key={value}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg border transition-all
                ${cellStyle.verticalAlign === value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                  : 'border-[var(--border)] hover:border-blue-300 text-[var(--text-secondary)]'
                }`}
              onClick={() => onUpdate({ verticalAlign: value as any })}
              title={label}
            >
              <span className="text-sm">{icon}</span>
              <span className="text-[9px]">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
