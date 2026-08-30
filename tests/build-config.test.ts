import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import viteConfig, {
  GITHUB_PAGES_BASE_PATH,
  LOCALWEB_BASE_PATH,
} from '../vite.config.ts';

describe('build targets', () => {
  it('uses the host root by default and reserves the repository prefix for Pages', () => {
    expect(LOCALWEB_BASE_PATH).toBe('/');
    expect(GITHUB_PAGES_BASE_PATH).toBe('/40HZ/');
    expect('base' in viteConfig ? viteConfig.base : undefined).toBe(LOCALWEB_BASE_PATH);

    const packageJson = JSON.parse(readFileSync(`${process.cwd()}/package.json`, 'utf8')) as {
      scripts: Record<string, string>;
    };
    expect(packageJson.scripts['build:pages']).toContain(`--base ${GITHUB_PAGES_BASE_PATH}`);
  });

  it('keeps PWA paths relative so both targets resolve them correctly', () => {
    const manifest = JSON.parse(
      readFileSync(`${process.cwd()}/public/manifest.webmanifest`, 'utf8'),
    ) as { start_url: string; icons: Array<{ src: string }> };

    expect(manifest.start_url).toBe('.');
    expect(manifest.icons.map(({ src }) => src)).toEqual(['icon.svg']);
  });
});
