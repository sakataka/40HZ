import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export const LOCALWEB_BASE_PATH = '/';
export const GITHUB_PAGES_BASE_PATH = '/40HZ/';

export default defineConfig({
  base: LOCALWEB_BASE_PATH,
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: true,
  },
});
