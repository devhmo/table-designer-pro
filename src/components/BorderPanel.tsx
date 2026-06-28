import { useState } from 'react';
import type { CellStyle, BorderSide } from '../types';

interface BorderPanelProps {
  cellStyle: CellStyle;
  onUpdate: (style: Partial<CellStyle>) => void;
}

const BORDER_PRESETS = [
  {
    id: 'none',
    name: 'No Border',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 3" opacity="0.3" />
        <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      </svg>
    ),
    style: {
      borderTop: undefined,
      borderBottom: undefined,
      borderLeft: undefined,
      borderRight: undefined,
    },
  },
  {
    id: 'all',
    name: 'All Borders',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <rect x="3" y="3" width="18" height="18" rx="1" />
        <line x1="12" y1="3" x2="12" y2="21" />
        <line x1="3" y1="12" x2="21" y2="12" />
      </svg>
    ),
    style: {
      borderTop: { width: 1, style: 'solid' as const, color: '#000000' },
      borderBottom: { width: 1, style: 'solid' as const, color: '#000000' },
      borderLeft: { width: 1, style: 'solid' as const, color: '#000000' },
      borderRight: { width: 1, style: 'solid' as const, color: '#000000' },
    },
  },
  {
    id: 'outside',
    name: 'Outside Borders',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <rect x="3" y="3" width="18" height="18" rx="1" />
      </svg>
    ),
    style: {
      borderTop: { width: 2, style: 'solid' as const, color: '#000000' },
      borderBottom: { width: 2, style: 'solid' as const, color: '#000000' },
      borderLeft: { width: 2, style: 'solid' as const, color: '#000000' },
      borderRight: { width: 2, style: 'solid' as const, color: '#000000' },
    },
  },
  {
    id: 'inside',
    name: 'Inside Borders',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <line x1="12" y1="3" x2="12" y2="21" />
        <line x1="3" y1="12" x2="21" y2="12" />
      </svg>
    ),
    style: {
      borderTop: undefined,
      borderBottom: undefined,
      borderLeft: undefined,
      borderRight: undefined,
    },
  },
  {
    id: 'top',
    name: 'Bottom Border Only',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <line x1="3" y1="21" x2="21" y2="21" />
      </svg>
    ),
    style: {
      borderTop: undefined,
      borderBottom: { width: 2, style: 'solid' as const, color: '#000000' },
      borderLeft: undefined,
      borderRight: undefined,
    },
  },
  {
    id: 'top-bottom',
    name: 'Top & Bottom',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <line x1="3" y1="3" x2="21" y2="3" />
        <line x1="3" y1="21" x2="21" y2="21" />
      </svg>
    ),
    style: {
      borderTop: { width: 2, style: 'solid' as const, color: '#000000' },
      borderBottom: { width: 2, style: 'solid' as const, color: '#000000' },
      borderLeft: undefined,
      borderRight: undefined,
    },
  },
  {
    id: 'thick-bottom',
    name: 'Thick Bottom',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-5 h-5">
        <line x1="3" y1="21" x2="21" y2="21" />
      </svg>
    ),
    style: {
      borderTop: undefined,
      borderBottom: { width: 3, style: 'solid' as const, color: '#000000' },
      borderLeft: undefined,
      borderRight: undefined,
    },
  },
  {
    id: 'double-bottom',
    name: 'Double Bottom',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
        <line x1="3" y1="19" x2="21" y2="19" />
        <line x1="3" y1="21" x2="21" y2="21" />
      </svg>
    ),
    style: {
      borderTop: undefined,
      borderBottom: { width: 1, style: 'double' as const, color: '#000000' },
      borderLeft: undefined,
      borderRight: undefined,
    },
  },
];

const LINE_STYLES = [
  { value: 'solid', label: '━━━', name: 'Solid' },
  { value: 'dashed', label: '┅┅┅', name: 'Dashed' },
  { value: 'dotted', label: '┈┈┈', name: 'Dotted' },
  { value: 'double', label: '═══', name: 'Double' },
];

const BORDER_WIDTHS = [1, 2, 3, 4, 5];

const PRESET_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
  '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
  '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
];

