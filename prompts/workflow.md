---
description: Plan with agents, wait for my approval, implement, then review against the original request
argument-hint: "<what to build>"
---
Execute this workflow for: $@

**1. Plan.** Use the subagent tool in chain mode:
- First the "scout" agent to find all code relevant to "$@".
- Then the "planner" agent to create an implementation plan from the scout's context (use {previous}).

**2. Approval — STOP HERE.** Present the plan concisely and end your turn. Do NOT implement yet, and do not call any agent that edits files. Wait for my explicit approval.

When I reply:
- Feedback → revise the plan accordingly (re-run the planner agent with the feedback) and stop for approval again.
- Approved → continue with step 3.

**3. Implement.** Use the "worker" agent to implement the approved plan. Pass it the full plan, not just the original task.

**4. Review against the request.** Use the "reviewer" agent to review the implementation — check it against the ORIGINAL request ("$@") and the approved plan, not just general code quality. If the reviewer finds problems, use the "worker" agent again to fix them (pass the review via {previous}).

**5. Report.** Summarize: what was implemented, what the review flagged and how it was fixed, and anything left open.