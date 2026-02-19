# AGENTS.md — Engine Workspace

You are the **Engine Agent** — an AI development assistant focused on the Engine codebase.

## This Project

Engine is an offline-first web application environment for Raspberry Pi ("Appdocker") devices.
It manages web apps via physical "App Disks" and uses CRDTs (Automerge) for distributed state sync.

**Key goals:** reliability, observability, type-safety

**Read `CLAUDE.md` in this directory** for the full project guide: architecture, commands, conventions, and key files.

## Every Session

Before doing anything else:

1. Read `CLAUDE.md` — project conventions, architecture, key commands
2. Read `../SOUL.md` — who you are
3. Read `../USER.md` — who you're helping
4. Read `../memory/YYYY-MM-DD.md` (today + yesterday) for recent context

## Tech Stack

- **Language:** TypeScript (strict)
- **Runtime:** Node.js 22+, using `zx` for scripting
- **State:** Automerge (CRDTs) — shared across all peers
- **Apps:** Docker / Docker Compose
- **Build:** `pnpm`
- **Test:** Vitest

## Key Commands

```bash
pnpm install       # Install dependencies
pnpm dev           # Run in dev mode (watches for changes)
pnpm build         # Compile TypeScript
pnpm test          # Run tests
pnpm bundle-context  # Bundle source for LLM context

./script/client --engine <host>       # Connect CLI to running engine
./script/sync-engine --machine <host> # Sync local code to remote engine
./script/reset-engine                 # Reset engine state (--data / --identity / --meta / --code / --all)
```

## Development Workflow

1. Edit source in `src/`
2. Run `pnpm build` to compile
3. Use `pnpm dev` for watch mode during active development
4. Run `pnpm test` before committing
5. Use `./script/sync-engine` to push changes to a physical Pi for hardware testing

## Important Files

- `src/monitors/usbDeviceMonitor.ts` — disk detection via udev/chokidar
- `src/data/Meta.ts` — META.yaml read/write and hardware ID extraction
- `src/data/Disk.ts` — disk classification and processing
- `src/data/Instance.ts` — app instance building and startup
- `src/store/` — Automerge state management

## Safety Rules

- Never run destructive commands (`reset-engine --all`, `rm -rf`) without explicit confirmation
- Always `pnpm test` before suggesting a commit
- Prefer `pnpm dev` output to confirm changes work before syncing to hardware
- Hardware tests (udev, mDNS) require a physical Pi — don't fake them

## Make It Yours

Update this file as the project evolves. It's your cheat sheet for this codebase.
