import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {
  type BrowserContext,
  test as base,
  chromium,
  type Page,
  type Worker,
} from '@playwright/test';

const TEST_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>FrameIt E2E Test Page</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: sans-serif; background: #ffffff; color: #111111; min-height: 200vh; }
    main#hero-container {
      width: 1200px;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
      min-height: 500px;
    }
    section#secondary-container {
      width: 960px;
      margin: 40px auto;
      padding: 0 16px;
      min-height: 240px;
      background: #f8fafc;
    }
    .cards-row {
      display: flex;
      align-items: flex-start;
      gap: 48px;
      margin-top: 32px;
    }
    .card {
      width: 200px;
      height: 100px;
      padding: 16px;
      background: #e2e8f0;
    }
  </style>
</head>
<body>
  <main id="hero-container">
    <h1>FrameIt Test Layout</h1>
    <div class="cards-row">
      <div id="card-a" class="card">Card A</div>
      <div id="card-b" class="card">Card B</div>
    </div>
  </main>
  <section id="secondary-container">
    <h2>Secondary 960px Section</h2>
  </section>
</body>
</html>`;

export const test = base.extend<{
  context: BrowserContext;
  serviceWorker: Worker;
  testServerUrl: string;
  triggerExtensionAction: (page: Page) => Promise<void>;
  setTourCompleted: (completed: boolean) => Promise<void>;
}>({
  // Local HTTP server so the extension operates on a real http://127.0.0.1 origin
  // biome-ignore lint/correctness/noEmptyPattern: Playwright fixture signature requires destructuring
  testServerUrl: async ({}, use) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1');
      const rootFontSize = url.searchParams.get('rootFontSize');
      const html = rootFontSize
        ? TEST_PAGE_HTML.replace(
            '<style>',
            `<style>html { font-size: ${rootFontSize}; } `,
          )
        : TEST_PAGE_HTML;
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    });

    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', () => resolve()),
    );
    const addr = server.address();
    const port = typeof addr === 'object' && addr ? addr.port : 0;

    await use(`http://127.0.0.1:${port}`);

    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  },

  // Persistent Chromium context with the built MV3 extension loaded
  // biome-ignore lint/correctness/noEmptyPattern: Playwright fixture signature requires destructuring
  context: async ({}, use) => {
    const pathToExtension = path.resolve(
      process.cwd(),
      '.output/chrome-mv3-e2e',
    );
    const userDataDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'frameit-playwright-'),
    );

    const context = await chromium.launchPersistentContext(userDataDir, {
      channel: 'chromium',
      locale: 'en-US',
      viewport: { width: 1440, height: 900 },
      args: [
        '--lang=en-US',
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });

    await use(context);

    await context.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
  },

  serviceWorker: async ({ context }, use) => {
    let [sw] = context.serviceWorkers();
    if (!sw) {
      sw = await context.waitForEvent('serviceworker');
    }
    // Pre-mark onboarding tour completed so existing E2E tests are not blocked by the auto-tour
    await sw.evaluate(async () => {
      const g = globalThis as unknown as {
        chrome: {
          storage: {
            local: {
              set: (items: Record<string, unknown>) => Promise<void>;
            };
          };
        };
      };
      await g.chrome.storage.local.set({
        'frameit:extension-settings': { hasCompletedTour: true },
      });
    });
    await use(sw);
  },

  setTourCompleted: async ({ serviceWorker }, use) => {
    await use(async (completed: boolean) => {
      await serviceWorker.evaluate(async (flag: boolean) => {
        const g = globalThis as unknown as {
          chrome: {
            storage: {
              local: {
                set: (items: Record<string, unknown>) => Promise<void>;
              };
            };
          };
        };
        await g.chrome.storage.local.set({
          'frameit:extension-settings': { hasCompletedTour: flag },
        });
      }, completed);
    });
  },

  triggerExtensionAction: async ({ serviceWorker }, use) => {
    await use(async (page: Page) => {
      await page.bringToFront();
      await serviceWorker.evaluate(async () => {
        const g = globalThis as unknown as {
          chrome: {
            tabs: {
              query: (q: {
                active: boolean;
                currentWindow: boolean;
              }) => Promise<Array<{ id?: number }>>;
            };
            action: {
              onClicked: {
                dispatch: (tab: { id?: number }) => void;
              };
            };
          };
        };
        const [tab] = await g.chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (tab) {
          g.chrome.action.onClicked.dispatch(tab);
        }
      });
    });
  },
});

export const expect = test.expect;
