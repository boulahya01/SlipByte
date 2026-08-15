import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_TCP_TIMEOUT_MS,
  OpenReceiptError,
  sendTcp,
} from "../dist/index.js";

test("sends bytes through an injected TCP connection and closes it", async () => {
  const events = [];
  let receivedEndpoint;

  await sendTcp(
    Uint8Array.from([0x1b, 0x40, 0x0a]),
    { host: "printer.local", port: 9100 },
    async (endpoint) => {
      receivedEndpoint = endpoint;
      return {
        async write(data) {
          events.push(["write", [...data]]);
        },
        async close() {
          events.push(["close"]);
        },
      };
    },
  );

  assert.deepEqual(receivedEndpoint, {
    host: "printer.local",
    port: 9100,
    timeoutMs: DEFAULT_TCP_TIMEOUT_MS,
  });
  assert.deepEqual(events, [
    ["write", [0x1b, 0x40, 0x0a]],
    ["close"],
  ]);
});

test("does not assume a default printer port", async () => {
  await assert.rejects(
    () => sendTcp(new Uint8Array(), { host: "printer.local" }),
    (error) =>
      error instanceof OpenReceiptError &&
      error.code === "INVALID_TCP_OPTION",
  );
});

test("validates port and timeout before connecting", async () => {
  await assert.rejects(
    () => sendTcp(new Uint8Array(), { host: "printer.local", port: 0 }),
    (error) => error instanceof OpenReceiptError && error.code === "INVALID_TCP_OPTION",
  );

  await assert.rejects(
    () => sendTcp(new Uint8Array(), { host: "printer.local", port: 9100, timeoutMs: 0 }),
    (error) => error instanceof OpenReceiptError && error.code === "INVALID_TCP_OPTION",
  );
});

test("wraps connector failures without copying arbitrary failure payloads", async () => {
  await assert.rejects(
    () => sendTcp(
      Uint8Array.from([1]),
      { host: "printer.local", port: 9100 },
      async () => {
        throw new Error("sensitive connector details");
      },
    ),
    (error) =>
      error instanceof OpenReceiptError &&
      error.code === "TCP_CONNECT_FAILED" &&
      !("cause" in error.details),
  );
});

test("attempts to close after a failed write and preserves the write failure", async () => {
  let closed = false;

  await assert.rejects(
    () => sendTcp(
      Uint8Array.from([1]),
      { host: "printer.local", port: 9100 },
      async () => ({
        async write() {
          throw new Error("write failed");
        },
        async close() {
          closed = true;
        },
      }),
    ),
    (error) => error instanceof OpenReceiptError && error.code === "TCP_WRITE_FAILED",
  );

  assert.equal(closed, true);
});

test("preserves structured timeout failures from an injected connector", async () => {
  await assert.rejects(
    () => sendTcp(
      Uint8Array.from([1]),
      { host: "printer.local", port: 9100 },
      async () => {
        throw new OpenReceiptError("TCP_CONNECT_TIMEOUT", "fixture timeout");
      },
    ),
    (error) => error instanceof OpenReceiptError && error.code === "TCP_CONNECT_TIMEOUT",
  );
});
