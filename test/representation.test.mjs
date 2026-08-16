import assert from "node:assert/strict";
import test from "node:test";

import {
  diagnoseError,
  OpenReceiptError,
  selectTextRepresentation,
} from "../dist/index.js";

const capabilities = (overrides = {}) => ({
  text: "native",
  cut: "unsupported",
  drawer: "unsupported",
  qr: "unsupported",
  barcode: "unsupported",
  raster: "unsupported",
  status: "unsupported",
  ...overrides,
});

const profile = (overrides = {}) => ({
  id: "fixture-printer",
  protocol: "escpos",
  capabilities: capabilities(),
  textEncodings: ["ascii"],
  ...overrides,
});

const asciiCandidate = {
  id: "ascii",
  canRepresent(text) {
    return [...text].every((character) => {
      const point = character.codePointAt(0);
      return point >= 0x20 && point <= 0x7e;
    });
  },
};

test("selects the first profile-declared native encoding that can represent the text", () => {
  const selection = selectTextRepresentation("Cafe 123", profile(), {
    nativeCandidates: [asciiCandidate],
  });

  assert.deepEqual(selection, { kind: "native", encodingId: "ascii" });
  assert.equal(Object.isFrozen(selection), true);
});

test("does not probe or select a native candidate omitted from the profile encoding allowlist", () => {
  let probed = false;

  const selection = selectTextRepresentation(
    "ASCII",
    profile({
      textEncodings: ["declared-only"],
      capabilities: capabilities({ raster: "native" }),
    }),
    {
      nativeCandidates: [
        {
          id: "not-declared",
          canRepresent() {
            probed = true;
            return true;
          },
        },
      ],
      allowRasterFallback: true,
    },
  );

  assert.equal(probed, false);
  assert.deepEqual(selection, {
    kind: "raster",
    usesCapabilityFallback: false,
  });
});

test("rejects malformed profile encoding allowlists before probing candidates", () => {
  for (const textEncodings of [[42], ["ascii\nspoof"]]) {
    let probed = false;

    assert.throws(
      () =>
        selectTextRepresentation(
          "secret receipt text",
          profile({ textEncodings }),
          {
            nativeCandidates: [
              {
                id: "ascii",
                canRepresent() {
                  probed = true;
                  return true;
                },
              },
            ],
          },
        ),
      (error) =>
        error instanceof OpenReceiptError &&
        error.code === "INVALID_DEVICE_PROFILE" &&
        !Object.values(error.details).includes("secret receipt text"),
    );

    assert.equal(probed, false);
  }
});

test("rejects unsafe device profile note metadata before probing candidates", () => {
  let probed = false;

  assert.throws(
    () =>
      selectTextRepresentation(
        "secret receipt text",
        profile({ notes: ["fixture\u001b[31mspoof"] }),
        {
          nativeCandidates: [
            {
              id: "ascii",
              canRepresent() {
                probed = true;
                return true;
              },
            },
          ],
        },
      ),
    (error) =>
      error instanceof OpenReceiptError &&
      error.code === "INVALID_DEVICE_PROFILE" &&
      error.details.noteIndex === 0 &&
      !Object.values(error.details).includes("secret receipt text") &&
      !Object.values(error.details).includes("fixture\u001b[31mspoof"),
  );

  assert.equal(probed, false);
});

test("rejects malformed device profile shapes with structured errors before probing candidates", () => {
  for (const malformedProfile of [
    null,
    [],
    { id: 42, protocol: "escpos", capabilities: capabilities() },
    { id: "fixture", protocol: 42, capabilities: capabilities() },
    { id: "fixture", protocol: "escpos", capabilities: null },
    { id: "bad\nprofile", protocol: "escpos", capabilities: capabilities() },
    { id: "fixture", protocol: "bad\rprotocol", capabilities: capabilities() },
  ]) {
    let probed = false;

    assert.throws(
      () =>
        selectTextRepresentation("secret receipt text", malformedProfile, {
          nativeCandidates: [
            {
              id: "ascii",
              canRepresent() {
                probed = true;
                return true;
              },
            },
          ],
        }),
      (error) =>
        error instanceof OpenReceiptError &&
        error.code === "INVALID_DEVICE_PROFILE" &&
        !Object.values(error.details).includes("secret receipt text"),
    );

    assert.equal(probed, false);
  }
});

