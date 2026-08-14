# OpenReceipt Architecture

## Goal

OpenReceipt separates what an application wants to print from how a particular printer receives and renders it.

```text
Application
    ↓
Receipt builder
    ↓
Receipt document
    ↓
Layout engine
    ↓
Printer profile
    ↓
Protocol encoder
    ↓
Transport
    ↓
Printer
```

## 1. Receipt document

The receipt document is hardware-independent application intent.

Examples:

- text
- item rows
- totals
- dividers
- QR codes
- barcodes
- images
- feed
- cut

The receipt document must not contain TCP addresses, USB identifiers, ESC/POS bytes, printer-brand conditions, or operating-system implementation details.

## 2. Layout engine

The layout engine turns receipt intent into a representation constrained by a paper/profile width.

Responsibilities will include:

- 58 mm and 80 mm paper profiles;
- wrapping;
- columns;
- alignment;
- line width calculation;
- international text layout;
- image sizing.

Layout should remain testable without physical hardware.

## 3. Printer profile

A printer profile describes capabilities and known quirks.

Examples of capabilities:

- cutter;
- cash drawer pulse;
- native QR;
- native barcode;
- status query;
- supported code pages;
- raster image support.

Application code should query or request capabilities rather than branch on brands.

## 4. Protocol encoder

The encoder translates laid-out receipt operations into bytes for a printer protocol.

V1 protocol target: ESC/POS.

Encoders must not own network or USB connections.

## 5. Transport

A transport only moves encoded bytes and, where supported, reads responses.

Initial targets:

- TCP;
- USB where practical.

Future transports may include serial, operating-system print queues, or a local print agent. Adding a transport should not require changing receipt-building code.

## Failure model

Expected failures should use structured error codes and useful metadata.

Examples:

- connection failure;
- unsupported capability;
- invalid configuration;
- printer unavailable;
- paper out;
- cover open;
- encoding fallback used.

A low-level system error may be preserved as a cause, but application developers should receive an OpenReceipt-level explanation.

## Fallbacks

Fallbacks must be explicit and safe.

Example:

```text
Arabic text
   ↓
native printer encoding available? ── yes ─→ native output
   │
   no
   ↓
raster text fallback
```

The library should expose when an important fallback occurs instead of pretending every printer handled the feature natively.

## AI-agent design requirement

Public types and documentation are part of the API. Coding agents should be able to determine:

- what an API does;
- required input;
- defaults;
- supported capability;
- expected output;
- structured failures;
- fallback behavior;
- relevant edge cases.

If correct usage requires reading internal implementation code, the public interface is not finished.
