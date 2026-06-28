import { useState } from 'react';
import { useTableStore } from '../store/tableStore';
import { importFromFile } from '../utils/import';
import { TEMPLATES } from '../utils/templates';
import { Plus, Table2, Sparkles, Upload, Trash2, Copy, MoreVertical, Clock, Grid3X3, Search } from 'lucide-react';
import type { TableData } from '../types';

function formatDate(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(diff / 86400000);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

function MiniTablePreview({ table }: { table: TableData }) {
  return (
    <div className="w-full h-full overflow-hidden" style={{ fontFamily: table.theme.fontFamily }}>
      <table className="w-full border-collapse" style={{ fontSize: 6 }}>
        <thead>
          <tr>
            {table.columns.slice(0, 5).map((col, i) => (
              <th key={i} className="px-0.5 py-0.5 text-left truncate"
                style={{ background: table.theme.headerBg, color: table.theme.headerText, borderBottom: `1px solid ${table.theme.borderColor}` }}>
                {col.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.slice(0, 4).map((row, ri) => (
            <tr key={ri}>
              {table.columns.slice(0, 5).map((col, ci) => {
                const cell = table.cells[`${row.id}:${col.id}`];
                return (
                  <td key={ci} className="px-0.5 py-0.5 truncate"
                    style={{ background: ri % 2 === 1 ? (table.theme.alternateRowBg || table.theme.cellBg) : table.theme.cellBg, color: table.theme.cellText, borderBottom: `1px solid ${table.theme.borderColor}` }}>
                    {cell?.content.text || ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Dashboard() {
  const { tables, addTable, removeTable, duplicateTable, setActiveTable, importTable } = useTableStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const filteredTables = tables.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.csv,.xlsx,.xls,.json,.md';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try { importTable(await importFromFile(file)); } catch (err: any) { alert('Import failed: ' + err.message); }
    };
    input.click();
  };

  const handleCreateFromTemplate = (template: typeof TEMPLATES[0], empty: boolean = false) => {
    const tableData = template.builder();
    if (empty) {
      // Clear all cell content but keep structure and theme
      const clearedCells: Record<string, any> = {};
      for (const [key, cell] of Object.entries(tableData.cells)) {
        clearedCells[key] = { ...cell, content: { type: 'text', text: '' } };
      }
      tableData.cells = clearedCells;
      // Clear header names to defaults
      tableData.columns = tableData.columns.map((col, i) => ({ ...col, name: `Column ${i + 1}` }));
    }
    importTable(tableData);
    setShowTemplates(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--surface-1)] overflow-auto">
      {/* Header */}
      <div className="bg-[var(--surface-0)] border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Table2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Table Designer Pro</h1>
              <p className="text-sm text-[var(--text-tertiary)]">Create and manage your tables</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => addTable()} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> New Table
            </button>
            <button onClick={() => setShowTemplates(!showTemplates)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--surface-2)] transition-colors">
              <Sparkles className="w-4 h-4 text-purple-500" /> Templates
            </button>
            <button onClick={handleImport} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--surface-2)] transition-colors">
              <Upload className="w-4 h-4 text-green-500" /> Import
            </button>
          </div>
        </div>
      </div>

      {/* Templates panel */}
      {showTemplates && (
        <div className="bg-[var(--surface-0)] border-b border-[var(--border)]">
          <div className="max-w-5xl mx-auto px-6 py-5">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" /> Templates
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {TEMPLATES.map((template) => {
                const previewData = template.builder();
                return (
                  <div key={template.name} className="group bg-[var(--surface-0)] rounded-xl border border-[var(--border)] hover:border-purple-400 hover:shadow-md transition-all overflow-hidden">
                    {/* Mini preview */}
                    <div className="h-24 p-2 overflow-hidden bg-[var(--surface-1)]">
                      <MiniTablePreview table={previewData} />
                    </div>
                    {/* Info + actions */}
                    <div className="p-3 border-t border-[var(--border)]">
                      <div className="font-medium text-sm text-[var(--text-primary)] mb-0.5">{template.name}</div>
                      <div className="text-[11px] text-[var(--text-tertiary)] mb-3">{template.desc}</div>
                      <div className="flex gap-2">
                        <button onClick={() => handleCreateFromTemplate(template, false)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-purple-500 text-white text-xs font-medium hover:bg-purple-600 transition-colors">
                          Use with Data
                        </button>
                        <button onClick={() => handleCreateFromTemplate(template, true)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-[var(--surface-2)] text-[var(--text-secondary)] text-xs font-medium hover:bg-[var(--surface-3)] transition-colors">
                          Use Empty
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Search + count */}
      {tables.length > 0 && (
        <div className="max-w-5xl mx-auto w-full px-6 pt-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
              <input type="text" className="input-field !pl-9 !py-2 text-sm" placeholder="Search tables..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <span className="text-xs text-[var(--text-tertiary)]">{filteredTables.length} table{filteredTables.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {/* Table cards */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-4">
        {filteredTables.length === 0 && tables.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center mb-4">
              <Grid3X3 className="w-10 h-10 text-[var(--text-tertiary)]" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">No tables yet</h2>
            <p className="text-sm text-[var(--text-tertiary)] mb-6">Create your first table to get started</p>
            <button onClick={() => addTable()} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors">
              <Plus className="w-4 h-4" /> Create Table
            </button>
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="text-center py-16 text-[var(--text-tertiary)]">No tables match "{searchQuery}"</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTables.map((table) => (
              <div key={table.id} className="group bg-[var(--surface-0)] rounded-xl border border-[var(--border)] hover:border-blue-400 hover:shadow-md transition-all cursor-pointer overflow-hidden"
                onClick={() => setActiveTable(table.id)}>
                <div className="h-28 p-3 overflow-hidden relative">
                  <MiniTablePreview table={table} />
                  <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[var(--surface-0)] to-transparent" />
                </div>
                <div className="px-4 py-3 border-t border-[var(--border)]">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">{table.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-[var(--text-tertiary)]">{table.rows.length}×{table.columns.length}</span>
                        <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{formatDate(table.updatedAt)}</span>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setContextMenu(contextMenu?.id === table.id ? null : { id: table.id, x: e.clientX, y: e.clientY }); }}
                      className="toolbar-btn !w-7 !h-7 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {contextMenu?.id === table.id && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setContextMenu(null); }} />
                    <div className="absolute right-2 bottom-12 z-50 bg-[var(--surface-0)] border border-[var(--border)] rounded-lg shadow-float p-1 min-w-[140px]" onClick={(e) => e.stopPropagation()}>
                      <button className="context-menu-item w-full" onClick={(e) => { e.stopPropagation(); duplicateTable(table.id); setContextMenu(null); }}><Copy className="w-3.5 h-3.5" /> Duplicate</button>
                      <div className="context-menu-separator" />
                      <button className="context-menu-item w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={(e) => { e.stopPropagation(); removeTable(table.id); setContextMenu(null); }}><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                    </div>
                  </>
                )}
              </div>
            ))}
            <button onClick={() => addTable()} className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-[var(--border)] hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all min-h-[180px]">
              <div className="w-10 h-10 rounded-lg bg-[var(--surface-2)] flex items-center justify-center"><Plus className="w-5 h-5 text-[var(--text-tertiary)]" /></div>
              <span className="text-sm text-[var(--text-tertiary)]">New Table</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
