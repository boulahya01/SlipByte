# Layout Engine

The SlipByte layout engine converts a hardware-independent `ReceiptDocument` into a deterministic `LayoutDocument`.

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

SlipByte currently exposes two convenience profiles:

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

Printer-specific evidence belongs in printer profiles / compatibility data rather than application-level brand checks.

## Overflow behavior

Overflow is explicit.

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

SlipByte throws `SlipByteError` with code `LAYOUT_OVERFLOW` rather than changing the content silently.

```ts
layoutReceipt(document, {
  overflow: "error",
});
```

The error includes the available columns, measured content width, source receipt node index, and text-measurement strategy when available.

## Text measurement

SlipByte does not assume one human language or one printer font model.

The default `GRAPHEME_TEXT_MEASURER` counts Unicode grapheme clusters. This means combined characters such as accented graphemes and multi-code-point emoji are kept intact when wrapping/truncating.

The default is deterministic and hardware-independent, but it is **not a claim about physical printer glyph width**.

A device/profile adapter can provide its own `TextMeasurer`:

```ts
const textMeasurer = {
  id: "device-font-a",
  measure(text: string) {
    // Return the number of printer layout cells used by this text.
    return measureForThisDevice(text);
  },
};

const layout = layoutReceipt(document, {
  paper: "80mm",
  textMeasurer,
});
```

A column-based measurer must:

- expose `measure(text)`;
- return a finite non-negative integer cell count;
- report a normal ASCII space as exactly one cell;
- throw or return invalid data only when it wants SlipByte to fail with a structured diagnostic.

This extension point can model, for example:

- double-width CJK glyphs;
- printer font A vs font B;
- vendor-specific character sizing;
- code-page constraints;
- raster/fallback layouts;
- future protocol/device metrics.

The core does not need `if Arabic`, `if Chinese`, or `if Epson` branches. Those are characteristics of content or device capabilities, not application-level product modes.

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

- exact text value;
- bold flag inherited from print intent;
- semantic source (`text`, `item`, `total`, or `divider`);
- source receipt node index for diagnostics.

Non-layout controls such as feed and cut are preserved as control nodes for later stages.

The layout layer does not decide whether a physical printer supports those actions. Capability validation belongs to the device profile / encoder boundary.

## Generality rule

The layout engine is not a restaurant layout engine and is not an Arabic/Latin renderer.

Specific scripts, currencies, businesses, printer brands, and protocols should be represented through data, profiles, capabilities, formatting, or adapters whenever possible rather than adding hard-coded core branches.
