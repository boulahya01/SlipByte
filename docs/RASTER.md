# Raster fallback

SlipByte treats raster output as a separate representation path after Unicode text/layout decisions. Raster fallback is explicit, capability-aware, and protocol-specific only at the final adapter boundary.

## Generic raster image

`defineRasterImage()` validates a canonical monochrome packed bitmap:

```ts
{
  width: 10,
  height: 2,
  data: [0xaa, 0x80, 0x55, 0x40]
}
```

Rows are packed most-significant-bit first. `data.length` must equal `ceil(width / 8) * height`, each entry must be a byte, and unused trailing bits in a partial final byte must be zero. The returned image is frozen and detached from caller-owned arrays.

This format is protocol-agnostic. It does not imply ESC/POS, printer dot density, paper width, or a specific image command.

## Text rendering boundary

`renderTextToRaster(text, renderer)` accepts an injected `RasterTextRenderer`. The renderer owns font selection, shaping, bidi handling, glyph rasterization, and any script-specific requirements. SlipByte validates the returned bitmap and wraps failures without copying receipt text or arbitrary renderer errors into structured diagnostics.

The core intentionally does not ship a guessed universal font/shaper. Arabic/RTL, CJK, combining marks, emoji, and mixed-script text remain conformance inputs for renderer implementations rather than separate receipt APIs.

## ESC/POS raster strategies

`encodeEscPosRaster(image, profile, config)` requires:

- an `escpos` device profile;
- a usable `raster` capability;
- a config bound to the exact profile id;
- an explicit `EscPosRasterEncoder` strategy.

There is no default raster command.

SlipByte includes `ESC_POS_GS_V0_RASTER_ENCODER` as one explicitly named strategy for devices whose reviewed compatibility data says that command is appropriate. It is never selected automatically. The ESC/POS reference marks `GS v 0` as obsolete and recommends the newer graphics-function family for supported devices, so future adapters can add newer strategy implementations without changing the generic raster contract.

A different strategy can be injected:

```ts
encodeEscPosRaster(image, profile, {
  profileId: profile.id,
  encoder: newerGraphicsEncoder,
});
```

This keeps `raster: "native"` from silently meaning one universal ESC/POS command.

## Delivery boundary

Raster rendering and protocol encoding complete before TCP/USB transport. Invalid images, renderer failures, unsupported raster capability, strategy errors, and profile/config mismatches therefore fail before delivery and are diagnosed as encoding-stage failures.

No real-printer compatibility claim follows from these contracts alone. Device-specific strategy choices still require provenance-backed evidence and hardware validation.
