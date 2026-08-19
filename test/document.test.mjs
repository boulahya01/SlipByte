import assert from "node:assert/strict";
import test from "node:test";

import {
  createPrintDocument,
  deserializePrintDocument,
  parsePrintDocument,
  PRINT_DOCUMENT_VERSION,
  receipt,
  serializePrintDocument,
  SlipByteError,
} from "../dist/index.js";

test("creates a versioned serializable document from receipt intent", () => {
  const document = createPrintDocument(receipt().title("Store").total("TOTAL", 12).cut().toDocument());

  assert.equal(document.version, PRINT_DOCUMENT_VERSION);
  assert.equal(Object.isFrozen(document), true);
  assert.equal(Object.isFrozen(document.nodes), true);
  assert.deepEqual(deserializePrintDocument(serializePrintDocument(document)), document);
});

test("parses a plain JSON-compatible v1 document", () => {
  const document = parsePrintDocument({
    version: 1,
    nodes: [{ type: "text", value: "Hello", align: "left", bold: false }],
  });

  assert.deepEqual(document, {
    version: 1,
    nodes: [{ type: "text", value: "Hello", align: "left", bold: false }],
  });
  assert.equal(Object.isFrozen(document.nodes[0]), true);
});

test("rejects unsupported versions explicitly", () => {
  assert.throws(
    () => parsePrintDocument({ version: 2, nodes: [] }),
    (error) =>
      error instanceof SlipByteError &&
      error.code === "UNSUPPORTED_DOCUMENT_VERSION" &&
      error.details.version === 2,
  );
});

test("rejects malformed nodes without leaking text content", () => {
  assert.throws(
    () => parsePrintDocument({
      version: 1,
      nodes: [{ type: "text", value: "secret\u001b@", align: "left", bold: false }],
    }),
    (error) =>
      error instanceof SlipByteError &&
      error.code === "INVALID_PRINT_DOCUMENT" &&
      error.details.index === 0 &&
      error.details.field === "value" &&
      !("value" in error.details),
  );
});

test("rejects invalid serialized JSON with a stable error", () => {
  assert.throws(
    () => deserializePrintDocument("{not-json}"),
    (error) =>
      error instanceof SlipByteError && error.code === "INVALID_PRINT_DOCUMENT",
  );
});
