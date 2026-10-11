import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'bun:test';

describe('build targets', () => {
  it('serves relative assets and the unchanged worklet under LocalWeb and Pages', async () => {
    const directory = mkdtempSync(join(tmpdir(), '40hz-build-'));
    try {
      for (const base of ['./', '/40HZ/']) {
        const outDir = join(directory, base === './' ? 'local' : 'pages');
        const child = Bun.spawn([process.execPath, 'scripts/build-frontend.ts', '--base', base, '--outDir', outDir], {stdout:'pipe', stderr:'pipe'});
        const errors = new Response(child.stderr).text();
        expect(await child.exited, await errors).toBe(0);
        const html = readFileSync(join(outDir, 'index.html'), 'utf8');
        expect(html).not.toContain('%BASE_URL%');
        const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match => match[1]!);
        for (const ref of refs.filter(ref => !ref.startsWith('http'))) {
          expect(ref.startsWith('./')).toBe(true);
          expect(readFileSync(join(outDir, ref)).byteLength).toBeGreaterThan(0);
        }
        const worklet = readdirSync(outDir).find(name => name.startsWith('isochronic-processor-'))!;
        expect(readFileSync(join(outDir, worklet))).toEqual(readFileSync('src/audio/worklets/isochronic-processor.js'));
        const main = readdirSync(outDir).filter(name => name.endsWith('.js') && name !== worklet).map(name=>readFileSync(join(outDir,name),'utf8')).join('\n');
        expect(main).toContain(worklet);
      }
    } finally { rmSync(directory, {recursive:true,force:true}); }
  });

  it('keeps PWA paths relative so both targets resolve them correctly', () => {
    const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8'));
    expect(manifest.start_url).toBe('.');
    expect(manifest.icons.map((icon:{src:string}) => icon.src)).toEqual(['icon.svg']);
  });
});
