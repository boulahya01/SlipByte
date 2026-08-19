import assert from "node:assert/strict";
import test from "node:test";

import {
  SlipByteError,
  selectTextRepresentation,
} from "../dist/index.js";

const capabilities = {
  text: "native",
  cut: "unsupported",
  drawer: "unsupported",
  qr: "unsupported",
  barcode: "unsupported",
  raster: "unsupported",
  status: "unsupported",
};

test("rejects duplicate normalized profile text encodings before probing candidates", () => {
  let probed = false;

  assert.throws(
    () =>
      selectTextRepresentation(
        "secret receipt text",
        {
          id: "fixture-printer",
          protocol: "escpos",
          capabilities,
          textEncodings: ["ascii", " ascii "],
        },
        {
          nativeCandidates: [
            {
              id: "ascii",
              canRepresent() {
                probed = true;
                return true;
              },
            },
          ],
        },
      ),
    (error) =>
      error instanceof SlipByteError &&
      error.code === "INVALID_DEVICE_PROFILE" &&
      error.details.encodingIndex === 1 &&
      !Object.values(error.details).includes("secret receipt text"),
  );

  assert.equal(probed, false);
});
