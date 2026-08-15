# OpenReceipt

> Thermal printing should feel like using a normal software API, not programming hardware.

OpenReceipt is an open-source, TypeScript-first toolkit for building predictable printing workflows around thermal printers and related hardware.

It is designed for both developers and AI coding agents: strong types, deterministic layout, structured errors, explicit device capabilities, and as little printer-specific knowledge as possible in application code.

## Product boundary

OpenReceipt starts with thermal receipt printing because that is the concrete problem being solved first. The core is **not tied to one business domain, human language/script, printer brand, protocol, operating system, or transport**.

Restaurants, retail, Arabic/RTL, CJK, emoji, Epson-compatible devices, TCP, and USB are use cases or conformance cases—not hard-coded product modes.

## Status

OpenReceipt is in early development. The repository is intended to be developed in public before the first npm release so architecture decisions, real printing problems, tests, and compatibility evidence can remain inspectable.

### Implemented on `main`

- TypeScript-first receipt/print document foundation
- chainable receipt builder
- stable versioned `PrintDocumentV1` JSON-compatible contract
- deterministic hardware-independent layout engine
- 58 mm / 32-column and 80 mm / 48-column convenience profiles
- custom validated paper profiles
- explicit `wrap`, `truncate`, and `error` overflow policies
- grapheme-aware default text measurement with an injectable device-width model
- initial device profile and capability model
- explicit `native`, `fallback`, and `unsupported` capability states
- capability-aware ESC/POS byte encoder with deterministic fixtures
- strict default ASCII encoding plus injectable device-specific text encoders
- raw TCP transport with explicit endpoint configuration, stage-specific timeouts, safe close/abort behavior, and no blind retries
- structured OpenReceipt errors
- input validation and unsafe control-character rejection in normal text fields
- public contribution, security, support, and maintainer policies

### Active work

- mock printer and hardware-free preview workflow
- capability/profile contract hardening before broad compatibility data is added
- diagnostics and end-to-end failure semantics

### Planned v0.1 path

- practical USB transport
- structured diagnostics across protocol, transport, and device feedback
- QR codes, barcodes, images, cut, and cash-drawer handling through explicit capabilities
- compatibility fixtures and evidence-based device profiles
- arbitrary Unicode native/raster fallback strategy
- CI/release hardening
- real physical-printer validation
- first npm release

The project does **not** currently claim broad physical-printer compatibility.

## What OpenReceipt wants to fix

Printing is fragmented across layout, printer protocols, hardware quirks, text encoding, network/USB connections, operating-system behavior, device capabilities, and inconsistent errors.

Developers should not need to become printer-protocol experts to ship a reliable application. AI coding agents should not need to infer hardware support from a brand name or copy undocumented raw bytes from old examples.

OpenReceipt aims to provide one clear application-facing model while keeping device-specific concerns modular internally.

## Architecture

```text
Application / AI coding agent
            ↓
       Print intent API
            ↓
       Print document
            ↓
        Layout engine
            ↓
      Device profile
            ↓
      Protocol encoder
            ↓
        Transport
            ↓
       Output device
```

Changing a printer, protocol, or connection should not require rewriting application business logic when the requested print intent is still supported.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the layer boundaries.

## Current API foundation

The implemented lower-level path now covers document construction, layout, ESC/POS encoding, and raw TCP delivery. The complete high-level printer API shown below is still the target developer experience, **not a released API**:

```ts
import { createPrinter, receipt, tcp } from "openreceipt";

const printer = createPrinter({
  transport: tcp({ host: "192.168.1.50" }),
});

await printer.print(
  receipt()
    .title("My Store")
    .item("Coffee", 2, 30)
    .total(60)
    .cut(),
);
```

Do not depend on unreleased names from target examples until they exist in the exported package API.

## Design principles

- simple common path, powerful lower layers
- TypeScript-first and AI-agent-friendly
- domain-agnostic print intent
- content-language-agnostic text pipeline
- document/layout separate from encoding and transport
- capability-driven instead of brand-driven application code
- protocol and transport adapters behind stable core contracts
- sensible defaults with explicit overrides
- structured, actionable errors
- graceful, observable fallbacks where safe
- hardware-free development and testing
- evidence-based compatibility claims

## Capability model

The initial capability/profile layer is implemented. Application and encoder code can reason about explicit capabilities instead of branching on printer brands.

Current support states are:

```text
native
fallback
unsupported
```

The current contract still requires explicit support data for each declared capability. Missing external evidence must not be silently converted into a compatibility claim; unknown-evidence handling will be hardened before a broad compatibility database is treated as authoritative.

See [`docs/CAPABILITIES.md`](docs/CAPABILITIES.md).

## For AI coding agents

Public APIs should be understandable from types and documentation without reverse-engineering implementation details.

Important contracts should expose purpose, inputs, defaults, capabilities, expected outputs, structured failures, fallback behavior, and whether behavior is hardware-independent or device-specific.

Machine-readable capability/profile data is preferred over prose-only brand compatibility rules.

## Public development

OpenReceipt treats repository history as part of the project:

- commits record meaningful engineering changes, not automation checkpoints;
- issues preserve real developer/hardware problems and their final technical findings;
- PRs contain reviewable implementation and validation evidence;
- discussions are used only for genuine proposals, compatibility investigations, or reusable technical explanations;
- automated maintainers may work continuously and merge focused PRs only after the documented engineering gates pass;
- public visibility and npm publication remain explicit owner decisions.

See [`docs/MAINTAINER_GUIDE.md`](docs/MAINTAINER_GUIDE.md) and [`docs/ROADMAP.md`](docs/ROADMAP.md).

## CI status

GitHub Actions currently has a startup/infrastructure blocker tracked in issue #8. A workflow that never starts is **not** treated as passing CI. Local or contract validation may support development while that infrastructure issue is isolated, but CI remains a release-quality gate before the first npm release.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — architecture boundaries
- [`docs/PRINT_DOCUMENT.md`](docs/PRINT_DOCUMENT.md) — versioned print-document contract
- [`docs/LAYOUT.md`](docs/LAYOUT.md) — deterministic layout contract
- [`docs/CAPABILITIES.md`](docs/CAPABILITIES.md) — current capability/profile model
- [`docs/ESC_POS.md`](docs/ESC_POS.md) — ESC/POS encoder contract
- [`docs/TCP.md`](docs/TCP.md) — raw TCP transport contract and failure semantics
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — v0.1 engineering sequence
- [`docs/MAINTAINER_GUIDE.md`](docs/MAINTAINER_GUIDE.md) — public engineering standards
- [`docs/PUBLIC_RELEASE_CHECKLIST.md`](docs/PUBLIC_RELEASE_CHECKLIST.md) — public-development and npm-release gates

## Compatibility policy

OpenReceipt does not claim that every printer labeled `ESC/POS compatible` supports every feature.

Compatibility should be based on tested capabilities and documented device/profile evidence. Unsupported behavior should fail explicitly or use a documented safe fallback rather than silently corrupting output.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request. Public API changes should preserve the architecture boundaries and include tests that demonstrate their contract.

Security-sensitive reports should follow [`SECURITY.md`](SECURITY.md) rather than being disclosed publicly first.

## License

MIT.
