import { act } from 'react';
import ReactDOM from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PageExportTool } from '@/components/overlay/dock/page-export-tool';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PortalContext } from '@/lib/portal-context';

describe('PageExportTool', () => {
  let container: HTMLDivElement;
  let root: ReactDOM.Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = ReactDOM.createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('copies SVG to clipboard when clicking the main dock button', async () => {
    const onBuildPageSvg = vi.fn().mockResolvedValue('<svg>page</svg>');
    const onCopySvg = vi.fn().mockResolvedValue(true);
    const onSaveSvg = vi.fn();

    await act(async () => {
      root.render(
        <PortalContext.Provider value={container}>
          <TooltipProvider>
            <PageExportTool
              onBuildPageSvg={onBuildPageSvg}
              onCopySvg={onCopySvg}
              onSaveSvg={onSaveSvg}
            />
          </TooltipProvider>
        </PortalContext.Provider>,
      );
    });

    const btn = container.querySelector(
      '[data-testid="page-export-button"]',
    ) as HTMLButtonElement;
    expect(btn).not.toBeNull();

    await act(async () => {
      btn.click();
    });

    expect(onBuildPageSvg).toHaveBeenCalledTimes(1);
    expect(onCopySvg).toHaveBeenCalledWith('<svg>page</svg>');
    expect(onSaveSvg).not.toHaveBeenCalled();
  });

  it('switches between SVG and PNG formats and saves or copies from dropdown', async () => {
    const pngBlob = new Blob(['png-data'], { type: 'image/png' });
    const onBuildPageSvg = vi.fn().mockResolvedValue('<svg>full</svg>');
    const onCapturePagePng = vi.fn().mockResolvedValue(pngBlob);
    const onCopySvg = vi.fn().mockResolvedValue(true);
    const onCopyPng = vi.fn().mockResolvedValue(true);
    const onSaveSvg = vi.fn();
    const onSavePng = vi.fn();

    await act(async () => {
      root.render(
        <PortalContext.Provider value={container}>
          <TooltipProvider>
            <PageExportTool
              onBuildPageSvg={onBuildPageSvg}
              onCapturePagePng={onCapturePagePng}
              onCopySvg={onCopySvg}
              onCopyPng={onCopyPng}
              onSaveSvg={onSaveSvg}
              onSavePng={onSavePng}
            />
          </TooltipProvider>
        </PortalContext.Provider>,
      );
    });

    const trigger = container.querySelector(
      '[data-testid="page-export-popover-trigger"]',
    ) as HTMLButtonElement;
    await act(async () => {
      trigger.click();
    });

    // Default format is SVG -> save .svg
    const saveBtn = container.querySelector(
      '[data-testid="page-export-save"]',
    ) as HTMLButtonElement;
    expect(saveBtn.textContent).toContain('.svg');

    await act(async () => {
      saveBtn.click();
    });

    expect(onSaveSvg).toHaveBeenCalledWith(
      '<svg>full</svg>',
      expect.stringMatching(/\.svg$/),
    );
    expect(
      container.querySelector('[data-testid="page-export-save"]'),
    ).toBeNull();

    // Reopen dropdown, switch format to PNG, and save .png
    await act(async () => {
      trigger.click();
    });
    const pngToggle = container.querySelector(
      '[data-testid="page-export-format-png"]',
    ) as HTMLButtonElement;
    expect(pngToggle).not.toBeNull();

    await act(async () => {
      pngToggle.click();
    });

    const savePngBtn = container.querySelector(
      '[data-testid="page-export-save"]',
    ) as HTMLButtonElement;
    expect(savePngBtn.textContent).toContain('.png');

    await act(async () => {
      savePngBtn.click();
    });

    expect(onCapturePagePng).toHaveBeenCalledTimes(1);
    expect(onSavePng).toHaveBeenCalledWith(
      pngBlob,
      expect.stringMatching(/\.png$/),
    );

    // Clicking main dock button now copies PNG to clipboard
    const mainBtn = container.querySelector(
      '[data-testid="page-export-button"]',
    ) as HTMLButtonElement;
    await act(async () => {
      mainBtn.click();
    });

    expect(onCopyPng).toHaveBeenCalledWith(pngBlob);
  });

  it('shows an error message inside popover when copy fails', async () => {
    const onBuildPageSvg = vi.fn().mockResolvedValue('<svg>full</svg>');
    const onCopySvg = vi.fn().mockResolvedValue(false);

    await act(async () => {
      root.render(
        <PortalContext.Provider value={container}>
          <TooltipProvider>
            <PageExportTool
              onBuildPageSvg={onBuildPageSvg}
              onCopySvg={onCopySvg}
            />
          </TooltipProvider>
        </PortalContext.Provider>,
      );
    });

    const btn = container.querySelector(
      '[data-testid="page-export-button"]',
    ) as HTMLButtonElement;

    await act(async () => {
      btn.click();
    });

    const err = container.querySelector('[data-testid="page-export-error"]');
    expect(err).not.toBeNull();
  });
});
