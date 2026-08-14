# OpenReceipt

> Thermal printing should feel like using a normal software API, not programming hardware.

OpenReceipt is an open-source, TypeScript-first toolkit for building and printing thermal receipts. It is designed for developers and AI coding agents: predictable APIs, strong types, structured errors, explicit capabilities, and minimal printer-specific knowledge in application code.

## Status

**Early development — not released to npm yet.**

The repository is intentionally validating the developer experience and architecture before making broad hardware compatibility claims. APIs may change before the first release.

## Why OpenReceipt

From an application's perspective, the task is simple: build a receipt and print it. In practice, thermal printing crosses several unrelated concerns:

```text
Receipt layout
      ↓
Text encoding / RTL
      ↓
Printer capabilities
      ↓
ESC/POS encoding
      ↓
TCP / USB / other transport
      ↓
Operating system + hardware
```

OpenReceipt aims to give application code one clear model while keeping those layers separate internally.

## Design principles

- simple common path, powerful lower layers
- TypeScript-first and AI-agent-friendly
- receipt intent separate from printer encoding and transport
- capability-driven instead of brand-driven application code
- sensible defaults with explicit overrides
- structured, actionable errors
- graceful fallbacks only where behavior is safe and predictable
- hardware-free development and testing
- Arabic and RTL treated as first-class requirements
- evidence-based hardware compatibility claims

## V1 direction

V1 is deliberately focused on ESC/POS receipt printers with Node.js / TypeScript:

- receipt document and layout model
- 58 mm and 80 mm layouts
- text, alignment, columns, wrapping, totals, and separators
- TCP transport first
- USB transport where practical
- QR codes and barcodes
- images / logos
- cut and cash-drawer actions
- Arabic / RTL with a documented fallback strategy
- mock / preview support
- clear diagnostics and structured errors

These are goals for V1, not claims that every item is implemented today.

## Current API foundation

The first implemented layer is a hardware-independent receipt document builder:

```ts
import { receipt } from "openreceipt";

const document = receipt()
  .title("My Store")
  .item("Coffee", 2, 30)
  .divider()
  .total("TOTAL", 60)
  .feed()
  .cut()
  .toDocument();
```

The receipt document is intentionally separate from layout, ESC/POS encoding, printer profiles, and transport.

## Target printing experience

The intended high-level experience is:

```ts
import { createPrinter, receipt, tcp } from "openreceipt";

const printer = createPrinter({
  transport: tcp({ host: "192.168.1.50" }),
});

await printer.print(
  receipt()
    .title("My Store")
    .item("Coffee", 2, 30)
    .total("TOTAL", 60)
    .cut(),
);
```

`createPrinter()` and `tcp()` above describe the target API direction and are **not part of the current public implementation yet**.

## Architecture

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

Changing printer hardware or connection type should not require rewriting receipt business logic.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the architectural boundaries.

## AI coding agents

OpenReceipt treats AI-agent usability as part of API design, not an afterthought. Public APIs should expose enough information through types and documentation for a coding agent to understand:

- purpose
- accepted input
- defaults
- output
- structured errors
- required capabilities
- fallback behavior
- important edge cases

Repository-level instructions live in [`AGENTS.md`](AGENTS.md).

## Compatibility

Do not infer compatibility from a printer brand or the phrase "ESC/POS compatible" alone. Printer firmware and command support vary.

As hardware support lands, compatibility claims will identify exact models and evidence wherever practical. Untested behavior should be described as unverified rather than supported.

## Contributing

Contributions and hardware reports are welcome. Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request.

For bugs, include a minimal sanitized reproduction plus the exact runtime, transport, and printer model when relevant.

## Security

Do **not** disclose vulnerabilities or exploit details in public issues. Follow [`SECURITY.md`](SECURITY.md) for private reporting guidance.

Never attach real customer receipts, credentials, tokens, or sensitive printer/network data to public bug reports.

## Support

See [`SUPPORT.md`](SUPPORT.md) for supported project boundaries and the information needed for useful hardware reports.

## Public release discipline

OpenReceipt will be developed publicly, but releases should only make claims backed by implementation and testing. The repository maintains a [`public release checklist`](docs/PUBLIC_RELEASE_CHECKLIST.md) covering secrets, npm packaging, compatibility evidence, security, developer experience, and AI-agent usability.

## License

MIT. See [`LICENSE`](LICENSE).
