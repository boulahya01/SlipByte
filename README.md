# SlipByte

> Predictable thermal printing for TypeScript.

SlipByte is a TypeScript-first toolkit for building receipt-printing workflows without spreading printer-specific logic through application code.

It gives you deterministic layout, explicit device capabilities, ESC/POS encoding, raw TCP transport, hardware-free preview, and structured diagnostics.

## Install

```bash
npm install slipbyte
```

Requires Node.js `^22.0.0 || ^24.0.0`.

## Quick start

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

`mockPrint()` uses the real receipt and layout path without sending anything to hardware. The same flow is exercised from the packed npm artifact by `npm run release:check`.

## What SlipByte provides

- chainable receipt construction and versioned print documents
- deterministic 58 mm, 80 mm, and custom paper layout
- explicit device capabilities and compatibility evidence
- native-text or raster representation selection
- capability-aware ESC/POS encoding
- raw TCP transport with explicit timeouts and delivery-state diagnostics
- hardware-free preview and package-level verification
- structured errors designed to avoid leaking receipt content

## Current scope

`slipbyte@0.1.0` is published on npm.

The current transport is raw TCP. USB, serial, Bluetooth, and operating-system printer queues are not part of `0.1.0`.

SlipByte currently makes **no named physical-printer compatibility claim**. Software tests, Canvas rendering conformance, and TCP contract coverage are useful evidence for the software boundary, but they do not prove that a specific printer will produce correct physical output.

## Architecture

```text
Receipt intent
    ↓
Print document
    ↓
Layout
    ↓
Device profile / capabilities
    ↓
Representation selection
    ↓
Protocol encoder
    ↓
Transport
```

Each layer has a narrow job. Layout does not depend on a printer connection, representation selection does not hide protocol commands, and preview does not implement a second layout engine.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Text and raster fallback

SlipByte keeps Unicode handling explicit:

```text
Unicode text
→ native encoding when the active profile supports it
→ otherwise raster fallback when explicitly allowed
→ otherwise fail before transport
```

Raster rendering support is intentionally separate from physical-printer compatibility. Actual glyph coverage, shaping, bidi behavior, fonts, and printer raster commands remain runtime/device-specific concerns that must be validated with evidence.

See [`docs/TEXT_REPRESENTATION.md`](docs/TEXT_REPRESENTATION.md), [`docs/RASTER.md`](docs/RASTER.md), and [`docs/UNICODE_CONFORMANCE.md`](docs/UNICODE_CONFORMANCE.md).

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system boundaries
- [`docs/PRINT_DOCUMENT.md`](docs/PRINT_DOCUMENT.md) — versioned print-document contract
- [`docs/LAYOUT.md`](docs/LAYOUT.md) — deterministic layout
- [`docs/CAPABILITIES.md`](docs/CAPABILITIES.md) — device capability model
- [`docs/ESC_POS.md`](docs/ESC_POS.md) — ESC/POS encoding
- [`docs/TCP.md`](docs/TCP.md) — raw TCP transport
- [`docs/DIAGNOSTICS.md`](docs/DIAGNOSTICS.md) — errors and delivery state
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — what comes next
- [`docs/RELEASING.md`](docs/RELEASING.md) — staged npm release process

## Contributing

Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request. Compatibility claims should include exact, reviewable evidence rather than broad printer-brand assumptions.

Security reports should follow [`SECURITY.md`](SECURITY.md).

## License

MIT.
