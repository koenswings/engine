# IDEA Virtual Company — Brainstorm

*Brainstorming session — no configuration changes made yet.*

**OpenClaw** is the self-hosted AI assistant platform already running on this Pi at `/home/pi/openclaw`. It manages multiple AI agents, each tied to a workspace (a codebase directory), and is accessible from any device on the Tailscale network at `https://openclaw-pi.tail2d60.ts.net`.

**IDEA** (Initiative for Digital Education in Africa) is the charity this virtual company serves. It deploys Raspberry Pi-based offline school computers running Engine and Console into rural African schools.

The goal is to configure OpenClaw to run the IDEA virtual company: multiple agents, each playing a specific role, coordinating through shared files and a CEO approval loop.

---

## How OpenClaw Already Maps to the Virtual Company

OpenClaw's agent model is a direct fit:

| OpenClaw concept | Virtual company concept |
|------------------|-------------------------|
| Agent (`id` in openclaw.json) | A team member / role |
| `workspace` | The codebase or work area that role owns |
| `AGENTS.md` in the workspace | The role definition — instructions, responsibilities, constraints |
| `DEFAULT_PERMISSION_MODE=plan` (already set in compose.yaml) | CEO approval loop — agents always show their plan before acting |
| Browser UI at tailscale URL | The "office" — you open an agent's tab to interact with that role |

**The plan permission mode is the key insight.** It is already set. Agents never act unilaterally — they always propose what they intend to do and wait for approval. This IS the CEO approval mechanism, built in.

For code changes specifically, the additional layer is **GitHub branch protection**: agents open PRs on feature branches, and only you can merge to `main`. This prevents any code from landing without explicit review.

---

## The Agent Roster

Each IDEA role becomes one agent entry in `openclaw.json`, with its own workspace and `AGENTS.md`.

**Full agent roster:**

| Agent id | Workspace (host path) | Role |
|----------|----------------------|------|
| `engine-dev` | `/home/pi/projects/engine` | Engine software developer |
| `console-dev` | `/home/pi/projects/console-ui` | Console UI developer (Solid.js, Chrome Extension) |
| `site-dev` | `/home/pi/projects/website` | Builds and maintains the IDEA public website |
| `quality-manager` | `/home/pi/projects/hq/quality-manager` | Cross-project quality and consistency reviewer |
| `teacher` | `/home/pi/projects/hq/teacher` | Creates offline teacher guides for rural schools |
| `fundraising` | `/home/pi/projects/hq/fundraising` | Researches grants, tracks donors, drafts proposals |
| `communications` | `/home/pi/projects/hq/communications` | All external communication and public presence |

*Note: existing `engine` and `console-ui` entries in openclaw.json must be renamed to `engine-dev` and `console-dev`.*

The `quality-manager`, `teacher`, `fundraising`, and `communications` agents are given subdirectories inside `hq/` as their workspace. This gives each its own `AGENTS.md` while keeping them inside the shared HQ directory tree. Because `/home/pi/projects` is fully mounted into the container as `/home/node/workspace`, every agent can read any other project if its AGENTS.md instructs it to — the QM in particular needs this to review code across all repos.

---

## The HQ Directory

`/home/pi/projects/hq/` is the company's coordination hub. It is a git repo in its own right. Structure:

```
hq/
  BACKLOG.md                      ← master backlog, covers all projects
  ROLES.md                        ← summary of all agents and their scope
  PROCESS.md                      ← how ideas become backlog items
  standups/
    2026-02-20-morning.md
  design/                         ← RFC-style design docs for complex features
  proposals/                      ← new ideas awaiting CEO approval
    YYYY-MM-DD-<topic>.md
  quality-manager/
    AGENTS.md                     ← quality manager role definition
  teacher/
    AGENTS.md                     ← teacher role definition
    getting-started.md
    kolibri-guide.md
    nextcloud-guide.md
  fundraising/
    AGENTS.md                     ← fundraising role definition
    opportunities.md
    grant-tracker.md
    proposals/
  communications/
    AGENTS.md                     ← communications manager role definition
    brand/
      tone-of-voice.md            ← how IDEA writes and speaks
      key-messages.md             ← what IDEA is, why it matters, our asks
    website/                      ← content drafts for site-dev
    donors/                       ← newsletter and impact report templates
    grants/narratives/            ← grant application narrative sections
    partners/                     ← partner outreach templates
    press/                        ← press releases and media kit
```

The `BACKLOG.md` is the single source of truth for what needs to be done across all projects. Any agent can propose additions; only the CEO approves them.

---

## AGENTS.md — The Role Definition File

Each workspace has an `AGENTS.md` that shapes the agent's behaviour. For example:

