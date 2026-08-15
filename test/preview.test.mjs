import assert from "node:assert/strict";
import test from "node:test";

import {
  mockPrint,
  PREVIEW_CUT_MARKER,
  previewLayout,
  receipt,
} from "../dist/index.js";

test("renders laid-out receipt text without a second layout implementation", () => {
  const result = mockPrint(
    receipt().text("Hi", { align: "center" }).cut().toDocument(),
    { paper: { id: "fixture", widthMm: 10, columns: 8 } },
  );

  assert.equal(result.preview, `   Hi\n${PREVIEW_CUT_MARKER}\n`);
  assert.equal(result.layout.nodes[0].value, "   Hi");
  assert.equal(Object.isFrozen(result), true);
});

test("represents feed operations deterministically", () => {
  const result = mockPrint(
    receipt().text("A").feed(2).text("B").toDocument(),
    { paper: { id: "fixture", widthMm: 10, columns: 8 } },
  );

  assert.equal(result.preview, "A\n\n\nB\n");
});

test("previewLayout consumes an existing layout directly", () => {
  const layout = Object.freeze({
    paper: Object.freeze({ id: "fixture", widthMm: 10, columns: 8 }),
    nodes: Object.freeze([
      Object.freeze({
        type: "line",
        value: "READY",
        bold: true,
        source: "text",
        sourceNodeIndex: 0,
      }),
      Object.freeze({ type: "cut", sourceNodeIndex: 1 }),
    ]),
  });

  assert.equal(previewLayout(layout), `READY\n${PREVIEW_CUT_MARKER}\n`);
});
