#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const packageRoot = fileURLToPath(new URL('../', import.meta.url));
const hash = (content) => createHash('sha256').update(content.toString('utf8').replace(/\r\n/g, '\n')).digest('hex');

async function readOptional(path) {
  try { return await readFile(path); }
  catch (error) { if (error.code === 'ENOENT') return undefined; throw error; }
}

async function rejectLinks(root, relativePath) {
  let current = root;
  for (const segment of relativePath.split('/')) {
    current = join(current, segment);
    try {
      if ((await lstat(current)).isSymbolicLink()) throw new Error(`Refusing linked destination: ${current}`);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}

async function collectFiles(root, prefix = '') {
  const files = [];
  for (const entry of await readdir(join(root, prefix), { withFileTypes: true })) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await collectFiles(root, relativePath));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(relativePath);
  }
  return files.sort();
}

export async function syncDocs({ sourceRoot = packageRoot, targetRoot = process.cwd(), check = false } = {}) {
  sourceRoot = resolve(sourceRoot);
  targetRoot = resolve(targetRoot);
  if (sourceRoot === targetRoot) return;
  const statePath = '.rulesync/playbook-docs.json';
  await rejectLinks(targetRoot, statePath);
  const stateBytes = await readOptional(join(targetRoot, statePath));
  const previous = stateBytes ? JSON.parse(stateBytes.toString()) : {};
  const next = {};
  const writes = [];
  for (const name of await collectFiles(join(sourceRoot, 'best-practices'))) {
    const relativePath = `best-practices/${name}`;
    await rejectLinks(targetRoot, relativePath);
    const desired = await readFile(join(sourceRoot, relativePath));
    const existing = await readOptional(join(targetRoot, relativePath));
    next[relativePath] = hash(desired);
    if (existing && hash(existing) === next[relativePath]) continue;
    if (check) throw new Error(`Shared documentation differs: ${relativePath}`);
    if (existing && hash(existing) !== previous[relativePath]) {
      throw new Error(`Preserve local changes before syncing: ${relativePath}`);
    }
    writes.push({ relativePath, desired });
  }
  // Check every destination before writing any document. Do not remove old files.
  for (const { relativePath, desired } of writes) {
    const destination = join(targetRoot, relativePath);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, desired);
  }
  if (!check) {
    await mkdir(dirname(join(targetRoot, statePath)), { recursive: true });
    await writeFile(join(targetRoot, statePath), `${JSON.stringify(next, null, 2)}\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const flags = process.argv.slice(2);
    if (flags.some((flag) => flag !== '--check')) throw new Error('Usage: playbook-docs [--check]');
    await syncDocs({ check: flags.includes('--check') });
    console.log('Shared documentation is in sync.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