**`/home/pi/projects/engine/AGENTS.md`** (Engine Developer):
- You are the Engine software developer for IDEA
- Tech stack: TypeScript, Node.js, Automerge, Docker, zx
- Your work lives on feature branches; open a PR for every change
- Every PR must include: code changes, tests, and updated documentation
- For complex features, propose a design doc in `hq/design/` first
- The engine runs unattended in rural schools with no IT support — reliability is paramount
- Consult `hq/BACKLOG.md` for approved work items

**`/home/pi/projects/hq/quality-manager/AGENTS.md`** (Quality Manager):
- You are the Quality Manager for IDEA
- Review open PRs across `/home/node/workspace/engine` and `/home/node/workspace/console-ui`
- Check: tests present, docs updated, change consistent with architecture, offline resilience preserved
- Raise concerns in PR comments; never approve or merge — that is the CEO's role
- Read the latest standup from `../standups/` before each review session

**`/home/pi/projects/hq/fundraising/AGENTS.md`** (Fundraising Manager):
- You are the Fundraising Manager for IDEA, a charity deploying offline school computers in rural Africa
- Research and track grant opportunities: EU development funds, UNESCO, UNICEF, Gates Foundation, Raspberry Pi Foundation, national development agencies
- All outputs are documents for CEO review — never make external contact autonomously
- Maintain `opportunities.md` and `grant-tracker.md`
- Draft proposals in `proposals/` as PRs for CEO approval before any submission
- Hand narrative writing to the Communications Manager with a clear brief

**`/home/pi/projects/hq/communications/AGENTS.md`** (Communications Manager):
- You are the Communications Manager for IDEA, a charity deploying offline school computers in rural Africa
- Define and maintain IDEA's brand voice (`brand/tone-of-voice.md`, `brand/key-messages.md`)
- Draft all external-facing content: website, donor newsletters, grant narratives, partner outreach, press
- All outputs are drafts for CEO review — never send, post, or publish anything externally
- Website content goes in `website/content-drafts/` as PRs for `site-dev` to implement
- Grant narratives are written from briefs provided by the Fundraising Manager in `hq/fundraising/proposals/`
- The Quality Manager reviews your drafts for factual consistency with project documents

**`/home/pi/projects/hq/teacher/AGENTS.md`** (Teacher):
- You are the Teacher documentation specialist for IDEA
- Audience: teachers in rural African schools, limited technology experience, no internet
- Guides must work fully offline — they will be served from the Engine or printed
- Cover the deployed apps: Kolibri, Nextcloud, offline Wikipedia
- Keep language simple and concrete. Use screenshots or diagrams where possible.
- Flag any guide that needs review by an actual teacher before deployment

---

## CEO Approval — Two Layers

**Layer 1 — Plan mode (already active):** Every agent shows its plan before acting. You approve or modify before it executes. This applies to all work.

**Layer 2 — GitHub PRs (to be set up):** All code and document changes land on feature branches. The agent opens a PR. You review on GitHub and merge (or request changes). Branch protection on `main` in every repo enforces this mechanically.

For complex engine or console changes, a third gate applies:
1. Agent proposes a design doc in `hq/design/` → you approve via PR merge
2. Implementation PR is raised only after the design is merged

---

## CEO Tools & Daily Workflow

### Tool Stack

| Tool | Purpose | When you use it |
|------|---------|-----------------|
| **OpenClaw Web UI** | Direct agents, approve plans, run standups | Daily — primary interface |
| **GitHub** | Review and merge PRs (code and documents) | Whenever agents raise PRs |
| **Terminal (SSH / Tailscale SSH)** | Pi administration, Docker, logs | Occasional — infrastructure changes only |

### Using the OpenClaw Web UI

Access at `https://openclaw-pi.tail2d60.ts.net` from any device on the Tailscale network.

The UI presents each agent as a separate chat tab. Your workflow in each tab:

| Step | What you do | What happens |
|------|-------------|--------------|
| **Direct** | Open an agent's tab, type a task | e.g. "Pick the next backlog item and propose your approach" |
| **Review plan** | Agent proposes exactly what it will do before acting | This is `DEFAULT_PERMISSION_MODE=plan` — the agent always stops here |
| **Approve / redirect** | Type "go ahead" or modify the plan | Agent executes only after your explicit approval |
| **Observe** | Watch tool calls, file edits, git operations stream in real time | You can interrupt at any point |

The "A return + waiting emoticon" in the chat is the agent presenting its plan and waiting for your go/no-go. It is not a bug — it is the CEO approval loop working as intended.

**Which agent tab to use for what:**

