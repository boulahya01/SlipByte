import { createHash } from "node:crypto";

import {
  createCanvasRasterTextRenderer,
  renderTextToRaster,
} from "../dist/index.js";

const CANVAS_MODULE_ID = "@napi-rs/canvas";
const DEFAULT_FONT = "32px sans-serif";
const DEFAULT_WIDTH = 576;
const DEFAULT_HEIGHT = 96;

const CASES = Object.freeze([
  { id: "latin", text: "OpenReceipt 123.45", direction: "ltr" },
  { id: "arabic-rtl", text: "مرحبا بالعالم 123", direction: "rtl" },
  { id: "cjk", text: "你好世界 日本語", direction: "ltr" },
  { id: "combining", text: "Cafe\u0301 A\u030A", direction: "ltr" },
  { id: "emoji", text: "Receipt ✅ 👋 🧾", direction: "ltr" },
  { id: "mixed", text: "Order 42 — مرحبا — 世界 — ✅", direction: "ltr" },
]);

const font = process.env.OPENRECEIPT_UNICODE_FONT?.trim() || DEFAULT_FONT;
const width = readPositiveIntegerEnv("OPENRECEIPT_UNICODE_WIDTH", DEFAULT_WIDTH);
const height = readPositiveIntegerEnv("OPENRECEIPT_UNICODE_HEIGHT", DEFAULT_HEIGHT);

let canvasRuntime;
try {
  canvasRuntime = await import(CANVAS_MODULE_ID);
} catch {
  console.error(
    "Unicode raster conformance requires an installed @napi-rs/canvas runtime. " +
      "Install it in the checkout, then rerun npm run conformance:unicode.",
  );
  process.exitCode = 2;
}

if (canvasRuntime) {
  if (typeof canvasRuntime.createCanvas !== "function") {
    console.error("The installed @napi-rs/canvas runtime does not expose createCanvas(width, height).");
    process.exitCode = 2;
  } else {
    const results = [];
    let failed = false;

    for (const testCase of CASES) {
      const renderer = createCanvasRasterTextRenderer(
        (surfaceWidth, surfaceHeight) => canvasRuntime.createCanvas(surfaceWidth, surfaceHeight),
        {
          id: `napi-canvas-${testCase.id}`,
          font,
          width,
          height,
          direction: testCase.direction,
          threshold: 160,
        },
      );

      const image = renderTextToRaster(testCase.text, renderer);
      const inkPixels = countInkPixels(image.data);
      const hash = createHash("sha256")
        .update(Uint8Array.from(image.data))
        .digest("hex");

      const result = Object.freeze({
        id: testCase.id,
        direction: testCase.direction,
        width: image.width,
        height: image.height,
        inkPixels,
        rasterSha256: hash,
      });
      results.push(result);

      if (inkPixels === 0) {
        failed = true;
      }
    }

    console.log(JSON.stringify({
      runtime: CANVAS_MODULE_ID,
      font,
      width,
      height,
      cases: results,
    }, null, 2));

    if (failed) {
      console.error(
        "Unicode raster conformance failed because at least one fixture produced a blank bitmap. " +
          "Check the configured Canvas runtime and font coverage.",
      );
      process.exitCode = 1;
    }
  }
}

function readPositiveIntegerEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;

  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 1) {
    console.error(`${name} must be a positive safe integer.`);
    process.exit(2);
  }
  return value;
}

function countInkPixels(data) {
  let total = 0;
  for (const byte of data) {
    total += POPCOUNT[byte] ?? 0;
  }
  return total;
}

const POPCOUNT = Object.freeze(
  Array.from({ length: 256 }, (_, value) => {
    let count = 0;
    let remaining = value;
    while (remaining !== 0) {
      count += remaining & 1;
      remaining >>>= 1;
    }
    return count;
  }),
);
