import assert from "node:assert/strict";
import test from "node:test";

import {
  defineDeviceProfile,
  encodeEscPos,
  SlipByteError,
} from "../dist/index.js";

const capabilities = {
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
    capabilities,
    textEncodings: ["fixture-page"],
    ...overrides,
  });
}

const textLayout = {
  paper: { id: "fixture", widthMm: 80, columns: 48 },
  nodes: [
    { type: "line", value: "A", bold: false, source: "text", sourceNodeIndex: 0 },
    { type: "line", value: "B", bold: false, source: "text", sourceNodeIndex: 1 },
  ],
};

function encodingConfig(overrides = {}) {
  return {
    profileId: "fixture-escpos",
    encodingId: "fixture-page",
    codePage: 37,
    encoder: {
      id: "fixture-page",
      encode(text) {
        return Uint8Array.from(text === "A" ? [0x81] : [0x82]);
      },
    },
    ...overrides,
  };
}

test("selects a profile-scoped ESC/POS code page before the first text line", () => {
  const bytes = encodeEscPos(textLayout, profile(), {
    textEncoding: encodingConfig(),
  });

  assert.deepEqual([...bytes], [
    0x1b, 0x40,
    0x1b, 0x74, 37,
    0x81, 0x0a,
    0x82, 0x0a,
  ]);
});

test("does not emit a code-page selector when the job has no text", () => {
  const layout = {
    paper: { id: "fixture", widthMm: 80, columns: 48 },
    nodes: [{ type: "cut", sourceNodeIndex: 0 }],
  };

  assert.deepEqual(
    [...encodeEscPos(layout, profile(), { textEncoding: encodingConfig() })],
    [0x1b, 0x40, 0x1d, 0x56, 0x00],
  );
});

test("rejects text encoding configuration for another device profile before encoding", () => {
  let encoded = false;

  assert.throws(
    () => encodeEscPos(textLayout, profile(), {
      textEncoding: encodingConfig({
        profileId: "other-printer",
        encoder: {
          id: "fixture-page",
          encode() {
            encoded = true;
            return Uint8Array.from([1]);
          },
        },
      }),
    }),
    (error) =>
      error instanceof SlipByteError &&
      error.code === "INVALID_ENCODER_OPTION" &&
      !("text" in error.details),
  );

  assert.equal(encoded, false);
});

test("rejects encodings not declared by the device profile", () => {
  assert.throws(
    () => encodeEscPos(textLayout, profile(), {
      textEncoding: encodingConfig({
        encodingId: "undeclared",
        encoder: { id: "undeclared", encode: () => Uint8Array.from([1]) },
      }),
    }),
    (error) => error instanceof SlipByteError && error.code === "INVALID_ENCODER_OPTION",
  );
});

test("rejects invalid code-page values and mismatched encoder ids", () => {
  for (const config of [
    encodingConfig({ codePage: -1 }),
    encodingConfig({ codePage: 256 }),
    encodingConfig({ codePage: 1.5 }),
    encodingConfig({ encoder: { id: "other", encode: () => Uint8Array.from([1]) } }),
  ]) {
    assert.throws(
      () => encodeEscPos(textLayout, profile(), { textEncoding: config }),
      (error) => error instanceof SlipByteError && error.code === "INVALID_ENCODER_OPTION",
    );
  }
});

test("rejects ambiguous text encoder configuration", () => {
  assert.throws(
    () => encodeEscPos(textLayout, profile(), {
      textEncoder: { id: "fixture-page", encode: () => Uint8Array.from([1]) },
      textEncoding: encodingConfig(),
    }),
    (error) => error instanceof SlipByteError && error.code === "INVALID_ENCODER_OPTION",
  );
});
