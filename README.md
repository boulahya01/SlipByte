# OpenReceipt

> Thermal printing should feel like using a normal software API, not programming hardware.

OpenReceipt is an open-source, TypeScript-first toolkit for building reliable printing workflows around thermal printers and related hardware.

It is designed for both developers and AI coding agents: predictable APIs, strong types, structured errors, explicit capabilities, and minimal device-specific knowledge in application code.

## Product boundary

OpenReceipt starts with thermal receipt printing because that is the concrete problem we are solving first, but the core is **not tied to one business, human language, printer brand, protocol, or connection type**.

The architecture should let the same application intent work across compatible hardware through profiles, capabilities, protocol encoders, and transports.

Examples such as restaurants, retail, Arabic/RTL, CJK, emoji, Epson-compatible devices, TCP, and USB are use cases or conformance cases—not hard-coded product modes.

## Status

OpenReceipt is in early development. The current focus is validating the core developer experience and architecture before claiming broad physical-printer compatibility.

### Implemented in the current foundation

- TypeScript-first print/receipt document model
- chainable receipt builder
- structured OpenReceipt errors
- input validation
- raw control-character rejection in normal text fields
- hardware-independent architecture boundaries
- public contribution/security/support policies

### In active development

- deterministic layout engine
- 58 mm / 80 mm convenience profiles
- custom media/column profiles
- explicit wrapping/truncation/error behavior
- extensible text measurement for arbitrary Unicode and device metrics

### Planned V1 hardware path

- capability/device profile model
- ESC/POS encoder
- TCP transport
- practical USB transport
- QR codes and barcodes
- images/logos
- cut and cash-drawer actions
- mock/preview workflows
- robust mixed-script/international text handling and safe fallbacks
- clear diagnostics and device errors

## What OpenReceipt wants to fix

Printing is fragmented across layout, printer protocols, hardware quirks, text encoding, network/USB connections, operating-system behavior, device capabilities, and inconsistent error handling.

Developers should not need to become printer-protocol experts to ship a reliable application.

AI coding agents should not need to guess what a printer supports from a brand name or copy undocumented raw bytes from old examples.

OpenReceipt aims to provide one clear application-facing model while keeping device-specific concerns modular internally.

## Design principles

- Simple common path, powerful lower layers
- TypeScript-first and AI-agent-friendly
- Domain-agnostic print intent
- Content-language-agnostic text pipeline
- Document/layout separate from encoding and transport
- Capability-driven instead of brand-driven application code
- Protocol and transport adapters behind stable core contracts
- Sensible defaults with explicit overrides
- Structured, actionable errors
- Graceful, observable fallbacks where safe
- Hardware-free development and testing
- Evidence-based compatibility claims

## API direction

The public API is still being designed. The target experience is intentionally straightforward:

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

The code above documents the desired developer experience, not a stable released API yet.

## Architecture direction

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

## For AI coding agents

Public APIs should be understandable from types and documentation without reverse-engineering implementation details.

Important contracts should expose:

- purpose
- inputs and defaults
- capabilities
- expected outputs
- structured errors
- remediation hints where practical
- fallback behavior
- edge cases
- hardware-independent vs device-specific boundaries

Machine-readable capability/profile data is preferred over prose-only brand compatibility rules.

## Compatibility policy

OpenReceipt does not claim that every printer labeled `ESC/POS compatible` supports every feature.

Compatibility should be based on tested capabilities and documented device/profile evidence. Unsupported behavior should fail explicitly or use a documented safe fallback rather than silently corrupting output.

## Contributing

See `CONTRIBUTING.md` before opening a pull request. Public API changes should preserve the architecture boundaries and include tests that demonstrate their contract.

Security-sensitive reports should follow `SECURITY.md` rather than being disclosed publicly first.

## License

MIT.
