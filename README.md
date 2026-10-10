# Latexer 📑

> A high-performance, local-first collaborative LaTeX editor inspired by Overleaf, built with **Vite, React, TypeScript, Monaco Editor, PDF.js**, and an isolated **Node.js LaTeX Compilation Engine**.

---

## ✨ Features

- **Desktop Application Menubar (`File`, `Edit`, `Insert`, `View`, `Format`, `Help`)**:
  - Full desktop-grade menus with dropdown panels and keyboard accelerators.
  - **Quick Insert Actions**: Sections, Subsections, Figures, Tables, Equations, Citations (`\cite`), and Footnotes.
  - **Text Formatting Tools**: Bold (`\textbf`), Italic (`\textit`), Code (`\texttt`), Bullet Lists (`itemize`), Numbered Lists (`enumerate`).
  - **Built-in Reference & Help**: Interactive LaTeX Quick Cheatsheet, Keyboard Shortcuts reference, Local TeX Engine setup dialog, and About modal.
  - **Adaptive Title Bar**: Center-positioned, adaptive-width document name input preventing truncation.
- **VS Code-Powered LaTeX Editor**:
  - Full LaTeX syntax highlighting and theme matching with warm parchment & dark mode palettes.
  - Autocomplete snippets for environments (`\begin{equation}`, `\begin{figure}`, `\begin{table}`, `\begin{itemize}`), formatting (`\textbf`, `\textit`), citations (`\cite`), and cross-references (`\ref`).
  - Keybindings: `⌘ + Enter` / `Ctrl + Enter` to recompile, `⌘ + S` / `Ctrl + S` to save & build, `⌘ + K` for AI inline prompt.
  - Inline error markers: server diagnostics are mapped directly to squiggly error underlines on the exact line.
  - Multi-file tab pills bar with tab close (`×`), active buffer indicators, and shortcuts (`⌘W`, `⌘1`–`⌘9`).
- **Mozilla PDF.js Live Preview**:
  - Hardware-accelerated canvas PDF renderer with high-DPI Retina display support.
  - Multi-page continuous view with page navigation and zoom controls (Fit to Width, Zoom In/Out).
  - **Integrated Preview Toolbar**: Recompile button with live compilation spinner and compact status/warning icon badges.
  - **Project-Named PDF Downloads**: Downloads dynamically named after your document title (e.g., `academic_research_manuscript.pdf`).
- **Comprehensive Settings Hub**:
  - Deep customization categories: Appearance (themes, font sizes, line height), Editor (word wrap, line numbers, bracket colorization), Compiler (engine selection, auto-compile toggle), Spelling & Language, References, Notifications, and AI Models.
- **Dual AI Copilot & Autonomous Research Agent**:
  - Sub-300ms inference via **Groq LPU** (GPT-OSS 120B, Qwen 27B, GPT-OSS 20B) and **Google Gemini** (Gemini 3.8 Flash, 3.6 Flash, 3.1 Pro).
  - Autonomous Agent with multi-step tool execution (`read_file`, `write_file`, `edit_file`, `search_files`, `compile_and_diagnose`).
  - Ghost Text AI inline code completions with `Tab` to accept and `Esc` to dismiss.
  - Inline `⌘K` floating command palette for surgical edits.
- **VS Code-Style Activity Bar & File Explorer**:
  - Left vertical Activity Bar with File Explorer, Global Search & Replace, AI Copilot, Document Outline, and Settings.
  - Upload figure assets (PNG, JPG, PDF) directly into the virtual project tree.
  - Create, rename, delete files with auto-detection of `main.tex` entrypoint.
  - Export entire project as a `.zip` archive.
- **Intelligent Diagnostics & Log Drawer**:
  - Parses messy TeX logs into structured errors, warnings, and bad boxes.
  - 1-click **"Jump to line"** action that focuses Monaco on the faulty line.
  - Full raw terminal console with copy support.
- **Starter Template Gallery**:
  - **Academic Research Paper**: Conference/journal style with abstract, equations, tables, and BibTeX citations.
  - **Professional Resume / CV**: Single-page ATS-friendly technical resume.
  - **Beamer Presentation**: Conference slide deck with Metropolis/Madrid styling.
  - **Minimal Starter**: Clean lightweight note-taking layout.
- **Multi-Engine Support**:
  - Native support for **Tectonic**, **latexmk**, **pdflatex**, and **xelatex**.
  - Host engine auto-discovery with built-in setup guide.

---

## 🚀 Quick Start

### 1. Start Client & Server Concurrently
```bash
npm run dev
```
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Compilation Engine**: [http://localhost:4000](http://localhost:4000)

### 2. Enable Native TeX Compilation
Latexer checks your local environment for a LaTeX compiler. On macOS, **Tectonic** is recommended because it is a lightweight, single binary that automatically downloads LaTeX packages on demand:

```bash
brew install tectonic
```

*(Alternatively, standard TeXLive / MacTeX / BasicTeX is fully supported).*

---

## 🛠️ Project Structure

```
Latexer/
├── client/                     # Frontend Application (Vite + React 18 + TS)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Editor/         # Monaco LaTeX editor & completions
│   │   │   ├── Header/         # Top navigation & compilation controls
│   │   │   ├── Logs/           # Diagnostics parser & raw console drawer
│   │   │   ├── Modals/         # Template picker & TeX setup dialogs
│   │   │   ├── Preview/        # PDF.js live renderer & zoom controls
│   │   │   └── Sidebar/        # Project file tree & asset uploader
│   │   ├── services/           # Backend API client
│   │   ├── store/              # Zustand reactive state & persistence
│   │   ├── templates/          # Pre-built LaTeX starter templates
│   │   ├── App.tsx             # Resizable 3-panel workspace layout
│   │   └── index.css           # Premium dark mode design system
│   └── vite.config.ts          # Vite configuration with /api proxy
├── server/                     # LaTeX Compilation Engine (Node.js + TS)
│   ├── src/
│   │   ├── compiler.ts         # Isolated workspace builder & CLI runner
│   │   ├── fallbackPdf.ts      # Zero-dependency starter PDF generator
│   │   ├── logParser.ts        # TeX log parsing (errors, warnings, line numbers)
│   │   ├── types.ts            # Compilation schema & diagnostics types
│   │   └── index.ts            # Express server (compile, pdf streaming, health)
│   └── tsconfig.json
└── package.json                # Root monorepo orchestration
```
