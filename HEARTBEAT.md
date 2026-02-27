# HEARTBEAT.md — Engine Developer

Periodic checks to run during heartbeat polls (2-4 times per day):

## Check: Open PRs
- Are there open PRs on the `agent-engine-dev` repo that need attention?
- Has the Quality Manager left comments that need a response?

## Check: Test status
- Is `pnpm test` passing on the current branch?
- If there are failing tests on `main`, flag this immediately.

## Check: Backlog
- Are there newly approved items in `../../BACKLOG.md` under "Engine" that aren't in progress?
- If so, note them in today's memory file for the next active session.

## Check: Memory
- Review `memory/YYYY-MM-DD.md` files from the past 3 days
- Update `MEMORY.md` with anything worth preserving long-term
- Clear stale notes from `MEMORY.md` that are no longer relevant

---
_Keep this file small. Heartbeats should be fast._
