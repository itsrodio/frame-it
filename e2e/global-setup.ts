import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export default function globalSetup() {
  const rootDir = process.cwd();
  const buildDir = path.resolve(rootDir, '.output/chrome-mv3');
  const e2eBuildDir = path.resolve(rootDir, '.output/chrome-mv3-e2e');

  // Build the extension so E2E always tests the latest bundle
  execSync('pnpm build', { cwd: rootDir, stdio: 'inherit' });

  // Copy to an isolated E2E build directory and grant localhost host_permissions
  // so Playwright can trigger chrome.action.onClicked programmatically without a native C++ toolbar click.
  fs.rmSync(e2eBuildDir, { recursive: true, force: true });
  fs.cpSync(buildDir, e2eBuildDir, { recursive: true });

  const manifestPath = path.join(e2eBuildDir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  manifest.host_permissions = ['http://127.0.0.1/*', 'http://localhost/*'];
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}
