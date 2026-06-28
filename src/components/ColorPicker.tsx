import { useState } from 'react';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  allowClear?: boolean;
}

const PRESET_COLORS = [
  // Row 1: Grays
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  // Row 2: Reds & Oranges
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  // Row 3: Pastels
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
  // Row 4: Medium tones
  '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
  // Row 5: Dark tones
  '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
];

export function ColorPicker({ label, value, onChange, allowClear }: ColorPickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-[var(--text-secondary)] w-20 shrink-0">{label}</label>
      <div className="relative flex-1">
        <div className="flex items-center gap-1.5">
          <div
            className="w-7 h-7 rounded-md border-2 border-[var(--border)] cursor-pointer shrink-0 hover:scale-105 transition-transform relative"
            style={{ backgroundColor: value || 'transparent' }}
            onClick={() => setShowPicker(!showPicker)}
          >
            {!value && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-0.5 bg-red-500 rotate-45 absolute" />
              </div>
            )}
          </div>
          <input
            type="text"
            className="input-field !py-1 text-xs font-mono flex-1"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#000000"
          />
          <input
            type="color"
            className="w-7 h-7 opacity-0 absolute left-0 top-0 cursor-pointer"
            value={value || '#000000'}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>

        {showPicker && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
            <div className="absolute top-full left-0 mt-1 z-50 bg-[var(--surface-0)] border border-[var(--border)] rounded-lg shadow-float p-3 w-[240px]">
              <div className="grid grid-cols-10 gap-1 mb-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-5 h-5 rounded-sm border transition-all hover:scale-110
                      ${value === color ? 'ring-2 ring-blue-500 ring-offset-1' : 'border-gray-200 dark:border-gray-600'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => { onChange(color); setShowPicker(false); }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]">
                <span className="text-[10px] text-[var(--text-tertiary)]">Custom:</span>
                <input
                  type="color"
                  className="w-6 h-6 cursor-pointer"
                  value={value || '#000000'}
                  onChange={(e) => onChange(e.target.value)}
                />
                <input
                  type="text"
                  className="input-field !py-0.5 text-xs font-mono flex-1"
                  value={value || ''}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder="#000000"
                />
              </div>
              {allowClear && (
                <button
                  className="w-full mt-2 py-1 text-[10px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded border border-red-200 dark:border-red-800"
                  onClick={() => { onChange(''); setShowPicker(false); }}
                >
                  Clear Color
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
