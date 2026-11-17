import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

const REM_REGEX = /"[^"]+"|'[^']+'|url\([^)]+\)|(-?\d*\.?\d+)rem\b/g;
const replaceRem = (str: string, baseValue = 16) =>
  str.replace(REM_REGEX, (match, rem) => {
    if (rem === undefined) return match;
    const val = Number.parseFloat(rem) * baseValue;
    return val === 0 ? '0' : `${val}px`;
  });

// See https://wxt.dev/api/reference/wxt/interfaces/inlineconfig.html
export default defineConfig({
  manifest: {
    name: 'FrameIt',
    description:
      'Figma-style layout grids, smart container detection, and live element spacing inspector for any website.',
    permissions: ['activeTab', 'scripting'],
    action: {},
    web_accessible_resources: [
      {
        resources: ['content-scripts/*.css'],
        matches: ['<all_urls>'],
      },
    ],
  },
  srcDir: 'src',
  modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons'],
  vite: () => ({
    plugins: [tailwindcss()],
    css: {
      postcss: {
        plugins: [
          {
            postcssPlugin: 'postcss-rem-to-px',
            Declaration(decl) {
              if (decl.value.includes('rem')) {
                decl.value = replaceRem(decl.value);
              }
            },
            AtRule(atRule) {
              if (atRule.params.includes('rem')) {
                atRule.params = replaceRem(atRule.params);
              }
            },
          },
        ],
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }),
});
