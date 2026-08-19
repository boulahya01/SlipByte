import assert from "node:assert/strict";
import test from "node:test";

import {
  defineDeviceProfile,
  printEscPosTcp,
  receipt,
} from "../dist/index.js";

const profile = defineDeviceProfile({
  id: "fixture-high-level",
  protocol: "escpos",
  capabilities: {
    text: "native",
    cut: "native",
    drawer: "unsupported",
    qr: "unsupported",
    barcode: "unsupported",
    raster: "unsupported",
    status: "unsupported",
  },
  textEncodings: ["ascii"],
});

test("composes receipt layout, ESC/POS encoding, and TCP transport", async () => {
  const document = receipt()
    .title("SlipByte")
    .item("Coffee", 2, 30)
    .total("TOTAL", 60)
    .cut()
    .toDocument();

  let endpoint;
  let delivered;
  let closed = false;

  const connector = async (resolvedEndpoint) => {
    endpoint = resolvedEndpoint;
    return {
      write: async (data) => {
        delivered = Uint8Array.from(data);
      },
      close: async () => {
        closed = true;
      },
    };
  };

  await printEscPosTcp(
    document,
    {
      profile,
      transport: { host: "printer.test", port: 9100 },
      layout: { paper: "58mm" },
    },
    connector,
  );

  assert.equal(endpoint.host, "printer.test");
  assert.equal(endpoint.port, 9100);
  assert.equal(delivered instanceof Uint8Array, true);
  assert.equal(delivered[0], 0x1b);
  assert.equal(delivered[1], 0x40);
  assert.deepEqual([...delivered.slice(-3)], [0x1d, 0x56, 0x00]);
  assert.equal(closed, true);
});

test("preserves encoder capability failures before transport", async () => {
  const noCutProfile = defineDeviceProfile({
    ...profile,
    id: "fixture-no-cut",
    capabilities: { ...profile.capabilities, cut: "unsupported" },
  });

  let connected = false;
  const connector = async () => {
    connected = true;
    throw new Error("transport should not be reached");
  };

  await assert.rejects(
    printEscPosTcp(
      receipt().text("Hello").cut().toDocument(),
      {
        profile: noCutProfile,
        transport: { host: "printer.test", port: 9100 },
      },
      connector,
    ),
    (error) => error?.code === "UNSUPPORTED_CAPABILITY",
  );

  assert.equal(connected, false);
});
