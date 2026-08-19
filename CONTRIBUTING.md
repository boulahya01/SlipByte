# Contributing to SlipByte

Thanks for helping make thermal printing easier for developers.

## Before contributing

SlipByte is intentionally focused. A contribution should remove real developer friction without making the common path harder to understand.

Before implementing a large feature, open an issue describing:

- the developer problem;
- the printer/environment involved;
- expected behavior;
- known hardware limitations;
- whether a fallback is possible.

## Development

Requirements:

- Node.js 22.x or 24.x
- npm

Install the committed dependency tree:

```bash
npm ci
```

Run all checks:

```bash
npm run check
```

Build only:

```bash
npm run build
```

Type-check only:

```bash
npm run typecheck
```

## Design rules

SlipByte separates receipt intent from printer implementation.

Do not introduce printer commands or transport details into the receipt document layer.

Prefer:

```ts
receipt().title("My Store").cut();
```

over APIs that expose protocol bytes or brand-specific commands to normal application code.

## Public APIs

Public APIs should be:

- strongly typed;
- explicit;
- deterministic;
- documented;
- easy to use correctly;
- difficult to misuse silently;
- understandable by both developers and coding agents.

Breaking API changes require a clear justification while the project is pre-1.0.

## Errors

Use structured `SlipByteError` codes for expected library failures. Error messages should explain what happened and, when possible, what the developer can do next.

## Tests

Every behavior change should include tests where practical. Hardware-independent logic must be testable without a physical printer.

Printer-specific fixtures should eventually include the relevant printer profile or protocol assumptions in the test name or fixture metadata.

## Scope

V1 does not aim to support every thermal printer protocol or runtime. The initial focus is Node.js/TypeScript and ESC/POS receipt printers.
