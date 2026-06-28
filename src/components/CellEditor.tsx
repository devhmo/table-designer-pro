import { useRef, useEffect, useCallback } from 'react';
import { useTableStore } from '../store/tableStore';
import type { Cell } from '../types';

interface CellEditorProps {
  rowIndex: number;
  colIndex: number;
  cell: Cell | undefined;
}

export function CellEditor({ rowIndex, colIndex, cell }: CellEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const committedRef = useRef(false);
  const focusAttemptsRef = useRef(0);

  const updateCellContent = useTableStore(s => s.updateCellContent);
  const setEditingCell = useTableStore(s => s.setEditingCell);
  const setActiveCell = useTableStore(s => s.setActiveCell);
  const getActiveTable = useTableStore(s => s.getActiveTable);
  const resizeRow = useTableStore(s => s.resizeRow);

  const commitContent = useCallback(() => {
    if (committedRef.current || !ref.current) return;
    committedRef.current = true;

    const html = ref.current.innerHTML;
    const text = ref.current.innerText;
    const hasFormatting = ref.current.querySelector('b, i, u, strong, em, ol, ul, li, a, br');

    if (hasFormatting || (html && html !== text && html !== '<br>' && html !== '')) {
      updateCellContent(rowIndex, colIndex, { text, html, type: 'text' });
    } else {
      updateCellContent(rowIndex, colIndex, { text: text || '', type: 'text' });
    }
  }, [rowIndex, colIndex, updateCellContent]);

  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Check if the related target is within our editor (e.g., clicking format buttons)
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget && ref.current?.contains(relatedTarget)) {
      return; // Don't commit if focus moved within the editor
    }

    // Check if a format button was clicked
    const activeEl = document.activeElement;
    if (activeEl && ref.current?.contains(activeEl)) {
      return;
    }

    commitContent();
    setTimeout(() => {
      setEditingCell(null);
    }, 200);
  }, [commitContent, setEditingCell]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      committedRef.current = true;
      setEditingCell(null);
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      commitContent();
      setEditingCell(null);
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      commitContent();
      const table = getActiveTable();
      if (table) {
        let { row, col } = { row: rowIndex, col: colIndex };
        if (e.shiftKey) {
          col--;
          if (col < 0) { col = table.columns.length - 1; row = Math.max(0, row - 1); }
        } else {
          col++;
          if (col >= table.columns.length) { col = 0; row = Math.min(table.rows.length - 1, row + 1); }
        }
        setActiveCell({ row, col });
        setEditingCell({ row, col });
      }
      return;
    }
    e.stopPropagation();
  }, [commitContent, setEditingCell, getActiveTable, setActiveCell, rowIndex, colIndex]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text/plain');
    if (text) {
      e.preventDefault();
      document.execCommand('insertText', false, text);
    }
  }, []);

  const handleInput = useCallback(() => {
    if (ref.current) {
      const table = getActiveTable();
      if (table) {
        const row = table.rows[rowIndex];
        const contentHeight = ref.current.scrollHeight;
        if (contentHeight > row.height + 4) {
          resizeRow(rowIndex, contentHeight + 8);
        }
      }
    }
  }, [getActiveTable, rowIndex, resizeRow]);

  // Focus strategy: aggressive retries for mobile
  useEffect(() => {
    committedRef.current = false;
    focusAttemptsRef.current = 0;

    const tryFocus = () => {
      if (!ref.current) return false;

      try {
        ref.current.focus({ preventScroll: true });

        // Check if focus actually worked
        if (document.activeElement === ref.current) {
          // Place cursor at end
          const range = document.createRange();
          const sel = window.getSelection();
          if (ref.current.childNodes.length > 0) {
            range.selectNodeContents(ref.current);
            range.collapse(false);
          } else {
            range.setStart(ref.current, 0);
            range.collapse(true);
          }
          sel?.removeAllRanges();
          sel?.addRange(range);
          return true;
        }
      } catch {
        // Ignore errors
      }
      return false;
    };

    // Strategy 1: Immediate
    if (tryFocus()) return;

    // Strategy 2: requestAnimationFrame
    const raf = requestAnimationFrame(() => {
      if (tryFocus()) return;

      // Strategy 3: Short delay
      const t1 = setTimeout(() => {
        if (tryFocus()) return;

        // Strategy 4: Longer delay (for stubborn mobile browsers)
        const t2 = setTimeout(() => {
          tryFocus();
        }, 100);

        return () => clearTimeout(t2);
      }, 30);

      return () => clearTimeout(t1);
    });

    return () => cancelAnimationFrame(raf);
  }, []);

  const initialContent = cell?.content.html || cell?.content.text || '';

  return (
    <div
      className="relative w-full h-full"
      // Prevent touch events from bubbling up to the cell
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className="w-full h-full px-2 py-1 outline-none text-sm overflow-hidden min-h-[24px]"
        style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
        data-placeholder="Type here..."
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onInput={handleInput}
        // Prevent the td's touch handlers from firing
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        tabIndex={0}
        role="textbox"
        aria-label="Cell editor"
        dangerouslySetInnerHTML={{ __html: initialContent }}
      />

      {/* Floating format mini-bar */}
      <div
        className="absolute -top-8 left-0 flex items-center gap-0.5 bg-[var(--surface-0)] border border-[var(--border)] rounded-md shadow-float px-1 py-0.5 z-50"
        onMouseDown={(e) => e.preventDefault()}
        onTouchStart={(e) => e.preventDefault()}
      >
        <button
          className="toolbar-btn !w-6 !h-6 !text-xs"
          onMouseDown={(e) => { e.preventDefault(); ref.current?.focus(); document.execCommand('bold'); }}
          onTouchStart={(e) => { e.preventDefault(); ref.current?.focus(); document.execCommand('bold'); }}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          className="toolbar-btn !w-6 !h-6 !text-xs"
          onMouseDown={(e) => { e.preventDefault(); ref.current?.focus(); document.execCommand('italic'); }}
          onTouchStart={(e) => { e.preventDefault(); ref.current?.focus(); document.execCommand('italic'); }}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          className="toolbar-btn !w-6 !h-6 !text-xs"
          onMouseDown={(e) => { e.preventDefault(); ref.current?.focus(); document.execCommand('underline'); }}
          onTouchStart={(e) => { e.preventDefault(); ref.current?.focus(); document.execCommand('underline'); }}
          title="Underline"
        >
          <u>U</u>
        </button>
      </div>
    </div>
  );
}
