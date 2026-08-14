# OpenReceipt Roadmap

Last reviewed: 2026-08-14

OpenReceipt is being developed in public before the first npm release. The roadmap is ordered by architecture dependency, not by feature count.

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
- injectable text-width measurement for device-specific metrics

### 3. Initial capability/device profile model — complete

Implemented:

- generic device profile
- explicit `native`, `fallback`, `unsupported` states
- capability resolution
- structured unsupported-capability failure

Still to harden before broad compatibility data:

- richer capability configuration where real encoders/devices require it
- explicit handling rules for missing/unknown compatibility evidence
- profile evidence/provenance model

### 4. Versioned print-document/schema contract — next

Goal:

- define a stable, serializable print-document boundary
- keep the format transport/protocol agnostic
- make it usable by human developers, coding agents, and future SDKs/services
- version the schema so future evolution is explicit

### 5. ESC/POS encoder

Goal:

- consume layout + device capability data
- emit deterministic byte output
- keep networking/USB outside the encoder
- cover text, alignment, emphasis, feed, cut, and other v0.1 operations only when capability rules are explicit
- use byte fixtures for regression testing

### 6. TCP transport

Goal:

- connect/write/close over raw TCP with safe defaults
- explicit host/port/timeout validation
- structured connection/write/timeout errors
- injectable boundary for tests

Default ESC/POS network port assumptions must remain configurable rather than becoming core protocol truth.

### 7. Mock printer and preview

Goal:

- let developers build/test without owning hardware
- inspect deterministic layout/output
- support automated tests and AI-generated integration validation

### 8. Diagnostics and failure model

Goal:

- consistent OpenReceipt-level errors across layout, encoding, transport, and device feedback
- preserve low-level causes where safe
- avoid leaking receipt data, credentials, or network secrets by default
- provide actionable remediation hints when evidence supports them

### 9. Compatibility fixtures and profiles

Goal:

- separate protocol support from real-device evidence
- record tested capabilities and known limitations
- never treat `ESC/POS compatible` as proof of complete support
- preserve provenance for compatibility claims

### 10. CI and release hardening

Current known blocker: GitHub Actions startup/infrastructure failure tracked in issue #8.

Before npm release:

- CI must start normally
- exact release-head checks must pass
- package-lock/reproducible install strategy must be settled
- package contents must be audited with `npm pack --dry-run`
- release process must not bypass tests/typecheck

### 11. Real hardware validation

Validate the end-to-end path on physical printers before broad compatibility claims:

```text
Print document
→ layout
→ capability resolution
→ ESC/POS encoder
→ transport
→ real device
```

Record exact model/environment/evidence for claims.

### 12. Public npm v0.1

Publish only after the release checklist is satisfied or remaining exceptions are explicitly documented and accepted.

## After v0.1

Likely expansion areas, driven by real demand/evidence:

- broader USB support
- serial
- Bluetooth where the runtime permits it safely
- operating-system printer queues
- images/logos and richer raster processing
- QR/barcode capability depth
- cash drawer/status feedback depth
- more verified device profiles
- browser-to-local-printer agent/bridge
- additional protocol adapters
- additional SDKs/languages around the versioned document contract

These are directions, not promises. Do not jump ahead when a lower layer is still unstable.

## Public development rule

Public issues, PRs, discussions, docs, and commits should preserve real engineering knowledge. Search/discoverability is a useful side effect of solving real printing problems clearly; it is not a reason to manufacture repository activity.
