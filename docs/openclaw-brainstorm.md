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

**Currently configured:**
- `engine` → workspace: `/home/node/workspace/engine` ✓
- `console-ui` → workspace: `/home/node/workspace/console-ui` (directory not yet created)

**To be added:**

| Agent id | Workspace (host path) | Role |
|----------|----------------------|------|
| `engine-dev` | `/home/pi/projects/engine` | Engine software developer |
| `console-dev` | `/home/pi/projects/console-ui` | Console UI developer (Solid.js, Chrome Extension) |
| `website` | `/home/pi/projects/website` | Builds and maintains the IDEA public website |
| `quality-manager` | `/home/pi/projects/hq/quality-manager` | Cross-project quality and consistency reviewer |
| `teacher` | `/home/pi/projects/hq/teacher` | Creates offline teacher guides for rural schools |
| `fundraising` | `/home/pi/projects/hq/fundraising` | Researches grants, tracks donors, drafts proposals |

Note: the `quality-manager`, `teacher`, and `fundraising` agents are given subdirectories inside `hq/` as their workspace. This gives each its own `AGENTS.md` while keeping them inside the shared HQ directory tree. Because `/home/pi/projects` is fully mounted into the container as `/home/node/workspace`, every agent can read any other project if its AGENTS.md instructs it to — the QM in particular needs this to review code across all repos.

---

## The HQ Directory

`/home/pi/projects/hq/` is the company's coordination hub. It is a git repo in its own right. Structure:

```
hq/
  BACKLOG.md                      ← master backlog, covers all projects
  ROLES.md                        ← summary of all agents and their scope
  standups/
    2026-02-20-morning.md
    2026-02-20-evening.md
  design/                         ← RFC-style design docs for complex features
    engine-test-infrastructure.md
  quality-manager/
    AGENTS.md                     ← quality manager role definition
  teacher/
    AGENTS.md                     ← teacher role definition
    getting-started.md            ← teacher guide: getting started
    kolibri-guide.md
    nextcloud-guide.md
  fundraising/
    AGENTS.md                     ← fundraising role definition
    opportunities.md
    grant-tracker.md
    proposals/
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

## Daily Standups — Practical Mechanics

A standup is an agent session seeded with a specific context prompt. The simplest implementation is a script you run manually (or via a systemd timer) that:

1. Reads `hq/BACKLOG.md`, recent git commits across all repos, open PRs, and the last standup
2. Opens a Claude session (in the context of a dedicated `standup` agent, or any agent) with that context
3. The agent produces a structured standup document saved to `hq/standups/YYYY-MM-DD-morning.md`
4. You read it, add your priorities or decisions as a CEO comment, and commit

Whether to automate this via a cron/systemd timer or keep it manual is an open question — see below.

---

## Open Questions to Resolve Before Configuration

1. **Rename `engine` → `engine-dev` in openclaw.json?** Cleaner for the UI when there are many agents, but it's a breaking change (existing browser sessions reference the old id). Worth doing now before adding more agents.

2. **Rename `console-ui` → `console-dev`?** Same reasoning.

3. **Standup: automated or manual trigger?** Automated (systemd timer at 8:00 and 18:00) means standups happen even on quiet days. Manual trigger (you run `./standup morning`) is more appropriate for a part-time project where days may pass without activity. Manual seems right for now.

4. **HQ repo: public or private?** Public means radical transparency — donors see the backlog, standups, design decisions. Builds trust. Private gives freedom to discuss sensitive topics (funding, partnerships). A middle path: separate `hq-public` (backlog, design docs, teacher guides) and `hq-private` (fundraising, standups with sensitive content).

5. **GitHub Organisation name?** This is the public face of the charity for developers, donors, and partner NGOs. Worth deciding before creating repos.

   **Name availability (checked 2026-02-20):**

   | Name | Available? |
   |------|-----------|
   | `idea-africa` | ❌ Taken (existing "IDEA Africa" org) |
   | `idea-edu-africa` | ✅ Available |
   | `idea-offline` | ✅ Available |
   | `offline-schools` | ✅ Available |
   | `appdocker` | ❌ Taken |

   "Idea-Africa" as a concept is strong — the double meaning (IDEA acronym + "idea" as in vision) works well and "Africa" is clear, but it's taken.

   Candidates, in preference order:
   - **`idea-edu-africa`** ← recommended: stays closest to the brand, clearly signals education, keeps all three elements. Slightly long but unambiguous to donors and NGO partners.
   - **`idea-offline`**: clean and short, highlights the offline-first angle (the genuinely distinctive thing about this project). Loses "Africa" from the URL but the full name IDEA can still appear in the org display name.
   - **`offline-schools`**: descriptive and findable by people searching the problem space, but loses the IDEA brand entirely.

6. **Teacher guides delivery?** Candidates: (a) served directly from the Engine — accessible from any browser on the school's local WiFi, no internet needed (best fit for offline-first philosophy); (b) embedded in Console UI as a built-in help system; (c) exported as printable PDFs. These are not mutually exclusive.

7. **Website technology?** A static site (Astro or Hugo) hosted on GitHub Pages is free, version-controlled, and immediately visible to donors from the GitHub org page. A dynamic CMS adds cost and maintenance. Static is the right default.

---

## What Needs to Happen (in order)

1. Decide answers to the open questions above
2. Create GitHub Organisation and repos (`engine`, `console-ui`, `website`, `hq`)
3. Create project directories on the Pi: `console-ui/`, `website/`, `hq/` with subdirs
4. Write `AGENTS.md` files for each workspace
5. Update `openclaw.json` to add the new agents (and optionally rename existing ones)
6. Restart OpenClaw: `sudo docker restart openclaw-gateway`
7. Set up branch protection on `main` in each GitHub repo (CEO-only merge)
8. Pair your browser with each new agent in the OpenClaw UI

---

## Current Backlog (captured from previous discussion)

### HQ / Setup
- [ ] Decide GitHub org name (see Q5 above — `idea-edu-africa` recommended)
- [ ] Create GitHub organisation and all repos
- [ ] Create `hq` directory structure and AGENTS.md files
- [ ] Configure OpenClaw agents (update openclaw.json)
- [ ] Set up branch protection across all repos

### Engine
- [ ] Review and improve Solution Description
- [ ] Update Architecture doc from Solution Description
- [ ] Remove Docker dev environment support from docs and code
- [ ] Test setup design review — automated tests, simulate disk dock/undock, multi-engine scenarios
- [ ] Refactor `script/` to `scripts/`
- [ ] Scan Solution Description for unimplemented features
- [ ] Review run architecture: which user? File ownership and permissions?

### Console UI
- [ ] Create repo and AGENTS.md (Solid.js, Chrome Extension, motivation documented)
- [ ] First version of UI from Solution Description outline

### Website
- [ ] Choose static site technology
- [ ] Create repo
- [ ] First version: mission, how it works, how to support

### Teacher Guides
- [ ] Decide delivery mechanism
- [ ] Getting Started guide
- [ ] App-specific guides: Kolibri, Nextcloud, Wikipedia

### Fundraising
- [ ] Research applicable grant programmes
- [ ] Create grant tracking document
- [ ] Draft first funding opportunity brief
