import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { produce } from 'immer';
import type { TableData, Cell, ColumnDef, RowDef, Selection, HistoryEntry, TableTheme, CellStyle, CellContent, StoreSnapshot } from '../types';
import { DEFAULT_THEME } from '../types';

function createDefaultCell(): Cell {
  return {
    id: nanoid(10),
    content: { type: 'text', text: '' },
    style: {},
    colspan: 1,
    rowspan: 1,
    locked: false,
    hidden: false,
  };
}

function createDefaultColumn(index: number): ColumnDef {
  return {
    id: nanoid(10),
    width: 150,
    minWidth: 40,
    hidden: false,
    frozen: false,
    name: String.fromCharCode(65 + (index % 26)) + (index >= 26 ? Math.floor(index / 26) : ''),
  };
}

function createDefaultRow(height?: number): RowDef {
  return {
    id: nanoid(10),
    height: height || 40,
    minHeight: 24,
    hidden: false,
    frozen: false,
  };
}

export function createTable(name: string, numCols = 5, numRows = 5): TableData {
  const columns = Array.from({ length: numCols }, (_, i) => createDefaultColumn(i));
  const rows = Array.from({ length: numRows }, () => createDefaultRow());
  const cells: Record<string, Cell> = {};
  for (const row of rows) {
    for (const col of columns) {
      cells[`${row.id}:${col.id}`] = createDefaultCell();
    }
  }
  return {
    id: nanoid(10),
    name,
    columns,
    rows,
    cells,
    theme: { ...DEFAULT_THEME },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/** Build a set of keys that are "covered" by merged cells (should not render) */
export function getCoveredCellKeys(table: TableData): Set<string> {
  const covered = new Set<string>();
  for (let ri = 0; ri < table.rows.length; ri++) {
    for (let ci = 0; ci < table.columns.length; ci++) {
      const cell = table.cells[`${table.rows[ri].id}:${table.columns[ci].id}`];
      if (!cell) continue;
      if (cell.colspan > 1 || cell.rowspan > 1) {
        for (let dr = 0; dr < cell.rowspan; dr++) {
          for (let dc = 0; dc < cell.colspan; dc++) {
            if (dr === 0 && dc === 0) continue;
            const r = ri + dr;
            const c = ci + dc;
            if (r < table.rows.length && c < table.columns.length) {
              covered.add(`${table.rows[r].id}:${table.columns[c].id}`);
            }
          }
        }
      }
    }
  }
  return covered;
}

// ── History Helpers ──
const MAX_HISTORY = 100;

function takeSnapshot(s: TableStore): StoreSnapshot {
  return { tables: JSON.parse(JSON.stringify(s.tables)), activeTableId: s.activeTableId };
}

function restoreSnapshot(s: TableStore, snap: StoreSnapshot) {
  s.tables = snap.tables;
  s.activeTableId = snap.activeTableId;
  // Clear UI state that may reference invalid indices
  s.selection = null;
  s.activeCell = null;
  s.editingCell = null;
  s.editingColumnHeader = null;
}

/** Push a history entry AFTER performing an action. Saves the current (post-action) state. */
function pushHistory(s: TableStore, description: string) {
  // If this is the very first action, save the initial state first (for undo)
  if (s.historyIndex === -1 && s.history.length === 0) {
    s.history.push({ description: 'Initial state', timestamp: Date.now(), snapshot: { tables: [], activeTableId: null } });
    s.historyIndex = 0;
  }
  // Truncate any redo entries
  s.history = s.history.slice(0, s.historyIndex + 1);
  // Save current (post-action) state
  s.history.push({ description, timestamp: Date.now(), snapshot: takeSnapshot(s) });
  if (s.history.length > MAX_HISTORY) {
    s.history.shift();
  }
  s.historyIndex = s.history.length - 1;
}

interface TableStore {
  tables: TableData[];
  activeTableId: string | null;
  selection: Selection | null;
  activeCell: { row: number; col: number } | null;
  editingCell: { row: number; col: number } | null;
  editingColumnHeader: number | null;
  history: HistoryEntry[];
  historyIndex: number;
  clipboard: CellStyle | null;
  isDarkMode: boolean;
  sidebarOpen: boolean;
  showGrid: boolean;
  zoom: number;

  // Table management
  addTable: (name?: string) => void;
  removeTable: (id: string) => void;
  duplicateTable: (id: string) => void;
  renameTable: (id: string, name: string) => void;
  setActiveTable: (id: string) => void;
  getActiveTable: () => TableData | null;

  // Row/Column operations
  addRow: (afterIndex?: number) => void;
  addColumn: (afterIndex?: number) => void;
  deleteRow: (index: number) => void;
  deleteColumn: (index: number) => void;
  duplicateRow: (index: number) => void;
  duplicateColumn: (index: number) => void;
  moveRow: (from: number, to: number) => void;
  moveColumn: (from: number, to: number) => void;
  renameColumn: (index: number, name: string) => void;
  resizeColumn: (index: number, width: number) => void;
  resizeRow: (index: number, height: number) => void;
  toggleRowHidden: (index: number) => void;
  toggleColumnHidden: (index: number) => void;
  toggleRowFrozen: (index: number) => void;
  toggleColumnFrozen: (index: number) => void;

  // Cell operations
  updateCellContent: (rowIndex: number, colIndex: number, content: Partial<CellContent>) => void;
  updateCellStyle: (rowIndex: number, colIndex: number, style: Partial<CellStyle>) => void;
  updateSelectionStyle: (style: Partial<CellStyle>) => void;
  mergeCells: (selection: Selection) => void;
  splitCell: (rowIndex: number, colIndex: number) => void;
  toggleCellLock: (rowIndex: number, colIndex: number) => void;
  updateCellColspan: (rowIndex: number, colIndex: number, colspan: number) => void;
  updateCellRowspan: (rowIndex: number, colIndex: number, rowspan: number) => void;

  // Selection
  setSelection: (selection: Selection | null) => void;
  setActiveCell: (cell: { row: number; col: number } | null) => void;
  setEditingCell: (cell: { row: number; col: number } | null) => void;
  setEditingColumnHeader: (index: number | null) => void;
  selectAll: () => void;
  selectRow: (index: number) => void;
  selectColumn: (index: number) => void;

  // History
  undo: () => void;
  redo: () => void;

  // Theme
  updateTheme: (theme: Partial<TableTheme>) => void;
  setDarkMode: (on: boolean) => void;
  setShowGrid: (on: boolean) => void;
  setZoom: (z: number) => void;
  setSidebarOpen: (on: boolean) => void;

  // Clipboard
  copyStyle: () => void;
  pasteStyle: () => void;

  // Import
  importTable: (table: TableData) => void;
}

export const useTableStore = create<TableStore>()(
  persist(
    (set, get) => ({
      tables: [],
      activeTableId: null,
      selection: null,
      activeCell: null,
      editingCell: null,
      editingColumnHeader: null,
      history: [],
      historyIndex: -1,
      clipboard: null,
      isDarkMode: false,
      sidebarOpen: true,
      showGrid: true,
      zoom: 100,

      addTable: (name?: string) => {
        set(produce((s: TableStore) => {
          const t = createTable(name || `Table ${s.tables.length + 1}`);
          s.tables.push(t);
          s.activeTableId = t.id;
          pushHistory(s, 'Add table');
        }));
      },

      removeTable: (id: string) => {
        set(produce((s: TableStore) => {
          s.tables = s.tables.filter(t => t.id !== id);
          if (s.activeTableId === id) {
            s.activeTableId = s.tables[0]?.id || null;
          }
          pushHistory(s, 'Remove table');
        }));
      },

      duplicateTable: (id: string) => {
        set(produce((s: TableStore) => {
          const table = s.tables.find(t => t.id === id);
          if (!table) return;
          const dup = JSON.parse(JSON.stringify(table));
          dup.id = nanoid(10);
          dup.name = table.name + ' (Copy)';
          dup.createdAt = Date.now();
          dup.updatedAt = Date.now();
          s.tables.push(dup);
          s.activeTableId = dup.id;
          pushHistory(s, 'Duplicate table');
        }));
      },

      renameTable: (id: string, name: string) => {
        set(produce((s: TableStore) => {
          const t = s.tables.find(t => t.id === id);
          if (t) {
            t.name = name;
            t.updatedAt = Date.now();
          }
        }));
      },

      setActiveTable: (id: string) => {
        set({ activeTableId: id, selection: null, activeCell: null, editingCell: null, editingColumnHeader: null });
      },

      getActiveTable: () => {
        const s = get();
        return s.tables.find(t => t.id === s.activeTableId) || null;
      },

      addRow: (afterIndex?: number) => {
        set(produce((s: TableStore) => {
          const table = s.tables.find(t => t.id === s.activeTableId);
          if (!table) return;
          const newRow = createDefaultRow();
          const insertAt = afterIndex !== undefined ? afterIndex + 1 : table.rows.length;
          table.rows.splice(insertAt, 0, newRow);
          for (const col of table.columns) {
            table.cells[`${newRow.id}:${col.id}`] = createDefaultCell();
          }
          table.updatedAt = Date.now();
          pushHistory(s, 'Add row');
        }));
      },

      addColumn: (afterIndex?: number) => {
        set(produce((s: TableStore) => {
          const table = s.tables.find(t => t.id === s.activeTableId);
          if (!table) return;
          const newCol = createDefaultColumn(table.columns.length);
          const insertAt = afterIndex !== undefined ? afterIndex + 1 : table.columns.length;
          table.columns.splice(insertAt, 0, newCol);
          for (const row of table.rows) {
            table.cells[`${row.id}:${newCol.id}`] = createDefaultCell();
          }
          table.updatedAt = Date.now();
          pushHistory(s, 'Add column');
        }));
      },

      deleteRow: (index: number) => {
        set(produce((s: TableStore) => {
          const table = s.tables.find(t => t.id === s.activeTableId);
          if (!table || table.rows.length <= 1) return;
          const row = table.rows[index];
          for (const col of table.columns) {
            delete table.cells[`${row.id}:${col.id}`];
          }
          table.rows.splice(index, 1);
          table.updatedAt = Date.now();
          pushHistory(s, 'Delete row');
        }));
      },

      deleteColumn: (index: number) => {
        set(produce((s: TableStore) => {
          const table = s.tables.find(t => t.id === s.activeTableId);
          if (!table || table.columns.length <= 1) return;
          const col = table.columns[index];
          for (const row of table.rows) {
            delete table.cells[`${row.id}:${col.id}`];
          }
          table.columns.splice(index, 1);
          table.updatedAt = Date.now();
          pushHistory(s, 'Delete column');
        }));
      },

      duplicateRow: (index: number) => {
        set(produce((s: TableStore) => {
          const table = s.tables.find(t => t.id === s.activeTableId);
          if (!table) return;
          const srcRow = table.rows[index];
          const newRow = createDefaultRow(srcRow.height);
          table.rows.splice(index + 1, 0, newRow);
          for (const col of table.columns) {
            const srcCell = table.cells[`${srcRow.id}:${col.id}`];
            const newCell = createDefaultCell();
            if (srcCell) {
              newCell.content = JSON.parse(JSON.stringify(srcCell.content));
              newCell.style = JSON.parse(JSON.stringify(srcCell.style));
            }
            table.cells[`${newRow.id}:${col.id}`] = newCell;
          }
          table.updatedAt = Date.now();
          pushHistory(s, 'Duplicate row');
        }));
      },

      duplicateColumn: (index: number) => {
        set(produce((s: TableStore) => {
          const table = s.tables.find(t => t.id === s.activeTableId);
          if (!table) return;
          const srcCol = table.columns[index];
          const newCol = createDefaultColumn(table.columns.length);
          table.columns.splice(index + 1, 0, newCol);
          for (const row of table.rows) {
            const srcCell = table.cells[`${row.id}:${srcCol.id}`];
            const newCell = createDefaultCell();
            if (srcCell) {
              newCell.content = JSON.parse(JSON.stringify(srcCell.content));
              newCell.style = JSON.parse(JSON.stringify(srcCell.style));
            }
            table.cells[`${row.id}:${newCol.id}`] = newCell;
          }
          table.updatedAt = Date.now();
          pushHistory(s, 'Duplicate column');
        }));
      },

      moveRow: (from: number, to: number) => {
        if (from === to) return;
        set(produce((s: TableStore) => {
          const table = s.tables.find(t => t.id === s.activeTableId);
          if (!table) return;
          const [row] = table.rows.splice(from, 1);
          table.rows.splice(to, 0, row);
          table.updatedAt = Date.now();
          pushHistory(s, 'Move row');
        }));
      },

      moveColumn: (from: number, to: number) => {
        if (from === to) return;
        set(produce((s: TableStore) => {
          const table = s.tables.find(t => t.id === s.activeTableId);
          if (!table) return;
          const [col] = table.columns.splice(from, 1);
          table.columns.splice(to, 0, col);
          table.updatedAt = Date.now();
          pushHistory(s, 'Move column');
        }));
      },

      renameColumn: (index: number, name: string) => {
        set(produce((s: TableStore) => {
          const table = s.tables.find(t => t.id === s.activeTableId);
          if (!table) return;
          table.columns[index].name = name;
          table.updatedAt = Date.now();
        }));
      },

      resizeColumn: (index: number, width: number) => {
        set(produce((s: TableStore) => {
          const table = s.tables.find(t => t.id === s.activeTableId);
          if (!table) return;
          table.columns[index].width = Math.max(table.columns[index].minWidth, width);
          table.updatedAt = Date.now();
        }));
      },

      resizeRow: (index: number, height: number) => {
        set(produce((s: TableStore) => {
          const table = s.tables.find(t => t.id === s.activeTableId);
          if (!table) return;
          table.rows[index].height = Math.max(table.rows[index].minHeight, height);
          table.updatedAt = Date.now();
        }));
      },

      toggleRowHidden: (index: number) => {
        set(produce((s: TableStore) => {
          const table = s.tables.find(t => t.id === s.activeTableId);
          if (!table) return;
          table.rows[index].hidden = !table.rows[index].hidden;
        }));
      },

      toggleColumnHidden: (index: number) => {
        set(produce((s: TableStore) => {
          const table = s.tables.find(t => t.id === s.activeTableId);
          if (!table) return;
          table.columns[index].hidden = !table.columns[index].hidden;
        }));
      },

      toggleRowFrozen: (index: number) => {
        set(produce((s: TableStore) => {
          const table = s.tables.find(t => t.id === s.activeTableId);
          if (!table) return;
          table.rows[index].frozen = !table.rows[index].frozen;
        }));
      },

      toggleColumnFrozen: (index: number) => {
        set(produce((s: TableStore) => {
          const table = s.tables.find(t => t.id === s.activeTableId);
          if (!table) return;
          table.columns[index].frozen = !table.columns[index].frozen;
        }));
      },

      updateCellContent: (rowIndex: number, colIndex: number, content: Partial<CellContent>) => {
        set(produce((s: TableStore) => {
          const table = s.tables.find(t => t.id === s.activeTableId);
          if (!table) return;
          const row = table.rows[rowIndex];
          const col = table.columns[colIndex];
          if (!row || !col) return;
          const key = `${row.id}:${col.id}`;
          if (!table.cells[key]) table.cells[key] = createDefaultCell();
          Object.assign(table.cells[key].content, content);
          table.updatedAt = Date.now();
        }));
      },

      updateCellStyle: (rowIndex: number, colIndex: number, style: Partial<CellStyle>) => {
        set(produce((s: TableStore) => {
          const table = s.tables.find(t => t.id === s.activeTableId);
          if (!table) return;
          const row = table.rows[rowIndex];
          const col = table.columns[colIndex];
          if (!row || !col) return;
          const key = `${row.id}:${col.id}`;
          if (!table.cells[key]) table.cells[key] = createDefaultCell();
          Object.assign(table.cells[key].style, style);
          table.updatedAt = Date.now();
        }));
      },

      updateSelectionStyle: (style: Partial<CellStyle>) => {
        const sel = get().selection;
        if (!sel) return;
        set(produce((s: TableStore) => {
          const table = s.tables.find(t => t.id === s.activeTableId);
          if (!table) return;
          const r1 = Math.min(sel.startRow, sel.endRow);
          const r2 = Math.max(sel.startRow, sel.endRow);
          const c1 = Math.min(sel.startCol, sel.endCol);
          const c2 = Math.max(sel.startCol, sel.endCol);
          for (let r = r1; r <= r2; r++) {
            for (let c = c1; c <= c2; c++) {
              const row = table.rows[r];
              const col = table.columns[c];
              if (!row || !col) continue;
              const key = `${row.id}:${col.id}`;
              if (!table.cells[key]) table.cells[key] = createDefaultCell();
              Object.assign(table.cells[key].style, style);
            }
          }
          table.updatedAt = Date.now();
        }));
      },

      mergeCells: (selection: Selection) => {
        set(produce((s: TableStore) => {
          const table = s.tables.find(t => t.id === s.activeTableId);
          if (!table) return;
          const r1 = Math.min(selection.startRow, selection.endRow);
          const r2 = Math.max(selection.startRow, selection.endRow);
          const c1 = Math.min(selection.startCol, selection.endCol);
          const c2 = Math.max(selection.startCol, selection.endCol);
          const mainRow = table.rows[r1];
          const mainCol = table.columns[c1];
          const mainKey = `${mainRow.id}:${mainCol.id}`;
          if (!table.cells[mainKey]) table.cells[mainKey] = createDefaultCell();
          table.cells[mainKey].colspan = (c2 - c1) + 1;
          table.cells[mainKey].rowspan = (r2 - r1) + 1;
          for (let r = r1; r <= r2; r++) {
            for (let c = c1; c <= c2; c++) {
              if (r === r1 && c === c1) continue;
              const key = `${table.rows[r].id}:${table.columns[c].id}`;
              if (table.cells[key]) {
                table.cells[key].colspan = 0;
                table.cells[key].rowspan = 0;
              }
            }
          }
          table.updatedAt = Date.now();
          pushHistory(s, 'Merge cells');
        }));
      },

      splitCell: (rowIndex: number, colIndex: number) => {
        set(produce((s: TableStore) => {
          const table = s.tables.find(t => t.id === s.activeTableId);
          if (!table) return;
          const row = table.rows[rowIndex];
          const col = table.columns[colIndex];
          const key = `${row.id}:${col.id}`;
          const cell = table.cells[key];
          if (!cell) return;
          const cs = cell.colspan;
          const rs = cell.rowspan;
          cell.colspan = 1;
          cell.rowspan = 1;
          for (let dr = 0; dr < rs; dr++) {
            for (let dc = 0; dc < cs; dc++) {
              if (dr === 0 && dc === 0) continue;
              const r = rowIndex + dr;
              const c = colIndex + dc;
              if (r < table.rows.length && c < table.columns.length) {
                const coveredKey = `${table.rows[r].id}:${table.columns[c].id}`;
                if (table.cells[coveredKey]) {
                  table.cells[coveredKey].colspan = 1;
                  table.cells[coveredKey].rowspan = 1;
                  table.cells[coveredKey].content = { type: 'text', text: '' };
                  table.cells[coveredKey].style = {};
                }
              }
            }
          }
          table.updatedAt = Date.now();
          pushHistory(s, 'Split cell');
        }));
      },

      toggleCellLock: (rowIndex: number, colIndex: number) => {
        set(produce((s: TableStore) => {
          const table = s.tables.find(t => t.id === s.activeTableId);
          if (!table) return;
          const row = table.rows[rowIndex];
          const col = table.columns[colIndex];
          const key = `${row.id}:${col.id}`;
          if (table.cells[key]) {
            table.cells[key].locked = !table.cells[key].locked;
          }
        }));
      },

      updateCellColspan: (rowIndex: number, colIndex: number, colspan: number) => {
        set(produce((s: TableStore) => {
          const table = s.tables.find(t => t.id === s.activeTableId);
          if (!table) return;
          const row = table.rows[rowIndex];
          const col = table.columns[colIndex];
          if (!row || !col) return;
          const key = `${row.id}:${col.id}`;
          if (!table.cells[key]) table.cells[key] = createDefaultCell();
          const cell = table.cells[key];
          const newColspan = Math.max(1, Math.min(colspan, table.columns.length - colIndex));
          cell.colspan = newColspan;
          for (let dc = 0; dc < newColspan; dc++) {
            for (let dr = 0; dr < cell.rowspan; dr++) {
              if (dc === 0 && dr === 0) continue;
              const r = rowIndex + dr;
              const c = colIndex + dc;
              if (r < table.rows.length && c < table.columns.length) {
                const coveredKey = `${table.rows[r].id}:${table.columns[c].id}`;
                if (table.cells[coveredKey]) {
                  table.cells[coveredKey].colspan = 0;
                  table.cells[coveredKey].rowspan = 0;
                }
              }
            }
          }
          table.updatedAt = Date.now();
          pushHistory(s, 'Update colspan');
        }));
      },

      updateCellRowspan: (rowIndex: number, colIndex: number, rowspan: number) => {
        set(produce((s: TableStore) => {
          const table = s.tables.find(t => t.id === s.activeTableId);
          if (!table) return;
          const row = table.rows[rowIndex];
          const col = table.columns[colIndex];
          if (!row || !col) return;
          const key = `${row.id}:${col.id}`;
          if (!table.cells[key]) table.cells[key] = createDefaultCell();
          const cell = table.cells[key];
          const newRowspan = Math.max(1, Math.min(rowspan, table.rows.length - rowIndex));
          cell.rowspan = newRowspan;
          for (let dr = 0; dr < newRowspan; dr++) {
            for (let dc = 0; dc < cell.colspan; dc++) {
              if (dr === 0 && dc === 0) continue;
              const r = rowIndex + dr;
              const c = colIndex + dc;
              if (r < table.rows.length && c < table.columns.length) {
                const coveredKey = `${table.rows[r].id}:${table.columns[c].id}`;
                if (table.cells[coveredKey]) {
                  table.cells[coveredKey].colspan = 0;
                  table.cells[coveredKey].rowspan = 0;
                }
              }
            }
          }
          table.updatedAt = Date.now();
          pushHistory(s, 'Update rowspan');
        }));
      },

      setSelection: (selection) => set({ selection }),
      setActiveCell: (cell) => set({ activeCell: cell }),
      setEditingCell: (cell) => set({ editingCell: cell }),
      setEditingColumnHeader: (index) => set({ editingColumnHeader: index }),

      selectAll: () => {
        const table = get().getActiveTable();
        if (!table) return;
        set({
          selection: {
            startRow: 0, startCol: 0,
            endRow: table.rows.length - 1,
            endCol: table.columns.length - 1,
          }
        });
      },

      selectRow: (index: number) => {
        const table = get().getActiveTable();
        if (!table) return;
        set({
          selection: {
            startRow: index, startCol: 0,
            endRow: index, endCol: table.columns.length - 1,
          }
        });
      },

      selectColumn: (index: number) => {
        const table = get().getActiveTable();
        if (!table) return;
        set({
          selection: {
            startRow: 0, startCol: index,
            endRow: table.rows.length - 1, endCol: index,
          }
        });
      },

      undo: () => {
        const { historyIndex, history } = get();
        if (historyIndex <= 0) return;
        const targetIndex = historyIndex - 1;
        const entry = history[targetIndex];
        if (!entry) return;
        set(produce((s: TableStore) => {
          restoreSnapshot(s, entry.snapshot);
          s.historyIndex = targetIndex;
        }));
      },

      redo: () => {
        const { historyIndex, history } = get();
        if (historyIndex >= history.length - 1) return;
        const targetIndex = historyIndex + 1;
        const entry = history[targetIndex];
        if (!entry) return;
        set(produce((s: TableStore) => {
          restoreSnapshot(s, entry.snapshot);
          s.historyIndex = targetIndex;
        }));
      },

      updateTheme: (theme: Partial<TableTheme>) => {
        set(produce((s: TableStore) => {
          const table = s.tables.find(t => t.id === s.activeTableId);
          if (!table) return;
          Object.assign(table.theme, theme);
          table.updatedAt = Date.now();
        }));
      },

      setDarkMode: (on: boolean) => set({ isDarkMode: on }),
      setShowGrid: (on: boolean) => set({ showGrid: on }),
      setZoom: (z: number) => set({ zoom: Math.max(50, Math.min(200, z)) }),
      setSidebarOpen: (on: boolean) => set({ sidebarOpen: on }),

      copyStyle: () => {
        const { activeCell, activeTableId, tables } = get();
        if (!activeCell) return;
        const table = tables.find(t => t.id === activeTableId);
        if (!table) return;
        const row = table.rows[activeCell.row];
        const col = table.columns[activeCell.col];
        const cell = table.cells[`${row.id}:${col.id}`];
        if (cell) {
          set({ clipboard: JSON.parse(JSON.stringify(cell.style)) });
        }
      },

      pasteStyle: () => {
        const { clipboard, selection, activeCell } = get();
        if (!clipboard) return;
        if (selection) {
          set(produce((s: TableStore) => {
            const table = s.tables.find(t => t.id === s.activeTableId);
            if (!table) return;
            const r1 = Math.min(selection.startRow, selection.endRow);
            const r2 = Math.max(selection.startRow, selection.endRow);
            const c1 = Math.min(selection.startCol, selection.endCol);
            const c2 = Math.max(selection.startCol, selection.endCol);
            for (let r = r1; r <= r2; r++) {
              for (let c = c1; c <= c2; c++) {
                const row = table.rows[r];
                const col = table.columns[c];
                if (!row || !col) continue;
                const key = `${row.id}:${col.id}`;
                if (!table.cells[key]) table.cells[key] = createDefaultCell();
                Object.assign(table.cells[key].style, clipboard);
              }
            }
            table.updatedAt = Date.now();
            pushHistory(s, 'Paste style');
          }));
        } else if (activeCell) {
          set(produce((s: TableStore) => {
            const t = s.tables.find(t => t.id === s.activeTableId);
            if (!t) return;
            const row = t.rows[activeCell.row];
            const col = t.columns[activeCell.col];
            const key = `${row.id}:${col.id}`;
            if (t.cells[key]) {
              Object.assign(t.cells[key].style, clipboard);
            }
            t.updatedAt = Date.now();
            pushHistory(s, 'Paste style');
          }));
        }
      },

      importTable: (table: TableData) => {
        set(produce((s: TableStore) => {
          s.tables.push(table);
          s.activeTableId = table.id;
          pushHistory(s, 'Import table');
        }));
      },
    }),
    {
      name: 'table-designer-storage',
      partialize: (state) => ({
        tables: state.tables,
        activeTableId: state.activeTableId,
        isDarkMode: state.isDarkMode,
        sidebarOpen: state.sidebarOpen,
        showGrid: state.showGrid,
        zoom: state.zoom,
      }),
    }
  )
);
