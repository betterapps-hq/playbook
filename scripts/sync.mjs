#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncDocs } from './sync-docs.mjs';

const flags = process.argv.slice(2);
if (flags.some((flag) => flag !== '--check')) {
  console.error('Usage: playbook-sync [--check]');
  process.exitCode = 1;
} else {
  try {
    await syncDocs({ check: flags.includes('--check') });
    const sourceRoot = fileURLToPath(new URL('../.rulesync', import.meta.url));
    const require = createRequire(import.meta.url);
    const cli = join(dirname(require.resolve('rulesync')), 'cli/index.js');
    const result = spawnSync(process.execPath, [
      cli, 'generate', '--input-roots', sourceRoot, '.rulesync', ...flags,
    ], { stdio: 'inherit' });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
