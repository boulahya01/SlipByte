# OpenReceipt Agent Guide

This repository is intentionally designed to be easy for coding agents to understand and modify safely.

## North star

OpenReceipt should make thermal-printer integration feel like using a normal software API, not programming hardware.

## Product boundary

OpenReceipt is a printing toolkit, not a restaurant SDK and not a language-specific renderer.

The core must remain:

- domain-agnostic: retail, hospitality, kiosks, ticketing, logistics, and other applications can use the same primitives;
- content-language-agnostic: no public core API should assume Latin, Arabic, CJK, emoji, or any other script is the default;
- hardware-capability-driven: behavior is based on declared capabilities and evidence, not brand-name assumptions;
- protocol-extensible: ESC/POS is the first protocol adapter, not the definition of the core;
- transport-extensible: TCP/USB are adapters, not application concerns.

Arabic/RTL, CJK, combining marks, emoji, long Latin text, and mixed-script receipts are conformance cases used to test whether the abstractions are general enough. Do not create script-specific application APIs when a general text/layout/capability abstraction can solve the problem.

## Architecture boundaries

Keep these concerns separate:

1. Print/receipt document: what the application wants to print.
2. Layout: how content fits a target media/profile.
3. Encoder: how a printer protocol represents that layout.
4. Printer profile: hardware capabilities and quirks.
5. Transport: how bytes reach the printer.

Application-facing code must not contain ESC/POS bytes, USB details, TCP sockets, or printer-brand conditions.

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
- do not silently swallow unsupported behavior;
- do not encode assumptions about one business domain, script, locale, currency, printer brand, protocol, or transport into core primitives.

## Public repository behavior

OpenReceipt is intended to be developed in public. Commits, issues, PRs, docs, discussions, and comments are part of the long-lived project surface and may be discovered through GitHub, search engines, or AI retrieval systems.

Follow [`docs/MAINTAINER_GUIDE.md`](docs/MAINTAINER_GUIDE.md) for commit quality, issue/PR writing, public discussions, documentation, automation behavior, and the pre-public audit.

Do not manufacture repository activity to satisfy an automation schedule. Public artifacts must record real engineering work, evidence, decisions, or useful technical explanations.

## Scope rules

Do not add a new package, protocol, transport, dependency, or domain-specific primitive unless it solves a concrete user problem and fits the architecture.

V1 uses TypeScript/Node.js as the npm runtime and ESC/POS as the first hardware protocol target, but the core document, layout, diagnostics, capability, and agent-facing contracts must remain reusable across future protocols and transports.

## AI-agent requirement

AI agents should be able to integrate hardware without guessing.

Prefer machine-discoverable contracts for:

- capabilities;
- configuration;
- defaults;
- errors and remediation hints;
- unsupported operations;
- fallbacks;
- diagnostics;
- protocol/transport boundaries.

An agent should not need to infer hardware behavior from a printer brand string or copy raw command bytes from examples.

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
