import assert from "node:assert/strict";
import test from "node:test";

import {
  createCanvasRasterTextRenderer,
  OpenReceiptError,
  renderTextToRaster,
} from "../dist/index.js";

function fakeSurface(imageData, onDraw = () => {}) {
  return {
    getContext(kind) {
      assert.equal(kind, "2d");
      return {
        font: "",
        fillStyle: "",
        textBaseline: "",
        direction: "inherit",
        fillRect() {},
        fillText(text, x, y) {
          onDraw(this, text, x, y);
        },
        getImageData() {
          return imageData;
        },
      };
    },
  };
}

test("packs Canvas RGBA pixels into deterministic monochrome raster bytes", () => {
  const rgba = [];
  for (let x = 0; x < 8; x += 1) {
    const black = x % 2 === 0;
    rgba.push(black ? 0 : 255, black ? 0 : 255, black ? 0 : 255, 255);
  }

  const renderer = createCanvasRasterTextRenderer(
    () => fakeSurface({ width: 8, height: 1, data: rgba }),
    { font: "16px Fixture", width: 8, height: 1 },
  );

  assert.deepEqual(renderTextToRaster("fixture", renderer), {
    width: 8,
    height: 1,
    data: [0xaa],
  });
});

test("passes Unicode text and explicit RTL direction to the Canvas implementation", () => {
  let observed;
  const renderer = createCanvasRasterTextRenderer(
    () => fakeSurface(
      { width: 8, height: 1, data: new Array(32).fill(255) },
      (context, text, x, y) => {
        observed = {
          text,
          x,
          y,
          direction: context.direction,
          font: context.font,
          baseline: context.textBaseline,
        };
      },
    ),
    {
      id: "fixture-unicode",
      font: "18px Noto Sans Arabic",
      width: 8,
      height: 1,
      x: 2,
      y: 3,
      direction: "rtl",
    },
  );

  renderTextToRaster("مرحبا 世界 👋", renderer);

  assert.deepEqual(observed, {
    text: "مرحبا 世界 👋",
    x: 2,
    y: 3,
    direction: "rtl",
    font: "18px Noto Sans Arabic",
    baseline: "top",
  });
});

test("composites transparent pixels onto white before thresholding", () => {
  const renderer = createCanvasRasterTextRenderer(
    () => fakeSurface({
      width: 2,
      height: 1,
      data: [0, 0, 0, 0, 0, 0, 0, 255],
    }),
    { font: "16px Fixture", width: 2, height: 1, threshold: 127 },
  );

  assert.deepEqual(renderTextToRaster("fixture", renderer).data, [0x40]);
});

test("rejects malformed renderer configuration before drawing", () => {
  let created = false;
  assert.throws(
    () => createCanvasRasterTextRenderer(
      () => {
        created = true;
        return fakeSurface({ width: 1, height: 1, data: [255, 255, 255, 255] });
      },
      { font: "16px Fixture", width: 0, height: 1 },
    ),
    (error) => error instanceof OpenReceiptError && error.code === "INVALID_RASTER_RENDERER",
  );
  assert.equal(created, false);
});

test("wraps Canvas context acquisition failures at the Canvas adapter boundary", () => {
  const renderer = createCanvasRasterTextRenderer(
    () => ({
      getContext() {
        throw new Error("private low-level context failure");
      },
    }),
    { id: "safe-context", font: "16px Fixture", width: 8, height: 1 },
  );

  assert.throws(
    () => renderer.render("private receipt مرحبا"),
    (error) =>
      error instanceof OpenReceiptError &&
      error.code === "RASTER_RENDER_FAILED" &&
      error.message.includes("context acquisition") &&
      JSON.stringify(error.details).includes("private") === false,
  );
});

test("rejects Canvas image data dimensions that differ from configured surface", () => {
  const renderer = createCanvasRasterTextRenderer(
    () => fakeSurface({ width: 4, height: 1, data: new Array(16).fill(255) }),
    { id: "dimension-safe", font: "16px Fixture", width: 8, height: 1 },
  );

  assert.throws(
    () => renderer.render("fixture"),
    (error) =>
      error instanceof OpenReceiptError &&
      error.code === "RASTER_RENDER_FAILED" &&
      error.details.expectedWidth === 8 &&
      error.details.receivedWidth === 4,
  );
});

test("does not copy receipt text into Canvas failure diagnostics", () => {
  const renderer = createCanvasRasterTextRenderer(
    () => ({
      getContext() {
        return {
          font: "",
          fillStyle: "",
          textBaseline: "",
          fillRect() {},
          fillText() {
            throw new Error("low-level failure");
          },
          getImageData() {
            throw new Error("unreachable");
          },
        };
      },
    }),
    { id: "safe-renderer", font: "16px Fixture", width: 8, height: 1 },
  );

  assert.throws(
    () => renderTextToRaster("private receipt مرحبا", renderer),
    (error) =>
      error instanceof OpenReceiptError &&
      error.code === "RASTER_RENDER_FAILED" &&
      JSON.stringify(error.details).includes("private receipt") === false,
  );
});