| Agent tab | Use it to... |
|-----------|-------------|
| `engine-dev` | Assign Engine coding tasks, review technical proposals |
| `console-dev` | Assign Console UI tasks |
| `site-dev` | Assign website content and build tasks |
| `quality-manager` | Request a cross-project review or PR analysis |
| `fundraising` | "What grants should we be applying for right now?" |
| `communications` | "Draft a donor update for this month" |
| `teacher` | "Write a Kolibri getting-started guide for teachers" |

### A Typical CEO Day

```
Morning
  └─ OpenClaw: standup agent → "run morning standup" → approve plan → read result
  └─ GitHub: review any PRs raised overnight → merge or comment

During the day
  └─ OpenClaw: fundraising → "what grants close this quarter?" → approve → review output
  └─ OpenClaw: engine-dev → "pick the next backlog item" → approve → it opens a PR
  └─ GitHub: quality-manager has commented on a PR → read, decide, merge

As needed
  └─ OpenClaw: communications → "draft a donor update from this month's commits" → approve
  └─ GitHub: review the comms draft PR, edit inline, merge when satisfied
```

**Key mental model:** OpenClaw is where you direct work and approve plans. GitHub is where you review and accept finished work.

---

## Complementary Open Source Tools

OpenClaw's web UI is the primary dashboard — there are no third-party dashboards built specifically for it. These tools add useful capability around it:

### Portainer — Docker management UI
The most immediately useful addition. Gives a web UI to see all running containers, their health, logs, and resource usage — without needing SSH.

- Runs as a Docker container alongside OpenClaw
- Useful for monitoring the OpenClaw container itself and checking logs

### Plane — project management (open source Jira/Linear alternative)
If `hq/BACKLOG.md` as a markdown file starts to feel limiting, Plane provides a proper board and backlog UI with issues, cycles, and modules. Self-hostable on the Pi.

### n8n — workflow automation
Useful for automating the standup trigger, scheduled agent prompts, or GitHub notifications. Rather than running `./standup morning` manually, n8n can trigger it on a schedule.

### Grafana — monitoring dashboards
Visibility into Pi health (CPU, memory, temperature, disk usage) — relevant for an always-on device deployed in a rural school. Pairs with Prometheus for metrics collection.

---

## Daily Standups — Practical Mechanics

A standup is an agent session seeded with a specific context prompt. The simplest implementation is a script you run manually (or via a systemd timer) that:

1. Reads `hq/BACKLOG.md`, recent git commits across all repos, open PRs, and the last standup
2. Opens a Claude session (in the context of a dedicated `standup` agent, or any agent) with that context
3. The agent produces a structured standup document saved to `hq/standups/YYYY-MM-DD-morning.md`
4. You read it, add your priorities or decisions as a CEO comment, and commit

Whether to automate this via a cron/systemd timer or keep it manual is an open question — see below.

---

## Decisions

1. **Rename `engine` → `engine-dev`?** ✅ Yes.
2. **Rename `console-ui` → `console-dev`?** ✅ Yes. Website agent is `site-dev`.
3. **Standup: automated or manual?** ✅ Manual trigger for now — `./standup morning`.
4. **HQ repo: public or private?** ✅ Public. All repos under the GitHub org will be public.
5. **GitHub Organisation name?** → **`idea-edu-africa`** (not yet created). Repos currently live under the personal account `koenswings` and will be transferred to the org when it is created. See availability table:

   | Name | Available? |
   |------|-----------|
   | `idea-africa` | ❌ Taken (existing "IDEA Africa" org) |
   | `idea-edu-africa` | ✅ Available |
   | `idea-offline` | ✅ Available |
   | `offline-schools` | ✅ Available |
   | `appdocker` | ❌ Taken |

6. **Teacher guides delivery?** ✅ All three: served from Engine, embedded in Console UI, printable PDFs.
7. **Website technology?** ✅ Static site (Astro or Hugo — TBC) hosted on GitHub Pages.

---

## Backlog Growth Process

Growing the backlog is a collaborative, PR-driven process. Full details in `hq/PROCESS.md`. Summary:

### The pipeline

1. **Anyone proposes** — any agent (or CEO) creates `hq/proposals/YYYY-MM-DD-<topic>.md` and opens a PR.

2. **Cross-team refinement** — relevant agents are tagged in the PR. Examples:
   - Fundraising identifies a need for usage analytics → tags `engine-dev` for feasibility,
     `console-dev` for UI impact, `quality-manager` for privacy review
   - Teacher spots a missing app feature → tags `engine-dev` to scope it
   - Communications needs new content → tags `site-dev` for implementation assessment

   Agents comment on the PR with technical context, estimates, concerns, or sub-proposals.
   The **Quality Manager** reviews all proposals for cross-project consistency.

