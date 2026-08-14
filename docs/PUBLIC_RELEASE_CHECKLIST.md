# Public Development and Release Checklist

OpenReceipt distinguishes two separate events:

1. **Public development** — the GitHub repository becomes public while the project is still explicitly early-stage.
2. **Public package release** — a versioned npm package is published after the v0.1 release gates pass.

Making the repository public does not mean OpenReceipt is production-ready or broadly hardware-compatible.

## A. Public development gate

Before changing repository visibility to public:

- [x] README clearly identifies OpenReceipt as early development
- [x] implemented, active, and planned work are separated
- [x] target API examples are labeled unreleased where appropriate
- [x] LICENSE, SECURITY.md, SUPPORT.md, CONTRIBUTING.md, and CODE_OF_CONDUCT.md are present
- [x] maintainer/automation behavior is documented
- [x] `.gitignore` covers environment files, keys/certificates, logs, captures, generated output, and editor files
- [x] package version remains `0.0.0-dev`
- [x] compatibility policy rejects broad claims without evidence
- [x] current CI limitation is documented rather than represented as passing
- [ ] repository visibility intentionally changed to public by the owner
- [ ] repository description and topics are set
- [ ] default-branch/ruleset configuration reviewed after public visibility is enabled

### Public-history review

Before or immediately after visibility changes, verify:

- no credentials, private keys, customer data, private printer/network details, or sensitive local paths are present in git-visible content/history;
- examples and fixtures use synthetic data;
- open issues/PRs are useful and truthful as public engineering records;
- no hardware test, benchmark, or compatibility result is claimed without evidence.

If a problem is discovered after publication, fix the exposure correctly; do not rewrite history merely to make the repository look cleaner.

## B. npm v0.1 release gate

The following are **not required merely to develop in public**, but they are required or must be explicitly resolved before the first npm release.

### Source and package quality

- [ ] `npm run check` passes from a clean checkout
- [ ] package lockfile is committed for reproducible contributor/CI installs
- [ ] `npm pack --dry-run` contains only intended distributable files
- [ ] public exports match documented API
- [ ] package name and npm ownership are confirmed
- [ ] package version follows semver
- [x] `prepublishOnly` prevents normal publishing when validation fails
- [ ] npm provenance / trusted publishing is configured when the release workflow is introduced

### Core v0.1 pipeline

- [x] receipt/print document foundation
- [x] deterministic layout engine
- [x] initial capability/device profile model
- [ ] versioned print-document/schema contract
- [ ] ESC/POS encoder with deterministic fixtures
- [ ] TCP transport
- [ ] practical USB path or an explicitly deferred USB scope decision
- [ ] mock printer / preview workflow
- [ ] structured diagnostics/error model for transport/device failures
- [ ] compatibility fixtures/profile evidence

### Compatibility and safety

- [ ] every named printer compatibility claim has exact evidence
- [ ] untested protocol compatibility is labeled unverified
- [ ] unsupported capabilities fail explicitly rather than silently
- [ ] unknown/missing compatibility evidence is not converted into a support claim
- [ ] disruptive hardware actions are capability-aware and explicit
- [ ] normal text cannot inject raw printer control commands
- [ ] network/device responses are treated as untrusted input
- [ ] diagnostics avoid leaking secrets or receipt contents by default

### Developer experience

- [ ] first released example works by copy/paste
- [ ] hardware-free preview/mock path works
- [ ] common errors explain the next action
- [ ] TypeScript declarations are included in the npm artifact
- [ ] API names/defaults are internally consistent
- [ ] supported Node.js versions are tested/documented

### AI-agent usability

- [ ] AGENTS.md matches released architecture
- [ ] public APIs document defaults, errors, capability requirements, and fallback behavior
- [ ] examples do not depend on hidden context
- [ ] structured errors are stable enough for tools to react to
- [ ] unsupported behavior is explicit instead of requiring brand/model inference

### CI / release infrastructure

GitHub Actions currently has a startup/infrastructure blocker tracked in issue #8. A run that never starts is not a passing check.

Before npm v0.1:

- [ ] normal CI jobs start successfully
- [ ] required checks are green on the exact release head
- [ ] branch/ruleset settings match the intended merge policy
- [ ] release workflow cannot bypass validation

## Release decision

Only publish the first npm version when the project can answer these questions accurately:

1. What does OpenReceipt support today?
2. What does it not support yet?
3. Which physical-device claims are actually verified?
4. How can a developer test behavior without risking production hardware or data?
