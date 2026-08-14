# OpenReceipt

> Thermal printing should feel like using a normal software API, not programming hardware.

OpenReceipt is an open-source, TypeScript-first toolkit for building and printing thermal receipts. It is designed for both developers and AI coding agents: predictable APIs, strong types, structured errors, clear capabilities, and minimal printer-specific knowledge in application code.

## Status

OpenReceipt is in early development. The first goal is to design and validate the developer experience before expanding hardware support.

## What OpenReceipt wants to fix

Thermal printing is fragmented across receipt layout, ESC/POS commands, printer quirks, text encoding, USB/TCP connections, operating-system behavior, and hardware capabilities. OpenReceipt aims to provide one clear application-facing model while keeping those concerns modular internally.

## Design principles

- Simple common path, powerful lower layers
- TypeScript-first and AI-agent-friendly
- Receipt document separate from printer encoding and transport
- Capability-driven instead of brand-driven application code
- Sensible defaults with explicit overrides
- Structured, actionable errors
- Graceful fallbacks where safe
- Hardware-free development and testing
- Arabic and RTL treated as first-class requirements

## V1 direction

V1 will focus on ESC/POS receipt printers with Node.js/TypeScript and a deliberately small feature set:

- Receipt document and layout model
- 58 mm and 80 mm layouts
- Text, alignment, columns, wrapping, totals, and separators
- TCP transport first
- USB transport where practical
- QR codes and barcodes
- Images/logos
- Cut and cash-drawer actions
- Arabic/RTL with a reliable fallback strategy
- Mock/preview support
- Clear diagnostics and errors

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
Application / AI-generated code
            ↓
       Receipt API
            ↓
    Receipt document
            ↓
      Layout engine
            ↓
     Printer profile
            ↓
      ESC/POS encoder
            ↓
   Transport abstraction
            ↓
      Thermal printer
```

Receipt creation, printer encoding, and hardware transport are separate concerns. Changing a printer or connection should not require rewriting receipt business logic.

## For AI coding agents

Public APIs should be understandable from types and documentation without reverse-engineering implementation details. Important APIs should document purpose, inputs, defaults, outputs, errors, required capabilities, fallbacks, and edge cases.

## Contributing

OpenReceipt is being built in public as a focused developer-tooling project. Contribution guidelines and the initial roadmap will be added as the foundation lands.

## License

MIT — license file will be included in the initial project scaffold.
