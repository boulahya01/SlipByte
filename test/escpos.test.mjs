import assert from "node:assert/strict";
import test from "node:test";

import {
  defineDeviceProfile,
  encodeEscPos,
  OpenReceiptError,
} from "../dist/index.js";

const baseCapabilities = {
  text: "native",
  cut: "native",
  drawer: "unsupported",
  qr: "unsupported",
  barcode: "unsupported",
  raster: "unsupported",
  status: "unsupported",
};

function profile(overrides = {}) {
  return defineDeviceProfile({
    id: "fixture-escpos",
    protocol: "escpos",
    capabilities: { ...baseCapabilities, ...overrides },
    textEncodings: ["ascii"],
  });
}

test("encodes deterministic ESC/POS bytes for text, emphasis, feed, and cut", () => {
  const layout = {
    paper: { id: "fixture", widthMm: 80, columns: 48 },
    nodes: [
      { type: "line", value: "HELLO", bold: true, source: "text", sourceNodeIndex: 0 },
      { type: "line", value: "TOTAL 12.00", bold: false, source: "total", sourceNodeIndex: 1 },
      { type: "feed", lines: 2, sourceNodeIndex: 2 },
      { type: "cut", sourceNodeIndex: 3 },
    ],
  };

  assert.deepEqual([...encodeEscPos(layout, profile())], [
    0x1b, 0x40,
    0x1b, 0x45, 0x01,
    0x48, 0x45, 0x4c, 0x4c, 0x4f, 0x0a,
    0x1b, 0x45, 0x00,
    0x54, 0x4f, 0x54, 0x41, 0x4c, 0x20, 0x31, 0x32, 0x2e, 0x30, 0x30, 0x0a,
    0x1b, 0x64, 0x02,
    0x1d, 0x56, 0x00,
  ]);
});

test("requires an explicit fallback when cut is not native", () => {
  const layout = {
    paper: { id: "fixture", widthMm: 80, columns: 48 },
    nodes: [{ type: "cut", sourceNodeIndex: 0 }],
  };

  assert.throws(
    () => encodeEscPos(layout, profile({ cut: "fallback" })),
    (error) =>
      error instanceof OpenReceiptError &&
      error.code === "UNSUPPORTED_CAPABILITY" &&
      error.details.capability === "cut" &&
      error.details.support === "fallback",
  );

  assert.deepEqual(
    [...encodeEscPos(layout, profile({ cut: "fallback" }), {
      cutFallback: { type: "feed", lines: 4 },
    })],
    [0x1b, 0x40, 0x1b, 0x64, 0x04],
  );
});

test("rejects non-ESC/POS profiles", () => {
  const wrongProtocol = defineDeviceProfile({
    id: "other-protocol",
    protocol: "example",
    capabilities: baseCapabilities,
  });

  assert.throws(
    () => encodeEscPos({ paper: { id: "fixture", widthMm: 80, columns: 48 }, nodes: [] }, wrongProtocol),
    (error) => error instanceof OpenReceiptError && error.code === "UNSUPPORTED_PROTOCOL",
  );
});

test("default text encoding rejects unsupported characters without copying receipt text", () => {
  const layout = {
    paper: { id: "fixture", widthMm: 80, columns: 48 },
    nodes: [{ type: "line", value: "secret café", bold: false, source: "text", sourceNodeIndex: 7 }],
  };

  assert.throws(
    () => encodeEscPos(layout, profile()),
    (error) =>
      error instanceof OpenReceiptError &&
      error.code === "TEXT_ENCODING_FAILED" &&
      !("text" in error.details) &&
      !("value" in error.details),
  );
});

test("accepts an injected device-specific text encoder", () => {
  const layout = {
    paper: { id: "fixture", widthMm: 80, columns: 48 },
    nodes: [{ type: "line", value: "é", bold: false, source: "text", sourceNodeIndex: 0 }],
  };

  const bytes = encodeEscPos(layout, profile(), {
    textEncoder: {
      id: "fixture-code-page",
      encode: () => Uint8Array.from([0x82]),
    },
  });

  assert.deepEqual([...bytes], [0x1b, 0x40, 0x82, 0x0a]);
});
