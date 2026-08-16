# Mock printing and preview

OpenReceipt provides a hardware-free path for receipt development and tests without introducing a second layout engine.

## API

`mockPrint(document, layoutOptions?)` runs the normal `layoutReceipt()` pipeline and returns:

- `layout`: the same immutable `LayoutDocument` used by real protocol encoders
- `preview`: a deterministic plain-text representation of that layout

`previewLayout(layout)` renders an already-created `LayoutDocument` directly.

```ts
const result = mockPrint(
  receipt()
    .title("My Store")
    .item("Coffee", 2, 30)
    .total("TOTAL", 60)
    .cut()
    .toDocument(),
  { paper: "80mm" },
);

console.log(result.preview);
```

## Preview semantics

Line content is emitted exactly as produced by the layout engine, including deterministic alignment spaces. Feed nodes become blank lines. Cut nodes are represented by the stable `[cut]` marker so operational intent remains visible in snapshots.

Plain-text preview does not attempt to simulate fonts, print darkness, physical paper motion, or device-specific rendering. Style metadata such as bold remains available in `result.layout.nodes` for assertions.

## Testing

The preview path is deterministic for the same receipt, layout options, and text measurer. Tests can assert either the human-readable preview string or the captured layout nodes.

Protocol bytes are intentionally outside this module. When byte-level assertions are needed, pass `result.layout` to the relevant encoder such as `encodeEscPos()`.

This keeps the boundaries explicit:

```text
receipt/document → layout → preview
                       ↘ protocol encoder → transport → hardware
```

The mock path therefore exercises the same document/layout behavior as real printing without claiming to emulate a physical printer.