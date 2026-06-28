import { useTableStore } from '../store/tableStore';
import { THEME_PRESETS } from '../utils/themes';
import { Plus, Table2, Sparkles, Upload, FileSpreadsheet } from 'lucide-react';


const TEMPLATES = [
  { name: 'Project Tracker', desc: 'Track tasks, status, and deadlines', icon: '📋', rows: 6, cols: 6 },
  { name: 'Budget Planner', desc: 'Monthly income and expenses', icon: '💰', rows: 8, cols: 5 },
  { name: 'Team Directory', desc: 'Contact info and roles', icon: '👥', rows: 5, cols: 6 },
  { name: 'Inventory List', desc: 'Products, quantities, and prices', icon: '📦', rows: 8, cols: 7 },
  { name: 'Grade Book', desc: 'Student grades and assignments', icon: '📚', rows: 10, cols: 8 },
  { name: 'Comparison Chart', desc: 'Feature comparison matrix', icon: '⚖️', rows: 6, cols: 5 },
];

export function WelcomeScreen() {
  const { addTable, importTable } = useTableStore();

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls,.json,.md';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        let table: TableData;
        if (file.name.endsWith('.csv')) {
          const { importCSV } = await import('../utils/import');
          table = await importCSV(file);
        } else if (file.name.match(/\.xlsx?$/)) {
          alert('Excel import requires xlsx library. Please use CSV format.');
          return;
        } else if (file.name.endsWith('.json')) {
          const { importJSON } = await import('../utils/import');
          table = await importJSON(file);
        } else if (file.name.endsWith('.md')) {
          const { importMarkdown } = await import('../utils/import');
          const text = await file.text();
          table = importMarkdown(text, file.name.replace(/\.md$/, ''));
        } else {
          alert('Unsupported file format');
          return;
        }
        importTable(table);
      } catch (err: any) {
        alert('Import failed: ' + err.message);
      }
    };
    input.click();
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-4">
            <Table2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
            Table Designer Pro
          </h1>
          <p className="text-[var(--text-secondary)] text-lg">
            Create beautiful, customizable tables for any purpose
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          <button
            onClick={() => addTable()}
            className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-[var(--text-primary)] text-sm">Blank Table</div>
              <div className="text-xs text-[var(--text-tertiary)]">Start from scratch</div>
            </div>
          </button>

          <button
            onClick={handleImport}
            className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-[var(--text-primary)] text-sm">Import Data</div>
              <div className="text-xs text-[var(--text-tertiary)]">CSV, Excel, JSON, Markdown</div>
            </div>
          </button>
        </div>

        <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Quick Start Templates
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.name}
              onClick={() => {
                const store = useTableStore.getState();
                store.addTable(t.name);
                // Add extra rows/cols if needed
                const table = store.getActiveTable();
                if (table) {
                  const extraRows = t.rows - table.rows.length;
                  const extraCols = t.cols - table.columns.length;
                  for (let i = 0; i < extraRows; i++) store.addRow();
                  for (let i = 0; i < extraCols; i++) store.addColumn();
                }
              }}
              className="p-3 rounded-lg border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-all text-left group"
            >
              <div className="text-2xl mb-1">{t.icon}</div>
              <div className="font-medium text-[var(--text-primary)] text-sm">{t.name}</div>
              <div className="text-xs text-[var(--text-tertiary)] mt-0.5">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
