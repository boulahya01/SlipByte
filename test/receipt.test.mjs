import assert from "node:assert/strict";
import test from "node:test";

import { SlipByteError, receipt } from "../dist/index.js";

test("builds a deterministic receipt document", () => {
  const document = receipt()
    .title("SlipByte Cafe")
    .item("Coffee", 2, 30)
    .divider()
    .total("TOTAL", 60)
    .feed()
    .cut()
    .toDocument();

  assert.deepEqual(document, {
    nodes: [
      {
        type: "text",
        value: "SlipByte Cafe",
        align: "center",
        bold: true,
      },
      { type: "item", name: "Coffee", quantity: 2, unitPrice: 30 },
      { type: "divider" },
      { type: "total", label: "TOTAL", amount: 60 },
      { type: "feed", lines: 1 },
      { type: "cut" },
    ],
  });
});

test("returns an immutable document snapshot", () => {
  const builder = receipt().title("Store");
  const first = builder.toDocument();

  builder.text("Later line");

  assert.equal(first.nodes.length, 1);
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.nodes), true);
});

test("uses structured errors for invalid input", () => {
  assert.throws(
    () => receipt().item("Coffee", 0, 10),
    (error) =>
      error instanceof SlipByteError &&
      error.code === "INVALID_QUANTITY" &&
      error.details.quantity === 0,
  );
});

test("rejects ESC/POS control bytes in normal receipt text", () => {
  assert.throws(
    () => receipt().text(`Coffee\u001b@`),
    (error) =>
      error instanceof SlipByteError &&
      error.code === "INVALID_TEXT" &&
      error.details.codePoint === 27 &&
      !("value" in error.details),
  );
});

test("rejects invalid plain JavaScript text values without leaking content", () => {
  assert.throws(
    () => receipt().item(null, 1, 10),
    (error) =>
      error instanceof SlipByteError &&
      error.code === "INVALID_TEXT" &&
      error.details.receivedType === "object" &&
      !("name" in error.details),
  );
});
