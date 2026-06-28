# 📊 Table Designer Pro

A modern, professional table design application for creating beautiful, fully customizable tables — inspired by the best of Excel, Google Sheets, Canva, and Notion.

![Table Designer Pro](https://img.shields.io/badge/status-active-brightgreen) ![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue) ![React](https://img.shields.io/badge/React-18-61DAFB) ![Vite](https://img.shields.io/badge/Vite-6-646CFF) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4)

---

## ✨ Features

### 🎨 Table Design
- **Unlimited tables** — create, rename, duplicate, delete
- **Row & column operations** — add, delete, duplicate, merge, split
- **Resize by dragging** — drag column/row borders to resize
- **Freeze rows & columns** — pin headers or key columns
- **Hide/show** rows and columns
- **10 built-in themes** — Clean Slate, Midnight, Ocean, Forest, Sunset, Royal, Rose, Minimal, Elegant, Neon

### 📝 Cell Editing
- **Rich text** — bold, italic, underline, strikethrough
- **11 content types** — text, number, link, badge, tag, checkbox, progress bar, rating, image
- **Image upload** — drag-drop or file picker, stored as base64
- **Cell merge & split** — proper visual rendering with colSpan/rowSpan
- **Font control** — family, size, weight, line height, letter spacing, text transform
- **Colors** — text color, background color, opacity
- **Alignment** — horizontal (left/center/right/justify) & vertical (top/middle/bottom)
- **Borders** — individual per side (top/bottom/left/right), style (solid/dashed/dotted/double), width, color
- **Effects** — shadows, gradients, border radius, padding

### 🎯 Styling & Themes
- **Cell-level styling** — full control over every cell's appearance
- **Table-level themes** — apply consistent styling across the entire table
- **Theme presets** — one-click professional themes
- **Dark mode** — toggle between light and dark
- **Grid visibility** — show or hide grid lines
- **Zoom** — 50% to 200% scaling

### ⚡ Productivity
- **Undo / Redo** — full history with 100-step buffer (Ctrl+Z / Ctrl+Y)
- **Drag & drop reorder** — drag row/column headers to reorder
- **Column rename** — double-click any column header
- **Multi-cell selection** — click + shift-click, or drag to select ranges
- **Copy / Paste style** — Ctrl+C / Ctrl+V for cell styles
- **Keyboard navigation** — arrow keys, Tab, Enter to edit, Escape to cancel
- **Context menu** — right-click for all operations
- **Floating format bar** — quick formatting while editing cells

### 📥📤 Import & Export
| Format | Import | Export |
|--------|--------|--------|
| CSV | ✅ | ✅ |
| Excel (.xlsx) | ✅ | ✅ |
| JSON | ✅ | ✅ |
| Markdown | ✅ | ✅ |
| HTML | — | ✅ |
| PDF | — | ✅ (via print) |
| PNG | — | ✅ |
| JPEG | — | ✅ |
| SVG | — | ✅ |

### 📱 Responsive Design
- Fully responsive across desktop, tablet, and mobile
- Touch-friendly interactions (tap to select, double-tap to edit, long-press for context menu)
- Adaptive sidebar, toolbar, and style panel

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) 18+
- npm 8+

### Installation

```bash
# Clone the repository
git clone https://github.com/devhmo/table-designer-pro.git
cd table-designer-pro

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm run preview
```

---

## 🏗️ Architecture

```
src/
├── types/index.ts          — TypeScript interfaces & type definitions
├── store/tableStore.ts     — Zustand state management (single source of truth)
├── utils/
│   ├── export.ts           — HTML, CSV, Markdown, JSON export
│   ├── import.ts           — CSV, JSON, Markdown file import
│   └── themes.ts           — 10 built-in theme presets
├── hooks/useKeyboard.ts    — Global keyboard shortcut handler
├── components/
│   ├── WelcomeScreen.tsx   — Landing page with templates & import
│   ├── Sidebar.tsx         — Table list with rename/duplicate/delete
│   ├── Toolbar.tsx         — Formatting toolbar & operations
│   ├── TableCanvas.tsx     — Main grid with resize, selection, context menu
│   ├── CellEditor.tsx      — Rich text editing with floating format bar
│   └── StylePanel.tsx      — Right panel: cell/table/theme settings
├── App.tsx                 — Root layout
├── main.tsx                — Entry point
└── index.css               — Tailwind + custom CSS
```

### Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite 6** | Build tool & dev server |
| **Zustand** | State management |
| **Immer** | Immutable state updates |
| **Tailwind CSS** | Utility-first styling |
| **Lucide React** | Icon library |
| **nanoid** | Unique ID generation |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Ctrl+A` | Select all cells |
| `Ctrl+C` | Copy cell style |
| `Ctrl+V` | Paste cell style |
| `Arrow Keys` | Navigate between cells |
| `Tab` | Move to next cell |
| `Shift+Tab` | Move to previous cell |
| `Enter` | Start editing cell |
| `Escape` | Stop editing |
| `Delete` / `Backspace` | Clear cell content |
| `Ctrl+B` | Bold (while editing) |
| `Ctrl+I` | Italic (while editing) |
| `Ctrl+U` | Underline (while editing) |

---

## 🎨 Theme Presets

| Theme | Style |
|-------|-------|
| **Clean Slate** | Professional dark header, clean white cells |
| **Midnight** | Full dark mode with blue-gray palette |
| **Ocean Blue** | Cool blue tones, fresh feel |
| **Forest Green** | Natural green palette |
| **Sunset** | Warm orange gradients |
| **Royal Purple** | Rich purple tones |
| **Rose** | Elegant pink palette |
| **Minimal** | Borderless, typography-focused |
| **Elegant** | Playfair Display font, refined look |
| **Neon** | Terminal-inspired, monospace, high contrast |

---

## 📋 Quick Start Templates

- 📋 **Project Tracker** — tasks, status, and deadlines
- 💰 **Budget Planner** — monthly income and expenses
- 👥 **Team Directory** — contact info and roles
- 📦 **Inventory List** — products, quantities, and prices
- 📚 **Grade Book** — student grades and assignments
- ⚖️ **Comparison Chart** — feature comparison matrix

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ using React, TypeScript, and Tailwind CSS
</p>
