# OpenReceipt Architecture

## Goal

OpenReceipt separates **what an application wants to print** from **how a particular device receives and renders it**.

The architecture must not assume one business domain, one human language/script, one printer brand, one protocol, or one transport.

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

OpenReceipt begins with thermal receipt printers because that is the concrete problem being solved first. The abstractions above should remain general enough that adding another compatible protocol, transport, or print workflow does not require rewriting application intent.

## 1. Print document

The document is hardware-independent application intent.

Current and planned primitives include:

- text;
- rows/items;
- totals/values;
- dividers;
- QR codes;
- barcodes;
- images;
- feed;
- cut;
- other explicit hardware actions where appropriate.

The document must not contain TCP addresses, USB identifiers, ESC/POS bytes, printer-brand conditions, operating-system implementation details, or assumptions about one business vertical.

Semantic convenience APIs may exist, but the underlying model should remain useful outside restaurants or retail.

## 2. Layout engine

The layout engine converts print intent into a deterministic representation constrained by a media/device profile.

Responsibilities include:

- media width/profile handling;
- wrapping;
- columns;
- alignment;
- text measurement;
- arbitrary Unicode/mixed-script layout;
- image sizing;
- explicit overflow behavior.

Layout must remain testable without physical hardware.

Text layout must use an explicit measurement strategy rather than assuming every Unicode code point occupies one printer cell. Latin, Arabic/RTL, CJK, combining marks, emoji, and mixed-script strings are test cases for the same general text pipeline.

## 3. Device / printer profile

A profile describes capabilities, limits, and known quirks of a target device or device family.

Examples:

- printable columns / width;
- cutter;
- cash drawer pulse;
- native QR;
- native barcode;
- status query;
- supported encodings/code pages;
- raster image support;
- text metrics / font modes;
- protocol-specific limitations.

Application code should request capabilities rather than branch on brands.

Compatibility claims must be evidence-based. A brand name or `ESC/POS compatible` label is not enough to claim support for every capability.

## 4. Representation selection

Representation selection decides how laid-out content should be represented **before** protocol-specific bytes are emitted.

For text, the current contract can select:

- native text when the device profile explicitly permits a configured encoding and that candidate can represent the complete text run;
- raster fallback when native text is unsafe or insufficient and raster fallback is explicitly allowed by capability policy;
- a structured failure when neither representation is safe.

This boundary does not contain ESC/POS code-page command values or a universal raster command. Protocol adapters remain responsible for mapping representation intent to reviewed protocol/device configuration.

Unicode shaping, bidi behavior, glyph coverage, and emoji rendering are properties of the configured text-rendering runtime and fonts. The Canvas2D adapter is one injected rendering path; it does not turn a successful software render into a physical-printer compatibility claim.

See [`TEXT_REPRESENTATION.md`](TEXT_REPRESENTATION.md), [`RASTER.md`](RASTER.md), and [`CANVAS_RASTER.md`](CANVAS_RASTER.md).

## 5. Protocol encoder

The encoder translates laid-out operations and selected representations into a printer/device protocol.

First protocol target: ESC/POS.

ESC/POS is an adapter behind the core architecture, not the definition of OpenReceipt.

Encoders:

- must not own network/USB connections;
- must not accept untrusted application text as raw control bytes;
- must validate requested capabilities;
- should produce deterministic output for deterministic input/profile data.

Future encoders can be added without changing receipt-building code when the same print intent is meaningful for them.

## 6. Transport

A transport moves encoded data and, where supported, reads responses.

The v0.1 transport path is raw TCP. USB is intentionally deferred from the v0.1 core unless hardware evidence forces reprioritization.

Future transports may include:

- USB;
- serial;
- operating-system print queues;
- local print agents;
- other device communication adapters.

Adding a transport must not require changing document/layout logic.

## 7. Capability model

Capabilities are the boundary between application intent and real hardware support.

Examples:

```text
cut
cash-drawer
qr-native
barcode-native
raster
status-query
text-encoding
```

The application asks for an operation. The selected profile/encoder determines whether that operation is native, requires a safe fallback, or is unsupported.

This prevents code such as:

```text
if brand == Epson ...
if brand == XPrinter ...
```

from spreading through user applications.

## 8. Fallback model

Fallbacks must be explicit, safe, and observable.

General example:

```text
requested content/operation
          ↓
native capability available? ── yes ─→ native output
          │
          no
          ↓
safe fallback available? ────── yes ─→ fallback + diagnostic
          │
          no
          ↓
structured unsupported-capability error
```

Examples include rasterizing text/images when native device encoding is insufficient or generating a barcode as raster content when a native barcode implementation is unreliable.

A fallback should never silently corrupt user content.

## 9. Failure and diagnostics model

Expected failures use structured error codes and useful metadata.

Examples:

- invalid configuration;
- unsupported capability;
- connection failure;
- device unavailable;
- timeout;
- paper out;
- cover open;
- invalid encoding;
- fallback used;
- malformed profile;
- unsafe control input.

A low-level system error may be preserved as a cause, but application developers and AI agents should receive an OpenReceipt-level explanation and, where practical, a remediation hint.

Diagnostics must avoid leaking receipt data, credentials, device secrets, or network secrets by default.

## 10. AI-agent design requirement

Public types and documentation are part of the executable product contract.

Coding agents should be able to determine:

- what an API does;
- required input;
- defaults;
- capabilities;
- expected output;
- structured failures;
- fallback behavior;
- relevant edge cases;
- whether behavior is hardware-independent or device-specific.

Machine-readable profiles/capabilities should be preferred over prose-only compatibility rules where practical.

If correct usage requires reading implementation internals, guessing from a printer brand, or copying undocumented raw bytes, the public interface is not finished.

## Non-goals for the core

The core should not become:

- restaurant-specific business logic;
- a locale/currency formatter;
- an Arabic-specific renderer;
- an Epson-specific SDK;
- a giant raw ESC/POS command dump;
- a transport implementation mixed into layout;
- an operating-system printer manager.

Those concerns can be composed around the core where needed without limiting the common printing model.