test("normalizes safe device profile identifiers before representation selection", () => {
  const selection = selectTextRepresentation(
    "ASCII",
    profile({ id: " fixture-printer ", protocol: " escpos ", textEncodings: [" ascii "] }),
    { nativeCandidates: [asciiCandidate] },
  );

  assert.deepEqual(selection, { kind: "native", encodingId: "ascii" });
});

test("uses explicit raster fallback for non-native conformance inputs", () => {
  const rasterProfile = profile({
    capabilities: capabilities({ raster: "native" }),
  });

  for (const text of [
    "مرحبا",
    "漢字",
    "e\u0301",
    "🙂",
    "Order مرحبا 42",
  ]) {
    const selection = selectTextRepresentation(text, rasterProfile, {
      nativeCandidates: [asciiCandidate],
      allowRasterFallback: true,
    });

    assert.deepEqual(selection, {
      kind: "raster",
      usesCapabilityFallback: false,
    });
  }
});

test("does not use a native candidate when the profile does not declare native text", () => {
  const selection = selectTextRepresentation(
    "ASCII",
    profile({
      textEncodings: ["always"],
      capabilities: capabilities({ text: "unsupported", raster: "native" }),
    }),
    {
      nativeCandidates: [{ id: "always", canRepresent: () => true }],
      allowRasterFallback: true,
    },
  );

  assert.equal(selection.kind, "raster");
});

test("requires raster fallback to be explicitly enabled and supported", () => {
  for (const [options, rasterSupport] of [
    [{ nativeCandidates: [asciiCandidate] }, "native"],
    [{ nativeCandidates: [asciiCandidate], allowRasterFallback: true }, "unsupported"],
  ]) {
    assert.throws(
      () =>
        selectTextRepresentation(
          "مرحبا",
          profile({ capabilities: capabilities({ raster: rasterSupport }) }),
          options,
        ),
      (error) =>
        error instanceof OpenReceiptError &&
        error.code === "UNSUPPORTED_TEXT_REPRESENTATION" &&
        !("text" in error.details),
    );
  }
});

test("preserves raster capability fallback state without assuming a protocol command", () => {
  const selection = selectTextRepresentation(
    "🙂",
    profile({ capabilities: capabilities({ raster: "fallback" }) }),
    {
      nativeCandidates: [asciiCandidate],
      allowRasterFallback: true,
    },
  );

  assert.deepEqual(selection, {
    kind: "raster",
    usesCapabilityFallback: true,
  });
});

test("rejects malformed candidates and probe failures without leaking text", () => {
  assert.throws(
    () =>
      selectTextRepresentation("secret receipt text", profile(), {
        nativeCandidates: [{ id: "bad\nidentifier", canRepresent: () => true }],
      }),
    (error) =>
      error instanceof OpenReceiptError &&
      error.code === "INVALID_TEXT_REPRESENTATION_OPTION" &&
      !Object.values(error.details).includes("secret receipt text"),
  );

  assert.throws(
    () =>
      selectTextRepresentation(
        "secret receipt text",
        profile({ textEncodings: ["probe"] }),
        {
          nativeCandidates: [
            {
              id: "probe",
              canRepresent() {
                throw new Error("sensitive codec failure");
              },
            },
          ],
        },
      ),
    (error) =>
      error instanceof OpenReceiptError &&
      error.code === "TEXT_REPRESENTATION_FAILED" &&
      !("cause" in error.details) &&
      !Object.values(error.details).includes("secret receipt text"),
  );
});

test("diagnoses representation failures before transport", () => {
  const diagnostic = diagnoseError(
    new OpenReceiptError(
      "UNSUPPORTED_TEXT_REPRESENTATION",
      "fixture failure",
    ),
  );

  assert.equal(diagnostic.stage, "encoding");
  assert.equal(diagnostic.delivery, "not-applicable");
  assert.equal(diagnostic.retrySafety, "not-applicable");
});
