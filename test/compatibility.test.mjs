import assert from "node:assert/strict";
import test from "node:test";

import {
  defineCapabilityEvidence,
  findCapabilityEvidence,
  OpenReceiptError,
} from "../dist/index.js";

test("normalizes and freezes compatibility evidence", () => {
  const evidence = defineCapabilityEvidence({
    profileId: " fixture-printer ",
    capability: "cut",
    support: "native",
    source: "hardware-test",
    reference: " bench-001 ",
    notes: [" full cut observed "],
  });

  assert.equal(evidence.profileId, "fixture-printer");
  assert.equal(evidence.reference, "bench-001");
  assert.deepEqual(evidence.notes, ["full cut observed"]);
  assert.equal(Object.isFrozen(evidence), true);
  assert.equal(Object.isFrozen(evidence.notes), true);
});

test("returns all evidence without inventing consensus", () => {
  const evidence = [
    defineCapabilityEvidence({
      profileId: "fixture-printer",
      capability: "cut",
      support: "native",
      source: "hardware-test",
      reference: "bench-001",
    }),
    defineCapabilityEvidence({
      profileId: "fixture-printer",
      capability: "cut",
      support: "unsupported",
      source: "community-report",
      reference: "report-002",
    }),
  ];

  const matches = findCapabilityEvidence(evidence, {
    profileId: "fixture-printer",
    capability: "cut",
  });

  assert.deepEqual(matches.map((record) => record.support), ["native", "unsupported"]);
  assert.equal(Object.isFrozen(matches), true);
});

test("treats missing evidence as missing rather than unsupported", () => {
  const matches = findCapabilityEvidence([], {
    profileId: "unresearched-printer",
    capability: "raster",
  });

  assert.deepEqual(matches, []);
});

test("validates untrusted collections and query objects", () => {
  for (const [evidence, query] of [
    [null, { profileId: "fixture", capability: "cut" }],
    [{}, { profileId: "fixture", capability: "cut" }],
    [[], null],
    [[], ["fixture", "cut"]],
  ]) {
    assert.throws(
      () => findCapabilityEvidence(evidence, query),
      (error) =>
        error instanceof OpenReceiptError &&
        error.code === "INVALID_COMPATIBILITY_EVIDENCE",
    );
  }
});

test("rejects malformed evidence without copying arbitrary values into error details", () => {
  const secret = { token: "do-not-copy" };

  for (const evidence of [
    { profileId: "fixture", capability: secret, support: "native", source: "hardware-test", reference: "r" },
    { profileId: "fixture", capability: "cut", support: secret, source: "hardware-test", reference: "r" },
    { profileId: "fixture", capability: "cut", support: "native", source: secret, reference: "r" },
    { profileId: "fixture", capability: "cut", support: "native", source: "hardware-test", reference: " " },
  ]) {
    assert.throws(
      () => defineCapabilityEvidence(evidence),
      (error) =>
        error instanceof OpenReceiptError &&
        error.code === "INVALID_COMPATIBILITY_EVIDENCE" &&
        !Object.values(error.details).includes(secret),
    );
  }
});
