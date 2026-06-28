import { useState } from 'react';
import { useTableStore } from '../store/tableStore';
import { THEME_PRESETS } from '../utils/themes';
import { BorderPanel } from './BorderPanel';
import {
  Palette, Type, Layout, Grid3X3, Image, Settings, ChevronDown, ChevronRight,
  Paintbrush, Box, Eye, EyeOff, Snowflake, Lock, Unlock, Link, Hash, Star
} from 'lucide-react';
import type { CellStyle, TableTheme, CellContent } from '../types';

type Tab = 'cell' | 'table' | 'theme';

function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[var(--border)] last:border-b-0">
      <button
        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider hover:bg-[var(--surface-2)] transition-colors"
        onClick={() => setOpen(!open)}
      >
        {Icon && <Icon className="w-3.5 h-3.5" />}
        <span className="flex-1 text-left">{title}</span>
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>
      {open && <div className="px-4 pb-3 space-y-2">{children}</div>}
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-[var(--text-secondary)] w-20 shrink-0">{label}</label>
      <div className="relative flex-1">
        <div className="flex items-center gap-1.5">
          <div
            className="w-6 h-6 rounded border border-[var(--border)] cursor-pointer shrink-0"
            style={{ backgroundColor: value || 'transparent' }}
          />
          <input
            type="color"
            className="absolute left-0 top-0 w-6 h-6 opacity-0 cursor-pointer"
            value={value || '#000000'}
            onChange={(e) => onChange(e.target.value)}
          />
          <input
            type="text"
            className="input-field !py-1 text-xs font-mono flex-1"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#000000"
          />
        </div>
      </div>
    </div>
  );
}

function SliderInput({ label, value, min, max, step = 1, unit = '', onChange }: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-[var(--text-secondary)] w-20 shrink-0">{label}</label>
      <input
        type="range"
        className="flex-1"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="text-xs text-[var(--text-tertiary)] w-10 text-right font-mono">{value}{unit}</span>
    </div>
  );
}

