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

test("does not echo profile identifiers when another evidence field is invalid", () => {
  const sensitiveProfileId = "customer-private-profile-id";

  assert.throws(
    () =>
      defineCapabilityEvidence({
        profileId: sensitiveProfileId,
        capability: "not-a-capability",
        support: "native",
        source: "hardware-test",
        reference: "bench-001",
      }),
    (error) =>
      error instanceof OpenReceiptError &&
      error.code === "INVALID_COMPATIBILITY_EVIDENCE" &&
      !Object.values(error.details).includes(sensitiveProfileId),
  );

  assert.throws(
    () =>
      findCapabilityEvidence([], {
        profileId: sensitiveProfileId,
        capability: "not-a-capability",
      }),
    (error) =>
      error instanceof OpenReceiptError &&
      error.code === "INVALID_COMPATIBILITY_EVIDENCE" &&
      !Object.values(error.details).includes(sensitiveProfileId),
  );
});

test("rejects unsafe control characters in evidence text without echoing content", () => {
  for (const evidence of [
    {
      profileId: "fixture\u001b-printer",
      capability: "cut",
      support: "native",
      source: "hardware-test",
      reference: "bench-001",
    },
    {
      profileId: "fixture-printer",
      capability: "cut",
      support: "native",
      source: "hardware-test",
      reference: "bench\u0000-001",
    },
    {
      profileId: "fixture-printer",
      capability: "cut",
      support: "native",
      source: "hardware-test",
      reference: "bench-001",
      observedAt: "2026-08-16\nforged-log-line",
    },
    {
      profileId: "fixture-printer",
      capability: "cut",
      support: "native",
      source: "hardware-test",
      reference: "bench-001",
      notes: ["status\rforged-log-line"],
    },
  ]) {
    assert.throws(
      () => defineCapabilityEvidence(evidence),
      (error) =>
        error instanceof OpenReceiptError &&
        error.code === "INVALID_COMPATIBILITY_EVIDENCE" &&
        !("value" in error.details),
    );
  }
});
