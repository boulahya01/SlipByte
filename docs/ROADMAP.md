# SlipByte Roadmap

Last reviewed: 2026-08-19

`slipbyte@0.1.0` is published on npm. Development on `main` has since added the first simple high-level ESC/POS-over-TCP print orchestration API; physical-printer evidence remains the next major validation gate.

## North star

> Make hardware printing predictable for developers and coding agents.

A feature belongs in the core when it removes hardware/protocol integration work, reduces ambiguity, or makes failures easier to diagnose without forcing application code to understand printer internals.

## v0.1.0 — released

The first release established the software boundary:

- chainable receipt builder and immutable print documents
- stable `PrintDocumentV1` JSON-compatible contract
- deterministic 58 mm, 80 mm, and custom-paper layout
- grapheme-aware measurement with injectable device-width modeling
- explicit device capability/profile model
- native-text versus raster representation selection
- profile-scoped ESC/POS text configuration
- deterministic ESC/POS text, feed, emphasis, cut, and raster encoding boundaries
- raw TCP transport with stage-specific timeouts and conservative delivery-state handling
- hardware-free `mockPrint()` preview over the real layout path
- structured diagnostics and retry-safety guidance
- provenance-aware compatibility evidence contracts
- Canvas2D Unicode-to-raster adapter and representative software conformance coverage
- package verification from the packed npm artifact, including runtime import and TypeScript declaration checks
- Node.js 22 and 24 CI release gates
- native Windows package-verifier support

Release/security state:

- `slipbyte@0.1.0` is public and installable from npm
- the bootstrap publish used interactive maintainer 2FA
- `0.1.0` does not have GitHub Actions provenance because it was the first-package bootstrap
- future publishing is configured through GitHub OIDC with `npm stage publish` only
- npm package publishing access requires 2FA and disallows bypass-2FA tokens

## Current limits

The current transport is raw TCP.

USB, serial, Bluetooth, operating-system printer queues, richer image processing, QR/barcode depth, cash-drawer/status feedback, and broader device profiles remain post-v0.1 work.

SlipByte makes **no named physical-printer compatibility claim yet**. Software tests, Canvas conformance, and TCP contract coverage are not physical-printer evidence.

The high-level `printEscPosTcp()` orchestration API is implemented on `main` after the `0.1.0` release. It is not part of the published `0.1.0` package unless and until a later release is explicitly authorized and published.

## Next

### 1. Real printer evidence

Validate one exact ESC/POS printer end to end and record:

- model and firmware/environment
- transport and endpoint
- device profile
- text/raster strategy
- fixture used
- observed output

Compatibility claims should be added only from exact, reviewable evidence.

### 2. High-level printing API — implemented on `main`

`printEscPosTcp()` now provides the common ESC/POS-over-TCP path on top of the existing layers:

```text
ReceiptDocument
→ layoutReceipt()
→ encodeEscPos()
→ sendTcp()
```

The API keeps the device profile and transport explicit and reuses the existing layout, capability, encoding, protocol, and transport contracts rather than duplicating them.

Further high-level API work should be driven by concrete consumer or hardware evidence, not by adding convenience surface speculatively.

### 3. Expand from evidence and demand

Likely areas:

- verified device profiles
- USB support
- richer images/logos
- QR/barcodes
- serial and Bluetooth where runtime constraints are clear
- operating-system printer queues
- browser-to-local-printer bridge/agent
- additional protocol adapters

These are directions, not promises. Real device evidence and user demand should decide the order.

## Public development rule

Issues, PRs, discussions, docs, and commits should preserve real engineering knowledge. Discoverability is useful, but it is not a reason to manufacture repository activity.
