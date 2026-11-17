import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

export default defineConfig({
  plugins: [WxtVitest()],
  define: {
    IS_REACT_ACT_ENVIRONMENT: 'true',
  },
  test: {
    environment: 'happy-dom',
    mockReset: true,
    restoreMocks: true,
  },
});
