# Chrome Web Store Listing — FrameIt

> Last Updated: 2026-11-22

## Store Listing

**Extension Name** [REQUIRED]
FrameIt

**Short Description** [REQUIRED]
Figma-style layout grids, smart container detection, and live element spacing inspector for any website.

**Detailed Description** [REQUIRED]
FrameIt brings Figma-grade layout grids, design mockup overlays, spacing measurements, and full-page Figma/PNG export directly onto any live webpage so frontend developers and UI/UX designers can verify alignment, responsive containers, and pixel accuracy right in the browser.

FEATURES
• Smart Container Auto-Detection — Automatically detects the website's main content container (max-width, padding, grid columns, and sidebar offsets) on launch, falling back to clean defaults when no container is present.
• Interactive Container Picker (Shift+C) — Click any container, sidebar, or card on the page to snap the grid directly to that element. Automatically adapts column count (2, 4, 6, 8, or 12 columns) to the element's width and stays synced on resize.
• Web-Native Column, Row & Pixel Grids — Configure track count, alignment (stretch, center, left/right, top/bottom), container Max Width with presets (768px–1536px), inner margin/padding, gutter spacing, X/Y offsets, and viewport-fixed vs. scroll-linked positioning.
• Inspect, Style Card & Redline Measurements (Hold Alt or Shift+I) — Measure pixel distances between elements and their parent containers, highlight inner paddings, margins, and flex/grid gaps, and click any element to open the floating Style Inspector Card (typography, HEX/RGB/OKLCH colors, WCAG 2.1 contrast ratio, DOM tree navigation). Copy ready-to-use CSS, Tailwind CSS, React JSX, or Figma-ready SVG frames.
• Design Overlay Mockup Comparison (Shift+O) — Drag and drop, upload, or paste (Ctrl+V) a design mockup image (PNG, JPG, SVG, or WebP) onto the live page. Adjust opacity, scale, X/Y position, or Difference blend mode, auto-fit or snap to an element, and lock click-through (Shift+L) while interacting with the site.
• Full-Page Export (SVG & PNG) — Copy the entire webpage to your clipboard as editable Figma vector layers (SVG) or a full-page PNG screenshot with one click, or open the export dropdown to switch formats and download .svg / .png files.
• Figma-Style Scrubbable Inputs & Customizable Shortcuts — Drag field labels horizontally to adjust numbers on the fly, customize hotkeys and defaults on the Options page, and work in 9 supported languages with automatic light and dark theme adaptation without altering page styles.

HOW TO USE

1. Open any webpage you want to inspect.
2. Click the FrameIt icon in your browser toolbar to launch the floating dock. FrameIt automatically detects and snaps to the page's main container.
3. Open the Layout Guides dropdown to customize Columns, Rows, or Pixel Grid, re-detect (Shift+A), or pick any element on the page (Shift+C).
4. Hold Alt (or press Shift+I) to measure pixel distances and paddings, or click an element to inspect styles and copy CSS, Tailwind, JSX, or Figma SVG.
5. Open Design Overlay (Shift+O) to paste or drop a mockup image over the live site and compare pixel-by-pixel using Opacity or Difference blend mode.
6. Click the Page Export icon on the dock to copy the entire page to your clipboard, or open its dropdown to switch between SVG (Figma) and PNG (Screenshot) and save files.

PRIVACY
FrameIt runs 100% locally in your browser. It does not collect, store, or transmit any personal data, browsing history, or website content to any external server.

PERMISSIONS
• activeTab & scripting — Used only when you click the FrameIt toolbar icon to display the overlay tools on the active tab and capture visible tab slices when you trigger a full-page PNG screenshot.
• storage — Used locally on your device to save your extension preferences (language, theme, custom shortcuts, default grids) and per-site overlay settings.

SUPPORT
Found a bug or have a feature request? Open an issue at https://github.com/itsrodio/frame-it/issues

Version 0.4.0 — Added Design Overlay mockup comparison (Difference blend mode, auto-fit, element snap, click-through lock), Style Inspector Card with CSS/Tailwind/JSX/Figma SVG export, and Full-Page Export (SVG for Figma and full-page PNG screenshot).

**Category** [REQUIRED]
Developer Tools

**Single Purpose** [REQUIRED]
Overlays customizable layout grids, design mockups, spacing measurements, and page export tools on the active webpage to verify visual alignment and inspect UI implementation.

**Primary Language** [REQUIRED]
English (`en`)

**Supported Locales (`_locales/`)**

- `en` — English: Figma-style layout grids, smart container detection, and live element spacing inspector for any website.
- `es` — Español: Cuadrículas de diseño estilo Figma, detección inteligente de contenedores e inspector de espaciado en vivo para cualquier sitio web.
- `zh_CN` — 简体中文: 适用于任何网站的 Figma 风格布局网格、智能容器检测和实时元素间距检查器。
- `pt_BR` — Português (Brasil): Grades de layout estilo Figma, detecção inteligente de contêineres e inspetor de espaçamento ao vivo para qualquer site.
- `de` — Deutsch: Layout-Raster im Figma-Stil, intelligente Container-Erkennung und Live-Abstandsinspektor für jede Website.
- `fr` — Français: Grilles de mise en page style Figma, détection intelligente des conteneurs et inspecteur d'espacement en direct pour tout site web.
- `ru` — Русский: Модульные сетки в стиле Figma, умное определение контейнеров и инспектор отступов элементов в реальном времени для любого сайта.
- `ja` — 日本語: あらゆるWebサイトで使える、Figma風のレイアウトグリッド、スマートコンテナ検出、リアルタイム要素間隔インスペクター。
- `ko` — 한국어: 모든 웹사이트를 위한 Figma 스타일 레이아웃 그리드, 스마트 컨테이너 감지 및 실시간 요소 간격 인스펙터.

