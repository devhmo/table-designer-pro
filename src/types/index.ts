export interface CellStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  textColor?: string;
  bgColor?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  borderTop?: BorderSide;
  borderBottom?: BorderSide;
  borderLeft?: BorderSide;
  borderRight?: BorderSide;
  borderRadius?: number;
  padding?: number;
  opacity?: number;
  lineHeight?: number;
  letterSpacing?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  boxShadow?: string;
  gradient?: string;
}

export interface BorderSide {
  width: number;
  style: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
  color: string;
}

export type CellContentType = 'text' | 'number' | 'image' | 'link' | 'badge' | 'tag' | 'icon' | 'checkbox' | 'progress' | 'rating';

export interface CellContent {
  type: CellContentType;
  text?: string;
  html?: string;
  src?: string;
  href?: string;
  label?: string;
  value?: number;
  checked?: boolean;
  icon?: string;
  color?: string;
}

export interface Cell {
  id: string;
  content: CellContent;
  style: CellStyle;
  colspan: number;
  rowspan: number;
  locked: boolean;
  hidden: boolean;
}

export interface ColumnDef {
  id: string;
  width: number;
  minWidth: number;
  hidden: boolean;
  frozen: boolean;
  name: string;
}

export interface RowDef {
  id: string;
  height: number;
  minHeight: number;
  hidden: boolean;
  frozen: boolean;
}

export interface TableTheme {
  id: string;
  name: string;
  headerBg: string;
  headerText: string;
  cellBg: string;
  cellText: string;
  borderColor: string;
  borderWidth: number;
  borderStyle: 'solid' | 'dashed' | 'dotted' | 'double';
  alternateRowBg?: string;
  alternateColBg?: string;
  fontFamily: string;
  fontSize: number;
  headerFontWeight: string;
  borderRadius: number;
  stickyHeader: boolean;
  stickyFirstCol: boolean;
}

export interface TableData {
  id: string;
  name: string;
  columns: ColumnDef[];
  rows: RowDef[];
  cells: Record<string, Cell>; // key: "rowId:colId"
  theme: TableTheme;
  createdAt: number;
  updatedAt: number;
}

export interface HistoryEntry {
  tableId: string;
  snapshot: string; // JSON stringified TableData
  timestamp: number;
  description: string;
}

export interface Selection {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  table: Omit<TableData, 'id' | 'createdAt' | 'updatedAt'>;
}

export const DEFAULT_THEME: TableTheme = {
  id: 'default',
  name: 'Default',
  headerBg: '#1e293b',
  headerText: '#ffffff',
  cellBg: '#ffffff',
  cellText: '#1e293b',
  borderColor: '#e2e8f0',
  borderWidth: 1,
  borderStyle: 'solid',
  alternateRowBg: '#f8fafc',
  fontFamily: 'Inter',
  fontSize: 14,
  headerFontWeight: '600',
  borderRadius: 8,
  stickyHeader: true,
  stickyFirstCol: false,
};

export const DARK_THEME: TableTheme = {
  ...DEFAULT_THEME,
  id: 'dark',
  name: 'Dark',
  headerBg: '#0f172a',
  headerText: '#f1f5f9',
  cellBg: '#1e293b',
  cellText: '#e2e8f0',
  borderColor: '#334155',
  alternateRowBg: '#1a2332',
};

export const EMPTY_CELL_STYLE: CellStyle = {};
