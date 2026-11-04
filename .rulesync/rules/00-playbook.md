---
root: true
targets: ['*']
description: Shared Better Apps engineering instructions
---

# AGENTS.md

## Permission to change guidance

Treat repository rules, agent instructions, skills, and best practices as read-only unless the user explicitly
authorizes a concrete change. This covers this rule itself, every `AGENTS.md` and `CLAUDE.md`, instructions loaded
from other files, and everything in [best-practices/](best-practices/README.md). It applies to creating, editing,
formatting, moving, renaming, and deleting protected files, including changes made by tools or scripts.

When permission is needed, show the proposed changes in a table with **File**, **Before**, and **After** columns.
Give the exact affected wording or paths, with a row for each change. For additions or deletions, mark the absent
side as “absent.” Ask for approval of that table and wait before applying it. If the user has already explicitly
authorized the concrete change, apply only that change. A feature request, review, or failing check does not authorize
changing the rules.

## Repository instructions

- Start at the [best-practices index](best-practices/README.md). For every code change, apply the
  [coding principles](best-practices/principles.md) and [conventions](best-practices/conventions.md).
- Check the [preferred tech stack](best-practices/tech-stack.md) and discuss new libraries before adding them.
- Before adding a script to any `package.json`, get explicit user permission for the script name and command.
  If an existing script or a direct `vp` command covers the task, use it.

## Copy and UX

- Review every new or changed user-facing string with at least one writing skill before opening a PR. Use
  [writing-style-guide](.agents/skills/writing-style-guide/SKILL.md) for interface text, including labels, errors,
  empty states, and accessible names. Use [copy-editing](.agents/skills/copy-editing/SKILL.md) for marketing copy.
  Apply [brand-voice](.agents/skills/brand-voice/SKILL.md) when shaping the voice or
  [deslopify-writing](.agents/skills/deslopify-writing/SKILL.md) when checking for formulaic phrasing.
- Exercise changed user workflows in the running app with the integrated browser. Check desktop and mobile layouts,
  keyboard use, and accessible names.

## Documentation and data

- Update product documentation alongside behavior changes. Keep each page focused on one topic. Review prose, evidence
  ledgers, status tables, and narrative records directly. Reserve executable tests for code and generated artifacts
  that affect behavior, fabrication, or an external interface.
- Treat stale prototype data as disposable. Only migrate or repair it on explicit request. Preserve integration
  credentials and unrelated external configuration during a data reset unless the user explicitly requests a full reset.

## Before opening a PR

- When the change is ready for review, run the relevant focused checks, fix related failures together, and run
  `pnpm verify`.
- Only bypass a Git hook with explicit user permission for an unrelated failure. Run focused checks on the files
  being committed and report the blocker and checks in the handoff.
