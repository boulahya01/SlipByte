# SlipByte Roadmap

Last reviewed: 2026-08-19

SlipByte is being developed before the first npm release. The roadmap is ordered by architecture dependency, not by feature count.

## North star

> Make hardware printing predictable for developers and AI coding agents.

A feature belongs in the core when it removes hardware/protocol integration work, reduces ambiguity, or makes failures easier to diagnose without forcing application code to understand printer internals.

## v0.1 engineering sequence

### 1. Receipt / print document foundation — complete

Implemented:

- chainable receipt builder
- immutable document snapshots
- structured validation errors
- unsafe control-character rejection in normal text

### 2. Deterministic layout engine — complete

Implemented:

- 58 mm / 32-column convenience profile
- 80 mm / 48-column convenience profile
- custom paper profiles
- wrap / truncate / error overflow policies
- deterministic alignment and two-column item/total layout
- grapheme-aware default measurement
- injectable text-width modeling

### 3. Capability/device profile model — complete for v0.1 core

Implemented:

- generic device profiles
- explicit `native`, `fallback`, and `unsupported` capability states
- capability resolution and requirement helpers
- structured unsupported-capability failure
- safe runtime profile validation
- ordered device text-encoding policy

Broader real-device profile data remains evidence-driven and will grow after hardware validation.

### 4. Versioned print-document/schema contract — complete

Implemented:

- stable `PrintDocumentV1` JSON-compatible boundary
- explicit version marker and runtime parsing
- protocol/transport-independent serialized intent
- unknown-version rejection
- versioned node types isolated from mutable builder internals

### 5. ESC/POS encoder — complete for current v0.1 scope

Implemented:

- deterministic byte output from `LayoutDocument`
- explicit ESC/POS protocol gating through device profiles
- native text capability enforcement
- strict printable-ASCII default encoder with injectable alternatives
- emphasis, feed, and capability-aware cut handling
- explicit cut fallback rather than silent downgrade
- profile-scoped ESC/POS code-page selection rather than a universal mapping
- deterministic byte fixtures

### 6. TCP transport — complete

Implemented:

- explicit host and port configuration
- raw Node.js TCP connect/write/close lifecycle
- separate connect, write, and close timeouts
- structured connect/write/early-close/close failure states
- injectable connector boundary
- safe abort/cleanup behavior
- no blind automatic retries because delivery can be uncertain
- loopback socket contract coverage without physical hardware

A successful TCP send means no transport failure was detected while handing bytes through the socket; it does not prove that paper physically exited the printer.

### 7. Mock printer and preview — complete

Implemented:

- `mockPrint()` over the real layout path
- deterministic human-readable preview
- immutable layout capture
- feed and cut intent representation
- hardware-free contract tests

Preview does not duplicate layout, capability, protocol, or transport logic.

### 8. Diagnostics and failure model — complete for current core

Implemented:

- stable SlipByte-level diagnostic classification
- encoding/capability/transport stage mapping
- retry-safety guidance
- explicit `not-started`, `uncertain`, and `unknown` delivery states
- conservative handling of unstructured external failures
- no blind retry advice after uncertain transport delivery

### 9. Compatibility evidence contracts — complete

Implemented:

- provenance-aware capability evidence records
- separation of `DeviceProfile` behavior from real-device evidence
- preservation of contradictory reports
- missing evidence remains unknown rather than becoming `unsupported`
- runtime validation and metadata-safety rules

Real compatibility claims still require exact, reviewable hardware or documentation evidence.

### 10. Unicode rendering and fallback strategy — complete for v0.1 software boundary

Implemented and validated:

- generic native-text versus raster representation selection
- profile-ordered native encoding candidates
- explicit pre-transport failure when text cannot be represented safely
- canonical packed monochrome `RasterImage`
- explicit raster capability/strategy boundary
- opt-in ESC/POS raster encoders rather than a universal graphics command
- Canvas2D Unicode-to-raster adapter
- explicit text direction propagation for RTL/LTR cases
- deterministic RGBA-to-monochrome conversion
- real `@napi-rs/canvas` conformance run with non-blank Latin, Arabic/RTL, CJK, combining-mark, emoji, and mixed-script fixtures

The conformance evidence proves representative software rendering produced ink. It does not prove universal glyph correctness or physical-printer compatibility.

### 11. CI and package hardening — complete for current `main`

Implemented and validated:

- committed npm lockfile and clean `npm ci`
- package contents audited through `scripts/verify-package.mjs`
- isolated packed-package runtime import smoke test
- packed declaration-consumer typecheck
- `prepublishOnly` wired to the full release gate
- Node.js 22 and 24 GitHub Actions matrix
- successful GitHub-hosted CI after the account billing/startup blocker was resolved
- exact merged-main local `npm ci && npm run release:check` with 89/89 tests passing

### 12. Project/package identity — complete

The original OpenReceipt name collided with an unrelated existing ecosystem. The owner selected **SlipByte** before the first public/npm release.

Completed:

- package metadata and public API branding use SlipByte consistently
- repository-facing docs use SlipByte consistently
- exact npm availability for unscoped `slipbyte` was confirmed directly against the registry before publication
- the GitHub repository was renamed to `boulahya01/SlipByte`
- public repository description/topics and release docs use the SlipByte identity

Identity issue #32 is closed completed.

### 13. Real hardware validation — required for physical compatibility claims, not for a claim-free first release

A named physical-printer compatibility claim requires end-to-end evidence through:

```text
Print document
→ layout
→ capability resolution
→ representation selection
→ ESC/POS encoder
→ transport
→ real device
```

For every future compatibility claim, record exact printer model, firmware/environment, transport, profile, command strategy, input fixture, and observed result.

The first npm release intentionally makes **no named physical-printer compatibility claim**. Therefore physical-printer testing is not represented as a completed release proof and is not required merely to publish the software package. Software tests, Canvas conformance, and TCP contract coverage must never be presented as hardware evidence.

### 14. Public-development audit and npm v0.1 — release preparation active

Completed:

- public-development audit #11
- repository visibility/metadata review
- all-history sensitive-data review
- protected default-branch ruleset with required Node.js 22/24 checks
- package identity `slipbyte`
- owner-confirmed and merged package version `0.1.0`
- packed-package artifact/runtime/declaration verification

Remaining before npm publication:

- finish the release-facing claim/copy-paste audit
- configure npm trusted publishing/provenance using current official guidance
- ensure release publication cannot bypass `npm run release:check`
- run final exact-release-candidate validation on Node.js 22 and 24
- summarize unsupported/untested areas and residual release risks
- obtain explicit owner authorization before npm publication, tag creation, or GitHub Release creation

Repository visibility is already public. npm publication remains an explicit maintainer action; automation does not perform it automatically.

## After v0.1

Likely expansion areas, driven by real demand/evidence:

- broader USB support
- serial
- Bluetooth where the runtime permits it safely
- operating-system printer queues
- richer images/logos and raster processing
- QR/barcode capability depth
- cash drawer/status feedback depth
- more verified device profiles
- browser-to-local-printer agent/bridge
- additional protocol adapters
- additional SDKs/languages around the versioned document contract

These are directions, not promises. Do not jump ahead when a lower layer is still unstable.

## Public development rule

Public issues, PRs, discussions, docs, and commits should preserve real engineering knowledge. Search/discoverability is a useful side effect of solving real printing problems clearly; it is not a reason to manufacture repository activity.
