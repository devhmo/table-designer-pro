import { useEffect } from 'react';
import { useTableStore } from '../store/tableStore';

export function useKeyboard() {
  const store = useTableStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isEditing = document.querySelector('[contenteditable="true"]:focus') ||
        document.querySelector('input:focus, textarea:focus, select:focus');

      // Global shortcuts (work even when editing)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        store.undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        store.redo();
        return;
      }

      if (isEditing) return;

      // Selection shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        store.selectAll();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        store.copyStyle();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        store.pasteStyle();
        return;
      }

      // Arrow key navigation
      const { activeCell } = store;
      if (activeCell && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const table = store.getActiveTable();
        if (!table) return;
        let { row, col } = activeCell;
        if (e.key === 'ArrowUp') row = Math.max(0, row - 1);
        if (e.key === 'ArrowDown') row = Math.min(table.rows.length - 1, row + 1);
        if (e.key === 'ArrowLeft') col = Math.max(0, col - 1);
        if (e.key === 'ArrowRight') col = Math.min(table.columns.length - 1, col + 1);
        store.setActiveCell({ row, col });
        store.setSelection(null);
      }

      // Tab to move right
      if (e.key === 'Tab' && activeCell) {
        e.preventDefault();
        const table = store.getActiveTable();
        if (!table) return;
        let { row, col } = activeCell;
        if (e.shiftKey) {
          col--;
          if (col < 0) { col = table.columns.length - 1; row = Math.max(0, row - 1); }
        } else {
          col++;
          if (col >= table.columns.length) { col = 0; row = Math.min(table.rows.length - 1, row + 1); }
        }
        store.setActiveCell({ row, col });
        store.setSelection(null);
        store.setEditingCell(null);
      }

      // Enter to start editing
      if (e.key === 'Enter' && activeCell && !store.editingCell) {
        e.preventDefault();
        store.setEditingCell(activeCell);
      }

      // Escape to stop editing
      if (e.key === 'Escape') {
        store.setEditingCell(null);
      }

      // Delete to clear cell content
      if ((e.key === 'Delete' || e.key === 'Backspace') && activeCell && !store.editingCell) {
        e.preventDefault();
        const sel = store.selection;
        if (sel) {
          const r1 = Math.min(sel.startRow, sel.endRow);
          const r2 = Math.max(sel.startRow, sel.endRow);
          const c1 = Math.min(sel.startCol, sel.endCol);
          const c2 = Math.max(sel.startCol, sel.endCol);
          for (let r = r1; r <= r2; r++) {
            for (let c = c1; c <= c2; c++) {
              store.updateCellContent(r, c, { text: '', html: '' });
            }
          }
        } else {
          store.updateCellContent(activeCell.row, activeCell.col, { text: '', html: '' });
        }
      }

      // Bold
      if ((e.ctrlKey || e.metaKey) && e.key === 'b' && store.editingCell) {
        e.preventDefault();
        document.execCommand('bold');
      }

      // Italic
      if ((e.ctrlKey || e.metaKey) && e.key === 'i' && store.editingCell) {
        e.preventDefault();
        document.execCommand('italic');
      }

      // Underline
      if ((e.ctrlKey || e.metaKey) && e.key === 'u' && store.editingCell) {
        e.preventDefault();
        document.execCommand('underline');
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [store]);
}
