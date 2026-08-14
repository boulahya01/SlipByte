import assert from "node:assert/strict";
import test from "node:test";

import {
  OpenReceiptError,
  layoutReceipt,
  paperProfile,
  receipt,
} from "../dist/index.js";

test("exposes deterministic built-in paper profiles", () => {
  assert.deepEqual(paperProfile("58mm"), {
    id: "58mm",
    widthMm: 58,
    columns: 32,
  });

  assert.deepEqual(paperProfile("80mm"), {
    id: "80mm",
    widthMm: 80,
    columns: 48,
  });
});

test("lays out a 58mm receipt without printer-specific behavior", () => {
  const document = receipt()
    .title("Cafe")
    .item("Coffee", 2, 30)
    .divider()
    .total("TOTAL", 60)
    .feed(2)
    .cut()
    .toDocument();

  const layout = layoutReceipt(document, { paper: "58mm" });

  assert.equal(layout.paper.columns, 32);
  assert.deepEqual(layout.nodes, [
    {
      type: "line",
      value: "              Cafe",
      bold: true,
      source: "text",
      sourceNodeIndex: 0,
    },
    {
      type: "line",
      value: "2x Coffee                  60.00",
      bold: false,
      source: "item",
      sourceNodeIndex: 1,
    },
    {
      type: "line",
      value: "--------------------------------",
      bold: false,
      source: "divider",
      sourceNodeIndex: 2,
    },
    {
      type: "line",
      value: "TOTAL                      60.00",
      bold: false,
      source: "total",
      sourceNodeIndex: 3,
    },
    { type: "feed", lines: 2, sourceNodeIndex: 4 },
    { type: "cut", sourceNodeIndex: 5 },
  ]);
});

test("wraps long item names while reserving the price column", () => {
  const document = receipt()
    .item("Extra Large Caramel Cappuccino With Oat Milk", 2, 12.5)
    .toDocument();

  const layout = layoutReceipt(document, { paper: "58mm", overflow: "wrap" });
  const lines = layout.nodes.filter((node) => node.type === "line");

  assert.equal(lines.length > 1, true);
  assert.equal(lines[0].value.endsWith("25.00"), true);
  assert.equal(lines.every((line) => Array.from(line.value).length <= 32), true);
});

test("truncates deterministically when requested", () => {
  const document = receipt()
    .text("This line is intentionally much longer than a 58mm receipt line")
    .toDocument();

  const layout = layoutReceipt(document, {
    paper: "58mm",
    overflow: "truncate",
  });

  const line = layout.nodes[0];
  assert.equal(line.type, "line");
  assert.equal(Array.from(line.value).length, 32);
  assert.equal(line.value.endsWith("…"), true);
});

test("throws a structured error when overflow policy is error", () => {
  const document = receipt()
    .text("This line cannot fit inside thirty two receipt columns")
    .toDocument();

  assert.throws(
    () => layoutReceipt(document, { paper: "58mm", overflow: "error" }),
    (error) =>
      error instanceof OpenReceiptError &&
      error.code === "LAYOUT_OVERFLOW" &&
      error.details.columns === 32 &&
      error.details.sourceNodeIndex === 0,
  );
});

test("supports application-owned amount formatting without changing receipt intent", () => {
  const document = receipt().total("TOTAL", 120).toDocument();
  const layout = layoutReceipt(document, {
    paper: "80mm",
    formatAmount: (amount) => `${amount.toFixed(0)} MAD`,
  });

  const line = layout.nodes[0];
  assert.equal(line.type, "line");
  assert.equal(line.value.endsWith("120 MAD"), true);
  assert.equal(Array.from(line.value).length, 48);
});

test("rejects unsafe custom paper profiles", () => {
  const document = receipt().text("Hello").toDocument();

  assert.throws(
    () =>
      layoutReceipt(document, {
        paper: { id: "broken", widthMm: 58, columns: 0 },
      }),
    (error) =>
      error instanceof OpenReceiptError &&
      error.code === "INVALID_PAPER_PROFILE",
  );
});
