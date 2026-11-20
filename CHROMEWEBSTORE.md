# Chrome Web Store Listing — FrameIt

> Last Updated: 2026-11-20

## Store Listing

**Extension Name** [REQUIRED]
FrameIt

**Short Description** [REQUIRED]
Figma-style layout grids, smart container detection, and live element spacing inspector for any website.

**Detailed Description** [REQUIRED]
FrameIt brings Figma-grade layout grids, smart container detection, and redline distance measurements directly onto any live webpage so frontend developers and UI/UX designers can verify alignment, responsive containers, gutters, and spacing in the browser.

FEATURES
• Smart Container Auto-Detection — Automatically detects the website's main content container (max-width, inline padding, CSS Grid columns/gaps, and sidebar offsets) on launch, falling back to clean defaults when no container is present.
• Interactive Container Picker (Shift+C) — Click any container, sidebar, or card on the page to snap the grid directly to that element. Automatically adapts column count (2, 4, 6, 8, or 12 columns) to the element's width and stays synced on resize.
• Web-Native Column, Row & Pixel Grids — Configure track count, alignment (stretch, center, start, end), container Max Width with presets (768px–1536px), inner margin/padding, gutter spacing, X/Y offsets, and viewport-fixed vs. scroll-linked positioning.
• Multi-Layer Overlays — Switch cleanly between Columns, Rows, and Pixel Grid, or explicitly enable multiple grid layers simultaneously.
• Inspect & Figma Redline Measurements (Hold Alt or Shift+I) — Hold Alt to measure pixel distances between elements and their parent containers, view element dimensions, and highlight inner paddings. Click to pin any element and measure exact X/Y distances to any other element on the page.
• Figma-Style Scrubbable Inputs & Shortcuts — Drag field labels horizontally to adjust numbers on the fly, and control everything with keyboard shortcuts (Shift+G, Shift+I, Shift+A, Shift+C, Shift+1/2/3).
• Clean & Non-Intrusive — Renders inside an isolated Shadow DOM with automatic light and dark theme adaptation without altering website layout or styles.

HOW TO USE

1. Open any webpage you want to inspect.
2. Click the FrameIt icon in your browser toolbar to launch the overlay dock. FrameIt will automatically detect and snap to the page's main container.
3. Use the Layout Guides popover to customize Columns, Rows, or Pixel Grid, click the wand icon (Shift+A) to re-detect, or use the crosshair (Shift+C) to snap to any element on the page.
4. Hold Alt (or press Shift+I) and hover over elements to measure pixel distances and paddings.

PRIVACY
FrameIt runs 100% locally in your browser. It does not collect, store, or transmit any personal data, browsing history, or website content.

PERMISSIONS
• activeTab & scripting — Used solely to display and toggle the layout grid and inspect overlay on the currently active tab when you click the extension icon.

SUPPORT
Found a bug or have a feature request? Open an issue at https://github.com/itsrodio/frame-it/issues

Version 0.2.0 — Added automatic container detection on launch, interactive container picker with adaptive column counts, Figma-style Alt/Inspect distance measurements, Max Width presets, X/Y offsets, scroll-linked grids, scrubbable inputs, and keyboard shortcuts.

**Category** [REQUIRED]
Developer Tools

**Single Purpose** [REQUIRED]
Overlays customizable column, row, and pixel layout grids and measures element spacing on the active webpage to verify visual alignment.

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

| Asset                          | Dimensions          | Status         | Filename                                                                  |
| ------------------------------ | ------------------- | -------------- | ------------------------------------------------------------------------- |
| Store Icon [REQUIRED]          | 128×128 PNG         | ✅ Ready       | `.output/chrome-mv3/icons/128.png` (generated from `src/assets/icon.png`) |
| Screenshot 1 [REQUIRED]        | 1280×800 or 640×400 | ⬜ Not created |                                                                           |
| Screenshot 2 [RECOMMENDED]     | 1280×800 or 640×400 | ⬜ Not created |                                                                           |
| Screenshot 3 [RECOMMENDED]     | 1280×800 or 640×400 | ⬜ Not created |                                                                           |
| Small Promo Tile [RECOMMENDED] | 440×280             | ⬜ Not created |                                                                           |
| Marquee Promo Tile             | 1400×560            | ⬜ Not created |                                                                           |

### Screenshot Notes

- **Screenshot 1**: Live website with an auto-detected 12-column grid snapped to the main `max-w` container and the FrameIt settings popover open showing Max Width, Margin, Gutter, and Offset controls.
- **Screenshot 2**: Inspect & Measure mode (`Alt` / `Shift+I`) showing redline pixel distances between two page elements and inner padding highlights.
- **Screenshot 3**: Interactive Container Picker (`Shift+C`) highlighting a sidebar container and automatically adapting to a 4-column grid.

## Permissions Justification

| Permission  | Type        | Justification                                                                                                                                                                                                            |
| ----------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `activeTab` | permissions | Grants temporary access to the currently active tab only when the user clicks the FrameIt toolbar icon, allowing the extension to toggle the layout grid overlay on that page without requesting broad host permissions. |
| `scripting` | permissions | Required to inject the on-page layout grid overlay and floating control dock into the active tab when the user clicks the extension toolbar icon.                                                                        |

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No

### Data Use Certification

- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL** [REQUIRED if collecting data; not required when declaring zero data collection, though recommended]
https://github.com/itsrodio/frame-it

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

| Version | Date       | Changes                                                                                                                                                                                                 | Status |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 0.2.0   | 2026-11-17 | Smart container auto-detection by default, interactive container picker with adaptive column counts, Inspect & Alt distance redlines, Max Width presets, X/Y offsets, scroll-linked grids, and hotkeys. | Draft  |
| 0.1.0   | 2026-11-14 | Initial MVP release: customizable column, row, and pixel grid overlays with floating on-page dock.                                                                                                      | Draft  |

## Review Notes

### Known Issues / Limitations

- Browser internal pages (`chrome://`, Chrome Web Store) restrict content script execution by design.
