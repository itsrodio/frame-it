# Chrome Web Store Listing — FrameIt

> Last Updated: 2026-11-14

## Store Listing

**Extension Name** [REQUIRED]
FrameIt

**Short Description** [REQUIRED]
Overlay customizable column, row, and pixel layout grids onto any live website.

**Detailed Description** [REQUIRED]
FrameIt overlays customizable layout grids directly onto any live webpage so frontend developers and UI/UX designers can verify alignment, columns, gutters, and spacing in the browser.

FEATURES
• Column & Row Guides — Configure track count, alignment (start, center, end, or stretch), track width/height, outer margins, and gutter spacing.
• Pixel Grid Overlay — Display a uniform square pixel grid of any custom size to verify baseline and modular spacing.
• Custom Appearance — Adjust guide colors and opacity independently for columns, rows, and pixel grids so overlays remain clearly visible on both light and dark websites.
• Floating On-Page Dock — Quickly toggle guides on or off and switch between grid modes right from the page, with automatic light and dark theme adaptation.
• Clean & Non-Intrusive — Overlays render above the page without altering website layout, styles, or mouse interactions.

HOW TO USE

1. Open any webpage you want to inspect.
2. Click the FrameIt icon in your browser toolbar to toggle the overlay dock on the current tab.
3. Click the grid toggle in the dock to show or hide layout guides, or open the dropdown menu to customize columns, rows, or pixel grid settings.

PRIVACY
FrameIt runs 100% locally in your browser. It does not collect, store, or transmit any personal data, browsing history, or website content.

PERMISSIONS
• activeTab & scripting — Used solely to display and toggle the layout grid overlay on the currently active tab when you click the extension icon.

SUPPORT
Found a bug or have a feature request? Open an issue at https://github.com/itsrodio/frame-it/issues

Version 0.1.0 — Initial release with customizable column, row, and pixel grid overlays and an on-page control dock.

**Category** [REQUIRED]
Developer Tools

**Single Purpose** [REQUIRED]
Overlays customizable column, row, and pixel layout grids onto the active webpage to verify visual alignment and spacing.

**Primary Language** [REQUIRED]
English

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

- **Screenshot 1**: Live website with a 12-column stretch grid overlay active and the FrameIt settings popover open showing Columns configuration (count, margin, gutter, color/opacity).
- **Screenshot 2**: Pixel grid / Rows overlay mode demonstrating custom color and opacity adjustments on a dark-themed website.

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

| Version | Date       | Changes                                                                                            | Status |
| ------- | ---------- | -------------------------------------------------------------------------------------------------- | ------ |
| 0.1.0   | 2026-11-14 | Initial MVP release: customizable column, row, and pixel grid overlays with floating on-page dock. | Draft  |

## Review Notes

### Known Issues / Limitations

- The Inspect tool button in the dock is currently disabled and marked "Currently not available" (scheduled for a future update).
