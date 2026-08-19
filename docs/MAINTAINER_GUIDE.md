# Maintainer Guide

SlipByte is intended to be developed in public. Repository history and discussion should remain useful to developers long after a change is merged.

This guide applies to maintainers, contributors, coding agents, and scheduled automation.

## Public writing standard

Every public artifact should be:

- technically specific;
- concise enough to review;
- truthful about what was observed, tested, inferred, or not yet verified;
- useful without requiring private project context;
- free of marketing claims that are not supported by evidence.

Automation may help produce repository content, but automation is not a reason to create content. Do not generate commits, issues, comments, discussions, or documentation merely to show activity.

Never fabricate user reports, hardware tests, benchmarks, community feedback, personal experience, or compatibility evidence.

## Commits

Prefer a small number of coherent commits over many micro-commits.

A commit should represent one meaningful, reviewable change. Use a concise imperative subject that describes the actual result.

Good:

- `Add capability resolution states`
- `Reject control bytes in receipt text`
- `Preserve grapheme clusters during wrapping`

Avoid:

- `Update files`
- `More fixes`
- `Improve project`
- checkpoint commits created only because an automation run occurred.

Use a commit body only when rationale, compatibility impact, migration concern, or an architectural constraint is not obvious from the change itself.

Noisy intermediate commits should normally be squashed before merge when doing so is safe.

## Issues

Create an issue only for a real problem, requirement, investigation, or independently trackable task.

Issue titles should describe the concrete developer or hardware problem in natural technical language. Search discoverability should come from accurate terminology, not keyword stuffing.

A useful issue normally records the problem or decision being investigated, observed behavior and relevant environment when known, evidence/constraints, and a completion condition when useful.

Do not create an issue to mirror every commit or PR.

When an issue resolves a real, searchable printing problem, preserve the final technical explanation and evidence before closing it. Closed issues are durable engineering knowledge, not clutter to delete.

## Pull requests

A pull request should explain the engineering change rather than narrate the development process.

Include only what materially helps review:

- behavior or contract changed;
- important architecture decisions;
- validation evidence;
- safety or compatibility implications;
- linked issues when useful.

Do not claim tests, compatibility, benchmarks, or physical hardware validation that did not happen.

Prefer focused PRs with coherent histories. A feature or fix PR should normally be squash-merged after its quality gates pass.

### Autonomous merge gate

Automated maintainers may merge their own focused PRs, but only after the same engineering checks expected from a human maintainer:

- scope is coherent and complete;
- architecture and public API boundaries were reviewed;
- relevant tests pass;
- typecheck/build pass when applicable;
- no known regression or unresolved review concern remains;
- no secret, unsafe artifact, or generated junk is introduced;
- docs match changed public behavior;
- compatibility claims are backed by evidence;
- disruptive hardware behavior is explicit and capability-aware;
- the PR is based on current `main` or was safely updated;
- required CI is green when CI is functioning.

A GitHub Actions workflow that fails before jobs start is not passing CI.

For stacked PRs, merge the base PR first, update the dependent PR onto the new `main`, rerun relevant validation, inspect the resulting diff, then decide whether the dependent PR can merge.

Do not enable or use automation to bypass branch rules or required checks.

## Stateful automation

Scheduled maintenance is one continuous engineering process, not a collection of independent hourly tasks.

Automation should resume the current workstream from the previous checkpoint, keep one primary milestone active, and avoid creating a new PR or issue merely because another scheduled run occurred.

A run does not need to produce code. Review, test, investigate, or leave the repository unchanged when that is the highest-value safe action.

If one task is blocked, record the blocker once and continue an architecturally independent task when possible. Do not spend repeated runs restating the same failure.

## Completed work and cleanup

Preserve durable engineering history:

- merged PRs;
- closed solved issues;
- useful comments/discussions;
- meaningful commits;
- compatibility findings;
- architecture decisions;
- research evidence;
- release notes.

Only remove temporary operational clutter from active state: completed TODO entries, resolved blockers, duplicate active trackers, obsolete temporary notes, and safely merged temporary branches where cleanup is appropriate.

Do not rewrite history to make automation invisible.

## Comments and discussions

A public comment should add new information: evidence, a decision, a clarification, a reproduced result, or a resolution.

Do not post comments merely to keep a thread active.

Use GitHub Discussions only when there is a genuine proposal, architectural question, compatibility investigation, or reusable technical explanation that benefits from community input or deserves a durable home outside an implementation issue.

Never simulate community activity or create fake conversations.

## Documentation and discoverability

Write documentation for developers first.

Use precise vocabulary such as `ESC/POS`, `USB printer`, `TCP thermal printer`, `code page`, `raster image`, `browser local printing`, or `cutter capability` when those terms accurately describe the problem. Useful technical writing naturally improves search and AI retrieval without turning documentation into SEO copy.

Documentation must clearly distinguish:

- implemented behavior;
- planned behavior;
- experimental behavior;
- compatibility verified with evidence;
- compatibility that remains unknown.

## External research

Community reports, Reddit threads, issues in other projects, standards, and vendor documentation can expose real printing problems. Research supports engineering; it is not an activity quota.

Record a finding when it changes a requirement, validates a design decision, documents a compatibility problem, or produces a reusable technical explanation. Preserve useful external-problem research even after the related code is finished because it may support future docs, debugging, support, and discoverability.

Do not convert an interesting external post into roadmap scope unless it fits SlipByte's product boundary.

## Owner-only decisions

Automation should escalate rather than act autonomously on:

- repository visibility changes;
- npm publication;
- breaking public API decisions with multiple viable directions;
- security or legal/licensing concerns;
- destructive repository changes;
- paid services or new costs;
- credentials/secrets;
- unsupported hardware compatibility claims.

## Before making the repository public

Perform a public-surface audit covering at least:

- README accuracy;
- package metadata;
- license and contribution/security/support files;
- issue and PR templates;
- open issue and PR wording;
- commit history coherence;
- accidental secrets, credentials, logs, captures, or local files;
- unsupported compatibility claims;
- documentation that describes features not yet implemented;
- release and CI blockers.

Making the source repository public is not the same as publishing a stable npm release. The repository may be public while SlipByte is explicitly marked early development.

Do not optimize history for appearance by falsifying authorship or evidence. The objective is a clean, truthful, useful engineering record.
