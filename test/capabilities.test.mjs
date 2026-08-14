import assert from "node:assert/strict";
import test from "node:test";

import {
  OpenReceiptError,
  defineDeviceProfile,
  requireCapability,
  resolveCapability,
} from "../dist/index.js";

test("defines immutable generic device capabilities", () => {
  const profile = defineDeviceProfile({
    id: "example-device",
    capabilities: [
      { id: "cut", support: "native", evidence: "fixture:cut-v1" },
      { id: "qr", support: "fallback" },
      { id: "drawer", support: "unsupported" },
    ],
  });

  assert.equal(Object.isFrozen(profile), true);
  assert.equal(Object.isFrozen(profile.capabilities), true);
  assert.deepEqual(resolveCapability(profile, "cut"), {
    id: "cut",
    support: "native",
    evidence: "fixture:cut-v1",
  });
  assert.deepEqual(resolveCapability(profile, "qr"), {
    id: "qr",
    support: "fallback",
  });
});

test("treats missing evidence as unknown rather than unsupported", () => {
  const profile = defineDeviceProfile({ id: "unverified-device" });

  assert.deepEqual(resolveCapability(profile, "status"), {
    id: "status",
    support: "unknown",
  });
});

test("allows native and fallback capabilities but rejects unknown capability requirements", () => {
  const profile = defineDeviceProfile({
    id: "example-device",
    capabilities: [
      { id: "cut", support: "native" },
      { id: "image", support: "fallback" },
    ],
  });

  assert.equal(requireCapability(profile, "cut").support, "native");
  assert.equal(requireCapability(profile, "image").support, "fallback");

  assert.throws(
    () => requireCapability(profile, "drawer"),
    (error) =>
      error instanceof OpenReceiptError &&
      error.code === "UNSUPPORTED_CAPABILITY" &&
      error.details.support === "unknown",
  );
});

test("rejects explicitly unsupported required capabilities", () => {
  const profile = defineDeviceProfile({
    id: "example-device",
    capabilities: [{ id: "cut", support: "unsupported" }],
  });

  assert.throws(
    () => requireCapability(profile, "cut"),
    (error) =>
      error instanceof OpenReceiptError &&
      error.code === "UNSUPPORTED_CAPABILITY" &&
      error.details.support === "unsupported",
  );
});

test("rejects duplicate or malformed capabilities", () => {
  assert.throws(
    () =>
      defineDeviceProfile({
        id: "broken",
        capabilities: [
          { id: "cut", support: "native" },
          { id: "cut", support: "fallback" },
        ],
      }),
    (error) =>
      error instanceof OpenReceiptError &&
      error.code === "INVALID_DEVICE_PROFILE",
  );

  assert.throws(
    () =>
      defineDeviceProfile({
        id: "broken",
        capabilities: [{ id: "cut", support: "maybe" }],
      }),
    (error) =>
      error instanceof OpenReceiptError &&
      error.code === "INVALID_CAPABILITY",
  );
});
