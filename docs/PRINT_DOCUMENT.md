# Print document contract

SlipByte uses a versioned JSON-compatible document as the durable boundary between application intent and lower printing layers.

The contract is deliberately independent of ESC/POS, TCP, USB, operating-system print queues, printer brands, and paper width. Layout and capability resolution happen after the application has expressed what it wants to print.

## Version 1

```json
{
  "version": 1,
  "nodes": [
    { "type": "text", "value": "Hello", "align": "center", "bold": true },
    { "type": "feed", "lines": 1 },
    { "type": "cut" }
  ]
}
```

`PRINT_DOCUMENT_VERSION` identifies the version emitted by the current package.

Versioned document node types are declared explicitly as `PrintDocumentNodeV1` and its `Print*NodeV1` variants. They do not alias the internal `ReceiptNode` type. This keeps the v1 schema from changing accidentally when receipt-builder internals evolve.

Use `createPrintDocument(receiptDocument)` when starting from `ReceiptBuilder`, `parsePrintDocument(value)` at an untrusted object boundary, and `serializePrintDocument()` / `deserializePrintDocument()` when the document crosses a JSON/string boundary.

## Validation

Parsing validates the complete v1 shape at runtime. Malformed documents fail with `INVALID_PRINT_DOCUMENT`. A document carrying an unsupported version fails with `UNSUPPORTED_DOCUMENT_VERSION` rather than being guessed or silently upgraded.

Normal text rejects unsafe control characters. Validation errors identify node indexes and field names where useful but do not copy receipt text into error details.

## Evolution rules

- Existing version semantics do not change silently.
- Versioned schema types must remain independent from mutable internal builder/layout types.
- New incompatible document shapes require a new version.
- Protocol or transport configuration does not belong in the document.
- Device capability evidence does not belong in application print intent.
- Parsers must reject unknown versions until explicit support exists.
- Serialized documents remain plain JSON-compatible data so other SDKs and coding agents can inspect or generate them without TypeScript runtime objects.

The v1 node set currently mirrors the implemented receipt intent primitives by value, not by type alias. Future receipt primitives do not become part of v1 automatically; they require an explicit schema decision so existing serialized documents remain stable.
