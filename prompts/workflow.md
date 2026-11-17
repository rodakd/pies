---
description: Plan with agents, wait for my approval, implement, then review against the original request
argument-hint: "<what to build>"
---
Execute this workflow for: $@

**1. Plan.** Use the subagent tool in chain mode:
- First the "scout" agent to find all code relevant to "$@".
- Then the "planner" agent to create an implementation plan from the scout's context. Give it the ORIGINAL request ("$@") and the scout findings via {previous}.

**2. Approval — STOP HERE.** Present the plan concisely and end your turn. Do NOT implement yet, and do not call any agent that edits files. Wait for my explicit approval.

When I reply:
- Feedback → revise the plan accordingly (re-run the planner agent with the feedback and the prior context) and stop for approval again.
- Approved → continue with step 3.

**3. Implement.** Use the "worker" agent to implement the approved plan. Pass it the full approved plan, the ORIGINAL request ("$@"), and the cwd. Require changed paths, exact checks with pass/fail, and blockers.

**4. Audit then review.** Use the subagent tool in chain mode: first the "scout" agent in read-only mode to triage only task-owned changes, including new/untracked files. Pass the ORIGINAL request, approved plan, worker report, task-owned paths, known pre-existing changes, and cwd. Its audit should map changed paths/hunks, note discrepancies and review hotspots, and include the worker's check results and unverified coverage. Scout does not run tests.

Then the "reviewer" agent, with the ORIGINAL request and approved plan plus this concise audit via {previous}. Keeping the audit in the chain keeps the intermediate handoff out of the main context. The reviewer inspects the relevant actual hunks and call sites, broadening scope only when evidence requires it — not the entire repository by default. Require severity, `path:line`, and actionable findings, with unverified coverage kept separate.

**5. Fix and recheck (only for actionable findings).** Use the "worker" agent to fix findings and rerun affected checks. Dispatch the "reviewer" directly for a focused recheck with the original request, relevant approved-plan steps, findings, changed paths, and fresh check results; repeat the scout audit only if the scope expanded. Allow at most two fix/recheck rounds after the initial review, then report unresolved issues.

**6. Report.** Summarize concisely: what was implemented, test/check results, and anything unresolved. Keep raw patches and logs out of handoffs.
