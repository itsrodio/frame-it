import { expect, test } from './fixtures';

test.describe('FrameIt Extension E2E (Shadow DOM & Portals)', () => {
  test('1. injects via background service worker into Shadow DOM, toggles via action click, and closes on hold', async ({
    page,
    testServerUrl,
    triggerExtensionAction,
  }) => {
    await page.goto(testServerUrl);

    const overlayHost = page.locator('frameit-overlay');
    await expect(overlayHost).toHaveCount(0);

    // First click on extension icon injects content script and mounts Shadow DOM UI
    await triggerExtensionAction(page);
    await expect(overlayHost).toHaveCount(1);

    const frameitRoot = overlayHost.locator('#frameit-root');
    const dock = overlayHost.locator('nav');
    await expect(dock).toBeVisible();
    await expect(frameitRoot).toHaveClass(/(light|dark)/);

    const toggleGuidesBtn = overlayHost.getByRole('button', {
      name: 'Toggle layout guides',
    });
    await expect(toggleGuidesBtn).toHaveAttribute('aria-pressed', 'true');

    // Second click on extension icon sends TOGGLE_OVERLAY and unmounts the UI
    await triggerExtensionAction(page);
    await expect(frameitRoot).toHaveCount(0);

    // Third click mounts it back
    await triggerExtensionAction(page);
    await expect(dock).toBeVisible();

    // Hold-to-close button (450ms hold) unmounts the overlay
    const closeBtn = overlayHost.getByRole('button', {
      name: 'Hold to close FrameIt',
    });
    const box = await closeBtn.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(550);
      await page.mouse.up();
    }
    await expect(frameitRoot).toHaveCount(0);
  });

  test('2. renders Popover, Select, and DropdownMenu portals inside Shadow Root (never leaking into document.body) with Tailwind CSS applied', async ({
    page,
    testServerUrl,
    triggerExtensionAction,
  }) => {
    await page.goto(testServerUrl);
    await triggerExtensionAction(page);

    const overlayHost = page.locator('frameit-overlay');
    const popoverTrigger = overlayHost.locator(
      '[data-testid="guides-popover-trigger"]',
    );
    await popoverTrigger.click();

    const popoverContent = overlayHost.locator('[data-slot="popover-content"]');
    await expect(popoverContent).toBeVisible();

    // Verify the popover is physically inside frameit-overlay's shadowRoot and NOT in document.body
    const portalLocation = await page.evaluate(() => {
      const host = document.querySelector('frameit-overlay');
      const inShadow =
        host?.shadowRoot?.querySelector('[data-slot="popover-content"]') !==
        null;
      const leakedInBody =
        document.body.querySelector('[data-slot="popover-content"]') !== null;
      return { inShadow, leakedInBody };
    });
    expect(portalLocation).toEqual({ inShadow: true, leakedInBody: false });

    // Open Max width presets DropdownMenu inside the Popover and verify it also portals into Shadow Root
    const presetsBtn = overlayHost.getByRole('button', {
      name: 'Max width presets',
    });
    await presetsBtn.click();
    await expect(
      overlayHost.locator('[data-slot="dropdown-menu-content"]'),
    ).toBeVisible();

    const menuInShadow = await page.evaluate(() => {
      const host = document.querySelector('frameit-overlay');
      return {
        inShadow:
          host?.shadowRoot?.querySelector(
            '[data-slot="dropdown-menu-content"]',
          ) !== null,
        leakedInBody:
          document.body.querySelector('[data-slot="dropdown-menu-content"]') !==
          null,
      };
    });
    expect(menuInShadow).toEqual({ inShadow: true, leakedInBody: false });
  });

  test('3. protects UI dimensions from host page html { font-size: 8px } overrides (postcss-rem-to-px)', async ({
    page,
    testServerUrl,
    triggerExtensionAction,
  }) => {
    // Load host page with root font-size shrunk to 8px (50% of standard 16px)
    await page.goto(`${testServerUrl}/?rootFontSize=8px`);
    await triggerExtensionAction(page);

    const overlayHost = page.locator('frameit-overlay');
    await overlayHost.locator('[data-testid="guides-popover-trigger"]').click();

    const popoverContent = overlayHost.locator('[data-slot="popover-content"]');
    await expect(popoverContent).toBeVisible();

    // Check computed CSS width/height (unaffected by zoom-in-95 entry transform and host root font-size)
    const dimensions = await page.evaluate(() => {
      const host = document.querySelector('frameit-overlay');
      const popover = host?.shadowRoot?.querySelector(
        '[data-slot="popover-content"]',
      ) as HTMLElement | null;
      const countInput = host?.shadowRoot?.querySelector(
        '#guide-count',
      ) as HTMLElement | null;
      return {
        popoverWidth: popover ? getComputedStyle(popover).width : null,
        inputHeight: countInput ? getComputedStyle(countInput).height : null,
      };
    });

    // w-68 = 17rem -> 272px, h-7 = 1.75rem -> 28px (must NOT shrink to 136px / 14px)
    expect(dimensions).toEqual({
      popoverWidth: '272px',
      inputHeight: '28px',
    });
  });

  test('4. auto-detects the main 1200px page container and snaps to another container via Pick Container (Shift+C)', async ({
    page,
    testServerUrl,
    triggerExtensionAction,
  }) => {
    await page.goto(testServerUrl);
    await triggerExtensionAction(page);

    const overlayHost = page.locator('frameit-overlay');
    await overlayHost.locator('[data-testid="guides-popover-trigger"]').click();

    // Auto-detected main#hero-container (1200px width, 24px horizontal padding)
    await expect(overlayHost.locator('#frameit-root')).toContainText(
      'main#hero-container',
    );
    await expect(overlayHost.locator('#guide-max-size')).toHaveValue('1200');
    await expect(overlayHost.locator('#guide-margin')).toHaveValue('24');

    // Activate Pick Container via button in popover header
    await overlayHost
      .getByRole('button', { name: 'Pick container on page' })
      .click();
    await expect(overlayHost.locator('#frameit-root')).toContainText(
      'Click any container on the page to snap layout guides',
    );

    // Hover and click section#secondary-container (960px width, 16px padding)
    const secondary = page.locator('section#secondary-container');
    await secondary.hover();
    await expect(overlayHost.locator('#frameit-root')).toContainText(
      'section#secondary-container',
    );
    await secondary.click();

    // Re-open popover and verify snapped container updated to section#secondary-container (960px, margin 16)
    await overlayHost.locator('[data-testid="guides-popover-trigger"]').click();
    await expect(overlayHost.locator('#frameit-root')).toContainText(
      'section#secondary-container',
    );
    await expect(overlayHost.locator('#guide-max-size')).toHaveValue('960');
    await expect(overlayHost.locator('#guide-margin')).toHaveValue('16');
  });

  test('5. measures real pixel distance (48px) between two sibling cards in Inspect & Measure mode (Shift+I)', async ({
    page,
    testServerUrl,
    triggerExtensionAction,
  }) => {
    await page.goto(testServerUrl);
    await triggerExtensionAction(page);

    const overlayHost = page.locator('frameit-overlay');
    const inspectBtn = overlayHost.getByRole('button', {
      name: 'Inspect & measure distances',
    });
    await expect(inspectBtn).toBeVisible();

    // Press Shift+I to activate Inspect & Measure mode
    await page.keyboard.press('Shift+KeyI');
    await expect(inspectBtn).toHaveAttribute('aria-pressed', 'true');

    // Click #card-a to lock it, then hover #card-b (48px gap in flex row)
    await page.locator('#card-a').click();
    await page.locator('#card-b').hover();

    const rootText = overlayHost.locator('#frameit-root');
    await expect(rootText).toContainText('div#card-a');
    await expect(rootText).toContainText('div#card-b');
    await expect(rootText).toContainText('200 × 100');
    await expect(rootText).toContainText('48');
  });

  test('6. opens InspectDetailsCard with WCAG contrast, updates format via InspectTool popover, and copies styles', async ({
    page,
    testServerUrl,
    triggerExtensionAction,
  }) => {
    await page.goto(testServerUrl);
    await triggerExtensionAction(page);

    const overlayHost = page.locator('frameit-overlay');
    const inspectBtn = overlayHost.getByRole('button', {
      name: 'Inspect & measure distances',
    });
    await expect(inspectBtn).toBeVisible();

    await page.keyboard.press('Shift+KeyI');
    await expect(inspectBtn).toHaveAttribute('aria-pressed', 'true');

    // Click #card-a to open InspectDetailsCard
    await page.locator('#card-a').click();

    const card = overlayHost.locator('[data-testid="inspect-details-card"]');
    await expect(card).toBeVisible();
    await expect(
      card.locator('[data-testid="inspect-breadcrumbs"]'),
    ).toContainText('div#card-a');
    await expect(
      card.locator('[data-testid="inspect-contrast-badge"]'),
    ).toContainText('AAA');

    // Open InspectTool settings popover in Dock and switch color format to OKLCH and units to rem
    await overlayHost
      .locator('[data-testid="inspect-popover-trigger"]')
      .click();
    await overlayHost
      .locator('[data-testid="dock-inspect-color-oklch"]')
      .click();
    await overlayHost.locator('[data-testid="dock-inspect-unit-rem"]').click();

    await expect(
      card.locator('[data-testid="inspect-copy-text-hex"]'),
    ).toContainText('oklch(');
    await expect(
      card.locator('[data-testid="inspect-copy-padding"]'),
    ).toContainText('1rem');

    // Click Copy Code and verify visual confirmation ("Copied")
    const copyCssBtn = card.locator('[data-testid="inspect-copy-css"]');
    await copyCssBtn.click();
    await expect(copyCssBtn).toHaveClass(/text-emerald/);
  });

  test('7. runs first-launch interactive onboarding tour, persists completion, and opens Help & Shortcuts popover inside Shadow DOM', async ({
    page,
    testServerUrl,
    triggerExtensionAction,
    setTourCompleted,
  }) => {
    await setTourCompleted(false);
    await page.goto(testServerUrl);
    await triggerExtensionAction(page);

    const overlayHost = page.locator('frameit-overlay');
    const tourCard = overlayHost.locator(
      '[data-testid="onboarding-tour-card"]',
    );
    await expect(tourCard).toBeVisible();
    await expect(tourCard).toHaveAttribute('data-tour-active-step', 'inspect');
    await expect(
      tourCard.locator('[data-testid="tour-step-counter"]'),
    ).toHaveText('1/5');

    // Navigate with Next button and ArrowRight through all 5 steps
    await tourCard.locator('[data-testid="tour-next-button"]').click();
    await expect(tourCard).toHaveAttribute('data-tour-active-step', 'guides');

    await page.keyboard.press('ArrowRight');
    await expect(tourCard).toHaveAttribute(
      'data-tour-active-step',
      'design-overlay',
    );

    await page.keyboard.press('ArrowRight');
    await expect(tourCard).toHaveAttribute(
      'data-tour-active-step',
      'page-export',
    );

    await page.keyboard.press('ArrowRight');
    await expect(tourCard).toHaveAttribute('data-tour-active-step', 'help');

    // Finish tour
    await tourCard.locator('[data-testid="tour-next-button"]').click();
    await expect(tourCard).toHaveCount(0);

    // Open Help (?) popover inside Shadow DOM and verify shortcuts + replay tour
    await overlayHost.locator('[data-testid="help-popover-trigger"]').click();
    await expect(
      overlayHost.locator('[data-testid="help-shortcuts-list"]'),
    ).toBeVisible();
    await expect(
      overlayHost.locator('[data-testid="help-report-bug"]'),
    ).toBeVisible();

    await overlayHost.locator('[data-testid="help-start-tour"]').click();
    await expect(tourCard).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(tourCard).toHaveCount(0);
  });
});
