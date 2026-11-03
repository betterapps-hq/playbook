import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { syncDocs } from '../scripts/sync-docs.mjs';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'playbook-docs-'));
  t.after(() => {
    if (dirname(resolve(root)) !== resolve(tmpdir())) throw new Error('Unexpected fixture location');
    return rm(root, { recursive: true, force: true });
  });
  const sourceRoot = join(root, 'source');
  const targetRoot = join(root, 'consumer');
  await mkdir(join(sourceRoot, 'best-practices'), { recursive: true });
  await mkdir(targetRoot);
  await writeFile(join(sourceRoot, 'best-practices/conventions.md'), 'shared');
  return { sourceRoot, targetRoot };
}

test('copies documentation, checks drift, and applies an upstream update', async (t) => {
  const options = await fixture(t);
  await assert.rejects(syncDocs({ ...options, check: true }), /differs/);
  await syncDocs(options);
  await syncDocs({ ...options, check: true });
  await writeFile(join(options.sourceRoot, 'best-practices/conventions.md'), 'updated');
  await syncDocs(options);
  assert.equal(await readFile(join(options.targetRoot, 'best-practices/conventions.md'), 'utf8'), 'updated');
});

test('refuses to overwrite existing or locally modified documentation', async (t) => {
  const options = await fixture(t);
  await mkdir(join(options.targetRoot, 'best-practices'));
  const destination = join(options.targetRoot, 'best-practices/conventions.md');
  await writeFile(destination, 'project rules');
  await assert.rejects(syncDocs(options), /Preserve local changes/);
  assert.equal(await readFile(destination, 'utf8'), 'project rules');
  await writeFile(destination, 'shared');
  await syncDocs(options);
  await writeFile(destination, 'local edits');
  await assert.rejects(syncDocs(options), /Preserve local changes/);
});

test('recognizes managed docs after a Windows checkout changes line endings', async (t) => {
  const options = await fixture(t);
  const source = join(options.sourceRoot, 'best-practices/conventions.md');
  const target = join(options.targetRoot, 'best-practices/conventions.md');
  await writeFile(source, 'shared\n');
  await syncDocs(options);
  await writeFile(target, 'shared\r\n');
  await syncDocs({ ...options, check: true });
  await writeFile(source, 'updated\n');
  await syncDocs(options);
  assert.equal(await readFile(target, 'utf8'), 'updated\n');
});

test('generates instructions with both shared and project rules in a consumer', async (t) => {
  const { targetRoot } = await fixture(t);
  await mkdir(join(targetRoot, '.rulesync/rules'), { recursive: true });
  await writeFile(join(targetRoot, '.rulesync/rules/90-project.md'),
    '---\nroot: true\ntargets: ["*"]\ndescription: Project rules\n---\n\nKeep project-specific constraints.\n');
  await writeFile(join(targetRoot, 'rulesync.jsonc'), JSON.stringify({
    targets: ['codexcli', 'claudecode', 'copilot'], features: ['rules'], delete: false,
  }));
  const command = fileURLToPath(new URL('../scripts/sync.mjs', import.meta.url));
  execFileSync(process.execPath, [command], { cwd: targetRoot });
  execFileSync(process.execPath, [command, '--check'], { cwd: targetRoot });
  for (const name of ['AGENTS.md', 'CLAUDE.md', '.github/copilot-instructions.md']) {
    const content = await readFile(join(targetRoot, name), 'utf8');
    assert.match(content, /Permission to change guidance/);
    assert.match(content, /Keep project-specific constraints/);
  }
  assert.equal(await readFile(join(targetRoot, 'best-practices/api-layer.md'), 'utf8'), '<TODO>');
});
