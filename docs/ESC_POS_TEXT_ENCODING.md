# ESC/POS text encoding configuration

OpenReceipt keeps Unicode text representation separate from ESC/POS code-page selection. A generic `encodingId` selected earlier in the pipeline does not imply a universal ESC/POS numeric code-page value.

## Profile-scoped configuration

Use `EscPosTextEncodingConfig` when a printer requires an explicit ESC/POS code-page selector:

```ts
const textEncoding = {
  profileId: "fixture-escpos",
  encodingId: "fixture-page",
  codePage: 37,
  encoder: {
    id: "fixture-page",
    encode(text) {
      // Device/profile-specific byte encoder.
      return encodeFixturePage(text);
    },
  },
};
```

The configuration is accepted only when:

- `profileId` matches the active `DeviceProfile.id`;
- `encodingId` is explicitly declared in `DeviceProfile.textEncodings`;
- `encoder.id` matches `encodingId`;
- `codePage` is an integer from 0 through 255;
- identifiers are safe non-empty text.

When text is actually present, `encodeEscPos()` emits `ESC t n` once before the first encoded text line. A cut/feed-only job does not change the printer code page unnecessarily.

## Why the numeric value is not global

The numeric `codePage` belongs to the reviewed device/profile configuration. OpenReceipt does not export a global `encodingId -> codePage` registry because ESC/POS code-page tables can vary by device implementation.

The generic path stays:

```text
Unicode layout text
→ text representation selection (`encodingId`)
→ profile-scoped ESC/POS text encoding config
→ ESC/POS bytes
→ transport
```

A device profile may declare that an encoding is allowed without claiming that every printer using the same protocol maps it to the same numeric selector.

## Existing `textEncoder`

`textEncoder` remains available for cases that do not require an explicit code-page selector. Do not configure both `textEncoder` and `textEncoding` in the same encoder call; ambiguous configuration fails with `INVALID_ENCODER_OPTION`.

For encodings that require a printer mode/code-page change, prefer `textEncoding` so the byte encoder and selector stay bound to the same reviewed device profile.

## Safety

Configuration validation happens before receipt text is encoded. Mismatched profiles, undeclared encodings, unsafe identifiers, invalid code-page values, and encoder-id mismatches fail before transport and do not copy receipt text into structured diagnostics.

This contract makes no real-printer compatibility claim by itself. Real device mappings still require provenance-backed compatibility evidence and hardware validation.
