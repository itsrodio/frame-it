# FrameIt

> Figma-like layout grid and spacing overlay directly on live websites.

**FrameIt** is a cross-browser extension designed for frontend developers and UI/UX designers to inspect, verify, and align layout grids, gutters, and element spacing right inside the browser.

---

## ✨ Features

- 📐 **Figma-Style Grids**: Overlay column, row, and modular grids onto any page.
- 📏 **Smart Spacing & Guides**: Measure margins, paddings, and distances between DOM elements with hover guides.
- 🎨 **Customizable Overlays**: Tune colors, opacity, gutter widths, and column counts to match your design tokens.
- ⚡ **Cross-Browser**: Built to work on Chrome, Firefox, Edge, and Safari.
- 🔒 **Zero Data Collection**: Runs 100% locally on your machine.

---

## 🚀 Getting Started

### Installation

#### From Web Stores

- [Chrome Web Store](#) _(coming soon)_
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

- **Package Manager**: [pnpm](https://pnpm.io/)
- **Build Tool**: WXT
- **TypeScript**

### Scripts

```bash
pnpm dev # Run in development mode with HMR
pnpm build # Build production bundles for targets
pnpm lint # Lint and format check
```

---

## 🗺️ Roadmap

- [x] Layout grids overlay (Columns, Rows & Grid)
- [x] Customizable grid parameters (colors, opacity, gutters, columns)
- [ ] **Inspect Mode**: Hover guides to measure margins, paddings, and distances between DOM elements
- [ ] **Rulers & Custom Guides**: Drag-and-drop horizontal/vertical guides like in Figma (`Shift + R`)
- [ ] **Per-domain Persistence**: Remember grid settings per URL/localhost port
- [ ] **Store Releases**: Chrome Web Store & Firefox Add-ons
