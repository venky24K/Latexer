# 🗺️ Latexer Engineering Roadmap

> Tracking the engineering milestones, completed modules, and upcoming industrial-grade differentiators for **Latexer** (Full-Stack Collaborative LaTeX Platform).

---

## 📊 Summary Progress Tracker

- **Completed**: Core Architecture, Tectonic Compilation Pipeline, Tailwind CSS v4 Design Tokens, Gemini AI Copilot, Monaco Editor, PDF.js Live Preview.
- **Current Focus**: Overleaf Differentiators (AI Error Doctor, Smart DOI/arXiv Fetcher, TikZ Live Sandbox).
- **Next Phase**: Industrial-Grade Sandboxing, Distributed Queue, and Real-Time Multiplayer CRDTs.

---

## 🏁 Phase 0: Foundation & Core Scaffolding `[COMPLETED]`

- [x] Monorepo orchestration with concurrently running client (`:3000`) and server (`:4000`).
- [x] High-performance Vite + React 18 + TypeScript frontend setup.
- [x] Monaco Editor integrated with custom LaTeX syntax, snippets (`\begin{equation}`, `\begin{table}`, `\cite`, `\ref`), and keybindings (`⌘↵`, `⌘S`, `⌘K`).
- [x] Mozilla PDF.js hardware-accelerated canvas viewer with zoom controls, page navigation, and download.
- [x] Overleaf-style 3-panel resizable layout (`react-resizable-panels`).
- [x] Virtual Project File System (multi-file `.tex`, `.bib`, styles, and image asset upload).
- [x] Starter Templates: Academic Research Paper, Professional Resume/CV, Beamer Presentation, Minimal Notes.
- [x] `localStorage` state persistence for offline project state.

---

## ⚙️ Phase 1: Local & Server Compilation Pipeline `[COMPLETED]`

- [x] Node.js Express compilation worker executing in isolated sandboxes (`/tmp/latexer-builds/<uuid>`).
- [x] Native **Tectonic** engine integration with automated Cloudflare bundle caching.
- [x] Sub-second incremental compilation (~300ms).
- [x] Host engine discovery (`GET /api/engine-status`) with automated setup guidance.
- [x] Structured `.log` diagnostic parser extracting errors, warnings, bad boxes, and exact line numbers.
- [x] Monaco squiggly error marker synchronization with compiler diagnostics.
- [x] "Jump to Line" action focusing Monaco on faulty lines directly from the diagnostics drawer.

---

## 🎨 Phase 2: Design Token System & Tailwind CSS v4 `[COMPLETED]`

- [x] Official `@tailwindcss/vite` v4 integration (zero-config, high-performance Vite plugin).
- [x] Centralized semantic `@theme` design tokens in `index.css` (`--color-brand`, `--color-sidebar`, `--color-editor`, etc.).
- [x] Eradicated 2,000+ lines of monolithic custom CSS in favor of scalable design tokens and utility classes.
- [x] Enterprise class utility `cn()` using `clsx` and `tailwind-merge`.
- [x] High-contrast, accessibility-checked Dark Theme with authentic PDF shadow elevation.

---

## 🤖 Phase 3: AI Copilot & Inline Intelligence `[COMPLETED]`

- [x] Google Gemini model integration (Gemini 1.5 Flash, Gemini 1.5 Pro, Gemini 2.0 Flash).
- [x] **Gemini AI Copilot Sidebar**:
  - Context-aware chat with active document attachment.
  - One-click quick action chips (*Polish Tone*, *Table*, *Math Equation*, *TikZ Graphic*).
  - One-click **"Insert"** button on generated LaTeX code blocks directly into the active editor position.
- [x] **Inline AI Command Palette (`⌘ + K`)**:
  - Floating Monaco overlay triggered on `⌘K`.
  - Prompts Gemini to rewrite, format into tables, or add equations with in-place selection replacement.
- [x] AI Configuration modal with persistent API key storage and model switching.

---

## 🚀 Phase 4: Unique Features Overleaf Lacks `[IN PROGRESS]`