## Graphics & Assets

| Asset                          | Dimensions   | Status         | Filename                                                                  |
| ------------------------------ | ------------ | -------------- | ------------------------------------------------------------------------- |
| Store Icon [REQUIRED]          | 128×128 PNG  | ✅ Ready       | `.output/chrome-mv3/icons/128.png` (generated from `src/assets/icon.png`) |
| Screenshot 1 [REQUIRED]        | 1280×800 PNG | ✅ Ready       | `store-assets/screenshot-1-layout-grids.png`                              |
| Screenshot 2 [RECOMMENDED]     | 1280×800 PNG | ✅ Ready       | `store-assets/screenshot-2-inspect-redlines.png`                          |
| Screenshot 3 [RECOMMENDED]     | 1280×800 PNG | ✅ Ready       | `store-assets/screenshot-3-design-overlay.png`                            |
| Screenshot 4                   | 1280×800 PNG | ✅ Ready       | `store-assets/screenshot-4-page-export.png`                               |
| Small Promo Tile [RECOMMENDED] | 440×280 PNG  | ✅ Ready       | `store-assets/promo-small-440x280.png`                                    |
| Marquee Promo Tile             | 1400×560     | ⬜ Not created |                                                                           |

### Screenshot Notes

- **Screenshot 1**: Live website with an auto-detected 12-column grid snapped to the main container and the Layout Guides popover open showing Max Width, Margin, Gutter, and Offset controls.
- **Screenshot 2**: Inspect & Measure mode (`Alt` / `Shift+I`) showing redline pixel distances, padding/margin highlights, and the floating Style Inspector Card (typography, HEX/RGB/OKLCH colors, WCAG contrast, CSS/Tailwind/JSX/Figma SVG copy).
- **Screenshot 3**: Design Overlay mode (`Shift+O`) showing a pasted mockup image aligned over a live webpage with opacity and Difference blend mode controls.
- **Screenshot 4**: Full-Page Export dropdown on the dock showing SVG (Figma) and PNG (Screenshot) format selection and file download, or Interactive Container Picker (`Shift+C`) snapping a 4-column grid to a sidebar.

## Permissions Justification

| Permission  | Type        | Justification                                                                                                                                                                                                                                    |
| ----------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `activeTab` | permissions | Grants temporary access to the currently active tab only when the user clicks the FrameIt toolbar icon, allowing the extension to toggle the overlay tools and capture visible tab slices via `tabs.captureVisibleTab` for full-page PNG export. |
| `scripting` | permissions | Required to inject the on-page layout grid, inspect, design overlay, and export dock into the active tab when the user clicks the extension toolbar icon.                                                                                        |
| `storage`   | permissions | Stores the user's extension preferences (interface language, theme, keyboard shortcuts, launch behavior, and default layout grid settings) locally on-device via `chrome.storage.local`.                                                         |

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No

### Data Use Certification

- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL** [REQUIRED if collecting data; recommended for all extensions]
https://github.com/itsrodio/frame-it

<!-- Note: Ensure this URL stays publicly accessible. Adding a dedicated PRIVACY.md or GitHub Pages /privacy page is recommended if CWS reviewers request a standalone policy page. -->

## Distribution

**Visibility**: Public
**Regions**: All regions

## Developer Info

**Publisher Name** [REQUIRED]
Nikita Rodionov (rodio)

**Contact Email** [REQUIRED]
<!-- Fill in your public developer contact email in the Chrome Web Store dashboard -->

**Support URL / Email** [RECOMMENDED]
https://github.com/itsrodio/frame-it/issues

**Homepage URL** [RECOMMENDED]
https://github.com/itsrodio/frame-it

## Version History

| Version | Date       | Changes                                                                                                                                                                                | Status |
| ------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 0.4.0   | 2026-11-22 | Added Design Overlay mockup preview & comparison, Style Inspector Card with CSS/Tailwind/JSX/Figma SVG export, and Full-Page Export (Figma SVG & PNG screenshot) on the floating dock. | Draft  |
| 0.3.0   | 2026-11-20 | Added localization for 9 languages (`en`, `es`, `zh_CN`, `pt_BR`, `de`, `fr`, `ru`, `ja`, `ko`) and extension Options page.                                                            | Draft  |
| 0.2.0   | 2026-11-17 | Smart container auto-detection by default, interactive container picker with adaptive column counts, Inspect & Alt distance redlines, Max Width presets, X/Y offsets, and hotkeys.     | Draft  |
| 0.1.0   | 2026-11-14 | Initial MVP release: customizable column, row, and pixel grid overlays with floating on-page dock.                                                                                     | Draft  |

## Review Notes

### Packaging & Pre-Publish Checklist

- Run `pnpm zip` to generate the Chrome Web Store upload archive inside `.output/` (built from `.output/chrome-mv3`, excluding `node_modules`, `.git`, tests, `store-assets/`, and `CHROMEWEBSTORE.md`).
- Confirm `manifest.json` version matches `0.4.0` before uploading.
- Upload `store-assets/screenshot-1-layout-grids.png` through `screenshot-4-page-export.png` (`1280×800`) and `store-assets/promo-small-440x280.png` (`440×280`), and fill in the public Contact Email in the Chrome Developer Dashboard.

### Known Issues / Limitations

- Browser internal pages (`chrome://`, `edge://`, Chrome Web Store) restrict content script execution by design.
- Full-page PNG screenshot capture relies on `activeTab` activation from clicking the extension toolbar icon on the current tab.