function SelectInput({ label, value, options, onChange }: {
  label: string; value: string; options: { label: string; value: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-[var(--text-secondary)] w-20 shrink-0">{label}</label>
      <select
        className="select-field flex-1 text-xs"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function ToggleButton({ active, onClick, children, title }: {
  active?: boolean; onClick: () => void; children: React.ReactNode; title?: string;
}) {
  return (
    <button
      className={`toolbar-btn !w-8 !h-8 ${active ? 'active' : ''}`}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
}

export function StylePanel() {
  const store = useTableStore();
  const table = store.getActiveTable();
  const [tab, setTab] = useState<Tab>('cell');

  if (!table) return null;

  const activeCell = store.activeCell;
  const cell = activeCell
    ? table.cells[`${table.rows[activeCell.row]?.id}:${table.columns[activeCell.col]?.id}`]
    : null;
  const cellStyle: CellStyle = cell?.style || {};
  const cellContent = cell?.content;

  const updateStyle = (patch: Partial<CellStyle>) => {
    if (store.selection) {
      store.updateSelectionStyle(patch);
    } else if (activeCell) {
      store.updateCellStyle(activeCell.row, activeCell.col, patch);
    }
  };

  const updateContent = (patch: Partial<CellContent>) => {
    if (activeCell) {
      store.updateCellContent(activeCell.row, activeCell.col, patch);
    }
  };

  const updateTheme = (patch: Partial<TableTheme>) => {
    store.updateTheme(patch);
  };

  return (
    <div className="w-72 min-w-[260px] bg-[var(--surface-0)] border-l border-[var(--border)] flex flex-col h-full overflow-hidden max-md:w-60 max-md:min-w-[240px]">
      {/* Tabs */}
      <div className="flex border-b border-[var(--border)]">
        {([
          { id: 'cell' as Tab, label: 'Cell', icon: Grid3X3 },
          { id: 'table' as Tab, label: 'Table', icon: Layout },
          { id: 'theme' as Tab, label: 'Theme', icon: Palette },
        ]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`tab-btn flex-1 flex items-center justify-center gap-1.5 ${tab === id ? 'active' : ''}`}
            onClick={() => setTab(id)}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'cell' && (
          <>
            {/* Cell Content Type */}
            <Section title="Content" icon={Type}>
              <SelectInput
                label="Type"
                value={cellContent?.type || 'text'}
                options={[
                  { label: 'Text', value: 'text' },
                  { label: 'Number', value: 'number' },
                  { label: 'Link', value: 'link' },
                  { label: 'Badge', value: 'badge' },
                  { label: 'Tag', value: 'tag' },
                  { label: 'Checkbox', value: 'checkbox' },
                  { label: 'Progress', value: 'progress' },
                  { label: 'Rating', value: 'rating' },
                  { label: 'Image', value: 'image' },
                ]}
                onChange={(v) => updateContent({ type: v as any })}
              />

              {cellContent?.type === 'link' && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[var(--text-secondary)] w-20 shrink-0">URL</label>
                  <input
                    className="input-field !py-1 text-xs flex-1"
                    value={cellContent.href || ''}
                    onChange={(e) => updateContent({ href: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              )}

              {cellContent?.type === 'badge' && (
                <>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[var(--text-secondary)] w-20 shrink-0">Label</label>
                    <input
                      className="input-field !py-1 text-xs flex-1"
                      value={cellContent.label || ''}
                      onChange={(e) => updateContent({ label: e.target.value })}
                    />
                  </div>
                  <ColorInput label="Color" value={cellContent.color || '#3b82f6'} onChange={(v) => updateContent({ color: v })} />
                </>
              )}

              {cellContent?.type === 'tag' && (
                <>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[var(--text-secondary)] w-20 shrink-0">Label</label>
                    <input
                      className="input-field !py-1 text-xs flex-1"
                      value={cellContent.label || ''}
                      onChange={(e) => updateContent({ label: e.target.value })}
                    />
                  </div>
                  <ColorInput label="Color" value={cellContent.color || '#3b82f6'} onChange={(v) => updateContent({ color: v })} />
                </>
              )}

              {cellContent?.type === 'checkbox' && (
                <>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[var(--text-secondary)] w-20 shrink-0">Checked</label>
                    <button
                      className={`toolbar-btn !w-8 !h-8 ${cellContent.checked ? 'active' : ''}`}
                      onClick={() => updateContent({ checked: !cellContent.checked })}
                    >
                      {cellContent.checked ? '☑' : '☐'}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[var(--text-secondary)] w-20 shrink-0">Label</label>
                    <input
                      className="input-field !py-1 text-xs flex-1"
                      value={cellContent.text || ''}
                      onChange={(e) => updateContent({ text: e.target.value })}
                      placeholder="Checkbox label..."
                    />
                  </div>
                </>
              )}

              {cellContent?.type === 'image' && (
                <>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[var(--text-secondary)] w-20 shrink-0">URL</label>
                    <input
                      className="input-field !py-1 text-xs flex-1"
                      value={cellContent.src || ''}
                      onChange={(e) => updateContent({ src: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[var(--text-secondary)] w-20 shrink-0">Upload</label>
                    <button
                      className="toolbar-btn !w-auto !px-2 text-xs"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => updateContent({ src: reader.result as string });
                          reader.readAsDataURL(file);
                        };
                        input.click();
                      }}
                    >
                      📁 Choose Image
                    </button>
                  </div>
                </>
              )}

              {cellContent?.type === 'progress' && (
                <>
                  <SliderInput label="Value" value={cellContent.value || 0} min={0} max={100} unit="%" onChange={(v) => updateContent({ value: v })} />
                  <ColorInput label="Color" value={cellContent.color || '#3b82f6'} onChange={(v) => updateContent({ color: v })} />
                </>
              )}

              {cellContent?.type === 'rating' && (
                <SliderInput label="Stars" value={cellContent.value || 0} min={0} max={5} onChange={(v) => updateContent({ value: v })} />
              )}
            </Section>

            {/* Typography */}
            <Section title="Typography" icon={Type}>
              <SelectInput
                label="Font"
                value={cellStyle.fontFamily || table.theme.fontFamily}
                options={['Inter', 'Poppins', 'Playfair Display', 'Roboto Slab', 'JetBrains Mono',
                  'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Courier New',
                  'Verdana', 'Trebuchet MS', 'Palatino', 'Garamond'].map(f => ({ label: f, value: f }))}
                onChange={(v) => updateStyle({ fontFamily: v })}
              />
              <SliderInput label="Size" value={cellStyle.fontSize || table.theme.fontSize} min={8} max={72} unit="px" onChange={(v) => updateStyle({ fontSize: v })} />
              <SliderInput label="Line height" value={cellStyle.lineHeight || 1.5} min={0.8} max={3} step={0.1} onChange={(v) => updateStyle({ lineHeight: v })} />
              <SliderInput label="Letter sp." value={cellStyle.letterSpacing || 0} min={-2} max={10} step={0.5} unit="px" onChange={(v) => updateStyle({ letterSpacing: v })} />
              <SelectInput
                label="Transform"
                value={cellStyle.textTransform || 'none'}
                options={[
                  { label: 'None', value: 'none' },
                  { label: 'UPPERCASE', value: 'uppercase' },
                  { label: 'lowercase', value: 'lowercase' },
                  { label: 'Capitalize', value: 'capitalize' },
                ]}
                onChange={(v) => updateStyle({ textTransform: v as any })}
              />

              <div className="flex items-center gap-1">
                <ToggleButton active={cellStyle.fontWeight === 'bold' || Number(cellStyle.fontWeight) >= 700}
                  onClick={() => updateStyle({ fontWeight: cellStyle.fontWeight === 'bold' ? 'normal' : 'bold' })} title="Bold">
                  <strong className="text-xs">B</strong>
                </ToggleButton>
                <ToggleButton active={cellStyle.italic}
                  onClick={() => updateStyle({ italic: !cellStyle.italic })} title="Italic">
                  <em className="text-xs">I</em>
                </ToggleButton>
                <ToggleButton active={cellStyle.underline}
                  onClick={() => updateStyle({ underline: !cellStyle.underline })} title="Underline">
                  <u className="text-xs">U</u>
                </ToggleButton>
                <ToggleButton active={cellStyle.strikethrough}
                  onClick={() => updateStyle({ strikethrough: !cellStyle.strikethrough })} title="Strikethrough">
                  <s className="text-xs">S</s>
                </ToggleButton>
              </div>
            </Section>

            {/* Alignment */}
            <Section title="Alignment" icon={Layout} defaultOpen={false}>
              <div className="flex items-center gap-1">
                {[
                  { value: 'left', icon: '≡' },
                  { value: 'center', icon: '☰' },
                  { value: 'right', icon: '≡' },
                  { value: 'justify', icon: '☰' },
                ].map(({ value, icon }) => (
                  <ToggleButton
                    key={value}
                    active={cellStyle.textAlign === value}
                    onClick={() => updateStyle({ textAlign: value as any })}
                    title={`Align ${value}`}
                  >
                    <span className="text-xs">{icon}</span>
                  </ToggleButton>
                ))}
              </div>
              <div className="flex items-center gap-1">
                {[
                  { value: 'top', label: 'T' },
                  { value: 'middle', label: 'M' },
                  { value: 'bottom', label: 'B' },
                ].map(({ value, label }) => (
                  <ToggleButton
                    key={value}
                    active={cellStyle.verticalAlign === value}
                    onClick={() => updateStyle({ verticalAlign: value as any })}
                    title={`Vertical ${value}`}
                  >
                    <span className="text-xs">{label}</span>
                  </ToggleButton>
                ))}
              </div>
            </Section>

            {/* Colors */}
            <Section title="Colors" icon={Paintbrush} defaultOpen={false}>
              <ColorInput label="Text" value={cellStyle.textColor || ''} onChange={(v) => updateStyle({ textColor: v })} />
              <ColorInput label="Background" value={cellStyle.bgColor || ''} onChange={(v) => updateStyle({ bgColor: v })} />
              <SliderInput label="Opacity" value={cellStyle.opacity ?? 1} min={0} max={1} step={0.05} onChange={(v) => updateStyle({ opacity: v })} />
            </Section>

            {/* Borders */}
            <Section title="Borders" icon={Box} defaultOpen={false}>
              <BorderPanel cellStyle={cellStyle} onUpdate={updateStyle} />
              <SliderInput label="Radius" value={cellStyle.borderRadius || 0} min={0} max={24} unit="px" onChange={(v) => updateStyle({ borderRadius: v })} />
              <SliderInput label="Padding" value={cellStyle.padding || 8} min={0} max={32} unit="px" onChange={(v) => updateStyle({ padding: v })} />
            </Section>

            {/* Effects */}
            <Section title="Effects" icon={Star} defaultOpen={false}>
              <div className="flex items-center gap-2">
                <label className="text-xs text-[var(--text-secondary)] w-20 shrink-0">Shadow</label>
                <select
                  className="select-field !py-0.5 text-xs flex-1"
                  value={cellStyle.boxShadow || 'none'}
                  onChange={(e) => updateStyle({ boxShadow: e.target.value === 'none' ? undefined : e.target.value })}
                >
                  <option value="none">None</option>
                  <option value="0 1px 2px rgba(0,0,0,0.1)">Subtle</option>
                  <option value="0 2px 8px rgba(0,0,0,0.15)">Medium</option>
                  <option value="0 4px 16px rgba(0,0,0,0.2)">Large</option>
                  <option value="0 8px 32px rgba(0,0,0,0.25)">Extra Large</option>
                  <option value="inset 0 2px 4px rgba(0,0,0,0.1)">Inset</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-[var(--text-secondary)] w-20 shrink-0">Gradient</label>
                <select
                  className="select-field !py-0.5 text-xs flex-1"
                  value={cellStyle.gradient || 'none'}
                  onChange={(e) => updateStyle({ gradient: e.target.value === 'none' ? undefined : e.target.value })}
                >
                  <option value="none">None</option>
                  <option value="linear-gradient(135deg, #667eea 0%, #764ba2 100%)">Purple Haze</option>
                  <option value="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">Pink Sunset</option>
                  <option value="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">Ocean Blue</option>
                  <option value="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">Green Fresh</option>
                  <option value="linear-gradient(135deg, #fa709a 0%, #fee140 100%)">Warm Glow</option>
                  <option value="linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)">Lavender</option>
                  <option value="linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)">Peach</option>
                </select>
              </div>
            </Section>

            {/* Lock */}
            <Section title="Cell Options" icon={Settings} defaultOpen={false}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-secondary)]">Locked</span>
                <button
                  className={`toolbar-btn !w-8 !h-8 ${cell?.locked ? 'active' : ''}`}
                  onClick={() => activeCell && store.toggleCellLock(activeCell.row, activeCell.col)}
                >
                  {cell?.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-[var(--text-secondary)] w-20 shrink-0">Colspan</label>
                <input
                  type="number"
                  className="input-field !py-1 text-xs w-16"
                  value={cell?.colspan || 1}
                  min={1}
                  max={20}
                  onChange={(e) => {
                    if (activeCell) {
                      store.updateCellColspan(activeCell.row, activeCell.col, Number(e.target.value));
                    }
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-[var(--text-secondary)] w-20 shrink-0">Rowspan</label>
                <input
                  type="number"
                  className="input-field !py-1 text-xs w-16"
                  value={cell?.rowspan || 1}
                  min={1}
                  max={20}
                  onChange={(e) => {
                    if (activeCell) {
                      store.updateCellRowspan(activeCell.row, activeCell.col, Number(e.target.value));
                    }
                  }}
                />
              </div>
            </Section>
          </>
        )}

        {tab === 'table' && (
          <>
            <Section title="Dimensions" icon={Layout}>
              <SliderInput label="Width" value={table.columns.reduce((s, c) => s + c.width, 0)} min={200} max={4000} step={10} unit="px"
                onChange={() => {}} />
              <div className="flex items-center gap-2">
                <label className="text-xs text-[var(--text-secondary)] w-20 shrink-0">Rows</label>
                <span className="text-xs font-mono text-[var(--text-primary)]">{table.rows.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-[var(--text-secondary)] w-20 shrink-0">Columns</label>
                <span className="text-xs font-mono text-[var(--text-primary)]">{table.columns.length}</span>
              </div>
            </Section>

            <Section title="Header" icon={Grid3X3}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-secondary)]">Sticky header</span>
                <ToggleButton
                  active={table.theme.stickyHeader}
                  onClick={() => updateTheme({ stickyHeader: !table.theme.stickyHeader })}
                >
                  <Snowflake className="w-4 h-4" />
                </ToggleButton>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-secondary)]">Sticky first column</span>
                <ToggleButton
                  active={table.theme.stickyFirstCol}
                  onClick={() => updateTheme({ stickyFirstCol: !table.theme.stickyFirstCol })}
                >
                  <Snowflake className="w-4 h-4" />
                </ToggleButton>
              </div>
            </Section>

            <Section title="Grid" icon={Grid3X3} defaultOpen={false}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-secondary)]">Show grid lines</span>
                <ToggleButton
                  active={store.showGrid}
                  onClick={() => store.setShowGrid(!store.showGrid)}
                >
                  {store.showGrid ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </ToggleButton>
              </div>
            </Section>

            <Section title="Table Name" icon={Type} defaultOpen={false}>
              <input
                className="input-field !py-1 text-xs"
                value={table.name}
                onChange={(e) => store.renameTable(table.id, e.target.value)}
              />
            </Section>
          </>
        )}

        {tab === 'theme' && (
          <>
            <Section title="Presets" icon={Palette}>
              <div className="grid grid-cols-2 gap-1.5">
                {THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    className={`p-2 rounded-lg border text-left transition-all hover:shadow-sm ${
                      table.theme.id === preset.id ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]' : 'border-[var(--border)]'
                    }`}
                    onClick={() => updateTheme(preset)}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <div className="w-3 h-3 rounded-sm" style={{ background: preset.headerBg }} />
                      <div className="w-3 h-3 rounded-sm border border-[var(--border)]" style={{ background: preset.cellBg }} />
                      <div className="w-3 h-3 rounded-sm" style={{ background: preset.borderColor }} />
                    </div>
                    <div className="text-[10px] font-medium text-[var(--text-primary)] truncate">{preset.name}</div>
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Header Colors" icon={Paintbrush}>
              <ColorInput label="Background" value={table.theme.headerBg} onChange={(v) => updateTheme({ headerBg: v })} />
              <ColorInput label="Text" value={table.theme.headerText} onChange={(v) => updateTheme({ headerText: v })} />
            </Section>

            <Section title="Cell Colors" icon={Paintbrush}>
              <ColorInput label="Background" value={table.theme.cellBg} onChange={(v) => updateTheme({ cellBg: v })} />
              <ColorInput label="Text" value={table.theme.cellText} onChange={(v) => updateTheme({ cellText: v })} />
              <ColorInput label="Alt row" value={table.theme.alternateRowBg || ''} onChange={(v) => updateTheme({ alternateRowBg: v })} />
            </Section>

            <Section title="Borders" icon={Box}>
              <ColorInput label="Color" value={table.theme.borderColor} onChange={(v) => updateTheme({ borderColor: v })} />
              <SliderInput label="Width" value={table.theme.borderWidth} min={0} max={5} unit="px" onChange={(v) => updateTheme({ borderWidth: v })} />
              <SelectInput
                label="Style"
                value={table.theme.borderStyle}
                options={[
                  { label: 'Solid', value: 'solid' },
                  { label: 'Dashed', value: 'dashed' },
                  { label: 'Dotted', value: 'dotted' },
                  { label: 'Double', value: 'double' },
                ]}
                onChange={(v) => updateTheme({ borderStyle: v as any })}
              />
              <SliderInput label="Radius" value={table.theme.borderRadius} min={0} max={24} unit="px" onChange={(v) => updateTheme({ borderRadius: v })} />
            </Section>

            <Section title="Typography" icon={Type}>
              <SelectInput
                label="Font"
                value={table.theme.fontFamily}
                options={['Inter', 'Poppins', 'Playfair Display', 'Roboto Slab', 'JetBrains Mono',
                  'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Courier New'].map(f => ({ label: f, value: f }))}
                onChange={(v) => updateTheme({ fontFamily: v })}
              />
              <SliderInput label="Size" value={table.theme.fontSize} min={10} max={24} unit="px" onChange={(v) => updateTheme({ fontSize: v })} />
              <SelectInput
                label="Header weight"
                value={table.theme.headerFontWeight}
                options={[
                  { label: 'Normal', value: '400' },
                  { label: 'Medium', value: '500' },
                  { label: 'Semi Bold', value: '600' },
                  { label: 'Bold', value: '700' },
                ]}
                onChange={(v) => updateTheme({ headerFontWeight: v })}
              />
            </Section>
          </>
        )}
      </div>
    </div>
  );
}
