# ESC/POS encoder

SlipByte keeps ESC/POS as a protocol adapter after layout and capability resolution. The encoder consumes a `LayoutDocument` plus a `DeviceProfile` and emits deterministic `Uint8Array` bytes. It does not open sockets, USB devices, operating-system printer queues, or perform transport retries.

## Current v0.1 scope

`encodeEscPos(layout, profile, options)` currently covers:

- ESC/POS initialization
- laid-out text lines
- emphasis/bold state
- line feed
- explicit feed nodes
- full cut when the device profile declares native cut support

Alignment is already resolved by the layout engine into deterministic line content, so the encoder does not reinterpret application alignment intent.

## Device capability rules

The profile protocol identifier must be exactly `escpos`.

Text lines require `text: "native"`. A profile that marks text as `fallback` is rejected because this encoder does not guess whether the intended fallback is rasterization, transliteration, another code page, or something else.

Cut behavior is explicit:

- `cut: "native"` emits the ESC/POS cut command.
- `cut: "unsupported"` fails with `UNSUPPORTED_CAPABILITY`.
- `cut: "fallback"` also fails unless the caller explicitly supplies a feed fallback such as `{ cutFallback: { type: "feed", lines: 4 } }`.

The encoder never silently converts a requested cut into another operation.

## Text encoding

The default text encoder is deliberately strict printable ASCII. This is a safe baseline for deterministic fixtures, not a claim that every ESC/POS printer uses the same code page.

Non-ASCII text fails with `TEXT_ENCODING_FAILED`. Applications or verified device profiles can supply an `EscPosTextEncoder` that maps Unicode text to the exact bytes required by the target printer/code page.

Injected encoder failures are wrapped without copying receipt text or arbitrary thrown payloads into structured error details.

## Example

```ts
const bytes = encodeEscPos(layout, profile, {
  textEncoder: {
    id: "verified-device-code-page",
    encode(text) {
      return encodeForVerifiedPrinter(text);
    },
  },
});
```

The returned bytes are transport-agnostic. A later TCP/USB adapter is responsible for sending them to hardware.

## Compatibility boundary

This module implements selected ESC/POS command semantics. It does not establish compatibility with a particular printer model. Device compatibility remains evidence-based and belongs in profiles/fixtures backed by real testing or authoritative documentation.
