import { useState } from 'react';

interface TableRadiusPanelProps {
  borderRadius: number;
  onChange: (radius: number) => void;
  cornerRadii?: { tl: number; tr: number; br: number; bl: number };
  onCornerChange?: (corners: { tl: number; tr: number; br: number; bl: number }) => void;
}

export function TableRadiusPanel({ borderRadius, onChange, cornerRadii, onCornerChange }: TableRadiusPanelProps) {
  const [linked, setLinked] = useState(true);
  const corners = cornerRadii || { tl: borderRadius, tr: borderRadius, br: borderRadius, bl: borderRadius };

  const handleSlider = (value: number) => {
    onChange(value);
    if (linked && onCornerChange) {
      onCornerChange({ tl: value, tr: value, br: value, bl: value });
    }
  };

  const handleCorner = (corner: keyof typeof corners, value: number) => {
    if (onCornerChange) {
      onCornerChange({ ...corners, [corner]: value });
    }
  };

  return (
    <div className="space-y-3">
      {/* Linked/unlinked toggle */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-[var(--text-secondary)]">Corner Radius</label>
        <button
          className={`toolbar-btn !w-7 !h-7 ${linked ? 'active' : ''}`}
          onClick={() => {
            setLinked(!linked);
            if (!linked && onCornerChange) {
              // Link all corners to the current slider value
              onCornerChange({ tl: borderRadius, tr: borderRadius, br: borderRadius, bl: borderRadius });
            }
          }}
          title={linked ? 'Unlink corners' : 'Link all corners'}
        >
          {linked ? (
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M6.5 2A1.5 1.5 0 0 0 5 3.5V5H3.5A1.5 1.5 0 0 0 2 6.5v3A1.5 1.5 0 0 0 3.5 11H5v1.5A1.5 1.5 0 0 0 6.5 14h3a1.5 1.5 0 0 0 1.5-1.5V11h1.5a1.5 1.5 0 0 0 1.5-1.5v-3A1.5 1.5 0 0 0 12.5 5H11V3.5A1.5 1.5 0 0 0 9.5 2h-3z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M6.5 2A1.5 1.5 0 0 0 5 3.5V5H3.5A1.5 1.5 0 0 0 2 6.5v3A1.5 1.5 0 0 0 3.5 11H5v1.5A1.5 1.5 0 0 0 6.5 14h3a1.5 1.5 0 0 0 1.5-1.5V11h1.5a1.5 1.5 0 0 0 1.5-1.5v-3A1.5 1.5 0 0 0 12.5 5H11V3.5A1.5 1.5 0 0 0 9.5 2h-3zm0 1h3a.5.5 0 0 1 .5.5V5H6V3.5a.5.5 0 0 1 .5-.5zM5 6h6v3H5V6zm-1 4h1.5v1.5a.5.5 0 0 1-.5.5h-.5v-2zm3 2v-2h2v1.5a.5.5 0 0 1-.5.5h-1.5zm3-2v2h.5a.5.5 0 0 0 .5-.5V10h-1zm1-4h1.5a.5.5 0 0 1 .5.5v.5h-2V6z"/>
            </svg>
          )}
        </button>
      </div>

      {/* Global slider (linked mode) */}
      {linked && (
        <div className="flex items-center gap-2">
          <input
            type="range"
            className="flex-1"
            min={0}
            max={32}
            value={borderRadius}
            onChange={(e) => handleSlider(Number(e.target.value))}
          />
          <span className="text-xs text-[var(--text-tertiary)] w-10 text-right font-mono">{borderRadius}px</span>
        </div>
      )}

      {/* Individual corners (unlinked mode) */}
      {!linked && (
        <div className="space-y-2">
          {/* Visual corner preview */}
          <div className="flex items-center justify-center">
            <div
              className="w-20 h-14 border-2 border-[var(--accent)] bg-[var(--surface-2)]"
              style={{
                borderTopLeftRadius: corners.tl,
                borderTopRightRadius: corners.tr,
                borderBottomRightRadius: corners.br,
                borderBottomLeftRadius: corners.bl,
              }}
            />
          </div>

          {/* Corner controls grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* Top-Left */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[var(--text-tertiary)] w-5">TL</span>
              <input
                type="range"
                className="flex-1"
                min={0}
                max={32}
                value={corners.tl}
                onChange={(e) => handleCorner('tl', Number(e.target.value))}
              />
              <span className="text-[10px] text-[var(--text-tertiary)] w-7 text-right font-mono">{corners.tl}</span>
            </div>

            {/* Top-Right */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[var(--text-tertiary)] w-5">TR</span>
              <input
                type="range"
                className="flex-1"
                min={0}
                max={32}
                value={corners.tr}
                onChange={(e) => handleCorner('tr', Number(e.target.value))}
              />
              <span className="text-[10px] text-[var(--text-tertiary)] w-7 text-right font-mono">{corners.tr}</span>
            </div>

            {/* Bottom-Left */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[var(--text-tertiary)] w-5">BL</span>
              <input
                type="range"
                className="flex-1"
                min={0}
                max={32}
                value={corners.bl}
                onChange={(e) => handleCorner('bl', Number(e.target.value))}
              />
              <span className="text-[10px] text-[var(--text-tertiary)] w-7 text-right font-mono">{corners.bl}</span>
            </div>

            {/* Bottom-Right */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[var(--text-tertiary)] w-5">BR</span>
              <input
                type="range"
                className="flex-1"
                min={0}
                max={32}
                value={corners.br}
                onChange={(e) => handleCorner('br', Number(e.target.value))}
              />
              <span className="text-[10px] text-[var(--text-tertiary)] w-7 text-right font-mono">{corners.br}</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick presets */}
      <div className="flex gap-1">
        {[0, 4, 8, 12, 16, 24].map((v) => (
          <button
            key={v}
            className={`flex-1 py-1 rounded text-[10px] border transition-all
              ${borderRadius === v
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                : 'border-[var(--border)] hover:border-blue-300 text-[var(--text-secondary)]'
              }`}
            onClick={() => handleSlider(v)}
          >
            {v}px
          </button>
        ))}
      </div>
    </div>
  );
}
