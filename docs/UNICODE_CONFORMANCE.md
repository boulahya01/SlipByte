# Unicode raster conformance

OpenReceipt keeps Unicode document intent separate from printer-native encodings and raster rendering. The generic Canvas raster adapter can render arbitrary Unicode through a real Canvas2D text engine, but actual glyph coverage and shaping depend on the runtime and fonts configured by the application.

The optional conformance runner provides a repeatable software smoke test for that runtime boundary.

## Run it

Build OpenReceipt, install a Canvas2D runtime locally, then run:

```sh
npm install --no-save @napi-rs/canvas
npm run conformance:unicode
```

The runner is intentionally not part of `npm run check` and `@napi-rs/canvas` is not a runtime dependency of OpenReceipt. Applications remain free to inject another compatible Canvas2D implementation.

You can override the Canvas font and raster dimensions:

```sh
OPENRECEIPT_UNICODE_FONT="32px Noto Sans" \
OPENRECEIPT_UNICODE_WIDTH=576 \
OPENRECEIPT_UNICODE_HEIGHT=96 \
npm run conformance:unicode
```

Use fonts that are actually available to the selected Canvas runtime. Register application fonts with that runtime before relying on them in production.

## Fixtures

The runner exercises representative public fixtures for:

- Latin and numbers;
- Arabic with explicit RTL direction;
- CJK;
- combining marks;
- emoji;
- mixed-script text.

For every fixture it records the raster dimensions, number of black pixels, and a SHA-256 hash of the packed monochrome bitmap.

A blank result fails the run because it is strong evidence that the configured runtime/font did not render usable ink for that fixture.

## What this does not prove

A non-blank bitmap does **not** prove that every glyph is correct. A missing-glyph box can still contain black pixels, and raster hashes may legitimately differ across operating systems, font versions, Canvas engines, or rendering versions.

Therefore:

- do not turn a successful software smoke test into a printer compatibility claim;
- do not use one machine's bitmap hash as a universal expected value;
- use exact, versioned runtime/font fixtures when deterministic visual regression testing is required;
- keep real-printer raster-command compatibility evidence separate from software text rendering evidence.

This runner exists to make the runtime/font boundary observable and repeatable without weakening OpenReceipt's hardware-agnostic core.
