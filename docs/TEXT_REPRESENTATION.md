# Text representation selection

OpenReceipt keeps document and layout text Unicode-oriented. Choosing how that text becomes printer-native bytes or raster output happens later, at the representation/encoding boundary.

`selectTextRepresentation(text, profile, options)` makes that decision explicitly without inspecting printer brands, locales, or script names.

## Native text

Native text is considered only when the device profile declares `text: "native"` and an explicitly configured native candidate reports that it can represent the complete laid-out text run.

Each `NativeTextRepresentationCandidate` has a stable `id` plus `canRepresent(text)`. The first matching candidate is selected deterministically and returned as:

```ts
{ kind: "native", encodingId: "pc437" }
```

The selection contract does not contain ESC/POS bytes or code-page commands. A protocol adapter is responsible for mapping the selected `encodingId` to its reviewed device/protocol configuration. This avoids turning one vendor's code-page numbers into generic core truth.

A candidate probe must return a boolean. Probe failures become structured `TEXT_REPRESENTATION_FAILED` errors without copying receipt text or arbitrary thrown values into diagnostics.

## Raster fallback

Raster is never selected implicitly. Callers must set `allowRasterFallback: true`, and the device profile must declare the `raster` capability as usable.

The result is representation intent only:

```ts
{ kind: "raster", usesCapabilityFallback: false }
```

No raster command is implied. ESC/POS `GS v 0`, newer graphics commands, or another protocol's raster mechanism remain protocol/device concerns. This prevents a historical printer command from becoming the generic fallback abstraction.

If native text cannot safely represent the run and raster fallback is either disabled or unsupported, selection fails before transport with `UNSUPPORTED_TEXT_REPRESENTATION`.

## Conformance inputs

Arabic/RTL, CJK, combining marks, emoji, and mixed-script strings are test inputs for the same generic contract. They are not separate receipt APIs or product modes.

The contract deliberately does not claim that any named encoding supports a real printer. Real compatibility remains provenance-backed through `CapabilityEvidence`; protocol configuration and actual hardware validation are separate gates.

## Security and diagnostics

Candidate identifiers reject C0/DEL control characters before they can reach logs or tooling. Representation failures do not include the receipt text in structured error details.

Representation errors are diagnosed as `encoding` stage failures with no transport delivery state because the decision occurs before network or USB delivery.
