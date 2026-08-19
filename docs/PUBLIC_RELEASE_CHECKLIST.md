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
- [x] package version remained `0.0.0-dev` through the public-development audit; release versioning was handled later as a separate gate
- [x] compatibility policy rejects broad claims without evidence
- [x] CI status is documented truthfully
- [x] repository visibility is public and has been reviewed in the public-readiness audit
- [x] repository description and topics are set for the SlipByte identity
- [x] default-branch/ruleset configuration reviewed after public visibility is enabled

### Public-history review

Before or immediately after visibility changes, verify:

- no credentials, private keys, customer data, private printer/network details, or sensitive local paths are present in git-visible content/history;
- examples and fixtures use synthetic data;
- open issues/PRs are useful and truthful as public engineering records;
- no hardware test, benchmark, or compatibility result is claimed without evidence.

The maintainer completed the all-history secret/local-path scan on 2026-08-19. No obvious credential or local-path marker was found. The only sensitive-looking historical filename was `.npmrc`; its current content is `engine-strict=true`, and a dedicated `.npmrc` history scan found no auth-token, username/password, or credential-bearing registry markers.

If a problem is discovered after publication, fix the exposure correctly; do not rewrite history merely to make the repository look cleaner.

## B. npm v0.1 release gate

The following are **not required merely to develop in public**, but they are required or must be explicitly resolved before the first npm release.

### Source and package quality

- [ ] `npm run check` passes from a clean checkout of the exact final release head
- [x] package lockfile is committed for reproducible contributor/CI installs
- [ ] `npm run release:check` passes on the exact final release head
- [x] exact npm ownership/availability for `slipbyte` is confirmed
- [x] package version is set to the owner-confirmed first release version `0.1.0`
- [x] package artifact policy is encoded: only `dist`, package metadata, README, and LICENSE may ship
- [x] `prepublishOnly` runs the complete release check and blocks normal publishing when validation or package verification fails
- [x] stage-only trusted-publishing workflow is prepared without a long-lived npm publish token
- [ ] npm trusted publisher is configured after the first-package bootstrap publish
- [ ] npm publishing access is changed to require 2FA and disallow traditional publish tokens after trusted publishing is configured

`npm run release:check` performs the full TypeScript/test gate and then runs `npm pack --dry-run --json --ignore-scripts` through `scripts/verify-package.mjs`. The verifier requires `dist/index.js`, `dist/index.d.ts`, package metadata, README, and LICENSE and rejects repository-only files such as `src`, `test`, `scripts`, `docs`, and `.github` from the npm artifact. It also installs the packed tarball into an isolated consumer, imports the package by its declared package name, runs the hardware-free receipt/preview path, and compiles a TypeScript consumer against the packed declarations.

### First-package bootstrap constraint

npm trusted-publisher configuration requires the package to already exist in the npm registry. Therefore the first-ever creation of `slipbyte` cannot use its final OIDC trust relationship.

The recommended bootstrap path is a maintainer-run interactive `npm publish --access public` with npm account 2FA after the exact `0.1.0` release candidate passes every gate. Automation must not run that bootstrap publish or create/store a bypass-2FA npm token.

- [ ] owner explicitly accepts the first-package bootstrap path and its lack of GitHub Actions provenance for `0.1.0`
- [ ] bootstrap publication remains an explicit owner action after the final release summary

See [`RELEASING.md`](RELEASING.md) for the steady-state staged publishing flow.

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
- [x] the first npm release intentionally makes no named physical-printer compatibility claim
- [x] software tests, Canvas conformance, TCP contract coverage, and CI are not represented as physical-printer evidence

If a named printer/model compatibility claim is added before publication, exact end-to-end physical-device evidence becomes a release gate and these two claim-free checks must be revisited.

### Developer experience

- [x] hardware-free preview/mock path works through the real layout path
- [x] common transport/encoding failures expose structured diagnostic guidance
- [x] public lower-level API names and boundaries are documented
- [x] first released copy/paste example is validated from an isolated packed `slipbyte` consumer through `npm run release:check`
- [x] TypeScript declarations are confirmed in the renamed packed npm artifact by `npm run release:check`
- [ ] supported Node.js versions are exercised on the exact final release head

The README's first example uses the same exported `receipt()` → `mockPrint()` flow exercised by `scripts/verify-package.mjs` after installing the generated tarball into a temporary consumer project.

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
- [ ] required checks are green on the exact final release head
- [x] branch/ruleset settings match the intended merge policy
- [x] staged release workflow requires an existing tag whose `vX.Y.Z` value matches `package.json`
- [x] staged release workflow requires the tagged commit to already be contained in `main`
- [x] staged release workflow reruns `npm ci` and `npm run release:check` before any npm staging command
- [x] staged release workflow uses OIDC permissions and `npm stage publish`; it does not contain an npm publish token
- [x] staged release workflow cannot make a package public without the separate npm 2FA approval step once trusted publishing is configured

The active `Protect main` ruleset targets the default branch with no bypass actors. It requires pull requests, conversation resolution, strict up-to-date status checks for `check (22)` and `check (24)`, blocks force pushes and deletion, and permits squash merges only.

The staged release workflow is intentionally a future steady-state path. It cannot authenticate until the first package exists and its npm Trusted Publisher is configured for `.github/workflows/publish.yml` with **`npm stage publish` only** permission.

## Identity gate

The owner selected **SlipByte** to replace the colliding OpenReceipt identity before the first public/npm release.

Before closing the identity blocker:

- [x] current package/root API/docs use SlipByte consistently
- [x] npm ownership/availability for `slipbyte` is confirmed directly against the registry
- [x] GitHub repository is renamed to SlipByte
- [x] repository description/topics use the selected identity
- [x] release docs contain no implication of affiliation with the unrelated pre-existing OpenReceipt ecosystem

Historical issues and commits may retain the former name when it is part of the factual engineering history; current public product documentation should not.

## Release decision

Only publish the first npm version when the project can answer these questions accurately:

1. What does SlipByte support today?
2. What does it not support yet?
3. Which physical-device claims are actually verified?
4. How can a developer test behavior without risking production hardware or data?

For `0.1.0`, the answer to question 3 is intentionally: **no named physical-printer compatibility claim is made**.

Repository visibility changes and npm publication remain explicit maintainer actions. Completing this checklist does not authorize either action automatically.
