import type { CellStyle } from '../types';

interface EffectsPanelProps {
  cellStyle: CellStyle;
  onUpdate: (style: Partial<CellStyle>) => void;
}

const SHADOW_PRESETS = [
  { id: 'none', name: 'None', value: '' },
  { id: 'xs', name: 'Extra Small', value: '0 1px 2px rgba(0,0,0,0.05)' },
  { id: 'sm', name: 'Small', value: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)' },
  { id: 'md', name: 'Medium', value: '0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)' },
  { id: 'lg', name: 'Large', value: '0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)' },
  { id: 'xl', name: 'Extra Large', value: '0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04)' },
  { id: 'inner', name: 'Inset', value: 'inset 0 2px 4px rgba(0,0,0,0.06)' },
  { id: 'ring', name: 'Ring', value: '0 0 0 3px rgba(59,130,246,0.5)' },
  { id: 'glow-blue', name: 'Blue Glow', value: '0 0 12px rgba(59,130,246,0.4)' },
  { id: 'glow-purple', name: 'Purple Glow', value: '0 0 12px rgba(139,92,246,0.4)' },
  { id: 'glow-green', name: 'Green Glow', value: '0 0 12px rgba(34,197,94,0.4)' },
];

const GRADIENT_PRESETS = [
  { id: 'none', name: 'None', value: '' },
  { id: 'purple-haze', name: 'Purple Haze', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'pink-sunset', name: 'Pink Sunset', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 'ocean-blue', name: 'Ocean Blue', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { id: 'green-fresh', name: 'Green Fresh', value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { id: 'warm-glow', name: 'Warm Glow', value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { id: 'lavender', name: 'Lavender', value: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
  { id: 'peach', name: 'Peach', value: 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)' },
  { id: 'cool-gray', name: 'Cool Gray', value: 'linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 100%)' },
  { id: 'midnight', name: 'Midnight', value: 'linear-gradient(135deg, #232526 0%, #414345 100%)' },
  { id: 'royal', name: 'Royal', value: 'linear-gradient(135deg, #141E30 0%, #243B55 100%)' },
  { id: 'fire', name: 'Fire', value: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)' },
  { id: 'emerald', name: 'Emerald', value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
];

export function EffectsPanel({ cellStyle, onUpdate }: EffectsPanelProps) {
  return (
    <div className="space-y-3">
      {/* Shadow Presets */}
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)] mb-2 block">Shadow</label>
        <div className="grid grid-cols-3 gap-1">
          {SHADOW_PRESETS.map((preset) => (
            <button
              key={preset.id}
              className={`p-2 rounded-lg border text-center transition-all
                ${cellStyle.boxShadow === preset.value || (!cellStyle.boxShadow && preset.id === 'none')
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                  : 'border-[var(--border)] hover:border-blue-300 text-[var(--text-secondary)]'
                }`}
              onClick={() => onUpdate({ boxShadow: preset.value || undefined })}
              title={preset.name}
            >
              {preset.id === 'none' ? (
                <span className="text-[10px]">None</span>
              ) : (
                <div className="w-full h-5 bg-[var(--surface-2)] rounded" style={{ boxShadow: preset.value }} />
              )}
              <span className="text-[9px] mt-0.5 block truncate">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Gradient Presets */}
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)] mb-2 block">Gradient</label>
        <div className="grid grid-cols-3 gap-1">
          {GRADIENT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              className={`h-10 rounded-lg border overflow-hidden transition-all
                ${cellStyle.gradient === preset.value || (!cellStyle.gradient && preset.id === 'none')
                  ? 'ring-2 ring-blue-500 ring-offset-1'
                  : 'border-[var(--border)] hover:border-blue-300'
                }`}
              style={{ background: preset.value || 'var(--surface-2)' }}
              onClick={() => onUpdate({ gradient: preset.value || undefined })}
              title={preset.name}
            >
              {preset.id === 'none' && (
                <span className="text-[10px] text-[var(--text-tertiary)]">None</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Opacity */}
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)] mb-2 block">Opacity</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            className="flex-1"
            min={0}
            max={1}
            step={0.05}
            value={cellStyle.opacity ?? 1}
            onChange={(e) => onUpdate({ opacity: Number(e.target.value) })}
          />
          <span className="text-xs text-[var(--text-tertiary)] w-12 text-right font-mono">
            {Math.round((cellStyle.opacity ?? 1) * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}
