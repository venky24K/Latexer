# 🎨 ElseWhere Design System & Theme Specification

> Comprehensive design specification, color tokens, surface hierarchy, and component styling standards for **ElseWhere** — the high-performance, local-first scientific authoring studio.

---

## 🏛️ 1. Design Philosophy: Warm Editorial Parchment (`#F5F0E7`)

ElseWhere features an **editorial, warm linen & parchment aesthetic** (`#F5F0E7` family) tailored for researchers, mathematicians, and writers:
- **Natural Reading Comfort:** Warm, organic paper background (`#F5F0E7`) inspired by academic books, iA Writer, and high-grade parchment rather than harsh sterile white or stark darkness.
- **Deep Espresso Typography:** High-contrast warm charcoal ink (`#1f1c18`) providing razor-sharp legibility for complex LaTeX formulas and text.
- **Subtle Surface Recesses:** Harmonious layering from warm canvas (`#F5F0E7`) to ivory editor (`#FAF7F2`) and recessed sidebars (`#ECE6DB`).
- **Translucent Micro-Interactions:** Warm glassmorphism (`backdrop-filter: blur(10px)`), delicate sepia hairline dividers (`rgba(44, 38, 30, 0.08)`), and emerald green focus glows.

---

## 🎨 2. Master Color Tokens

