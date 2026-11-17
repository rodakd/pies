---
description: Plan locally, wait for my approval, implement, then review against the original request
argument-hint: "<what to build>"
---
Execute this workflow for: $@

**Permission guard.** planner, reviewer, and fixer are expensive and opt-in: dispatch one only when I explicitly request it, or approve a proposal naming the agent and its scope. Invoking `/workflow` or approving implementation is not authorization. When a task is large or difficult enough that one would help, propose it and wait; if I decline, continue with the main model.

**1. Recon.** Dispatch the "scout" agent read-only for "$@" — relevant code, interfaces, test commands, gaps. Pass the ORIGINAL request, cwd, and what to locate.

**2. Plan — you, the main model.** Write the plan from the scout findings; read only the gaps needed to resolve ambiguity. Keep it small and actionable: requirements and acceptance criteria, numbered steps naming file/function, files changed, exact checks, risks and unrelated work to preserve. If planner is authorized for this scope, you may dispatch it with the ORIGINAL request, cwd, and the compressed scout findings.

**3. Approval — STOP HERE.** Present the plan concisely and end your turn. Do not call any agent that edits files. Wait for my explicit approval. Feedback → revise the plan locally (via planner only if authorized) and stop again.

**4. Implement.** Dispatch the "worker" agent with the full approved plan, the ORIGINAL request ("$@"), cwd, task-owned paths and new files, unrelated changes to preserve, and required checks. Require changed paths, exact checks with pass/fail, and blockers.

**5. Audit.** Dispatch the "scout" agent read-only to triage only task-owned changes, including new/untracked files. Pass the ORIGINAL request, approved plan, worker report, task-owned paths, known pre-existing changes, and cwd. Its map should list changed paths/hunks, discrepancies and hot spots, the worker's check results, and unverified coverage. Scout does not run tests.

**6. Review — you, the main model.** Inspect the actual hunks and call sites against the ORIGINAL request and approved plan, treating the audit as claims to verify rather than ground truth. Broaden beyond the task-owned diff only when evidence requires it. Track severity, `path:line`, and actionable findings; keep unverified coverage separate. If reviewer is authorized for this scope, you may dispatch it with the ORIGINAL request, approved plan, and the concise audit instead.

**7. Fix and recheck (actionable findings only).** Dispatch the "worker" agent to fix findings and rerun affected checks. Recheck yourself against the findings and fresh results, re-auditing only if scope expanded; dispatch "reviewer" for the recheck only if the approval already covers that rerun. Allow at most two fix/recheck rounds. If the worker still fails, stalls, or is blocked, propose an escalation to the "fixer" agent (Sol, full tools) with the original request, worker report, failure evidence, task-owned paths, and cwd; wait for approval, and if declined keep the work with the main model or report the blocker.

**8. Report.** Summarize concisely: what was implemented, check results, and anything unresolved. Keep raw patches and logs out of handoffs.
