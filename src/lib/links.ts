export const GITHUB_REPO_URL = 'https://github.com/itsrodio/frame-it';
export const BUG_REPORT_URL = `${GITHUB_REPO_URL}/issues/new?template=bug_report.yml`;
export const FEATURE_REQUEST_URL = `${GITHUB_REPO_URL}/issues/new?template=feature_request.yml`;
export const CHROME_WEB_STORE_URL =
  'https://chromewebstore.google.com/detail/frameit/haepfbidkoiaoapnojbmjcidjhiipdpe';

export function getExtensionVersion(): string {
  try {
    return browser?.runtime?.getManifest?.()?.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export async function openExtensionOptionsPage(): Promise<void> {
  try {
    if (browser?.runtime?.sendMessage) {
      await browser.runtime.sendMessage({ type: 'OPEN_OPTIONS_PAGE' });
      return;
    }
  } catch {
    // Fallback below if called from an extension page without a message listener
  }

  try {
    await browser?.runtime?.openOptionsPage?.();
  } catch {
    // Ignore if unavailable in test environment
  }
}
