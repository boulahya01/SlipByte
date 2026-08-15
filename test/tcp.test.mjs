import assert from "node:assert/strict";
import { createServer } from "node:net";
import test from "node:test";

import {
  DEFAULT_TCP_CLOSE_TIMEOUT_MS,
  DEFAULT_TCP_CONNECT_TIMEOUT_MS,
  DEFAULT_TCP_WRITE_TIMEOUT_MS,
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
    connectTimeoutMs: DEFAULT_TCP_CONNECT_TIMEOUT_MS,
    writeTimeoutMs: DEFAULT_TCP_WRITE_TIMEOUT_MS,
    closeTimeoutMs: DEFAULT_TCP_CLOSE_TIMEOUT_MS,
  });
  assert.deepEqual(events, [
    ["write", [0x1b, 0x40, 0x0a]],
    ["close"],
  ]);
});

test("sends bytes through the built-in Node TCP connector", async () => {
  const payload = Uint8Array.from([0x1b, 0x40, 0x41, 0x0a]);
  const server = createServer();

  const received = new Promise((resolve, reject) => {
    server.once("connection", (socket) => {
      socket.once("error", reject);
      socket.once("data", (chunk) => resolve([...chunk]));
    });
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  try {
    const address = server.address();
    assert.ok(address && typeof address === "object");

    await Promise.all([
      sendTcp(payload, {
        host: "127.0.0.1",
        port: address.port,
        connectTimeoutMs: 1_000,
        writeTimeoutMs: 1_000,
        closeTimeoutMs: 1_000,
      }),
      received,
    ]).then(([, bytes]) => {
      assert.deepEqual(bytes, [...payload]);
    });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("does not assume a default printer port", async () => {
  await assert.rejects(
    () => sendTcp(new Uint8Array(), { host: "printer.local" }),
    (error) =>
      error instanceof OpenReceiptError &&
      error.code === "INVALID_TCP_OPTION",
  );
});

test("validates stage timeout options before connecting", async () => {
  for (const options of [
    { host: "printer.local", port: 0 },
    { host: "printer.local", port: 9100, connectTimeoutMs: 0 },
    { host: "printer.local", port: 9100, writeTimeoutMs: 0 },
    { host: "printer.local", port: 9100, closeTimeoutMs: 0 },
  ]) {
    await assert.rejects(
      () => sendTcp(new Uint8Array(), options),
      (error) =>
        error instanceof OpenReceiptError &&
        error.code === "INVALID_TCP_OPTION",
    );
  }
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

test("times out a hanging injected connector", async () => {
  await assert.rejects(
    () => sendTcp(
      Uint8Array.from([1]),
      { host: "printer.local", port: 9100, connectTimeoutMs: 5 },
      async () => new Promise(() => {}),
    ),
    (error) =>
      error instanceof OpenReceiptError &&
      error.code === "TCP_CONNECT_TIMEOUT",
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

test("times out a hanging write, aborts, then still attempts close", async () => {
  const events = [];

  await assert.rejects(
    () => sendTcp(
      Uint8Array.from([1]),
      { host: "printer.local", port: 9100, writeTimeoutMs: 5 },
      async () => ({
        async write() {
          events.push("write");
          return new Promise(() => {});
        },
        async close() {
          events.push("close");
        },
        abort() {
          events.push("abort");
        },
      }),
    ),
    (error) =>
      error instanceof OpenReceiptError &&
      error.code === "TCP_WRITE_TIMEOUT",
  );

  assert.deepEqual(events, ["write", "abort", "close"]);
});

test("reports close timeout separately and aborts the connection", async () => {
  const events = [];

  await assert.rejects(
    () => sendTcp(
      Uint8Array.from([1]),
      { host: "printer.local", port: 9100, closeTimeoutMs: 5 },
      async () => ({
        async write() {
          events.push("write");
        },
        async close() {
          events.push("close");
          return new Promise(() => {});
        },
        abort() {
          events.push("abort");
        },
      }),
    ),
    (error) =>
      error instanceof OpenReceiptError &&
      error.code === "TCP_CLOSE_TIMEOUT",
  );

  assert.deepEqual(events, ["write", "close", "abort"]);
});

test("preserves structured failures from an injected connector", async () => {
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
