# 🎨 ElseWhere Design System & Theme Specification

> Comprehensive design specification, color tokens, surface hierarchy, and component styling standards for **ElseWhere** — the high-performance, local-first scientific authoring studio.

---

## 🏛️ 1. Design Philosophy

ElseWhere follows an **industrial, deep-focus dark aesthetic** tailored for researchers, mathematicians, and engineers who work for long sessions in technical LaTeX environments:
- **Zero Eye Fatigue:** Deep midnight navy and obsidian canvases instead of stark, pitch-black `#000000`.
- **Deliberate Contrast:** High-contrast text readability paired with subdued structural borders (`rgba(255, 255, 255, 0.07)`).
- **Functional Semantics:** Colors communicate compile states, AI operations, and editor modifications at a single glance.
- **Glassmorphism & Micro-Interactions:** Subtle translucent blurs (`backdrop-filter: blur(10px)`), smooth transitions (`150ms cubic-bezier`), and glowing focus states.

---

## 🎨 2. Master Color Tokens

All design tokens are defined in [`client/src/index.css`](file:///Users/venky/Documents/Github/Latexer/client/src/index.css#L4-L60) under both Tailwind `@theme` and native CSS `:root` custom properties.

### 2.1 Brand & Action Tokens
| Token | Native Variable | Hex / RGBA | Preview | Semantic Role |
| :--- | :--- | :--- | :---: | :--- |
| `--color-brand` | `--accent-primary` | `#00b875` | 🟢 | Primary action buttons, build success, active tab indicators |
| `--color-brand-hover` | `--accent-primary-hover` | `#00d689` | 🟢 | Hover state for primary actions |
| `--color-brand-glow` | `--accent-primary-glow` | `rgba(0, 184, 117, 0.25)` | ❇️ | Focus rings, status pills, success highlights |

### 2.2 Surface & Canvas Hierarchy
| Token | Native Variable | Hex / RGBA | Preview | Layer Role |
| :--- | :--- | :--- | :---: | :--- |
| `--color-app` | `--bg-app` | `#0b0f17` | ⬛ | Application root background |
| `--color-sidebar` | `--bg-sidebar` | `#101622` | ⬛ | Activity bar rail, file tree, drawer background |
| `--color-editor` | `--bg-editor` | `#131a27` | ⬛ | Monaco editor code area |
| `--color-preview` | `--bg-preview` | `#0d121c` | ⬛ | PDF canvas background |
| `--color-card` | `--bg-card` | `#172131` | ⬛ | Diagnostic cards, tab pills, modals |
| `--color-card-hover`| `--bg-card-hover` | `#1e2b40` | ⬛ | Card hover & active states |
| `--color-toolbar` | `--bg-toolbar` | `rgba(16, 22, 34, 0.85)`| ⬛ | Frosted top navigation & floating toolbars |

### 2.3 Semantic Accents & Status Indicators
| Token | Hex / Value | Preview | Semantic Purpose |
| :--- | :--- | :---: | :--- |
| `--color-accent-blue` | `#38bdf8` | 🔵 | `⌘K` command badge, jump-to-line links, file matches, code snippets |
| `--color-accent-purple`| `#a855f7` | 🟣 | Autonomous Agent steps, AI Compiler Doctor banner & quick-fixes |
| `--color-accent-amber` | `#fbbf24` | 🟡 | Compiler warnings, Copilot Ghost Text toggle, citations |
| `--color-accent-red` | `#f43f5e` | 🔴 | Compiler fatal errors, diff deletions, reject actions |

### 2.4 Borders & Outlines
| Token | Value | Semantic Purpose |
| :--- | :--- | :--- |
| `--color-border-subtle` | `rgba(255, 255, 255, 0.07)` | Grid borders, inactive dividers, resizer handles |
| `--color-border-light` | `rgba(255, 255, 255, 0.12)` | Active tab borders, input focus borders, modal outlines |
| `--color-border-active`| `#00b875` | Focused editor outlines, active radio selections |

### 2.5 Typography & Text Contrast
| Token | Hex / Value | Contrast Ratio | Usage |
| :--- | :--- | :---: | :--- |
| `--color-text-primary` | `#f8fafc` | High (15.5:1) | Headings, active code, primary buttons |
| `--color-text-secondary`| `#94a3b8` | Medium (7.2:1) | File paths, logs, descriptions, timestamps |
| `--color-text-muted` | `#64748b` | Subtle (4.5:1) | Keyboard shortcut hints, line counts, placeholders |

---

## 📐 3. Surface Layering & Elevation

```
Level 0: #0b0f17 (Base App Canvas)
   │
   ├── Level 1: #101622 (Activity Bar Rail & Left Sidebar)
   │
   ├── Level 2: #131a27 (Monaco Code Editor Canvas)
   │     └── Level 3: #172131 (Editor Tab Pills, Inactive)
   │           └── Level 4: #1e2b40 (Active Tab / Hovered Item)
   │
   ├── Level 2: #0d121c (PDF Viewport Background)
   │     └── Level 5: #ffffff (Compiled PDF Paper Sheets)
   │
   └── Level 6: Floating Overlays (z-index: 10 - 100)
         ├── rgba(18, 20, 29, 0.96) + blur (Error Floating Banner & Review Bar)
         ├── rgba(16, 22, 34, 0.95) + blur (Logs Drawer & Modal Windows)
         └── rgba(0, 0, 0, 0.70) (Backdrop Dimmer)
```

---

## 🔤 4. Typography Stack

```css
/* UI, Controls & Dialogs */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Monaco Editor, LaTeX Syntax, Terminals & Code Snippets */
--font-mono: 'JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', monospace;
```

- **Heading 1 / Title:** `17px` - `18px`, Weight: `700`, Line-Height: `1.2`
- **Section Heading:** `13px` - `14px`, Weight: `600`, Line-Height: `1.3`
- **Body & Controls:** `12px` - `13px`, Weight: `500`, Line-Height: `1.4`
- **Code / Editor:** `13.5px`, Weight: `400` / `500`, Line-Height: `22px`
- **Badges & Footers:** `9.5px` - `11px`, Weight: `600` / `700`, Tracking: `0.02em`

---

## 🧩 5. Core Component Styling Standards

### 5.1 Status Pills & Quick Badges
- **Success (`Compiled`):** `background: rgba(0, 184, 117, 0.12)`, `border: 1px solid rgba(0, 184, 117, 0.3)`, `color: #4ade80`.
- **Error (`X Errors`):** `background: rgba(244, 63, 94, 0.15)`, `border: 1px solid rgba(244, 63, 94, 0.35)`, `color: #fda4af`.
- **Copilot Active (`Copilot (Tab)`):** `background: rgba(245, 158, 11, 0.12)`, `border: 1px solid rgba(245, 158, 11, 0.35)`, `color: #fbbf24`.
- **AI Command (`⌘K AI Edit`):** `background: rgba(56, 189, 248, 0.1)`, `border: 1px solid rgba(56, 189, 248, 0.25)`, `color: #38bdf8`.

### 5.2 Floating Monaco Diff Review Bar
- **Container:** `background: rgba(18, 20, 29, 0.95)`, `backdrop-filter: blur(12px)`, `border: 1px solid rgba(255, 255, 255, 0.12)`, `border-radius: 24px`.
- **Accept Button:** `background: linear-gradient(135deg, #059669, #00b875)`, `box-shadow: 0 2px 10px rgba(0, 184, 117, 0.35)`.
- **Reject Button:** `background: rgba(244, 63, 94, 0.15)`, `border: 1px solid rgba(244, 63, 94, 0.3)`, `color: #fda4af`.

### 5.3 AI Compiler Doctor Banner
- **Background:** `linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)`.
- **Border:** `1px solid rgba(124, 58, 237, 0.35)`.
- **Action Button:** `linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)`, `color: #fff`.

---

## 🛠️ 6. How to Customize the Theme

To update any theme color or adapt ElseWhere to a new branding scheme:
1. Open [`client/src/index.css`](file:///Users/venky/Documents/Github/Latexer/client/src/index.css#L4-L60).
2. Modify the variables in both the `@theme` block and `:root` block:
   ```css
   @theme {
     --color-brand: #00b875; /* change primary brand accent */
     --color-app: #0b0f17;   /* change dark canvas base */
     --color-editor: #131a27;/* change editor surface */
   }
   ```
3. Vite hot-module-replacement (HMR) will immediately reflect the new theme live without browser refresh.
