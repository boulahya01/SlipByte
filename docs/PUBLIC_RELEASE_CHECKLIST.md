# Public Development and Release Checklist

This file records the completed public-development and `0.1.0` release gates. It is an engineering record, not an authorization mechanism for future releases.

## Public development

- [x] repository is public
- [x] SlipByte identity is consistent across package metadata, public API, repository, and docs
- [x] LICENSE, SECURITY.md, SUPPORT.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md, and maintainer guidance are present
- [x] repository description/topics are configured
- [x] protected `main` requires pull requests, conversation resolution, strict Node.js 22/24 checks, and squash merges
- [x] force pushes and branch deletion are blocked
- [x] all-history sensitive-data/local-path review completed
- [x] compatibility policy rejects broad hardware claims without evidence

The 2026-08-19 history review found no obvious credentials or sensitive local-path material. The historical `.npmrc` content was separately reviewed and contains no authentication material.

## `0.1.0` package gate

- [x] package version is `0.1.0`
- [x] package lockfile is committed
- [x] `npm ci` succeeds
- [x] `npm run check` succeeds
- [x] `npm run release:check` succeeds
- [x] 89/89 tests pass on the validated release content
- [x] Node.js 22 and 24 required CI checks pass
- [x] native Windows package verification succeeds
- [x] package artifact is limited to `dist`, package metadata, README, and LICENSE
- [x] packed artifact installs into an isolated consumer
- [x] packed runtime imports work
- [x] packed TypeScript declarations compile in a consumer
- [x] README copy/paste `receipt()` → `mockPrint()` flow is exercised from the packed package
- [x] `prepublishOnly` runs the complete release gate

The final Windows verifier fix was validated on PR head `f1cfc9cc2efa27c2b8194c2dd44c64bc147a77f8`. That head and the merged `main` commit `555a5e015a0b39d7d683f03d250585af650d57e9` have the same Git tree (`6035fd68a614bf4a41004051d61d71308e9b2b43`), so the validated package content is identical to the released source content.

## npm publication and security

- [x] owner accepted the first-package bootstrap limitation
- [x] owner explicitly authorized `slipbyte@0.1.0` publication
- [x] bootstrap publication completed interactively with npm account 2FA
- [x] `slipbyte@0.1.0` is public on npm
- [x] `latest` points to `0.1.0`
- [x] clean public `npm i slipbyte` install succeeds
- [x] Trusted Publisher is configured for `boulahya01/SlipByte` and `publish.yml`
- [x] Trusted Publisher permission is limited to `npm stage publish`
- [x] package publishing access requires 2FA and disallows bypass-2FA tokens
- [x] no long-lived npm publish token is used for the steady-state release flow

`0.1.0` was published locally as the bootstrap version, so it does **not** have GitHub Actions provenance. Verify provenance on the first later version published through the trusted OIDC workflow.

## Core `0.1.0` software boundary

- [x] receipt/print document foundation
- [x] deterministic layout engine
- [x] versioned print-document contract
- [x] capability/device profile model
- [x] native-text versus raster representation selection
- [x] profile-scoped ESC/POS text configuration
- [x] ESC/POS encoder and explicit raster strategy boundary
- [x] raw TCP transport
- [x] mock printer / deterministic preview
- [x] structured diagnostics and retry-safety model
- [x] compatibility evidence contracts
- [x] Canvas2D Unicode-to-raster adapter
- [x] representative software Unicode/raster conformance evidence

## Compatibility boundary

`0.1.0` intentionally makes **no named physical-printer compatibility claim**.

Software tests, Canvas rendering evidence, TCP contract coverage, and CI do not prove that a specific physical printer will produce correct output. A future named compatibility claim must record the exact printer model, firmware/environment, transport, profile, command strategy, fixture, and observed result.

USB is not part of the `0.1.0` transport scope.

## Future releases

Use [`RELEASING.md`](RELEASING.md) for the steady-state process:

protected version PR → exact validation → maintainer-created release tag → GitHub OIDC `npm stage publish` → maintainer 2FA approval → public package.

Package publication, version selection, release tags, and GitHub Releases remain explicit maintainer-controlled actions.
