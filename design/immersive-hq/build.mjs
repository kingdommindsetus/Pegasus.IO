// Builds the HQ preview in two shapes:
//   dist/                       plain static site (open index.html locally)
//   .vercel/output/             Vercel Build Output API: static site + /api/hq-chat function
// Deploy with: vercel deploy --prebuilt
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp('index.html', 'dist/index.html');
await cp('assets', 'dist/assets', { recursive: true });

const out = '.vercel/output';
await rm(`${out}/static`, { recursive: true, force: true });
await rm(`${out}/functions`, { recursive: true, force: true });
await cp('dist', `${out}/static`, { recursive: true });

// The Claude reply function, bundled with the Anthropic SDK into one file.
const fn = `${out}/functions/api/hq-chat.func`;
await mkdir(fn, { recursive: true });
await build({
  entryPoints: ['functions/hq-chat.mjs'],
  outfile: `${fn}/index.mjs`,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
  logLevel: 'warning',
});
await writeFile(`${fn}/.vc-config.json`, JSON.stringify({
  runtime: 'nodejs22.x',
  handler: 'index.mjs',
  launcherType: 'Nodejs',
  shouldAddHelpers: true,
  maxDuration: 30,
}, null, 2));
await writeFile(`${out}/config.json`, JSON.stringify({ version: 3 }, null, 2));
console.log('built dist/ and .vercel/output (static + api/hq-chat)');
