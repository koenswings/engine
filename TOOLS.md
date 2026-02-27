# TOOLS.md — Engine Developer

## Environment

- **Pi hostname:** engine-pi (or check `hostname` in the container)
- **Projects root (host):** `/home/pi/idea/`
- **Projects root (container):** `/home/node/workspace/`
- **Engine repo:** `/home/node/workspace/agents/agent-engine-dev`
- **Org root:** `/home/node/workspace/` (CONTEXT.md, BACKLOG.md, proposals/, etc.)
- **OpenClaw data:** `/root/.openclaw/` (container)

## SSH

- Pi is on Tailscale. Connect via: `ssh pi@<tailscale-ip>`
- Use `./script/sync-engine --machine <host>` to push code to the Pi

## Key Paths

- Engine source: `src/`
- Tests: `src/**/*.test.ts`
- Built output: `dist/`
- Udev rules: check Engine docs for hardware-specific paths

## Notes

_(Add local setup quirks here as you discover them — device names, port numbers, hardware-specific observations.)_
