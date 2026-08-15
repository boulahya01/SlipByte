import assert from "node:assert/strict";
import test from "node:test";

import {
  diagnoseError,
  OpenReceiptError,
} from "../dist/index.js";

test("marks pre-write TCP connection failures as safe to retry after remediation", () => {
  const diagnostic = diagnoseError(
    new OpenReceiptError("TCP_CONNECT_TIMEOUT", "fixture timeout"),
  );

  assert.deepEqual(diagnostic, {
    code: "TCP_CONNECT_TIMEOUT",
    stage: "transport",
    summary: "TCP connection failed before print bytes were written.",
    retrySafety: "safe-after-remediation",
    delivery: "not-started",
    remediation: [
      "Verify printer reachability, host, port, and network path before retrying.",
    ],
  });
  assert.equal(Object.isFrozen(diagnostic), true);
  assert.equal(Object.isFrozen(diagnostic.remediation), true);
});

test("marks post-connect transport failures as uncertain delivery", () => {
  for (const code of [
    "TCP_WRITE_FAILED",
    "TCP_WRITE_TIMEOUT",
    "TCP_CLOSED_EARLY",
    "TCP_CLOSE_FAILED",
    "TCP_CLOSE_TIMEOUT",
  ]) {
    const diagnostic = diagnoseError(new OpenReceiptError(code, "fixture failure"));

    assert.equal(diagnostic.stage, "transport");
    assert.equal(diagnostic.delivery, "uncertain");
    assert.equal(diagnostic.retrySafety, "unsafe-without-confirmation");
  }
});

test("classifies layout failures without exposing error details", () => {
  const diagnostic = diagnoseError(
    new OpenReceiptError("LAYOUT_OVERFLOW", "fixture", {
      receiptText: "sensitive",
    }),
  );

  assert.equal(diagnostic.stage, "layout");
  assert.equal(diagnostic.retrySafety, "not-applicable");
  assert.equal("details" in diagnostic, false);
  assert.equal(JSON.stringify(diagnostic).includes("sensitive"), false);
});

test("handles unknown failures conservatively", () => {
  const diagnostic = diagnoseError(new Error("external failure"));

  assert.deepEqual(diagnostic, {
    stage: "unknown",
    summary: "The failure is not an OpenReceipt structured error.",
    retrySafety: "unknown",
    delivery: "not-applicable",
    remediation: [
      "Inspect the original failure at the application boundary before retrying.",
    ],
  });
});
