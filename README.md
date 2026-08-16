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
- device profile and capability model with explicit `native`, `fallback`, and `unsupported` states
- provenance-aware compatibility evidence contracts that preserve conflicting/unknown evidence
- capability-aware ESC/POS byte encoder with deterministic fixtures
- profile-scoped ESC/POS text-encoding configuration instead of global code-page assumptions
- raw TCP transport with explicit endpoint configuration, stage-specific timeouts, safe close/abort behavior, and no blind retries
- hardware-free mock printing and deterministic text preview
- structured diagnostics with explicit retry-safety and delivery-state semantics
- native-text versus raster representation selection
- canonical packed monochrome raster-image contract
- explicit ESC/POS raster strategy boundary; no universal graphics command is assumed
- Canvas2D Unicode-to-raster adapter with explicit RTL/LTR direction and deterministic monochrome conversion
- input/runtime validation designed to avoid leaking receipt content through structured diagnostics
- public contribution, security, support, and maintainer policies

### Active work

- real Canvas runtime/font conformance for Arabic/RTL, CJK, combining marks, emoji, and mixed-script raster fallback
- GitHub Actions startup blocker investigation and release-quality CI restoration
- v0.1 package/release hardening and real physical-printer validation

### Remaining v0.1 path

- finish Unicode raster conformance with evidence from an actual text-rendering runtime/font configuration
- restore normal CI execution and run exact release-head checks
- audit package contents and reproducible install/release behavior
- validate the end-to-end path on physical thermal printers with exact model/environment evidence
- complete the public-release audit
- publish the first npm release only after explicit maintainer authorization

USB, serial, Bluetooth, operating-system printer queues, and broader hardware adapters remain post-v0.1 expansion areas unless evidence forces a reprioritization.

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
 Representation selection
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

The implemented lower-level path now covers document construction, layout, capability resolution, preview/mock output, native/raster representation selection, ESC/POS encoding, diagnostics, and raw TCP delivery. The complete high-level printer API shown below is still the target developer experience, **not a released API**:

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

The capability/profile layer is implemented. Application and encoder code can reason about explicit capabilities instead of branching on printer brands.

Current support states are:

```text
native
fallback
unsupported
```

Compatibility evidence is stored separately from `DeviceProfile` behavior. Missing evidence remains unknown, contradictory observations remain visible, and a printer brand or generic `ESC/POS compatible` label is never promoted into a support claim automatically.

See [`docs/CAPABILITIES.md`](docs/CAPABILITIES.md) and [`docs/COMPATIBILITY.md`](docs/COMPATIBILITY.md).

## Unicode and raster fallback

OpenReceipt now has an explicit representation boundary:

```text
Unicode layout
→ native encoding when explicitly profile-configured and representable
→ otherwise explicit raster fallback when capability policy allows it
→ otherwise fail before transport
```

The generic raster contract is protocol-independent. A Canvas2D adapter can shape/render Unicode through an injected graphics runtime and convert the resulting RGBA pixels into the canonical 1-bit bitmap format. Actual glyph coverage, shaping, bidi behavior, and emoji support remain properties of the selected runtime and fonts and must be validated rather than assumed.

See [`docs/TEXT_REPRESENTATION.md`](docs/TEXT_REPRESENTATION.md), [`docs/RASTER.md`](docs/RASTER.md), and [`docs/CANVAS_RASTER.md`](docs/CANVAS_RASTER.md).

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

GitHub Actions currently has a startup/infrastructure blocker tracked in issue #8. A workflow that never starts is **not** treated as passing CI. Focused executable validation may support development while that infrastructure issue is isolated, but functioning CI remains a release-quality gate before the first npm release.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — architecture boundaries
- [`docs/PRINT_DOCUMENT.md`](docs/PRINT_DOCUMENT.md) — versioned print-document contract
- [`docs/LAYOUT.md`](docs/LAYOUT.md) — deterministic layout contract
- [`docs/CAPABILITIES.md`](docs/CAPABILITIES.md) — capability/profile model
- [`docs/COMPATIBILITY.md`](docs/COMPATIBILITY.md) — provenance-aware compatibility evidence
- [`docs/ESC_POS.md`](docs/ESC_POS.md) — ESC/POS encoder contract
- [`docs/ESC_POS_TEXT_ENCODING.md`](docs/ESC_POS_TEXT_ENCODING.md) — profile-scoped text/code-page configuration
- [`docs/TEXT_REPRESENTATION.md`](docs/TEXT_REPRESENTATION.md) — native/raster selection rules
- [`docs/RASTER.md`](docs/RASTER.md) — canonical raster image and protocol adapter boundary
- [`docs/CANVAS_RASTER.md`](docs/CANVAS_RASTER.md) — Canvas2D Unicode raster adapter
- [`docs/TCP.md`](docs/TCP.md) — raw TCP transport contract and failure semantics
- [`docs/PREVIEW.md`](docs/PREVIEW.md) — mock printer and deterministic preview
- [`docs/DIAGNOSTICS.md`](docs/DIAGNOSTICS.md) — structured failure and retry-safety model
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
