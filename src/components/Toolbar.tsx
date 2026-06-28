import { useState, useRef } from 'react';
import { useTableStore } from '../store/tableStore';
import {
  Undo2, Redo2, Plus, Minus, Merge, Split, Lock, Unlock,
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Type, Paintbrush, Grid3X3,
  Moon, Sun, ZoomIn, ZoomOut,
  Copy, ClipboardPaste, Eye, Snowflake,
  Trash2, CopyPlus, ChevronDown, FileDown, FileUp,
  Columns, Rows,
  PanelLeftClose, PanelLeftOpen, Home, PanelRightClose, PanelRightOpen
} from 'lucide-react';
import { tableToHTML, tableToCSV, tableToMarkdown, tableToJSON, tableToExcel, tableToImage, tableToSVG, tableToPDF, downloadFile } from '../utils/export';
import { importFromFile } from '../utils/import';
import { PDFSettingsDialog, type PDFExportSettings } from './PDFSettingsDialog';
import type { TableData } from '../types';

function ToolbarButton({ icon: Icon, label, active, disabled, onClick, className = '' }: {
  icon: any; label?: string; active?: boolean; disabled?: boolean; onClick?: () => void; className?: string;
}) {
  return (
    <button
      className={`toolbar-btn ${active ? 'active' : ''} ${className}`}
      disabled={disabled}
      onClick={onClick}
      title={label}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

function ToolbarDivider() {
  return <div className="toolbar-divider" />;
}

export function Toolbar() {
  const store = useTableStore();
  const { isDarkMode, showGrid, zoom, sidebarOpen, stylePanelOpen } = store;
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showRowMenu, setShowRowMenu] = useState(false);
  const [showColMenu, setShowColMenu] = useState(false);
  const [showPDFSettings, setShowPDFSettings] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const importRef = useRef<HTMLDivElement>(null);

  const table = store.getActiveTable();

  const handleExport = async (format: string) => {
    if (!table) return;
    if (format === 'pdf') {
      setShowPDFSettings(true);
      setShowExport(false);
      return;
    }
    switch (format) {
      case 'html':
        downloadFile(tableToHTML(table), `${table.name}.html`, 'text/html');
        break;
      case 'csv':
        downloadFile(tableToCSV(table), `${table.name}.csv`, 'text/csv');
        break;
      case 'markdown':
        downloadFile(tableToMarkdown(table), `${table.name}.md`, 'text/markdown');
        break;
      case 'json':
        downloadFile(tableToJSON(table), `${table.name}.json`, 'application/json');
        break;
      case 'png':
        await tableToImage(table, 'png');
        break;
      case 'jpeg':
        await tableToImage(table, 'jpeg');
        break;
      case 'svg':
        await tableToSVG(table);
        break;
      case 'excel':
        await tableToExcel(table);
        break;
    }
    setShowExport(false);
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls,.json,.md';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const imported = await importFromFile(file);
        store.importTable(imported);
      } catch (err: any) {
        alert('Import failed: ' + err.message);
      }
    };
    input.click();
    setShowImport(false);
  };

  const handlePDFExport = async (settings: PDFExportSettings) => {
    if (!table) return;
    setShowPDFSettings(false);
    await tableToPDF(table, settings);
  };

  const applyStyleToSelection = (style: any) => {
    const sel = store.selection;
    if (sel) {
      store.updateSelectionStyle(style);
    } else if (store.activeCell) {
      const table = store.getActiveTable();
      if (table) {
        store.updateCellStyle(store.activeCell.row, store.activeCell.col, style);
      }
    }
  };

  const getActiveStyle = () => {
    if (!table) return {};
    const cell = store.activeCell;
    if (!cell) return {};
    const row = table.rows[cell.row];
    const col = table.columns[cell.col];
    return table.cells[`${row?.id}:${col?.id}`]?.style || {};
  };

  const activeStyle = getActiveStyle();

  return (
    <div className="bg-[var(--surface-0)] border-b border-[var(--border)] px-2 py-1.5">
      <div className="flex items-center gap-0.5 flex-wrap">
        {/* Home / Back to Dashboard */}
        <ToolbarButton
          icon={Home}
          label="Back to Dashboard"
          onClick={() => store.setActiveTable('')}
        />
        {/* Sidebar toggle */}
        <ToolbarButton
          icon={sidebarOpen ? PanelLeftClose : PanelLeftOpen}
          label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          onClick={() => store.setSidebarOpen(!sidebarOpen)}
        />
        {/* Style panel toggle */}
        <ToolbarButton
          icon={stylePanelOpen ? PanelRightClose : PanelRightOpen}
          label={stylePanelOpen ? 'Hide style panel' : 'Show style panel'}
          onClick={() => store.setStylePanelOpen(!stylePanelOpen)}
        />
        <ToolbarDivider />

        {/* Undo/Redo */}
        <ToolbarButton icon={Undo2} label="Undo (Ctrl+Z)" onClick={store.undo} />
        <ToolbarButton icon={Redo2} label="Redo (Ctrl+Y)" onClick={store.redo} />
        <ToolbarDivider />

        {/* Row/Column operations */}
        <div className="relative" ref={importRef}>
          <button
            className="toolbar-btn flex items-center gap-1 !px-2 !w-auto"
            onClick={() => setShowRowMenu(!showRowMenu)}
            title="Row operations"
          >
            <Rows className="w-4 h-4" />
            <ChevronDown className="w-3 h-3" />
          </button>
          {showRowMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowRowMenu(false)} />
              <div className="absolute top-full left-0 mt-1 z-50 bg-[var(--surface-0)] border border-[var(--border)] rounded-lg shadow-float p-1 min-w-[160px]">
                <button className="context-menu-item w-full" onClick={() => { store.addRow(); setShowRowMenu(false); }}>
                  <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
                <button className="context-menu-item w-full" onClick={() => { store.deleteRow(store.activeCell?.row ?? table!.rows.length - 1); setShowRowMenu(false); }}>
                  <Minus className="w-3.5 h-3.5" /> Delete Row
                </button>
                <button className="context-menu-item w-full" onClick={() => { store.duplicateRow(store.activeCell?.row ?? 0); setShowRowMenu(false); }}>
                  <CopyPlus className="w-3.5 h-3.5" /> Duplicate Row
                </button>
                <div className="context-menu-separator" />
                <button className="context-menu-item w-full" onClick={() => { if (store.activeCell) store.toggleRowFrozen(store.activeCell.row); setShowRowMenu(false); }}>
                  <Snowflake className="w-3.5 h-3.5" /> Toggle Freeze
                </button>
                <button className="context-menu-item w-full" onClick={() => { if (store.activeCell) store.toggleRowHidden(store.activeCell.row); setShowRowMenu(false); }}>
                  <Eye className="w-3.5 h-3.5" /> Toggle Hide
                </button>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            className="toolbar-btn flex items-center gap-1 !px-2 !w-auto"
            onClick={() => setShowColMenu(!showColMenu)}
            title="Column operations"
          >
            <Columns className="w-4 h-4" />
            <ChevronDown className="w-3 h-3" />
          </button>
          {showColMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowColMenu(false)} />
              <div className="absolute top-full left-0 mt-1 z-50 bg-[var(--surface-0)] border border-[var(--border)] rounded-lg shadow-float p-1 min-w-[160px]">
                <button className="context-menu-item w-full" onClick={() => { store.addColumn(); setShowColMenu(false); }}>
                  <Plus className="w-3.5 h-3.5" /> Add Column
                </button>
                <button className="context-menu-item w-full" onClick={() => { store.deleteColumn(store.activeCell?.col ?? table!.columns.length - 1); setShowColMenu(false); }}>
                  <Minus className="w-3.5 h-3.5" /> Delete Column
                </button>
                <button className="context-menu-item w-full" onClick={() => { store.duplicateColumn(store.activeCell?.col ?? 0); setShowColMenu(false); }}>
                  <CopyPlus className="w-3.5 h-3.5" /> Duplicate Column
                </button>
                <div className="context-menu-separator" />
                <button className="context-menu-item w-full" onClick={() => { if (store.activeCell) store.toggleColumnFrozen(store.activeCell.col); setShowColMenu(false); }}>
                  <Snowflake className="w-3.5 h-3.5" /> Toggle Freeze
                </button>
                <button className="context-menu-item w-full" onClick={() => { if (store.activeCell) store.toggleColumnHidden(store.activeCell.col); setShowColMenu(false); }}>
                  <Eye className="w-3.5 h-3.5" /> Toggle Hide
                </button>
              </div>
            </>
          )}
        </div>

        {/* Merge/Split */}
        <ToolbarButton
          icon={Merge}
          label="Merge cells"
          disabled={!store.selection}
          onClick={() => { if (store.selection) store.mergeCells(store.selection); }}
        />
        <ToolbarButton
          icon={Split}
          label="Split cell"
          disabled={!store.activeCell}
          onClick={() => { if (store.activeCell) store.splitCell(store.activeCell.row, store.activeCell.col); }}
        />
        <ToolbarDivider />

        {/* Text formatting */}
        <ToolbarButton
          icon={Bold}
          label="Bold (Ctrl+B)"
          active={activeStyle.fontWeight === 'bold' || Number(activeStyle.fontWeight) >= 700}
          onClick={() => applyStyleToSelection({
            fontWeight: activeStyle.fontWeight === 'bold' || Number(activeStyle.fontWeight) >= 700 ? 'normal' : 'bold'
          })}
        />
        <ToolbarButton
          icon={Italic}
          label="Italic (Ctrl+I)"
          active={activeStyle.italic}
          onClick={() => applyStyleToSelection({ italic: !activeStyle.italic })}
        />
        <ToolbarButton
          icon={Underline}
          label="Underline (Ctrl+U)"
          active={activeStyle.underline}
          onClick={() => applyStyleToSelection({ underline: !activeStyle.underline })}
        />
        <ToolbarButton
          icon={Strikethrough}
          label="Strikethrough"
          active={activeStyle.strikethrough}
          onClick={() => applyStyleToSelection({ strikethrough: !activeStyle.strikethrough })}
        />
        <ToolbarDivider />

        {/* Alignment */}
        <ToolbarButton
          icon={AlignLeft}
          label="Align left"
          active={activeStyle.textAlign === 'left'}
          onClick={() => applyStyleToSelection({ textAlign: 'left' })}
        />
        <ToolbarButton
          icon={AlignCenter}
          label="Align center"
          active={activeStyle.textAlign === 'center'}
          onClick={() => applyStyleToSelection({ textAlign: 'center' })}
        />
        <ToolbarButton
          icon={AlignRight}
          label="Align right"
          active={activeStyle.textAlign === 'right'}
          onClick={() => applyStyleToSelection({ textAlign: 'right' })}
        />
        <ToolbarButton
          icon={AlignJustify}
          label="Justify"
          active={activeStyle.textAlign === 'justify'}
          onClick={() => applyStyleToSelection({ textAlign: 'justify' })}
        />
        <ToolbarDivider />

        {/* Font size */}
        <select
          className="select-field !py-1 !px-1.5 !w-16 text-xs"
          value={activeStyle.fontSize || 14}
          onChange={(e) => applyStyleToSelection({ fontSize: Number(e.target.value) })}
          title="Font size"
        >
          {[8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32, 36, 42, 48, 56, 64, 72].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Font family */}
        <select
          className="select-field !py-1 !px-1.5 !w-28 text-xs"
          value={activeStyle.fontFamily || table?.theme.fontFamily || 'Inter'}
          onChange={(e) => applyStyleToSelection({ fontFamily: e.target.value })}
          title="Font family"
        >
          {['Inter', 'Poppins', 'Playfair Display', 'Roboto Slab', 'JetBrains Mono',
            'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Courier New',
            'Verdana', 'Trebuchet MS', 'Palatino', 'Garamond'].map(f => (
            <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
          ))}
        </select>
        <ToolbarDivider />

        {/* Colors */}
        <div className="flex items-center gap-1">
          <div className="relative group">
            <div
              className="w-6 h-6 rounded border border-[var(--border)] cursor-pointer flex items-center justify-center"
              style={{ backgroundColor: activeStyle.textColor || '#000000' }}
              title="Text color"
            >
              <Type className="w-3 h-3" style={{ color: activeStyle.textColor ? '#fff' : '#000' }} />
            </div>
            <input
              type="color"
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              value={activeStyle.textColor || '#000000'}
              onChange={(e) => applyStyleToSelection({ textColor: e.target.value })}
            />
          </div>
          <div className="relative">
            <div
              className="w-6 h-6 rounded border border-[var(--border)] cursor-pointer flex items-center justify-center"
              style={{ backgroundColor: activeStyle.bgColor || '#ffffff' }}
              title="Background color"
            >
              <Paintbrush className="w-3 h-3" style={{ color: activeStyle.bgColor && activeStyle.bgColor !== '#ffffff' ? '#fff' : '#000' }} />
            </div>
            <input
              type="color"
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              value={activeStyle.bgColor || '#ffffff'}
              onChange={(e) => applyStyleToSelection({ bgColor: e.target.value })}
            />
          </div>
        </div>
        <ToolbarDivider />

        {/* Lock */}
        <ToolbarButton
          icon={store.activeCell && table?.cells[`${table.rows[store.activeCell.row]?.id}:${table.columns[store.activeCell.col]?.id}`]?.locked ? Lock : Unlock}
          label="Toggle lock"
          onClick={() => { if (store.activeCell) store.toggleCellLock(store.activeCell.row, store.activeCell.col); }}
        />

        {/* Copy/Paste style */}
        <ToolbarButton icon={Copy} label="Copy style (Ctrl+C)" onClick={store.copyStyle} />
        <ToolbarButton icon={ClipboardPaste} label="Paste style (Ctrl+V)" onClick={store.pasteStyle} />

        <div className="flex-1" />

        {/* Grid toggle */}
        <ToolbarButton
          icon={Grid3X3}
          label="Toggle grid"
          active={showGrid}
          onClick={() => store.setShowGrid(!showGrid)}
        />

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <ToolbarButton icon={ZoomOut} label="Zoom out" onClick={() => store.setZoom(zoom - 10)} />
          <span className="text-xs text-[var(--text-secondary)] w-10 text-center font-mono">{zoom}%</span>
          <ToolbarButton icon={ZoomIn} label="Zoom in" onClick={() => store.setZoom(zoom + 10)} />
        </div>
        <ToolbarDivider />

        {/* Dark mode */}
        <ToolbarButton
          icon={isDarkMode ? Sun : Moon}
          label={isDarkMode ? 'Light mode' : 'Dark mode'}
          onClick={() => store.setDarkMode(!isDarkMode)}
        />

        {/* Import */}
        <ToolbarButton icon={FileUp} label="Import" onClick={handleImport} />

        {/* Export */}
        <div className="relative">
          <button
            className="toolbar-btn flex items-center gap-1 !px-2 !w-auto"
            onClick={() => setShowExport(!showExport)}
            title="Export"
          >
            <FileDown className="w-4 h-4" />
            <ChevronDown className="w-3 h-3" />
          </button>
          {showExport && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowExport(false)} />
              <div className="absolute top-full right-0 mt-1 z-50 bg-[var(--surface-0)] border border-[var(--border)] rounded-lg shadow-float p-1 min-w-[140px]">
                {[
                  { format: 'pdf', label: 'PDF Document' },
                  { format: 'png', label: 'PNG Image' },
                  { format: 'jpeg', label: 'JPEG Image' },
                  { format: 'svg', label: 'SVG Vector' },
                  { format: 'excel', label: 'Excel (.xlsx)' },
                  { format: 'csv', label: 'CSV' },
                  { format: 'html', label: 'HTML' },
                  { format: 'markdown', label: 'Markdown' },
                  { format: 'json', label: 'JSON' },
                ].map(({ format, label }) => (
                  <button
                    key={format}
                    className="context-menu-item w-full"
                    onClick={() => handleExport(format)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* PDF Export Settings Dialog */}
      {showPDFSettings && table && (
        <PDFSettingsDialog
          tableName={table.name}
          onExport={handlePDFExport}
          onClose={() => setShowPDFSettings(false)}
        />
      )}
    </div>
  );
}
