import { useState } from 'react';
import { X } from 'lucide-react';

export interface PDFExportSettings {
  paperSize: 'a4' | 'letter' | 'legal' | 'a3' | 'custom';
  orientation: 'portrait' | 'landscape' | 'auto';
  showPageNumbers: boolean;
  showTitle: boolean;
  showMetadata: boolean;
  fitToPage: 'width' | 'page' | 'none';
  marginSize: 'narrow' | 'normal' | 'wide';
}

interface PDFSettingsDialogProps {
  onExport: (settings: PDFExportSettings) => void;
  onClose: () => void;
  tableName: string;
}

const PAPER_SIZES = [
  { value: 'a4', label: 'A4', desc: '210 × 297 mm' },
  { value: 'letter', label: 'Letter', desc: '8.5 × 11 in' },
  { value: 'legal', label: 'Legal', desc: '8.5 × 14 in' },
  { value: 'a3', label: 'A3', desc: '297 × 420 mm' },
];

const ORIENTATIONS = [
  { value: 'portrait', label: 'Portrait', icon: '▯' },
  { value: 'landscape', label: 'Landscape', icon: '▭' },
  { value: 'auto', label: 'Auto', icon: '⟲' },
];

const FIT_OPTIONS = [
  { value: 'none', label: 'Natural Size', desc: 'Table at original size' },
  { value: 'width', label: 'Fit Width', desc: 'Stretch to page width' },
  { value: 'page', label: 'Fit Page', desc: 'Fit entire table on one page' },
];

const MARGINS = [
  { value: 'narrow', label: 'Narrow', desc: '10mm' },
  { value: 'normal', label: 'Normal', desc: '14mm' },
  { value: 'wide', label: 'Wide', desc: '20mm' },
];

export function PDFSettingsDialog({ onExport, onClose, tableName }: PDFSettingsDialogProps) {
  const [settings, setSettings] = useState<PDFExportSettings>({
    paperSize: 'a4',
    orientation: 'auto',
    showPageNumbers: true,
    showTitle: true,
    showMetadata: true,
    fitToPage: 'width',
    marginSize: 'normal',
  });

  const update = <K extends keyof PDFExportSettings>(key: K, value: PDFExportSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[var(--surface-0)] rounded-2xl shadow-float-lg w-[440px] max-w-[95vw] max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Export PDF</h2>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{tableName}</p>
          </div>
          <button onClick={onClose} className="toolbar-btn !w-8 !h-8"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Paper Size */}
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] mb-2 block">Paper Size</label>
            <div className="grid grid-cols-4 gap-1.5">
              {PAPER_SIZES.map((size) => (
                <button
                  key={size.value}
                  className={`p-2.5 rounded-lg border text-center transition-all
                    ${settings.paperSize === size.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                      : 'border-[var(--border)] hover:border-blue-300 text-[var(--text-secondary)]'}`}
                  onClick={() => update('paperSize', size.value as any)}
                >
                  <div className="text-sm font-semibold">{size.label}</div>
                  <div className="text-[9px] text-[var(--text-tertiary)]">{size.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Orientation */}
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] mb-2 block">Orientation</label>
            <div className="flex gap-1.5">
              {ORIENTATIONS.map((ori) => (
                <button
                  key={ori.value}
                  className={`flex-1 p-2.5 rounded-lg border flex flex-col items-center gap-1 transition-all
                    ${settings.orientation === ori.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                      : 'border-[var(--border)] hover:border-blue-300 text-[var(--text-secondary)]'}`}
                  onClick={() => update('orientation', ori.value as any)}
                >
                  <span className="text-lg">{ori.icon}</span>
                  <span className="text-[10px]">{ori.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Fit to Page */}
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] mb-2 block">Table Size</label>
            <div className="flex gap-1.5">
              {FIT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`flex-1 p-2.5 rounded-lg border text-center transition-all
                    ${settings.fitToPage === opt.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                      : 'border-[var(--border)] hover:border-blue-300 text-[var(--text-secondary)]'}`}
                  onClick={() => update('fitToPage', opt.value as any)}
                >
                  <div className="text-xs font-medium">{opt.label}</div>
                  <div className="text-[9px] text-[var(--text-tertiary)]">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Margins */}
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] mb-2 block">Margins</label>
            <div className="flex gap-1.5">
              {MARGINS.map((m) => (
                <button
                  key={m.value}
                  className={`flex-1 p-2 rounded-lg border text-center transition-all
                    ${settings.marginSize === m.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                      : 'border-[var(--border)] hover:border-blue-300 text-[var(--text-secondary)]'}`}
                  onClick={() => update('marginSize', m.value as any)}
                >
                  <div className="text-xs font-medium">{m.label}</div>
                  <div className="text-[9px] text-[var(--text-tertiary)]">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2.5">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-[var(--text-secondary)]">Show title</span>
              <div className={`w-9 h-5 rounded-full transition-colors ${settings.showTitle ? 'bg-blue-500' : 'bg-[var(--surface-3)]'} relative`}
                onClick={() => update('showTitle', !settings.showTitle)}>
                <div className={`w-4 h-4 rounded-full bg-white shadow absolute top-0.5 transition-transform ${settings.showTitle ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-[var(--text-secondary)]">Show metadata (row/column count)</span>
              <div className={`w-9 h-5 rounded-full transition-colors ${settings.showMetadata ? 'bg-blue-500' : 'bg-[var(--surface-3)]'} relative`}
                onClick={() => update('showMetadata', !settings.showMetadata)}>
                <div className={`w-4 h-4 rounded-full bg-white shadow absolute top-0.5 transition-transform ${settings.showMetadata ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-[var(--text-secondary)]">Show page numbers</span>
              <div className={`w-9 h-5 rounded-full transition-colors ${settings.showPageNumbers ? 'bg-blue-500' : 'bg-[var(--surface-3)]'} relative`}
                onClick={() => update('showPageNumbers', !settings.showPageNumbers)}>
                <div className={`w-4 h-4 rounded-full bg-white shadow absolute top-0.5 transition-transform ${settings.showPageNumbers ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[var(--border)]">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors">
            Cancel
          </button>
          <button onClick={() => onExport(settings)} className="px-5 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors">
            Export PDF
          </button>
        </div>
      </div>
    </div>
  );
}