### 4.1 AI Error Doctor (1-Click Patching) `[TODO]`
- [ ] Next to every compiler diagnostic in the bottom drawer, add a **"✨ Fix with AI"** button.
- [ ] Gemini analyzes the compiler error message, faulty line, and surrounding code.
- [ ] Displays an inline diff with an **"Apply Fix to Code"** button that immediately updates Monaco and recompiles.

### 4.2 Smart Bibliography & DOI/arXiv Auto-Fetcher `[TODO]`
- [ ] Paste any DOI (e.g. `10.1145/3318464.3389700`) or arXiv URL (e.g. `arxiv.org/abs/1706.03762`).
- [ ] Auto-query CrossRef and arXiv APIs to generate clean, standard BibTeX.
- [ ] Append automatically to `references.bib` with no manual file editing.
- [ ] Autocomplete dropdown for `\cite{...}` displaying paper title, authors, and publication year.

### 4.3 Isolated Live TikZ Canvas `[TODO]`
- [ ] Standalone lightweight TikZ diagram preview drawer.
- [ ] Renders isolated TikZ code blocks to vector SVG in **<100ms** without recompiling the 50-page manuscript.
- [ ] Export TikZ figure directly as standalone `.pdf`, `.svg`, or `.png`.

### 4.4 Visual Rendered PDF Diffing `[TODO]`
- [ ] Side-by-side visual comparison between two compilation versions or Git revisions.
- [ ] Visual overlay: highlights added paragraphs/equations in green and deleted items in red on the rendered PDF pages.

### 4.5 Language Server Protocol (TexLab LSP) `[TODO]`
- [ ] Semantic Go to Definition for `\ref`, `\label`, `\cite`, and `\input`.
- [ ] Workspace-wide symbol graph and table of contents outline.
- [ ] Safe symbol renaming (renaming a `\label` updates all `\ref` occurrences across all project files).

### 4.6 Multi-Format Publishing Engine (Pandoc / Quarto) `[TODO]`
- [ ] Export project to Word (`.docx`) for non-LaTeX co-authors and reviewers.
- [ ] Export to clean GitHub Flavored Markdown (`.md`).
- [ ] Export to responsive interactive HTML Research Article.

---

## 🛡️ Phase 5: Industrial-Grade Backend & Compute Sandboxing `[PLANNED]`

### 5.1 Security & Sandboxing
- [ ] Ephemeral rootless Docker containers / Firecracker MicroVMs.
- [ ] Compile with strict isolation: `--net=none`, memory ceiling (512MB), CPU quota (1 core), timeout (30s).
- [ ] Enforce `--untrusted` / `-no-shell-escape` preventing shellcode execution.
- [ ] In-memory `tmpfs` mounts ensuring zero persistent artifact leakage.

### 5.2 Decoupled Compute Queue & Caching
- [ ] **BullMQ + Redis** job queue decoupling API web servers from compilation workers.
- [ ] Content-Addressable Storage (CAS): SHA-256 hashing of source files for instant 0ms cached builds.
- [ ] S3 / Cloudflare R2 object storage for project assets and compiled PDF distributions.

---

## 👥 Phase 6: Multiplayer Real-Time Collaboration `[PLANNED]`

- [ ] **Yjs CRDT Sync Engine**:
  - Conflict-free simultaneous multi-user typing.
  - Colored user cursors and presence avatars in Monaco editor.
- [ ] **Track Changes & Review Mode**:
  - Suggestion mode with Accept/Reject diff controls.
  - Inline threaded comments anchored to code lines.
- [ ] **Git Synchronization**:
  - Virtualized Git repository per project with commit history, branching, and GitHub synchronization.

---

## 🏢 Phase 7: Enterprise Identity, Teams & Production Deployment `[PLANNED]`

- [ ] PostgreSQL + Prisma/Drizzle ORM for User, Organization, and Project management.
- [ ] Role-Based Access Control (RBAC): Owner, Editor, Reviewer, Viewer.
- [ ] Academic Single Sign-On (ORCID, Google, SAML/Shibboleth).
- [ ] Production deployment orchestration:
  - `docker-compose.prod.yml` (Nginx + API + TeX Workers + Postgres + Redis + MinIO).
  - Kubernetes Helm chart for cloud autoscaling.
- [ ] Observability: Prometheus metrics, Grafana dashboards, and Sentry error tracking.
