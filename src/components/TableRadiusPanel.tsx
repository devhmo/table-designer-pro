import { useState } from 'react';
import type { CellStyle } from '../types';

interface TableRadiusPanelProps {
  borderRadius: number;
  onChange: (radius: number) => void;
}

export function TableRadiusPanel({ borderRadius, onChange }: TableRadiusPanelProps) {
  const [mode, setMode] = useState<'all' | 'individual'>('all');
  const [corners, setCorners] = useState({ tl: borderRadius, tr: borderRadius, br: borderRadius, bl: borderRadius });

  const handleAllChange = (value: number) => {
    onChange(value);
    setCorners({ tl: value, tr: value, br: value, bl: value });
  };

  const handleCornerChange = (corner: keyof typeof corners, value: number) => {
    const newCorners = { ...corners, [corner]: value };
    setCorners(newCorners);
    // Apply all corners individually
    // We'll store them in the theme's borderRadius as the max for now
    // The actual per-corner values get applied via CSS in the canvas
    onChange(Math.max(newCorners.tl, newCorners.tr, newCorners.br, newCorners.bl));
  };

  const cornerLabels = [
    { key: 'tl' as const, label: 'Top-Left', css: 'borderTopLeftRadius' },
    { key: 'tr' as const, label: 'Top-Right', css: 'borderTopRightRadius' },
    { key: 'bl' as const, label: 'Bottom-Left', css: 'borderBottomLeftRadius' },
    { key: 'br' as const, label: 'Bottom-Right', css: 'borderBottomRightRadius' },
  ];

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-1 bg-[var(--surface-2)] rounded-lg p-0.5">
        <button
          className={`flex-1 py-1.5 text-xs rounded-md transition-all ${mode === 'all' ? 'bg-[var(--surface-0)] shadow-sm text-[var(--text-primary)] font-medium' : 'text-[var(--text-tertiary)]'}`}
          onClick={() => setMode('all')}
        >
          All Corners
        </button>
        <button
          className={`flex-1 py-1.5 text-xs rounded-md transition-all ${mode === 'individual' ? 'bg-[var(--surface-0)] shadow-sm text-[var(--text-primary)] font-medium' : 'text-[var(--text-tertiary)]'}`}
          onClick={() => setMode('individual')}
        >
          Individual
        </button>
      </div>

      {/* All corners mode */}
      {mode === 'all' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="range"
              className="flex-1"
              min={0}
              max={32}
              value={borderRadius}
              onChange={(e) => handleAllChange(Number(e.target.value))}
            />
            <span className="text-xs text-[var(--text-tertiary)] w-10 text-right font-mono">{borderRadius}px</span>
          </div>
          {/* Quick presets */}
          <div className="flex gap-1">
            {[0, 4, 8, 12, 16, 24, 32].map((v) => (
              <button
                key={v}
                className={`flex-1 py-1.5 rounded text-[10px] border transition-all
                  ${borderRadius === v ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-[var(--border)] hover:border-blue-300 text-[var(--text-secondary)]'}`}
                onClick={() => handleAllChange(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Individual corners mode */}
      {mode === 'individual' && (
        <div className="space-y-3">
          {/* Visual preview */}
          <div className="flex justify-center">
            <div className="relative w-24 h-16">
              <div
                className="w-full h-full border-2 border-[var(--accent)] bg-[var(--surface-2)]"
                style={{
                  borderTopLeftRadius: corners.tl,
                  borderTopRightRadius: corners.tr,
                  borderBottomLeftRadius: corners.bl,
                  borderBottomRightRadius: corners.br,
                }}
              />
              {/* Corner labels */}
              <span className="absolute -top-3 -left-1 text-[8px] text-[var(--text-tertiary)]">{corners.tl}px</span>
              <span className="absolute -top-3 -right-1 text-[8px] text-[var(--text-tertiary)]">{corners.tr}px</span>
              <span className="absolute -bottom-3 -left-1 text-[8px] text-[var(--text-tertiary)]">{corners.bl}px</span>
              <span className="absolute -bottom-3 -right-1 text-[8px] text-[var(--text-tertiary)]">{corners.br}px</span>
            </div>
          </div>

          {/* Each corner slider */}
          {cornerLabels.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <label className="text-[10px] text-[var(--text-secondary)] w-16 shrink-0">{label}</label>
              <input
                type="range"
                className="flex-1"
                min={0}
                max={32}
                value={corners[key]}
                onChange={(e) => handleCornerChange(key, Number(e.target.value))}
              />
              <span className="text-[10px] text-[var(--text-tertiary)] w-8 text-right font-mono">{corners[key]}</span>
            </div>
          ))}

          {/* Quick presets for all */}
          <div className="flex gap-1 pt-1">
            {[0, 4, 8, 12, 16, 24].map((v) => (
              <button
                key={v}
                className="flex-1 py-1 rounded text-[10px] border border-[var(--border)] hover:border-blue-300 text-[var(--text-secondary)]"
                onClick={() => { setCorners({ tl: v, tr: v, br: v, bl: v }); onChange(v); }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
