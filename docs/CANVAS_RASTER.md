# Canvas2D Unicode raster rendering

SlipByte can turn text into the canonical packed monochrome `RasterImage` format through a Canvas2D-compatible runtime.

`createCanvasRasterTextRenderer()` owns only the deterministic thermal-printer conversion step:

`Unicode text -> Canvas2D draw -> RGBA pixels -> 1-bit packed RasterImage`

The configured Canvas implementation and font remain responsible for glyph coverage, shaping, bidi behavior, emoji/color-font support, and platform-specific text rasterization. SlipByte does not claim that every Canvas runtime or font can render every Unicode string correctly.

## Why this boundary exists

Native printer code pages are often incomplete for Arabic, CJK, emoji, combining marks, and mixed-script receipts. When the device profile permits raster fallback, an application can render the same Unicode text through a real text engine and then pass the resulting bitmap to a protocol-specific raster encoder.

This stays separate from the receipt/document API and from ESC/POS command selection.

## Example

```ts
import {
  createCanvasRasterTextRenderer,
  renderTextToRaster,
} from "slipbyte";

const renderer = createCanvasRasterTextRenderer(
  (width, height) => canvasRuntime.createCanvas(width, height),
  {
    font: "28px Noto Sans Arabic",
    width: 576,
    height: 64,
    direction: "rtl",
    threshold: 150,
  },
);

const image = renderTextToRaster("مرحبا بالعالم", renderer);
```

`canvasRuntime` can be a browser/runtime adapter or a Node Canvas2D implementation. The factory is injected deliberately so the core package does not force one native graphics dependency on every SlipByte user.

## Deterministic bitmap conversion

The adapter:

- paints a white background;
- draws black text with a top baseline;
- reads RGBA pixels;
- alpha-composites pixels onto white;
- converts luminance to black/white using an explicit byte threshold;
- packs black pixels MSB-first into the existing `RasterImage` contract;
- preserves zero padding bits at the end of non-byte-aligned rows.

That means protocol encoders receive one canonical monochrome bitmap format regardless of the Canvas implementation used to shape and rasterize text.

## Safety

Malformed dimensions, thresholds, directions, Canvas surfaces, contexts, or pixel buffers fail before transport. Renderer failures do not copy the receipt text or arbitrary low-level exceptions into structured diagnostics.

## Compatibility claims

A successful software render proves only that the configured Canvas runtime produced a bitmap. It does not prove a particular printer supports the chosen raster command, width, density, or image size. Those claims remain device-profile and evidence specific.
