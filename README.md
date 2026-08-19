# SlipByte

> Thermal printing should feel like using a normal software API, not programming hardware.

SlipByte is an open-source, TypeScript-first toolkit for building predictable printing workflows around thermal printers and related hardware.

It is designed for both developers and AI coding agents: strong types, deterministic layout, structured errors, explicit device capabilities, and as little printer-specific knowledge as possible in application code.

## Product boundary

SlipByte starts with thermal receipt printing because that is the concrete problem being solved first. The core is **not tied to one business domain, human language/script, printer brand, protocol, operating system, or transport**.

Restaurants, retail, Arabic/RTL, CJK, emoji, specific printer brands/models, TCP, and USB are use cases or conformance cases—not hard-coded product modes.

## Status

SlipByte is preparing its first npm release. The repository is public, the package metadata is versioned `0.1.0`, and the package has **not** been published to npm yet.

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
- real `@napi-rs/canvas` conformance evidence for Latin, Arabic/RTL, CJK, combining marks, emoji, and mixed-script non-blank rendering
- package/release verification with clean install, build, runtime import, declaration-consumer, and packed-artifact checks
- GitHub Actions CI across Node.js 22 and 24
- input/runtime validation designed to avoid leaking receipt content through structured diagnostics
- public contribution, security, support, and maintainer policies

### Active release work

- run final exact-release-candidate validation on Node.js 22 and 24
- explicitly resolve the first-package npm bootstrap constraint before publication
- keep `0.1.0` publication as an owner-only 2FA action
- configure stage-only npm trusted publishing immediately after the package exists so later releases require maintainer approval before going live

### Remaining v0.1 path

- keep the first release free of named physical-printer compatibility claims unless exact device evidence is added
- complete the exact release-candidate clean install, tests, build, package verification, and protected CI checks
- obtain explicit maintainer acceptance of the first-package bootstrap limitation
- publish `slipbyte@0.1.0` only after explicit maintainer authorization
- after the package exists, configure the prepared stage-only OIDC workflow for future releases

USB, serial, Bluetooth, operating-system printer queues, and broader hardware adapters remain post-v0.1 expansion areas unless evidence forces a reprioritization.

The first npm release intentionally makes **no named physical-printer compatibility claim**. Software conformance and CI evidence must not be interpreted as proof that a specific physical printer will produce correct output.

## What SlipByte wants to fix

Printing is fragmented across layout, printer protocols, hardware quirks, text encoding, network/USB connections, operating-system behavior, device capabilities, and inconsistent errors.

Developers should not need to become printer-protocol experts to ship a reliable application. AI coding agents should not need to infer hardware support from a brand name or copy undocumented raw bytes from old examples.

SlipByte aims to provide one clear application-facing model while keeping device-specific concerns modular internally.

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

## Try the implemented API

The current package has a hardware-free path that exercises the real receipt and layout pipeline. This exact installed-package flow is exercised from the packed `slipbyte` tarball by `npm run release:check`:

```ts
import { mockPrint, receipt } from "slipbyte";

const document = receipt()
  .title("My Store")
  .item("Coffee", 2, 30)
  .total("TOTAL", 60)
  .cut()
  .toDocument();

const result = mockPrint(document, { paper: "80mm" });

console.log(result.preview);
```

`mockPrint()` returns the immutable layout used by protocol encoders plus a deterministic plain-text preview. It does not emulate physical printer behavior or claim hardware compatibility; it is the safe development/test path before connecting a transport.

See [`docs/PREVIEW.md`](docs/PREVIEW.md) for preview semantics and testing guidance.

## Target high-level API

The implemented lower-level path now covers document construction, layout, capability resolution, preview/mock output, native/raster representation selection, ESC/POS encoding, diagnostics, and raw TCP delivery. The complete high-level printer API shown below is still the target developer experience, **not a released API**:

```ts
import { createPrinter, receipt, tcp } from "slipbyte";

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

SlipByte has an explicit representation boundary:

```text
Unicode layout
→ native encoding when explicitly profile-configured and representable
→ otherwise explicit raster fallback when capability policy allows it
→ otherwise fail before transport
```

The generic raster contract is protocol-independent. A Canvas2D adapter can shape/render Unicode through an injected graphics runtime and convert the resulting RGBA pixels into the canonical 1-bit bitmap format. Actual glyph coverage, shaping, bidi behavior, and emoji support remain properties of the selected runtime and fonts and must be validated rather than assumed.

See [`docs/TEXT_REPRESENTATION.md`](docs/TEXT_REPRESENTATION.md), [`docs/RASTER.md`](docs/RASTER.md), [`docs/CANVAS_RASTER.md`](docs/CANVAS_RASTER.md), and [`docs/UNICODE_CONFORMANCE.md`](docs/UNICODE_CONFORMANCE.md).

## For AI coding agents

Public APIs should be understandable from types and documentation without reverse-engineering implementation details.

Important contracts should expose purpose, inputs, defaults, capabilities, expected outputs, structured failures, fallback behavior, and whether behavior is hardware-independent or device-specific.

Machine-readable capability/profile data is preferred over prose-only brand compatibility rules.

## Public development

SlipByte treats repository history as part of the project:

- commits record meaningful engineering changes, not automation checkpoints;
- issues preserve real developer/hardware problems and their final technical findings;
- PRs contain reviewable implementation and validation evidence;
- discussions are used only for genuine proposals, compatibility investigations, or reusable technical explanations;
- automated maintainers may work continuously and merge focused PRs only after the documented engineering gates pass;
- npm publication remains an explicit owner decision, and repository visibility/identity changes remain consequential owner actions.

See [`docs/MAINTAINER_GUIDE.md`](docs/MAINTAINER_GUIDE.md) and [`docs/ROADMAP.md`](docs/ROADMAP.md).

## CI status

GitHub Actions CI is functioning and runs the release-quality gate across Node.js 22 and 24 using `npm ci` followed by `npm run release:check`. A successful CI run validates the software/package contract; it does not substitute for physical-printer evidence.

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
- [`docs/UNICODE_CONFORMANCE.md`](docs/UNICODE_CONFORMANCE.md) — real Canvas runtime/font conformance boundary
- [`docs/TCP.md`](docs/TCP.md) — raw TCP transport contract and failure semantics
- [`docs/PREVIEW.md`](docs/PREVIEW.md) — mock printer and deterministic preview
- [`docs/DIAGNOSTICS.md`](docs/DIAGNOSTICS.md) — structured failure and retry-safety model
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — v0.1 engineering sequence
- [`docs/RELEASING.md`](docs/RELEASING.md) — first-package bootstrap and staged trusted-publishing process
- [`docs/MAINTAINER_GUIDE.md`](docs/MAINTAINER_GUIDE.md) — public engineering standards
- [`docs/PUBLIC_RELEASE_CHECKLIST.md`](docs/PUBLIC_RELEASE_CHECKLIST.md) — public-development and npm-release gates

## Compatibility policy

SlipByte does not claim that every printer labeled `ESC/POS compatible` supports every feature.

Compatibility should be based on tested capabilities and documented device/profile evidence. Unsupported behavior should fail explicitly or use a documented safe fallback rather than silently corrupting output.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request. Public API changes should preserve the architecture boundaries and include tests that demonstrate their contract.

Security-sensitive reports should follow [`SECURITY.md`](SECURITY.md) rather than being disclosed publicly first.

## License

MIT.
