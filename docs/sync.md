# Repository setup and updates

Playbook supplies shared documentation, agent instructions, and a catalog of skills.
Each consuming repository chooses when to update and commits the resulting changes.
There is no automatic postinstall or cross-repository write.

## Node runtime

Use the Node version in `.nvmrc`. On Windows, older Node 24 releases can abort after
a successful skills command with `UV_HANDLE_CLOSING`. Node 24.20 fixes the shutdown
bug; the skills updater also passes on Node 26. See the
[Node 24.20 release notes](https://nodejs.org/fr/blog/release/v24.20.0).

With fnm, install and select the pinned version before running package scripts:

```sh
fnm install
fnm use
```

## Connect a repository

Run these commands from a branch in the consuming repository.

Use [the example Node pin](../examples/consumer/.nvmrc) for the repository's `.nvmrc`,
and select that runtime before installing dependencies.

```sh
pnpm add -D @betterapps/playbook@github:betterapps-hq/playbook rulesync@43.5.0 skills@1.7.6
```

Copy the configuration from [examples/consumer/rulesync.jsonc](../examples/consumer/rulesync.jsonc)
into the repository root. Merge the entries from
[package-scripts.json](../examples/consumer/package-scripts.json) into the existing
package.json `scripts` object. Do not replace the existing package.json.

The sync command reads Playbook's rules first and the repository's `.rulesync/`
rules second. Rulesync merges files by name; a local file with the same name
replaces the shared rule, so use distinct names to retain both.

Before generating instructions, preserve the repository's existing instructions:

```sh
pnpm exec rulesync import --targets codexcli --features rules
```

Use `claudecode` or `copilot` instead when that tool's file is authoritative.
Inspect the imported `.rulesync/rules/` files before proceeding. Keep project-only
instructions there and resolve any conflicting requirements deliberately. A fresh
repository needs no import. Generation owns the root AGENTS.md, CLAUDE.md, and
.github/copilot-instructions.md; keep future edits in the source rules.

Existing `best-practices/` documents must match Playbook or be reconciled before the
first sync. Move project-specific documentation to a distinct project-owned path and
update local pointers when appropriate. The sync command refuses differing files;
it does not silently adopt or overwrite them.

```sh
pnpm guidance:sync
pnpm guidance:check
```

Commit the dependency lockfile, configuration, local rule sources, generated
instructions, copied best practices, and `.rulesync/playbook-docs.json`. The latter
records the last copied content so future updates can detect local edits. Do not
ignore it. Stale documentation files are retained for explicit review and removal.

## Install skills

Install selected skills from Playbook. For example:

```sh
pnpm skills:add betterapps-hq/playbook --skill pr handoff show-me -a codex claude-code github-copilot
```

Use `--list` to inspect the catalog first. Select skills explicitly rather than
installing everything by default. The skills CLI records the remote source and
content hashes in `skills-lock.json` and manages the agent-specific links or copies.
Commit its project lockfile and installed project skill files. Use `--copy` if the
environment cannot create links.

For an upstream skill that should track its original author, install directly from
that author's repository:

```sh
pnpm skills:add vercel-labs/agent-skills --skill web-design-guidelines -a codex claude-code github-copilot
```

Do not install two different sources with the same skill name. Playbook's copied
skills are maintained snapshots and may contain local adaptations; updating from
Playbook follows those versions, not the original author's repository.
The copied Agency lockfile is retained at `docs/agency-skills-lock.json` as provenance,
outside the active lockfile path. Keeping it at the root would hide those skills
from the CLI's source catalog.

## Fetch updates

The package-manager lockfile pins the public Playbook Git dependency to a commit.
Ordinary installs restore that revision. Sync uses the installed copy and does not
fetch or silently upgrade it. To fetch shared documentation and rules:

```sh
pnpm guidance:update
pnpm guidance:check
```

Commit the updated dependency lockfile and generated outputs. Skills have an
independent update cycle:

```sh
pnpm skills:check
pnpm skills:update
pnpm skills:remove show-me
```

`skills:update` selects project scope. Global user skills and plugin-bundled skills
are outside this setup. `skills:check` can return a nonzero status when updates exist.
Review changed skills and instructions before committing. Updates can replace local
skill edits; maintain intentional adaptations in Playbook instead.

## Tool responsibilities

- Rulesync reads shared and local rule sources and generates tool-native instructions.
- `playbook-sync` copies Markdown from `best-practices/`, including TODO pages. It
  validates destinations before writing and refuses linked paths or local differences.
- Vercel's skills CLI owns skill installation, removal, provenance, and updates.

The docs copier uses Node's built-in modules because Rulesync generates agent
configuration rather than arbitrary documentation destinations. It runs from the
installed Playbook package and writes only `best-practices/` and its ownership file.

References: [Rulesync input roots](https://github.com/dyoshikawa/rulesync/blob/main/docs/guide/separate-input-root.md)
and [Vercel skills CLI commands](https://github.com/vercel-labs/skills/blob/main/docs/commands.md).
