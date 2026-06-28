import { useRef, useEffect, useState } from 'react';
import { useTableStore } from '../store/tableStore';
import type { Cell, CellContent } from '../types';

interface CellEditorProps {
  rowIndex: number;
  colIndex: number;
  cell: Cell | undefined;
}

export function CellEditor({ rowIndex, colIndex, cell }: CellEditorProps) {
  const store = useTableStore();
  const ref = useRef<HTMLDivElement>(null);
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
      // Place cursor at end
      const range = document.createRange();
      const sel = window.getSelection();
      if (ref.current.childNodes.length > 0) {
        range.selectNodeContents(ref.current);
        range.collapse(false);
      }
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, []);

  const handleBlur = () => {
    if (ref.current) {
      const html = ref.current.innerHTML;
      const text = ref.current.innerText;
      const hasFormatting = html !== text && html !== `<br>` && html !== '';

      if (hasFormatting) {
        store.updateCellContent(rowIndex, colIndex, { text, html, type: 'text' });
      } else {
        store.updateCellContent(rowIndex, colIndex, { text, type: 'text' });
      }
    }
    // Small delay to allow click events on type menu
    setTimeout(() => {
      store.setEditingCell(null);
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      store.setEditingCell(null);
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
    // Stop propagation for shortcuts that shouldn't reach the global handler
    if (e.key === 'Tab') {
      e.preventDefault();
      handleBlur();
      // Move to next/prev cell
      const table = store.getActiveTable();
      if (table) {
        let { row, col } = { row: rowIndex, col: colIndex };
        if (e.shiftKey) {
          col--;
          if (col < 0) { col = table.columns.length - 1; row = Math.max(0, row - 1); }
        } else {
          col++;
          if (col >= table.columns.length) { col = 0; row = Math.min(table.rows.length - 1, row + 1); }
        }
        store.setActiveCell({ row, col });
        store.setEditingCell({ row, col });
      }
    }
    e.stopPropagation();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    // Allow rich text paste
    const html = e.clipboardData.getData('text/html');
    if (html) {
      e.preventDefault();
      document.execCommand('insertHTML', false, html);
    }
  };

  const handleInput = () => {
    // Auto-grow height if needed
    if (ref.current) {
      const table = store.getActiveTable();
      if (table) {
        const row = table.rows[rowIndex];
        const contentHeight = ref.current.scrollHeight;
        if (contentHeight > row.height) {
          store.resizeRow(rowIndex, contentHeight + 8);
        }
      }
    }
  };

  const cellContent = cell?.content;
  const isRichText = cellContent?.type === 'text' && cellContent?.html;

  return (
    <div className="relative w-full h-full">
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className="w-full h-full px-2 py-1 outline-none text-sm overflow-hidden min-h-[24px]"
        style={{
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
        }}
        data-placeholder="Type here..."
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: cellContent?.html || cellContent?.text || '' }}
      />

      {/* Floating format mini-bar */}
      <div className="absolute -top-8 left-0 flex items-center gap-0.5 bg-[var(--surface-0)] border border-[var(--border)] rounded-md shadow-float px-1 py-0.5 z-50">
        <button
          className="toolbar-btn !w-6 !h-6 !text-xs"
          onMouseDown={(e) => { e.preventDefault(); document.execCommand('bold'); }}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          className="toolbar-btn !w-6 !h-6 !text-xs"
          onMouseDown={(e) => { e.preventDefault(); document.execCommand('italic'); }}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          className="toolbar-btn !w-6 !h-6 !text-xs"
          onMouseDown={(e) => { e.preventDefault(); document.execCommand('underline'); }}
          title="Underline"
        >
          <u>U</u>
        </button>
        <div className="w-px h-4 bg-[var(--border)] mx-0.5" />
        <button
          className="toolbar-btn !w-6 !h-6 !text-xs"
          onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertUnorderedList'); }}
          title="Bullet list"
        >
          •≡
        </button>
        <button
          className="toolbar-btn !w-6 !h-6 !text-xs"
          onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertOrderedList'); }}
          title="Numbered list"
        >
          1.
        </button>
      </div>
    </div>
  );
}