All design tokens are defined in [`client/src/index.css`](file:///Users/venky/Documents/Github/Latexer/client/src/index.css#L4-L60) under both Tailwind `@theme` and native CSS `:root` custom properties.

### 2.1 Brand & Action Tokens
| Token | Native Variable | Hex / RGBA | Preview | Semantic Role |
| :--- | :--- | :--- | :---: | :--- |
| `--color-brand` | `--accent-primary` | `#008f5d` | 🟢 | Primary action buttons, build success, active tab indicators |
| `--color-brand-hover` | `--accent-primary-hover` | `#00754a` | 🟢 | Hover state for primary actions |
| `--color-brand-glow` | `--accent-primary-glow` | `rgba(0, 143, 93, 0.20)` | ❇️ | Focus rings, status pills, success highlights |

### 2.2 Surface & Canvas Hierarchy (`#F5F0E7` Family)
| Token | Native Variable | Hex / RGBA | Preview | Layer Role |
| :--- | :--- | :--- | :---: | :--- |
| `--color-app` | `--bg-app` | `#F5F0E7` | 📜 | Application root canvas (warm parchment) |
| `--color-sidebar` | `--bg-sidebar` | `#ECE6DB` | 📜 | Activity bar rail, file tree, drawer background (recessed tint) |
| `--color-editor` | `--bg-editor` | `#FAF7F2` | 📜 | Monaco editor code area (crisp writing ivory) |
| `--color-preview` | `--bg-preview` | `#E6DFD3` | 📜 | PDF canvas background (depth behind white paper) |
| `--color-card` | `--bg-card` | `#FFFFFF` | ⬜ | Diagnostic cards, tab pills, modals (elevated white cards) |
| `--color-card-hover`| `--bg-card-hover` | `#F6F1E8` | 📜 | Card hover & active states (soft warm wash) |
| `--color-toolbar` | `--bg-toolbar` | `rgba(245, 240, 231, 0.88)`| 📜 | Frosted top navigation & floating toolbars |

### 2.3 Semantic Accents & Status Indicators
| Token | Hex / Value | Preview | Semantic Purpose |
| :--- | :--- | :---: | :--- |
| `--color-accent-blue` | `#0284c7` | 🔵 | `⌘K` command badge, jump-to-line links, file matches, code snippets |
| `--color-accent-purple`| `#7c3aed` | 🟣 | Autonomous Agent steps, AI Compiler Doctor banner & quick-fixes |
| `--color-accent-amber` | `#d97706` | 🟡 | Compiler warnings, Copilot Ghost Text toggle, citations |
| `--color-accent-red` | `#e11d48` | 🔴 | Compiler fatal errors, diff deletions, reject actions |

### 2.4 Borders & Outlines
| Token | Value | Semantic Purpose |
| :--- | :--- | :--- |
| `--color-border-subtle` | `rgba(44, 38, 30, 0.08)` | Grid borders, hairline dividers, resizer handles |
| `--color-border-light` | `rgba(44, 38, 30, 0.15)` | Active tab borders, input focus borders, modal outlines |
| `--color-border-active`| `#008f5d` | Focused editor outlines, active radio selections |

### 2.5 Typography & Text Contrast
| Token | Hex / Value | Contrast Ratio | Usage |
| :--- | :--- | :---: | :--- |
| `--color-text-primary` | `#1f1c18` | High (15.1:1) | Headings, active code, primary buttons (warm charcoal ink) |
| `--color-text-secondary`| `#5c554b` | Medium (6.8:1) | File paths, logs, descriptions, timestamps (walnut slate) |
| `--color-text-muted` | `#8a8073` | Subtle (4.2:1) | Keyboard shortcut hints, line counts, placeholders (warm taupe) |

---

## 📐 3. Surface Layering & Elevation

```
Level 0: #F5F0E7 (Base Parchment Canvas)
   │
   ├── Level 1: #ECE6DB (Activity Bar Rail & Recessed Sidebars)
   │
   ├── Level 2: #FAF7F2 (Monaco Writing Paper Canvas)
   │     └── Level 3: #FFFFFF (Editor Tab Pills & Cards, Elevated)
   │           └── Level 4: #F6F1E8 (Card Hover & Active States)
   │
   ├── Level 2: #E6DFD3 (PDF Viewport Background)
   │     └── Level 5: #FFFFFF (Compiled PDF Paper Sheets)
   │
   └── Level 6: Floating Overlays (z-index: 10 - 100)
         ├── rgba(255, 255, 255, 0.96) + blur (Error Floating Banner & Review Bar)
         ├── rgba(236, 230, 219, 0.95) + blur (Logs Drawer & Modal Windows)
         └── rgba(44, 38, 30, 0.40) (Backdrop Dimmer)
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
- **Success (`Compiled`):** `background: rgba(0, 143, 93, 0.12)`, `border: 1px solid rgba(0, 143, 93, 0.3)`, `color: #008f5d`.
- **Error (`X Errors`):** `background: rgba(225, 29, 72, 0.12)`, `border: 1px solid rgba(225, 29, 72, 0.35)`, `color: #e11d48`.
- **Copilot Active (`Copilot (Tab)`):** `background: rgba(217, 119, 6, 0.12)`, `border: 1px solid rgba(217, 119, 6, 0.35)`, `color: #d97706`.
- **AI Command (`⌘K AI Edit`):** `background: rgba(2, 132, 199, 0.1)`, `border: 1px solid rgba(2, 132, 199, 0.25)`, `color: #0284c7`.

### 5.2 Floating Monaco Diff Review Bar
- **Container:** `background: rgba(255, 255, 255, 0.96)`, `backdrop-filter: blur(12px)`, `border: 1px solid var(--color-border-light)`, `box-shadow: 0 10px 30px rgba(44, 38, 30, 0.15)`.
- **Accept Button:** `background: #008f5d`, `color: #ffffff`.
- **Reject Button:** `background: rgba(44, 38, 30, 0.06)`, `border: 1px solid var(--color-border-subtle)`, `color: var(--color-text-primary)`.

### 5.3 AI Compiler Doctor Banner
- **Background:** `linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(2, 132, 199, 0.05) 100%)`.
- **Border:** `1px solid rgba(124, 58, 237, 0.25)`.
- **Action Button:** `linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)`, `color: #fff`.

---

## 🛠️ 6. How to Customize the Theme

To tweak or adapt shades:
1. Open [`client/src/index.css`](file:///Users/venky/Documents/Github/Latexer/client/src/index.css#L4-L60).
2. Modify the variables in both `@theme` and `:root`:
   ```css
   @theme {
     --color-app: #F5F0E7;     /* Canvas Base */
     --color-sidebar: #ECE6DB; /* Recessed Tint */
     --color-editor: #FAF7F2;  /* Writing Ivory */
     --color-card: #FFFFFF;    /* Elevated Surfaces */
   }
   ```
3. Vite hot-module-replacement (HMR) will instantly apply changes live in the browser.
