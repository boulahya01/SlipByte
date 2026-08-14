# OpenReceipt Agent Guide

This repository is intentionally designed to be easy for coding agents to understand and modify safely.

## North star

OpenReceipt should make thermal-printer integration feel like using a normal software API, not programming hardware.

## Architecture boundaries

Keep these concerns separate:

1. Receipt document: what the application wants to print.
2. Layout: how receipt content fits a paper profile.
3. Encoder: how a printer protocol represents that layout.
4. Printer profile: hardware capabilities and quirks.
5. Transport: how bytes reach the printer.

Application-facing receipt code must not contain ESC/POS bytes, USB details, TCP sockets, or printer-brand conditions.

## Public API rules

When adding or changing public APIs:

- prefer explicit names over clever abstractions;
- keep defaults predictable and documented;
- expose structured errors with stable error codes;
- avoid boolean arguments when an options object is clearer;
- model unsupported features as capabilities rather than brand checks;
- document fallback behavior;
- preserve deterministic output for the same input;
- add tests that demonstrate the intended contract;
- do not silently swallow unsupported behavior.

## Scope rules

Do not add a new package, protocol, transport, or dependency unless it solves a concrete user problem.

V1 focuses on TypeScript/Node.js, ESC/POS, receipt layout, TCP, practical USB support, preview/mock workflows, and international text including Arabic/RTL.

## Before completing a change

Run:

```bash
npm run check
```

A change to a public API should include:

- types;
- validation where appropriate;
- structured failure behavior;
- tests;
- documentation or an example when behavior is not obvious.
