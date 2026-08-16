import assert from "node:assert/strict";
import test from "node:test";

import {
  defineDeviceProfile,
  defineRasterImage,
  diagnoseError,
  encodeEscPosRaster,
  ESC_POS_GS_V0_RASTER_ENCODER,
  OpenReceiptError,
  renderTextToRaster,
} from "../dist/index.js";

const capabilities = (overrides = {}) => ({
  text: "native",
  cut: "unsupported",
  drawer: "unsupported",
  qr: "unsupported",
  barcode: "unsupported",
  raster: "native",
  status: "unsupported",
  ...overrides,
});

function profile(overrides = {}) {
  return defineDeviceProfile({
    id: "fixture-escpos",
    protocol: "escpos",
    capabilities: capabilities(),
    ...overrides,
  });
}

test("defines a canonical packed monochrome raster image", () => {
  const image = defineRasterImage({
    width: 10,
    height: 2,
    data: Uint8Array.from([0xaa, 0x80, 0x55, 0x40]),
  });

  assert.deepEqual(image, {
    width: 10,
    height: 2,
    data: [0xaa, 0x80, 0x55, 0x40],
  });
  assert.equal(Object.isFrozen(image), true);
  assert.equal(Object.isFrozen(image.data), true);
});

test("rejects malformed raster dimensions, byte counts, and non-zero padding bits", () => {
  for (const value of [
    { width: 0, height: 1, data: [] },
    { width: 9, height: 1, data: [0xff] },
    { width: 9, height: 1, data: [0xff, 0x7f] },
    { width: 8, height: 1, data: [300] },
  ]) {
    assert.throws(
      () => defineRasterImage(value),
      (error) => error instanceof OpenReceiptError && error.code === "INVALID_RASTER_IMAGE",
    );
  }
});

test("renders text through an injected renderer without exposing receipt text on failure", () => {
  const rendered = renderTextToRaster("مرحبا", {
    id: "fixture-renderer",
    render() {
      return { width: 8, height: 1, data: [0xf0] };
    },
  });

  assert.deepEqual(rendered, { width: 8, height: 1, data: [0xf0] });

  assert.throws(
    () => renderTextToRaster("secret receipt text", {
      id: "fixture-renderer",
      render() {
        throw new Error("renderer internals");
      },
    }),
    (error) =>
      error instanceof OpenReceiptError &&
      error.code === "RASTER_RENDER_FAILED" &&
      !Object.values(error.details).includes("secret receipt text") &&
      !("cause" in error.details),
  );
});

test("encodes deterministic GS v 0 bytes only when that explicit strategy is supplied", () => {
  const image = defineRasterImage({
    width: 10,
    height: 2,
    data: [0xaa, 0x80, 0x55, 0x40],
  });

  const bytes = encodeEscPosRaster(image, profile(), {
    profileId: "fixture-escpos",
    encoder: ESC_POS_GS_V0_RASTER_ENCODER,
  });

  assert.deepEqual([...bytes], [
    0x1d, 0x76, 0x30, 0x00,
    0x02, 0x00,
    0x02, 0x00,
    0xaa, 0x80, 0x55, 0x40,
  ]);
});

test("requires raster capability and exact profile ownership", () => {
  const image = defineRasterImage({ width: 8, height: 1, data: [0xff] });

  assert.throws(
    () => encodeEscPosRaster(
      image,
      profile({ capabilities: capabilities({ raster: "unsupported" }) }),
      { profileId: "fixture-escpos", encoder: ESC_POS_GS_V0_RASTER_ENCODER },
    ),
    (error) =>
      error instanceof OpenReceiptError &&
      error.code === "UNSUPPORTED_CAPABILITY" &&
      error.details.capability === "raster",
  );

  assert.throws(
    () => encodeEscPosRaster(image, profile(), {
      profileId: "other-profile",
      encoder: ESC_POS_GS_V0_RASTER_ENCODER,
    }),
    (error) => error instanceof OpenReceiptError && error.code === "INVALID_ENCODER_OPTION",
  );
});

test("keeps raster strategy injectable instead of assuming GS v 0", () => {
  const image = defineRasterImage({ width: 8, height: 1, data: [0x80] });
  const bytes = encodeEscPosRaster(image, profile(), {
    profileId: "fixture-escpos",
    encoder: {
      id: "fixture-newer-graphics",
      encode() {
        return Uint8Array.from([0xde, 0xad, 0xbe, 0xef]);
      },
    },
  });

  assert.deepEqual([...bytes], [0xde, 0xad, 0xbe, 0xef]);
});

test("diagnoses raster failures before transport", () => {
  const diagnostic = diagnoseError(
    new OpenReceiptError("RASTER_ENCODING_FAILED", "fixture"),
  );

  assert.equal(diagnostic.stage, "encoding");
  assert.equal(diagnostic.delivery, "not-applicable");
  assert.equal(diagnostic.retrySafety, "not-applicable");
});
