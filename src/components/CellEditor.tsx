import { useRef, useEffect, useCallback, useState } from 'react';
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

  const handleBlur = useCallback(() => {
    commitContent();
    setTimeout(() => {
      setEditingCell(null);
    }, 150);
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

  useEffect(() => {
    committedRef.current = false;
    // Multiple focus strategies for mobile + desktop compatibility
    const focusEditor = () => {
      if (!ref.current) return;
      ref.current.focus({ preventScroll: true });

      // For mobile: ensure the element is focusable
      if ('ontouchstart' in window) {
        ref.current.setAttribute('contenteditable', 'true');
        // Trigger a touch to activate keyboard on iOS/Android
        const touchEvent = new TouchEvent('touchstart', { bubbles: true });
        ref.current.dispatchEvent(touchEvent);
      }

      // Place cursor at end
      try {
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
      } catch {
        // Selection API may fail on some mobile browsers
      }
    };

    // Try immediately and via rAF for different browsers
    focusEditor();
    requestAnimationFrame(focusEditor);
    // Extra fallback for stubborn mobile browsers
    const timer = setTimeout(focusEditor, 50);
    return () => clearTimeout(timer);
  }, []);

  const initialContent = cell?.content.html || cell?.content.text || '';

  return (
    <div className="relative w-full h-full">
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
        // Touch: prevent scroll while editing
        onTouchStart={(e) => e.stopPropagation()}
        // Ensure mobile keyboard activates
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
          onMouseDown={(e) => { e.preventDefault(); document.execCommand('bold'); }}
          onTouchStart={(e) => { e.preventDefault(); document.execCommand('bold'); }}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          className="toolbar-btn !w-6 !h-6 !text-xs"
          onMouseDown={(e) => { e.preventDefault(); document.execCommand('italic'); }}
          onTouchStart={(e) => { e.preventDefault(); document.execCommand('italic'); }}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          className="toolbar-btn !w-6 !h-6 !text-xs"
          onMouseDown={(e) => { e.preventDefault(); document.execCommand('underline'); }}
          onTouchStart={(e) => { e.preventDefault(); document.execCommand('underline'); }}
          title="Underline"
        >
          <u>U</u>
        </button>
      </div>
    </div>
  );
}
