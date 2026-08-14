# Maintainer Guide

OpenReceipt is intended to be developed in public. Repository history and discussion should remain useful to developers long after a change is merged.

This guide applies to maintainers, contributors, and coding agents.

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

Use a commit body only when the rationale, compatibility impact, migration concern, or architectural constraint is not obvious from the change itself.

Noisy intermediate commits should normally be squashed before merge.

## Issues

Create an issue only for a real problem, requirement, investigation, or independently trackable task.

Issue titles should describe the concrete developer or hardware problem in natural technical language. Search discoverability should come from accurate terminology, not keyword stuffing.

A useful issue normally records:

- the problem or decision being investigated;
- observed behavior and relevant environment when known;
- expected behavior or the question that must be resolved;
- evidence and constraints;
- a completion condition when one is useful.

Do not create an issue to mirror every commit or PR.

When an issue resolves a real, searchable printing problem, preserve the final technical explanation and evidence before closing it. A closed issue should remain useful to somebody who finds it months later through GitHub, search, or an AI retrieval system.

## Pull requests

A pull request should explain the engineering change rather than narrate the development process.

Include only what materially helps review:

- the behavior or contract changed;
- important architecture decisions;
- validation evidence;
- safety or compatibility implications;
- linked issues when useful.

Do not claim tests, compatibility, benchmarks, or physical hardware validation that did not happen.

Prefer focused PRs with coherent histories. A feature or fix PR should normally be squash-merged after its quality gates pass.

## Comments and discussions

A public comment should add new information: evidence, a decision, a clarification, a reproduced result, or a resolution.

Do not post comments merely to keep a thread active.

Use GitHub Discussions only when there is a genuine proposal, architectural question, compatibility investigation, or reusable technical explanation that benefits from community input or deserves a durable home outside an implementation issue.

Never simulate community activity or create fake conversations.

## Documentation and discoverability

Write documentation for developers first.

Use precise vocabulary such as `ESC/POS`, `USB printer`, `TCP thermal printer`, `code page`, `raster image`, `browser local printing`, or `cutter capability` when those terms accurately describe the problem. This naturally improves search and AI retrieval without turning documentation into SEO copy.

Documentation must clearly distinguish:

- implemented behavior;
- planned behavior;
- experimental behavior;
- compatibility verified with evidence;
- compatibility that remains unknown.

## Automation and AI-assisted maintenance

Coding agents and automation must follow the same engineering and public-writing standards as any contributor.

They must not:

- manufacture activity to satisfy a schedule;
- create repetitive boilerplate across issues or PRs;
- invent a human testing story or personal anecdote;
- represent inference as measured hardware behavior;
- create promotional GitHub content without an engineering reason;
- repeatedly reopen or restate a known blocker instead of making progress elsewhere.

When provenance matters to a technical claim, state the evidence rather than creating a persona. For example, prefer `validated by contract tests` or `not yet tested on physical hardware` over implying who performed the test.

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

Do not optimize history for appearance by falsifying authorship or evidence. The objective is a clean, useful engineering record.
