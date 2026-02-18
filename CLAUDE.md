# Engine Project Guide

## Overview
Engine is an offline-first web application environment designed for Raspberry Pi devices ("Appdockers"). It manages web apps via physical "App Disks" and uses CRDTs (Automerge) for distributed state synchronization between peers.

Key goals: reliability, observability, type-safety

## Documentation
- **[README.md](README.md)**: Core concepts, installation, and usage.
- **[Architecture Guide](docs/ARCHITECTURE.md)**: Technical design, Automerge state management, and data flow.
- **[Command Reference](docs/COMMANDS.md)**: CLI commands (`ls`, `send`, `createInstance`, etc.).
- **[Provisioning Scripts](docs/SCRIPTS.md)**: Scripts for building engines, app disks, and services.
- **[Solution Description](docs/SOLUTION_DESCRIPTION.md)**: High-level requirements and solution vision.
- **[Source Bundle](docs/source-bundle.md)**: Bundled source code context.

## Key Commands
- `pnpm install`: Install dependencies.
- `pnpm dev`: Run in development mode.
- `pnpm build`: Build the project.
- `pnpm test`: Run tests.
- `./script/client --engine <host>`: Connect the CLI to a running engine.
- `./script/sync-engine --machine <host>`: Sync local code to a remote engine.
- `./script/reset-engine`: Reset engine state. Options: `--data` (store), `--identity` (UUIDs), `--meta` (META.yaml), `--code` (re-clone repo), `--all` (full reset).