# playbook
Shared skills, engineering practices, agent instructions, and documentation for Better Apps repositories.

Rulesync generates instructions for Codex, Claude Code, and GitHub Copilot from
`.rulesync/rules/`. Vercel's skills CLI installs and updates selected skills.
The `playbook-sync` command copies shared best practices and runs Rulesync, refusing
to overwrite untracked documentation differences or local edits.

See [repository setup and updates](docs/sync.md) to connect a consuming repository.

For changes here, install dependencies with `pnpm install`, edit rules in
`.rulesync/rules/`, run `pnpm rules:sync`, then run `pnpm verify`. Commit the source
rules and generated instructions together. Best practices remain in `best-practices/`;
the four unfinished pages remain TODO stubs.