export function BorderPanel({ cellStyle, onUpdate }: BorderPanelProps) {
  const [selectedSide, setSelectedSide] = useState<'top' | 'bottom' | 'left' | 'right' | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const currentBorder = selectedSide ? cellStyle[`border${selectedSide.charAt(0).toUpperCase() + selectedSide.slice(1)}` as keyof CellStyle] as BorderSide | undefined : undefined;

  const applyPreset = (preset: typeof BORDER_PRESETS[0]) => {
    onUpdate(preset.style as any);
  };

  const updateSide = (side: 'top' | 'bottom' | 'left' | 'right', border: BorderSide | undefined) => {
    onUpdate({ [`border${side.charAt(0).toUpperCase() + side.slice(1)}`]: border } as any);
  };

  const sides = [
    { id: 'top' as const, label: 'Top', icon: '⬆' },
    { id: 'bottom' as const, label: 'Bottom', icon: '⬇' },
    { id: 'left' as const, label: 'Left', icon: '⬅' },
    { id: 'right' as const, label: 'Right', icon: '➡' },
  ];

  return (
    <div className="space-y-3">
      {/* Border Presets Grid */}
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)] mb-2 block">Presets</label>
        <div className="grid grid-cols-4 gap-1">
          {BORDER_PRESETS.map((preset) => {
            const isActive = preset.id === 'none'
              ? !cellStyle.borderTop && !cellStyle.borderBottom && !cellStyle.borderLeft && !cellStyle.borderRight
              : preset.id === 'all'
              ? cellStyle.borderTop && cellStyle.borderBottom && cellStyle.borderLeft && cellStyle.borderRight
              : false;

            return (
              <button
                key={preset.id}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all
                  ${isActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                    : 'border-[var(--border)] hover:border-blue-300 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                onClick={() => applyPreset(preset)}
                title={preset.name}
              >
                {preset.icon}
                <span className="text-[9px] leading-tight text-center">{preset.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Individual Side Controls */}
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)] mb-2 block">Individual Sides</label>
        <div className="grid grid-cols-4 gap-1 mb-2">
          {sides.map((side) => {
            const border = cellStyle[`border${side.id.charAt(0).toUpperCase() + side.id.slice(1)}` as keyof CellStyle] as BorderSide | undefined;
            return (
              <button
                key={side.id}
                className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border transition-all
                  ${selectedSide === side.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                    : border
                    ? 'border-green-400 bg-green-50 dark:bg-green-900/20 text-green-600'
                    : 'border-[var(--border)] text-[var(--text-tertiary)] hover:border-blue-300'
                  }`}
                onClick={() => setSelectedSide(selectedSide === side.id ? null : side.id)}
              >
                <span className="text-sm">{side.icon}</span>
                <span className="text-[9px]">{side.label}</span>
                {border && (
                  <div className="w-4 h-0.5 rounded mt-0.5" style={{
                    background: border.color,
                    height: Math.min(border.width, 4),
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected side options */}
        {selectedSide && (
          <div className="bg-[var(--surface-2)] rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                {selectedSide.charAt(0).toUpperCase() + selectedSide.slice(1)} Border
              </span>
              {currentBorder && (
                <button
                  className="text-[10px] text-red-500 hover:text-red-700 px-2 py-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => updateSide(selectedSide, undefined)}
                >
                  Remove
                </button>
              )}
            </div>

            {/* Enable/Disable toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!currentBorder}
                onChange={(e) => {
                  if (e.target.checked) {
                    updateSide(selectedSide, { width: 1, style: 'solid', color: '#000000' });
                  } else {
                    updateSide(selectedSide, undefined);
                  }
                }}
                className="w-3.5 h-3.5 rounded"
              />
              <span className="text-xs text-[var(--text-secondary)]">Enable border</span>
            </label>

            {currentBorder && (
              <>
                {/* Line Style */}
                <div>
                  <label className="text-[10px] text-[var(--text-tertiary)] mb-1 block">Style</label>
                  <div className="flex gap-1">
                    {LINE_STYLES.map((ls) => (
                      <button
                        key={ls.value}
                        className={`flex-1 py-1.5 px-2 rounded text-center text-xs border transition-all
                          ${currentBorder.style === ls.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                            : 'border-[var(--border)] hover:border-blue-300 text-[var(--text-secondary)]'
                          }`}
                        onClick={() => updateSide(selectedSide, { ...currentBorder, style: ls.value as any })}
                        title={ls.name}
                      >
                        {ls.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Width */}
                <div>
                  <label className="text-[10px] text-[var(--text-tertiary)] mb-1 block">Width</label>
                  <div className="flex gap-1">
                    {BORDER_WIDTHS.map((w) => (
                      <button
                        key={w}
                        className={`flex-1 py-1.5 rounded text-center text-xs border transition-all flex items-center justify-center
                          ${currentBorder.width === w
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                            : 'border-[var(--border)] hover:border-blue-300 text-[var(--text-secondary)]'
                          }`}
                        onClick={() => updateSide(selectedSide, { ...currentBorder, width: w })}
                      >
                        <div style={{ width: 16, height: Math.min(w, 6), background: currentBorder.color, borderRadius: 1 }} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="text-[10px] text-[var(--text-tertiary)] mb-1 block">Color</label>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div
                      className="w-6 h-6 rounded border border-[var(--border)] cursor-pointer shrink-0"
                      style={{ backgroundColor: currentBorder.color }}
                    />
                    <input
                      type="color"
                      className="absolute opacity-0 cursor-pointer w-6 h-6"
                      value={currentBorder.color}
                      onChange={(e) => updateSide(selectedSide, { ...currentBorder, color: e.target.value })}
                    />
                    <input
                      type="text"
                      className="input-field !py-1 text-xs font-mono flex-1"
                      value={currentBorder.color}
                      onChange={(e) => updateSide(selectedSide, { ...currentBorder, color: e.target.value })}
                    />
                  </div>
                  {/* Color palette */}
                  <div className="grid grid-cols-10 gap-0.5">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        className={`w-5 h-5 rounded-sm border transition-transform hover:scale-110
                          ${currentBorder.color === color ? 'ring-2 ring-blue-500 ring-offset-1' : 'border-gray-200 dark:border-gray-600'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => updateSide(selectedSide, { ...currentBorder, color })}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Quick: Apply to all sides */}
      {selectedSide && currentBorder && (
        <button
          className="w-full py-2 px-3 rounded-lg text-xs font-medium bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text-secondary)] transition-colors"
          onClick={() => {
            onUpdate({
              borderTop: { ...currentBorder },
              borderBottom: { ...currentBorder },
              borderLeft: { ...currentBorder },
              borderRight: { ...currentBorder },
            });
          }}
        >
          Apply this style to all sides
        </button>
      )}
    </div>
  );
}