3. **CEO decides** — merges (approved → backlog), requests changes, or closes (declined).

4. **Backlog entry** — on merge, a concise entry is added to `hq/BACKLOG.md` with a link to the proposal.

### Why this works

- Any team member can surface a need regardless of role
- Ideas get cross-functional input before the CEO sees them
- Nothing lands in the backlog without explicit approval
- The full proposal history is preserved in git

---

## Project Repositories

| Repo | Current URL | Notes |
|------|------------|-------|
| `engine` | https://github.com/koenswings/engine | Engine software |
| `openclaw` | https://github.com/koenswings/openclaw | OpenClaw platform config |
| `idea-proposal` | https://github.com/koenswings/idea-proposal | This planning doc and proposals |

All repos currently under personal account `koenswings`. Will transfer to `idea-edu-africa` org when it is created.

Repos still to create (after org setup): `console-ui`, `website`, `hq`.

---

## What Needs to Happen (in order)

1. ✅ Decide answers to the open questions above
2. ✅ Set up project repos: `engine`, `openclaw`, `idea-proposal` on GitHub
3. ✅ Set up VS Code / Claude Code / tmux per-project session pattern across all three projects
4. Review and approve the full proposal in `/home/pi/projects/idea-proposal/` (AGENTS.md files, sandbox files, openclaw.json)
5. Create GitHub Organisation (`idea-edu-africa`) and transfer existing repos; create new repos (`console-ui`, `website`, `hq`)
6. Create project directories on the Pi: `console-ui/`, `website/`, `hq/` with subdirs
7. Copy approved `AGENTS.md` files from proposal into each workspace
8. Apply updated `openclaw.json` (rename existing agents + add new ones)
9. Copy sandbox files (IDENTITY, SOUL, USER, TOOLS, HEARTBEAT, BOOTSTRAP) into each agent's OpenClaw sandbox
10. Restart OpenClaw: `sudo docker restart openclaw-gateway`
11. Set up branch protection on `main` in each GitHub repo (CEO-only merge)
12. Pair your browser with each new agent in the OpenClaw UI
13. Run the BOOTSTRAP session for each new agent to confirm identity and orientation

---

## Current Backlog

### HQ / Setup
- [x] Decide GitHub org name → `idea-edu-africa`
- [x] Set up `engine`, `openclaw`, `idea-proposal` repos on GitHub (currently under `koenswings`)
- [x] Set up VS Code / Claude Code / tmux per-project session pattern
- [ ] Review and approve proposal in `/home/pi/projects/idea-proposal/`
- [ ] Create GitHub organisation (`idea-edu-africa`) and transfer repos; create `console-ui`, `website`, `hq`
- [ ] Create project directories on Pi: `console-ui/`, `website/`, `hq/` with subdirs
- [ ] Configure OpenClaw agents (rename engine→engine-dev, console-ui→console-dev; add 5 new agents)
- [ ] Copy sandbox files (IDENTITY, SOUL, USER, TOOLS, HEARTBEAT, BOOTSTRAP) to each agent
- [ ] Set up branch protection on `main` across all repos
- [ ] BOOTSTRAP sessions for all new agents

### Engine
- [ ] Review and improve Solution Description
- [ ] Update Architecture doc from Solution Description
- [ ] Remove Docker dev environment support from docs and code
- [ ] Test setup design review — automated tests, simulate disk dock/undock, multi-engine scenarios
- [ ] Refactor `script/` to `scripts/`
- [ ] Scan Solution Description for unimplemented features
- [ ] Review run architecture: which user? File ownership and permissions?

### Console UI
- [ ] Create repo and AGENTS.md
- [ ] Document architecture: Solid.js, Chrome Extension, Engine API contract
- [ ] First version of UI from Solution Description outline

### Website
- [x] Decide technology → static site on GitHub Pages
- [ ] Confirm framework: Astro or Hugo
- [ ] Create repo and AGENTS.md
- [ ] Set up GitHub Actions deploy to GitHub Pages
- [ ] First version: mission, how it works, how to support

### Teacher Guides
- [x] Decide delivery → all three (Engine-served, Console-embedded, printable PDF)
- [ ] Define delivery pipeline and PDF generation approach
- [ ] Getting Started guide
- [ ] App guides: Kolibri, Nextcloud, Wikipedia

### Fundraising
- [ ] Research applicable grant programmes
- [ ] Create grant tracking document
- [ ] Draft first funding opportunity brief

### Communications
- [ ] Define brand voice and key messages (`brand/tone-of-voice.md`, `brand/key-messages.md`)
- [ ] Draft website content: mission, how it works, how to support
- [ ] Create donor newsletter template
- [ ] Create impact report template
