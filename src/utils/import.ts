import { nanoid } from 'nanoid';
import type { TableData, Cell, ColumnDef, RowDef } from '../types';

const DEFAULT_THEME = {
  id: 'default',
  name: 'Default',
  headerBg: '#1e293b',
  headerText: '#ffffff',
  cellBg: '#ffffff',
  cellText: '#1e293b',
  borderColor: '#e2e8f0',
  borderWidth: 1,
  borderStyle: 'solid' as const,
  alternateRowBg: '#f8fafc',
  fontFamily: 'Inter',
  fontSize: 14,
  headerFontWeight: '600',
  borderRadius: 8,
  stickyHeader: true,
  stickyFirstCol: false,
};

function makeCell(text: string): Cell {
  return {
    id: nanoid(10),
    content: { type: 'text', text },
    style: {},
    colspan: 1,
    rowspan: 1,
    locked: false,
    hidden: false,
  };
}

function parseCSVText(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { current.push(field); field = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        current.push(field); field = '';
        if (current.some(c => c.trim())) rows.push(current);
        current = [];
      }
      else { field += ch; }
    }
  }
  current.push(field);
  if (current.some(c => c.trim())) rows.push(current);
  return rows;
}

function buildTable(headers: string[], dataRows: string[][], name: string): TableData {
  const columns: ColumnDef[] = headers.map((h, i) => ({
    id: nanoid(10), width: 150, minWidth: 40, hidden: false, frozen: false,
    name: h || `Col ${i + 1}`,
  }));
  const rows: RowDef[] = [];
  const cells: Record<string, Cell> = {};
  for (const rowData of dataRows) {
    const row: RowDef = { id: nanoid(10), height: 40, minHeight: 24, hidden: false, frozen: false };
    rows.push(row);
    columns.forEach((col, ci) => {
      cells[`${row.id}:${col.id}`] = makeCell(rowData[ci] || '');
    });
  }
  return {
    id: nanoid(10), name,
    columns, rows, cells, theme: { ...DEFAULT_THEME },
    createdAt: Date.now(), updatedAt: Date.now(),
  };
}

export async function importCSV(file: File): Promise<TableData> {
  const text = await file.text();
  const data = parseCSVText(text);
  if (data.length === 0) throw new Error('Empty file');
  return buildTable(data[0], data.slice(1), file.name.replace(/\.[^.]+$/, ''));
}

export async function importExcel(file: File): Promise<TableData> {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' });
  if (json.length === 0) throw new Error('Empty sheet');
  const headers = json[0].map(h => String(h || ''));
  const dataRows = json.slice(1).map(row => row.map(cell => String(cell)));
  return buildTable(headers, dataRows, file.name.replace(/\.[^.]+$/, ''));
}

export async function importJSON(file: File): Promise<TableData> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  // If it's already a full TableData object
  if (parsed.columns && parsed.rows && parsed.cells) {
    return { ...parsed, id: nanoid(10), createdAt: Date.now(), updatedAt: Date.now() };
  }
  // If it's an array of objects
  if (Array.isArray(parsed) && parsed.length > 0) {
    const keys = Object.keys(parsed[0]);
    const dataRows = parsed.map(item => keys.map(k => String(item[k] || '')));
    return buildTable(keys, dataRows, file.name.replace(/\.[^.]+$/, ''));
  }
  throw new Error('Unsupported JSON format');
}

export function importMarkdown(text: string, name: string): TableData {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) throw new Error('Invalid markdown table');
  const parseRow = (line: string) =>
    line.split('|').map(c => c.trim()).filter((c, i, arr) => i > 0 && i < arr.length - 1 || (i === 0 && c) || (i === arr.length - 1 && c));
  const headers = parseRow(lines[0]);
  const dataRows: string[][] = [];
  for (let i = 2; i < lines.length; i++) {
    if (lines[i].match(/^\|[\s-:|]+\|$/)) continue;
    dataRows.push(parseRow(lines[i]));
  }
  return buildTable(headers, dataRows, name);
}
