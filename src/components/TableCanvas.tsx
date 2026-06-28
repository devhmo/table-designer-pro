import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useTableStore, getCoveredCellKeys } from '../store/tableStore';
import { CellEditor } from './CellEditor';
import { Plus, Crosshair } from 'lucide-react';

function SnowflakeIcon() {
  return (
    <svg className="w-2.5 h-2.5 ml-1 text-blue-400 inline" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 6.293V.5A.5.5 0 0 1 8 0zm-3.354 10.354a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 0 1 .708-.708L4.5 9.293V8a.5.5 0 0 1 1 0v1.293l1.354-1.354a.5.5 0 0 1 .708.708l-2.414 2.414-.146.146z"/>
    </svg>
  );
}

export function TableCanvas() {
  // Selective store subscriptions for performance
  const activeTableId = useTableStore(s => s.activeTableId);
  const tables = useTableStore(s => s.tables);
  const selection = useTableStore(s => s.selection);
  const activeCell = useTableStore(s => s.activeCell);
  const editingCell = useTableStore(s => s.editingCell);
  const editingColumnHeader = useTableStore(s => s.editingColumnHeader);
  const showGrid = useTableStore(s => s.showGrid);
  const zoom = useTableStore(s => s.zoom);

  // Store functions (stable references)
  const resizeColumn = useTableStore(s => s.resizeColumn);
  const resizeRow = useTableStore(s => s.resizeRow);
  const renameColumn = useTableStore(s => s.renameColumn);
  const selectAll = useTableStore(s => s.selectAll);
  const selectColumn = useTableStore(s => s.selectColumn);
  const selectRow = useTableStore(s => s.selectRow);
  const addColumn = useTableStore(s => s.addColumn);
  const addRow = useTableStore(s => s.addRow);
  const setActiveCell = useTableStore(s => s.setActiveCell);
  const setSelection = useTableStore(s => s.setSelection);
  const setEditingCell = useTableStore(s => s.setEditingCell);
  const setEditingColumnHeader = useTableStore(s => s.setEditingColumnHeader);
  const moveRow = useTableStore(s => s.moveRow);
  const moveColumn = useTableStore(s => s.moveColumn);
  const deleteRow = useTableStore(s => s.deleteRow);
  const deleteColumn = useTableStore(s => s.deleteColumn);
  const duplicateRow = useTableStore(s => s.duplicateRow);
  const duplicateColumn = useTableStore(s => s.duplicateColumn);
  const mergeCells = useTableStore(s => s.mergeCells);
  const splitCell = useTableStore(s => s.splitCell);
  const toggleCellLock = useTableStore(s => s.toggleCellLock);
  const copyStyle = useTableStore(s => s.copyStyle);
  const pasteStyle = useTableStore(s => s.pasteStyle);

  const canvasRef = useRef<HTMLDivElement>(null);
  const colRenameRef = useRef<HTMLInputElement>(null);

  const [resizingCol, setResizingCol] = useState<{ index: number; startX: number; startWidth: number } | null>(null);
  const [resizingRow, setResizingRow] = useState<{ index: number; startY: number; startHeight: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; row: number; col: number } | null>(null);
  const [selectStart, setSelectStart] = useState<{ row: number; col: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [isStylus, setIsStylus] = useState(false);
  const [lastTapCell, setLastTapCell] = useState<{ row: number; col: number; time: number } | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dragType, setDragType] = useState<'row' | 'col' | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  // Memoize table lookup
  const table = useMemo(() => tables.find(t => t.id === activeTableId) || null, [tables, activeTableId]);
  const coveredKeys = useMemo(() => table ? getCoveredCellKeys(table) : new Set<string>(), [table]);
  const theme = table?.theme;
  const scale = zoom / 100;

  if (!table || !theme) return null;

  // ── Stylus detection ──
  const lastPointerTypeRef = useRef<string>('touch');
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      lastPointerTypeRef.current = e.pointerType;
      if (e.pointerType === 'pen') setIsStylus(true);
    };
    const handlePointerUp = () => {
      // Reset after a short delay
      setTimeout(() => setIsStylus(false), 100);
    };
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  useEffect(() => {
    return () => { if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current); };
  }, []);

  // ── Resize ──
  const handleColResizeStart = (e: React.MouseEvent, index: number) => {
    e.preventDefault(); e.stopPropagation();
    setResizingCol({ index, startX: e.clientX, startWidth: table.columns[index].width });
  };
  const handleColResizeTouchStart = (e: React.TouchEvent, index: number) => {
    e.stopPropagation(); e.preventDefault();
    setResizingCol({ index, startX: e.touches[0].clientX, startWidth: table.columns[index].width });
  };
  const handleRowResizeStart = (e: React.MouseEvent, index: number) => {
    e.preventDefault(); e.stopPropagation();
    setResizingRow({ index, startY: e.clientY, startHeight: table.rows[index].height });
  };
  const handleRowResizeTouchStart = (e: React.TouchEvent, index: number) => {
    e.stopPropagation(); e.preventDefault();
    setResizingRow({ index, startY: e.touches[0].clientY, startHeight: table.rows[index].height });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingCol) resizeColumn(resizingCol.index, resizingCol.startWidth + (e.clientX - resizingCol.startX));
      if (resizingRow) resizeRow(resizingRow.index, resizingRow.startHeight + (e.clientY - resizingRow.startY));
    };
    const handleMouseUp = () => { setResizingCol(null); setResizingRow(null); };
    const handleTouchMove = (e: TouchEvent) => {
      if (resizingCol) { e.preventDefault(); resizeColumn(resizingCol.index, resizingCol.startWidth + (e.touches[0].clientX - resizingCol.startX)); }
      if (resizingRow) { e.preventDefault(); resizeRow(resizingRow.index, resizingRow.startHeight + (e.touches[0].clientY - resizingRow.startY)); }
    };
    const handleTouchEnd = () => { setResizingCol(null); setResizingRow(null); };
    if (resizingCol || resizingRow) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [resizingCol, resizingRow, resizeColumn, resizeRow]);

  // ── Column Rename ──
  useEffect(() => {
    if (editingColumnHeader !== null && colRenameRef.current) { colRenameRef.current.focus(); colRenameRef.current.select(); }
  }, [editingColumnHeader]);

  const commitColRename = (index: number, name: string) => {
    if (name.trim()) renameColumn(index, name.trim());
    setEditingColumnHeader(null);
  };

  // ── Drag & Drop ──
  const handleDragStart = (e: React.DragEvent, type: 'row' | 'col', index: number) => {
    setDragType(type); setDragFrom(index);
    e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', `${type}:${index}`);
    const ghost = document.createElement('div'); ghost.style.opacity = '0';
    document.body.appendChild(ghost); e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };
  const handleDragOver = (e: React.DragEvent, type: 'row' | 'col', index: number) => {
    e.preventDefault();
    if (dragType === type) { e.dataTransfer.dropEffect = 'move'; setDragOver(index); }
  };
  const handleDrop = (e: React.DragEvent, type: 'row' | 'col', index: number) => {
    e.preventDefault();
    if (dragType === type && dragFrom !== null && dragFrom !== index) {
      if (type === 'row') moveRow(dragFrom, index); else moveColumn(dragFrom, index);
    }
    setDragType(null); setDragFrom(null); setDragOver(null);
  };
  const handleDragEnd = () => { setDragType(null); setDragFrom(null); setDragOver(null); };

  // ── Cell activation ──
  const activateCell = useCallback((rowIdx: number, colIdx: number) => {
    setActiveCell({ row: rowIdx, col: colIdx });
    setSelection(null); setEditingCell(null); setEditingColumnHeader(null); setContextMenu(null);
  }, [setActiveCell, setSelection, setEditingCell, setEditingColumnHeader]);

  const startEditingCell = useCallback((rowIdx: number, colIdx: number) => {
    const cell = table.cells[`${table.rows[rowIdx].id}:${table.columns[colIdx].id}`];
    if (cell?.locked) return;
    setActiveCell({ row: rowIdx, col: colIdx });
    setEditingCell({ row: rowIdx, col: colIdx });
  }, [table, setActiveCell, setEditingCell]);

  // ── Mouse ──
  const handleCellMouseDown = useCallback((rowIdx: number, colIdx: number, e: React.MouseEvent) => {
    if (e.button === 2) return; e.stopPropagation();
    if (selectionMode) {
      if (e.shiftKey && activeCell) {
        setSelection({ startRow: activeCell.row, startCol: activeCell.col, endRow: rowIdx, endCol: colIdx });
      } else {
        setActiveCell({ row: rowIdx, col: colIdx });
        if (selection) { setSelection({ startRow: selection.startRow, startCol: selection.startCol, endRow: rowIdx, endCol: colIdx }); }
        else { setSelection({ startRow: rowIdx, startCol: colIdx, endRow: rowIdx, endCol: colIdx }); }
      }
      setSelectStart({ row: rowIdx, col: colIdx }); setIsSelecting(true); return;
    }
    if (e.shiftKey && activeCell) {
      setSelection({ startRow: activeCell.row, startCol: activeCell.col, endRow: rowIdx, endCol: colIdx });
    } else if (activeCell?.row === rowIdx && activeCell?.col === colIdx && !editingCell) {
      startEditingCell(rowIdx, colIdx);
    } else {
      activateCell(rowIdx, colIdx); setSelectStart({ row: rowIdx, col: colIdx }); setIsSelecting(true);
    }
  }, [selectionMode, activeCell, selection, editingCell, setActiveCell, setSelection, activateCell, startEditingCell]);

  const handleCellMouseEnter = useCallback((rowIdx: number, colIdx: number) => {
    if (isSelecting && selectStart) setSelection({ startRow: selectStart.row, startCol: selectStart.col, endRow: rowIdx, endCol: colIdx });
  }, [isSelecting, selectStart, setSelection]);

  useEffect(() => {
    const handleMouseUp = () => { setIsSelecting(false); setSelectStart(null); };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // ── Touch ──
  const handleCellTouchStart = useCallback((rowIdx: number, colIdx: number, e: React.TouchEvent) => {
    e.stopPropagation();

    // Detect if this is from a stylus/pen
    const touch = e.touches[0];
    const isPenTouch = (touch as any).touchType === 'stylus' ||
      (touch as any).pointerType === 'pen' ||
      lastPointerTypeRef.current === 'pen' ||
      isStylus;

    // STYLUS BEHAVIOR: tap = edit, drag = select
    if (isPenTouch) {
      activateCell(rowIdx, colIdx);
      // Start editing immediately on stylus tap
      const cell = table.cells[`${table.rows[rowIdx].id}:${table.columns[colIdx].id}`];
      if (!cell?.locked) {
        setEditingCell({ row: rowIdx, col: colIdx });
      }
      setSelectStart({ row: rowIdx, col: colIdx });
      setIsSelecting(true);
      return;
    }

    // FINGER BEHAVIOR: tap = select, double-tap = edit
    if (selectionMode) {
      if (selection) setSelection({ startRow: selection.startRow, startCol: selection.startCol, endRow: rowIdx, endCol: colIdx });
      else { setActiveCell({ row: rowIdx, col: colIdx }); setSelection({ startRow: rowIdx, startCol: colIdx, endRow: rowIdx, endCol: colIdx }); }
      setSelectStart({ row: rowIdx, col: colIdx }); setIsSelecting(true); return;
    }
    const now = Date.now();
    if (lastTapCell && lastTapCell.row === rowIdx && lastTapCell.col === colIdx && now - lastTapCell.time < 350) {
      startEditingCell(rowIdx, colIdx); setLastTapCell(null);
      if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; } return;
    }
    setLastTapCell({ row: rowIdx, col: colIdx, time: now }); activateCell(rowIdx, colIdx); setSelectStart({ row: rowIdx, col: colIdx });
    longPressTimerRef.current = setTimeout(() => {
      setContextMenu({ x: touch.clientX, y: touch.clientY, row: rowIdx, col: colIdx });
    }, 600);
  }, [selectionMode, selection, lastTapCell, isStylus, table, setActiveCell, setSelection, setEditingCell, activateCell, startEditingCell]);

  const handleCellTouchMove = useCallback((rowIdx: number, colIdx: number) => {
    if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; }
    if (selectStart) setSelection({ startRow: selectStart.row, startCol: selectStart.col, endRow: rowIdx, endCol: colIdx });
  }, [selectStart, setSelection]);

  const handleCellTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null; }
    setIsSelecting(false); setSelectStart(null);
  }, []);

  const handleCellDoubleClick = useCallback((rowIdx: number, colIdx: number) => { startEditingCell(rowIdx, colIdx); }, [startEditingCell]);

  const handleContextMenu = useCallback((e: React.MouseEvent, rowIdx: number, colIdx: number) => {
    e.preventDefault(); e.stopPropagation();
    setActiveCell({ row: rowIdx, col: colIdx });
    setContextMenu({ x: e.clientX, y: e.clientY, row: rowIdx, col: colIdx });
  }, [setActiveCell]);

  const isSelected = useCallback((rowIdx: number, colIdx: number) => {
    if (!selection) return false;
    return rowIdx >= Math.min(selection.startRow, selection.endRow) && rowIdx <= Math.max(selection.startRow, selection.endRow) &&
           colIdx >= Math.min(selection.startCol, selection.endCol) && colIdx <= Math.max(selection.startCol, selection.endCol);
  }, [selection]);

  const isActive = useCallback((rowIdx: number, colIdx: number) => {
    return activeCell?.row === rowIdx && activeCell?.col === colIdx;
  }, [activeCell]);

  // ── Styles ──
  const getCellStyle = useCallback((cell: any): React.CSSProperties => {
    if (!cell) return {};
    const s = cell.style; const style: React.CSSProperties = {};
    if (s.gradient) style.background = s.gradient; else if (s.bgColor) style.backgroundColor = s.bgColor;
    if (s.fontFamily) style.fontFamily = s.fontFamily; if (s.fontSize) style.fontSize = s.fontSize;
    if (s.fontWeight) style.fontWeight = s.fontWeight; if (s.italic) style.fontStyle = 'italic';
    if (s.underline && s.strikethrough) style.textDecoration = 'underline line-through';
    else if (s.underline) style.textDecoration = 'underline'; else if (s.strikethrough) style.textDecoration = 'line-through';
    if (s.textColor) style.color = s.textColor; if (s.textAlign) style.textAlign = s.textAlign;
    if (s.verticalAlign) style.verticalAlign = s.verticalAlign; if (s.padding !== undefined) style.padding = s.padding;
    if (s.opacity !== undefined) style.opacity = s.opacity; if (s.lineHeight) style.lineHeight = s.lineHeight;
    if (s.letterSpacing) style.letterSpacing = s.letterSpacing; if (s.textTransform) style.textTransform = s.textTransform;
    if (s.borderRadius !== undefined) style.borderRadius = s.borderRadius; if (s.boxShadow) style.boxShadow = s.boxShadow;
    const bs = (side: any) => side ? `${side.width}px ${side.style} ${side.color}` : undefined;
    if (s.borderTop) style.borderTop = bs(s.borderTop); if (s.borderBottom) style.borderBottom = bs(s.borderBottom);
    if (s.borderLeft) style.borderLeft = bs(s.borderLeft); if (s.borderRight) style.borderRight = bs(s.borderRight);
    return style;
  }, []);

  const renderCellContent = useCallback((cell: any) => {
    if (!cell) return null; const { content } = cell;
    switch (content.type) {
      case 'text': return content.html ? <span dangerouslySetInnerHTML={{ __html: content.html }} /> : <span>{content.text}</span>;
      case 'image': return content.src ? <img src={content.src} alt="" className="max-w-full max-h-full object-contain" /> : null;
      case 'link': return content.href ? <a href={content.href} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{content.text || content.href}</a> : <span>{content.text}</span>;
      case 'badge': return <span className="badge" style={{ backgroundColor: content.color || '#3b82f6', color: '#fff' }}>{content.label || content.text}</span>;
      case 'tag': return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: (content.color || '#3b82f6') + '20', color: content.color || '#3b82f6' }}>{content.label || content.text}</span>;
      case 'checkbox': return <label className="inline-flex items-center gap-1.5 cursor-pointer select-none"><input type="checkbox" checked={content.checked || false} readOnly className="w-4 h-4 rounded accent-blue-500" />{content.text && <span className="text-sm">{content.text}</span>}</label>;
      case 'progress': return <div className="w-full bg-gray-200 rounded-full h-2"><div className="h-2 rounded-full transition-all" style={{ width: `${content.value || 0}%`, backgroundColor: content.color || '#3b82f6' }} /></div>;
      case 'rating': return <span className="text-yellow-400 text-sm tracking-wide">{'★'.repeat(content.value || 0)}{'☆'.repeat(5 - (content.value || 0))}</span>;
      default: return <span>{content.text}</span>;
    }
  }, []);

  // ── Context Menu ──
  const handleContextAction = useCallback((action: string) => {
    if (!contextMenu) return; const { row, col } = contextMenu;
    switch (action) {
      case 'insertRowAbove': addRow(row - 1); break; case 'insertRowBelow': addRow(row); break;
      case 'insertColLeft': addColumn(col - 1); break; case 'insertColRight': addColumn(col); break;
      case 'deleteRow': deleteRow(row); break; case 'deleteCol': deleteColumn(col); break;
      case 'duplicateRow': duplicateRow(row); break; case 'duplicateCol': duplicateColumn(col); break;
      case 'merge': if (selection) mergeCells(selection); break;
      case 'split': splitCell(row, col); break; case 'lock': toggleCellLock(row, col); break;
      case 'copyStyle': copyStyle(); break; case 'pasteStyle': pasteStyle(); break;
    }
    setContextMenu(null);
  }, [contextMenu, selection, addRow, addColumn, deleteRow, deleteColumn, duplicateRow, duplicateColumn, mergeCells, splitCell, toggleCellLock, copyStyle, pasteStyle]);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('click', close); window.addEventListener('touchstart', close);
    return () => { window.removeEventListener('click', close); window.removeEventListener('touchstart', close); };
  }, [contextMenu]);

  const getContextMenuPos = () => {
    if (!contextMenu) return { left: 0, top: 0 };
    let x = contextMenu.x, y = contextMenu.y;
    if (x + 200 > window.innerWidth) x = window.innerWidth - 208;
    if (y + 400 > window.innerHeight) y = window.innerHeight - 408;
    if (x < 8) x = 8; if (y < 8) y = 8;
    return { left: x, top: y };
  };

  // Memoize theme border values
  const bw = theme.borderWidth;
  const bs = theme.borderStyle;
  const bc = theme.borderColor;
  const cellBorder: React.CSSProperties = useMemo(() => ({
    borderBottom: `${bw}px ${bs} ${bc}`,
    borderRight: `${bw}px ${bs} ${bc}`,
  }), [bw, bs, bc]);
  const headerBorder: React.CSSProperties = useMemo(() => ({
    borderBottom: `${bw + 1}px ${bs} ${bc}`,
    borderRight: `${bw}px ${bs} ${bc}`,
  }), [bw, bs, bc]);

  return (
    <div ref={canvasRef} className="table-canvas bg-[var(--surface-1)] relative"
      onClick={(e) => { if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('table-canvas')) { setContextMenu(null); setEditingColumnHeader(null); } }}>

      {/* Selection Mode Toggle — also serves as stylus indicator */}
      <button className={`fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all
        ${isStylus ? 'bg-purple-500 text-white scale-110' : selectionMode ? 'bg-blue-500 text-white scale-110' : 'bg-[var(--surface-0)] text-[var(--text-secondary)] border border-[var(--border)]'}`}
        onClick={() => { setSelectionMode(!selectionMode); if (selectionMode) setSelection(null); }}
        title={isStylus ? 'Stylus detected — tap to edit, drag to select' : selectionMode ? 'Exit selection mode' : 'Enter selection mode'}>
        <Crosshair className="w-5 h-5" />
      </button>
      {isStylus && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-40 bg-purple-500 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg animate-fadeIn">
          Stylus Mode — Tap to edit, drag to select
        </div>
      )}
      {!isStylus && selectionMode && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-40 bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg animate-fadeIn">
          Selection Mode — Tap cells to select
        </div>
      )}

      <div className="inline-block min-w-full p-4" style={{ zoom: `${scale}` }}>

        {/* ══ CORNER + COLUMN HEADERS ══ */}
        <div className="flex">
          <div className="bg-[var(--surface-2)]" style={{ width: 32, minWidth: 32, height: 28, ...headerBorder }}
            onClick={(e) => { e.stopPropagation(); selectAll(); }}>
            <div className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-[var(--surface-3)]">
              <div className="w-2 h-2 rounded-sm bg-[var(--text-tertiary)]" />
            </div>
          </div>
          {table.columns.map((col, ci) => {
            if (col.hidden) return null;
            return (
              <div key={col.id}
                className={`text-xs font-medium text-left relative group select-none ${col.frozen ? 'bg-blue-50 dark:bg-blue-900/20' : ''} ${dragOver === ci && dragType === 'col' ? 'ring-2 ring-blue-400 ring-inset' : ''}`}
                style={{ width: col.width, minWidth: col.minWidth, height: 28, ...headerBorder, background: theme.headerBg, color: theme.headerText, fontWeight: theme.headerFontWeight as any }}
                draggable onDragStart={(e) => handleDragStart(e, 'col', ci)} onDragOver={(e) => handleDragOver(e, 'col', ci)} onDrop={(e) => handleDrop(e, 'col', ci)} onDragEnd={handleDragEnd}>
                <div className="px-2 h-full flex items-center cursor-pointer hover:opacity-80" onClick={() => selectColumn(ci)} onDoubleClick={(e) => { e.stopPropagation(); setEditingColumnHeader(ci); }}>
                  {editingColumnHeader === ci ? (
                    <input ref={colRenameRef} className="input-field !py-0 !px-1 text-xs w-full" defaultValue={col.name}
                      onBlur={(e) => commitColRename(ci, e.currentTarget.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') commitColRename(ci, e.currentTarget.value); if (e.key === 'Escape') setEditingColumnHeader(null); e.stopPropagation(); }}
                      onClick={(e) => e.stopPropagation()} />
                  ) : <><span>{col.name}</span>{col.frozen && <SnowflakeIcon />}</>}
                </div>
                <div className={`col-resize-handle absolute right-0 top-0 bottom-0 z-30 ${resizingCol?.index === ci ? 'active' : ''}`}
                  style={{ width: 16, cursor: 'col-resize' }} onMouseDown={(e) => handleColResizeStart(e, ci)} onTouchStart={(e) => handleColResizeTouchStart(e, ci)} />
              </div>
            );
          })}
          <div className="bg-[var(--surface-2)]" style={{ width: 32, minWidth: 32, height: 28, ...headerBorder }}>
            <button className="toolbar-btn !w-6 !h-6 mx-auto flex items-center justify-center" onClick={() => addColumn()} title="Add column">
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* ══ ROW HEADERS + DATA TABLE ══ */}
        <div className="flex">
          {/* Row headers */}
          <div className="flex flex-col" style={{ width: 32 }}>
            {table.rows.map((row, ri) => (
              <div key={row.id}
                className={`text-xs text-center cursor-grab select-none active:cursor-grabbing relative ${row.frozen ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-[var(--surface-2)]'} ${row.hidden ? 'hidden' : ''} ${dragOver === ri && dragType === 'row' ? 'ring-2 ring-blue-400 ring-inset' : ''}`}
                style={{ width: 32, minWidth: 32, height: row.height, ...cellBorder }}
                draggable onDragStart={(e) => handleDragStart(e, 'row', ri)} onDragOver={(e) => handleDragOver(e, 'row', ri)} onDrop={(e) => handleDrop(e, 'row', ri)} onDragEnd={handleDragEnd} onClick={() => selectRow(ri)}>
                <span className="text-[var(--text-tertiary)]">{ri + 1}</span>
                {row.frozen && <SnowflakeIcon />}
                <div className={`row-resize-handle absolute bottom-0 left-0 right-0 z-30 ${resizingRow?.index === ri ? 'active' : ''}`}
                  style={{ height: 16, cursor: 'row-resize' }} onMouseDown={(e) => handleRowResizeStart(e, ri)} onTouchStart={(e) => handleRowResizeTouchStart(e, ri)} />
              </div>
            ))}
            <div className="bg-[var(--surface-2)]" style={{ width: 32, height: 32, ...cellBorder }}>
              <button className="toolbar-btn !w-6 !h-6 mx-auto flex items-center justify-center" onClick={() => addRow()} title="Add row">
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Data table */}
          <div style={{ borderRadius: theme.borderRadius, overflow: 'hidden', flex: 1, border: `${bw}px ${bs} ${bc}` }}>
            <table className="border-collapse w-full" style={{ fontFamily: theme.fontFamily, fontSize: theme.fontSize }}>
              <tbody>
                {table.rows.map((row, ri) => (
                  <tr key={row.id} className={row.hidden ? 'hidden' : ''}>
                    {table.columns.map((col, colIdx) => {
                      if (col.hidden) return null;
                      const cellKey = `${row.id}:${col.id}`;
                      if (coveredKeys.has(cellKey)) return null;
                      const cell = table.cells[cellKey];
                      const cellStyle = getCellStyle(cell);
                      const isEditing = editingCell?.row === ri && editingCell?.col === colIdx;
                      const selected = isSelected(ri, colIdx);
                      const active = isActive(ri, colIdx);
                      let cellBg: string | undefined;
                      if (cell?.style.gradient || cell?.style.bgColor) cellBg = undefined;
                      else cellBg = ri % 2 === 1 ? theme.alternateRowBg : theme.cellBg;

                      return (
                        <td key={col.id}
                          className={`relative ${showGrid ? '' : 'border-transparent'} ${selected && !active ? 'cell-selected' : ''} ${active ? 'cell-active' : ''} ${cell?.locked ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}
                          style={{ height: row.height, width: col.width, minWidth: col.minWidth, color: theme.cellText, ...(cellBg ? { backgroundColor: cellBg } : {}), ...cellBorder, ...cellStyle }}
                          colSpan={cell?.colspan && cell.colspan > 1 ? cell.colspan : undefined}
                          rowSpan={cell?.rowspan && cell.rowspan > 1 ? cell.rowspan : undefined}
                          onMouseDown={(e) => handleCellMouseDown(ri, colIdx, e)} onMouseEnter={() => handleCellMouseEnter(ri, colIdx)}
                          onDoubleClick={() => handleCellDoubleClick(ri, colIdx)} onContextMenu={(e) => handleContextMenu(e, ri, colIdx)}
                          onTouchStart={(e) => handleCellTouchStart(ri, colIdx, e)} onTouchMove={() => handleCellTouchMove(ri, colIdx)} onTouchEnd={handleCellTouchEnd}>
                          {isEditing ? (
                            <CellEditor rowIndex={ri} colIndex={colIdx} cell={cell} />
                          ) : (
                            <div className="px-2 py-1 h-full overflow-hidden text-sm flex items-center"
                              style={{ justifyContent: cellStyle.textAlign === 'center' ? 'center' : cellStyle.textAlign === 'right' ? 'flex-end' : 'flex-start', alignItems: cellStyle.verticalAlign === 'top' ? 'flex-start' : cellStyle.verticalAlign === 'bottom' ? 'flex-end' : 'center' }}>
                              {renderCellContent(cell)}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div className="fixed z-50 bg-[var(--surface-0)] border border-[var(--border)] rounded-lg shadow-float p-1 min-w-[180px]" style={getContextMenuPos()} onClick={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
          <button className="context-menu-item w-full" onClick={() => handleContextAction('insertRowAbove')}>Insert Row Above</button>
          <button className="context-menu-item w-full" onClick={() => handleContextAction('insertRowBelow')}>Insert Row Below</button>
          <button className="context-menu-item w-full" onClick={() => handleContextAction('insertColLeft')}>Insert Column Left</button>
          <button className="context-menu-item w-full" onClick={() => handleContextAction('insertColRight')}>Insert Column Right</button>
          <div className="context-menu-separator" />
          <button className="context-menu-item w-full" onClick={() => handleContextAction('duplicateRow')}>Duplicate Row</button>
          <button className="context-menu-item w-full" onClick={() => handleContextAction('duplicateCol')}>Duplicate Column</button>
          <div className="context-menu-separator" />
          <button className="context-menu-item w-full" onClick={() => handleContextAction('merge')}>Merge Cells</button>
          <button className="context-menu-item w-full" onClick={() => handleContextAction('split')}>Split Cell</button>
          <div className="context-menu-separator" />
          <button className="context-menu-item w-full" onClick={() => handleContextAction('copyStyle')}>Copy Style</button>
          <button className="context-menu-item w-full" onClick={() => handleContextAction('pasteStyle')}>Paste Style</button>
          <button className="context-menu-item w-full" onClick={() => handleContextAction('lock')}>Toggle Lock</button>
          <div className="context-menu-separator" />
          <button className="context-menu-item w-full text-red-500" onClick={() => handleContextAction('deleteRow')}>Delete Row</button>
          <button className="context-menu-item w-full text-red-500" onClick={() => handleContextAction('deleteCol')}>Delete Column</button>
        </div>
      )}
    </div>
  );
}
