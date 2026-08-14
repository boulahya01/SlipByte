# Layout Engine

The OpenReceipt layout engine converts a hardware-independent `ReceiptDocument` into a deterministic `LayoutDocument`.

It does **not** generate ESC/POS commands, open network connections, access USB devices, or make printer-brand decisions.

```text
ReceiptDocument
      ↓
 layoutReceipt()
      ↓
LayoutDocument
      ↓
future encoder / preview
```

## Built-in paper profiles

OpenReceipt currently exposes two convenience profiles:

| Profile | Physical width | Default columns |
| --- | ---: | ---: |
| `58mm` | 58 mm | 32 |
| `80mm` | 80 mm | 48 |

These column counts are **layout defaults, not universal printer guarantees**.

Actual printable character counts can vary with printer model, firmware, font mode, character size, and vendor implementation. Applications can provide a validated custom `PaperProfile` when a printer uses a different column count.

```ts
layoutReceipt(document, {
  paper: {
    id: "my-80mm-profile",
    widthMm: 80,
    columns: 42,
  },
});
```

Printer-specific evidence belongs in future printer profiles / compatibility data rather than application-level brand checks.

## Overflow behavior

Overflow is explicit:

### `wrap` (default)

Long text is wrapped into additional lines. Item descriptions wrap while the amount column is reserved when possible.

```ts
layoutReceipt(document, {
  paper: "58mm",
  overflow: "wrap",
});
```

### `truncate`

Content that cannot fit is shortened deterministically with an ellipsis.

```ts
layoutReceipt(document, {
  overflow: "truncate",
});
```

### `error`

OpenReceipt throws `OpenReceiptError` with code `LAYOUT_OVERFLOW` rather than changing the content silently.

```ts
layoutReceipt(document, {
  overflow: "error",
});
```

The error includes the available columns, measured content width, and source receipt node index.

## Amount formatting

Receipt intent stores numeric amounts. Presentation belongs to the layout call.

```ts
const layout = layoutReceipt(document, {
  formatAmount: (amount) => `${amount.toFixed(2)} MAD`,
});
```

This keeps currency / locale presentation out of the receipt business model while allowing applications to own formatting.

A formatter that throws or returns invalid output produces the structured `AMOUNT_FORMAT_FAILED` error.

## Output model

Printable rows become `line` nodes with:

- exact text value
- bold flag inherited from receipt text intent
- semantic source (`text`, `item`, `total`, or `divider`)
- source receipt node index for diagnostics

Non-layout controls such as feed and cut are preserved as control nodes for later stages.

The layout layer does not decide whether a physical printer supports those actions. Capability validation belongs to the printer profile / encoder boundary.

## Text width model

The first layout implementation uses a deterministic Unicode code-point cell model. This is intentionally simple and hardware-independent.

It should not be interpreted as a guarantee that every Unicode character occupies one physical printer cell. Arabic/RTL shaping, combining characters, East Asian width, raster fallback, and printer code-page behavior are separate concerns that will be handled by the international-text / printer capability work.

The important contract at this stage is deterministic layout behavior without pretending the model knows capabilities it does not yet know.
