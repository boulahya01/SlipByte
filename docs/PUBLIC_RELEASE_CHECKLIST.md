# Public Development and Release Checklist

SlipByte distinguishes two separate events:

1. **Public development** — the GitHub repository becomes public while the project is still explicitly early-stage.
2. **Public package release** — a versioned npm package is published after the v0.1 release gates pass.

Making the repository public does not mean SlipByte is production-ready or broadly hardware-compatible.

## A. Public development gate

Before changing repository visibility to public:

- [x] README clearly identifies SlipByte as early development
- [x] implemented, active, and planned work are separated
- [x] target API examples are labeled unreleased where appropriate
- [x] LICENSE, SECURITY.md, SUPPORT.md, CONTRIBUTING.md, and CODE_OF_CONDUCT.md are present
- [x] maintainer/automation behavior is documented
- [x] `.gitignore` covers environment files, keys/certificates, logs, captures, generated output, and editor files
- [x] package version remains `0.0.0-dev`
- [x] compatibility policy rejects broad claims without evidence
- [x] CI status is documented truthfully
- [ ] repository visibility intentionally changed to public by the owner
- [ ] repository description and topics are set for the SlipByte identity
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

- [ ] `npm run check` passes from a clean checkout of the exact release head
- [x] package lockfile is committed for reproducible contributor/CI installs
- [ ] `npm run release:check` passes on the exact release head
- [x] exact npm ownership/availability for `slipbyte` is confirmed
- [ ] package version is changed from `0.0.0-dev` to the intended semver release
- [x] package artifact policy is encoded: only `dist`, package metadata, README, and LICENSE may ship
- [x] `prepublishOnly` runs the complete release check and blocks normal publishing when validation or package verification fails
- [ ] npm provenance / trusted publishing is configured for the first release workflow

`npm run release:check` performs the full TypeScript/test gate and then runs `npm pack --dry-run --json --ignore-scripts` through `scripts/verify-package.mjs`. The verifier requires `dist/index.js`, `dist/index.d.ts`, package metadata, README, and LICENSE and rejects repository-only files such as `src`, `test`, `scripts`, `docs`, and `.github` from the npm artifact. It also installs the packed tarball into an isolated consumer, imports the package by its declared package name, runs the hardware-free receipt/preview path, and compiles a TypeScript consumer against the packed declarations.

### Core v0.1 pipeline

- [x] receipt/print document foundation
- [x] deterministic layout engine
- [x] capability/device profile model
- [x] versioned print-document/schema contract
- [x] ESC/POS encoder with deterministic fixtures
- [x] TCP transport
- [x] USB explicitly deferred from the v0.1 core unless hardware evidence forces reprioritization
- [x] mock printer / preview workflow
- [x] structured diagnostics/error model for transport/device failures
- [x] compatibility evidence contracts
- [x] native-text versus raster representation selection
- [x] profile-scoped ESC/POS text configuration
- [x] canonical raster image and explicit ESC/POS raster strategy boundary
- [x] Canvas2D Unicode-to-raster adapter
- [x] real runtime/font Unicode conformance evidence for representative Arabic/RTL, CJK, combining-mark, emoji, and mixed-script fixtures

The Unicode conformance evidence is software-rendering evidence only. It does not establish universal glyph correctness or physical-printer compatibility.

### Compatibility and safety

- [x] untested protocol/device compatibility remains labeled unverified
- [x] unsupported capabilities fail explicitly rather than silently
- [x] unknown/missing compatibility evidence is not converted into a support claim
- [x] disruptive hardware actions represented by the current core are capability-aware and explicit
- [x] normal text cannot inject raw printer control commands
- [x] external/runtime metadata is validated before use in structured contracts
- [x] diagnostics avoid leaking receipt contents or arbitrary low-level payloads by default
- [ ] every named physical-printer compatibility claim in the release has exact evidence
- [ ] end-to-end physical-printer evidence is recorded for any release-target compatibility claim

### Developer experience

- [x] hardware-free preview/mock path works through the real layout path
- [x] common transport/encoding failures expose structured diagnostic guidance
- [x] public lower-level API names and boundaries are documented
- [ ] first released copy/paste example is validated from the renamed packed package
- [x] TypeScript declarations are confirmed in the renamed packed npm artifact by `npm run release:check`
- [ ] supported Node.js versions are exercised on the renamed release head

### AI-agent usability

- [x] AGENTS.md describes the current architecture and maintenance constraints
- [x] public contracts document capability/fallback boundaries instead of relying on printer-brand inference
- [x] examples clearly distinguish implemented API from unreleased target API
- [x] structured SlipByte errors are available for tools to classify failures
- [x] unsupported behavior is explicit instead of requiring brand/model inference

### CI / release infrastructure

GitHub Actions is functioning after the account billing/startup blocker in issue #8 was resolved. The active CI workflow runs Node.js 22 and 24, `npm ci`, and the full `npm run release:check` gate.

Before npm v0.1:

- [x] normal CI jobs start successfully
- [ ] required checks are green on the exact release head
- [ ] branch/ruleset settings match the intended merge policy
- [ ] release workflow cannot bypass validation

## Identity gate

The owner selected **SlipByte** to replace the colliding OpenReceipt identity before the first public/npm release.

Before closing the identity blocker:

- [x] current package/root API/docs use SlipByte consistently
- [x] npm ownership/availability for `slipbyte` is confirmed directly against the registry
- [x] GitHub repository is renamed to SlipByte
- [ ] repository description/topics use the selected identity
- [x] release docs contain no implication of affiliation with the unrelated pre-existing OpenReceipt ecosystem

Historical issues and commits may retain the former name when it is part of the factual engineering history; current public product documentation should not.

## Release decision

Only publish the first npm version when the project can answer these questions accurately:

1. What does SlipByte support today?
2. What does it not support yet?
3. Which physical-device claims are actually verified?
4. How can a developer test behavior without risking production hardware or data?

Repository visibility changes and npm publication remain explicit maintainer actions. Completing this checklist does not authorize either action automatically.
