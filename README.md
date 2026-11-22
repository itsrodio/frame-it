# FrameIt

> Figma-style layout grids, smart container auto-detection, and live element spacing inspector directly on any website.

**FrameIt** is a cross-browser extension designed for frontend developers and UI/UX designers to inspect, verify, and align layout grids, containers, gutters, and element spacing right inside the browser.

---

## ✨ Features

- 🪄 **Smart Container Auto-Detection**: Automatically detects the page's primary content container (`max-width`, inline padding, CSS Grid columns/gaps, and sidebar offsets) as soon as you open the overlay, with fallback to sensible defaults.
- 🎯 **Interactive Container Picker (`Shift + C`)**: Click any section, sidebar, or card on the page to snap the grid directly to that element. Automatically scales column counts (`2`, `4`, `6`, `8`, or `12` columns) based on container width and stays synced on resize via `ResizeObserver`.
- 📐 **Web-Native Layout Guides**:
  - **Columns, Rows & Pixel Grid**: Switch between modes or layer multiple grids simultaneously using the layer visibility toggle.
  - **Max Width & Presets**: Constrain `Stretch` grids to a specific `Max W` (with one-click presets for Tailwind `xl`/`2xl`, Bootstrap, and Figma desktop frames) instead of stretching across the entire monitor.
  - **Margin, Gutter & Offset**: Full support for inner container padding (`Margin`) in all alignment modes, plus X/Y `Offset` and `Scroll with page` vs `Fixed to viewport` positioning.
  - **Figma-Style Scrubbing**: Drag any field label horizontally to tweak values on the fly (hold `Shift` for `10x` steps).
- 📏 **Inspect, Style Card & Redline Distance Measurement (`Alt` / `Shift + I`)**:
  - Hold `Alt` at any time to measure pixel distances from the hovered element to its parent container and visualize paddings, margins, and flex/grid gaps.
  - Click an element in Inspect mode (`Shift + I`) to pin it, hover over any other element to measure exact X/Y distances, navigate the DOM tree (`↑` / `↓` / `←` / `→`), check **WCAG 2.1 contrast**, and copy **CSS**, **Tailwind CSS**, **React JSX**, or **Figma SVG** layers directly from the Style Inspector Card.
- ⚡ **Cross-Browser & Isolated**: Renders inside an isolated Shadow DOM with automatic light/dark theme adaptation. Works on Chrome, Firefox, Edge, and Brave.
- 🔒 **Zero Data Collection**: Runs 100% locally on your machine.

---

## ⌨️ Keyboard Shortcuts

| Shortcut               | Action                                                       |
| ---------------------- | ------------------------------------------------------------ |
| `Alt` _(hold)_         | Measure distances & inspect paddings under cursor            |
| `Shift + G` / `Ctrl+;` | Toggle layout guides visibility                              |
| `Shift + I`            | Toggle persistent Inspect & Measure mode                     |
| `Shift + A`            | Auto-detect main page container (`max-width`, padding, grid) |
| `Shift + C`            | Pick a specific container element on the page                |
| `Shift + 1 / 2 / 3`    | Switch between **Columns**, **Rows**, and **Grid**           |
| `Shift + Click`        | Snap layout grid to clicked element _(in Inspect mode)_      |
| `Esc`                  | Clear pinned element or exit active picker/inspect mode      |

---

## 🚀 Getting Started

### Installation

#### From Web Stores

- [Chrome Web Store](https://chromewebstore.google.com/detail/frameit/haepfbidkoiaoapnojbmjcidjhiipdpe)
- [Firefox Add-ons](#) _(coming soon)_

#### Manual (Developer Mode)

1. Clone the repository:

   ```bash
   git clone https://github.com/itsrodio/frame-it.git
   cd frame-it
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Build the extension:

   ```bash
   pnpm build
   ```

4. Load unpacked in Chrome:
   - Go to `chrome://extensions/`
   - Enable **Developer mode** (top right)
   - Click **Load unpacked** and select the `.output/chrome-mv3` directory.

---

## 🛠️ Tech Stack & Development

- **Framework**: React 19 + TypeScript + WXT (Manifest V3)
- **UI & Styling**: Tailwind CSS v4 + Base UI + Lucide Icons
- **Code Quality**: Biome + Lefthook + Commitlint

### Scripts

```bash
pnpm dev          # Run in development mode with HMR (Chrome)
pnpm dev:firefox  # Run in development mode for Firefox
pnpm build        # Build production bundle
pnpm compile      # Run TypeScript type check
pnpm check:write  # Format and lint with Biome
```

---

## 🗺️ Roadmap

- [x] Layout grids overlay (Columns, Rows & Pixel Grid)
- [x] Multi-layer grid visibility & scroll-linked positioning
- [x] Container `Max Width` constraints, presets & X/Y offsets
- [x] Automatic container detection & interactive element picker (`ResizeObserver` synced)
- [x] **Inspect Mode & `Alt` Redlines**: Measure margins, paddings, and distances between DOM elements
- [x] Keyboard shortcuts & Figma-style scrubbable number inputs
- [ ] **Rulers & Custom Guides**: Drag-and-drop horizontal/vertical guides (`Shift + R`)
- [ ] **Per-domain Persistence**: Remember custom grid presets per domain/localhost port
- [ ] **Store Releases**: Chrome Web Store & Firefox Add-ons
