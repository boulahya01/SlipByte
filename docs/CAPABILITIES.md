# Device Capabilities

SlipByte models hardware behavior through explicit capabilities instead of printer-brand conditionals.

The capability/profile contract is implemented on `main` and sits between application/layout intent and protocol encoders.

## Current public contract

Current support states:

```ts
export type CapabilitySupport =
  | "native"
  | "fallback"
  | "unsupported";
```

Current capability keys:

```ts
export type PrinterCapability =
  | "text"
  | "cut"
  | "drawer"
  | "qr"
  | "barcode"
  | "raster"
  | "status";
```

A `DeviceProfile` currently contains:

```ts
type DeviceProfile = Readonly<{
  id: string;
  protocol: string;
  capabilities: PrinterCapabilities;
  textEncodings?: readonly string[];
  notes?: readonly string[];
}>;
```

The exact contract can still evolve before the first stable release.

## Why capabilities exist

Application code should be able to express intent such as:

```text
print text
render image
print QR
cut paper
open drawer
query status
```

without knowing which raw command sequence, protocol extension, driver, or vendor quirk implements it.

The selected profile and encoder decide whether an operation is native, uses a documented fallback, or is unsupported.

## Current helpers

`defineDeviceProfile(profile)` validates and freezes profile data.

At runtime it rejects non-object profiles, malformed identifiers, missing/malformed capability maps, non-array encoding/notes fields, non-text encoding/notes entries, and unsafe control characters in profile or protocol identifiers. Profile id, protocol id, and text-encoding identifiers are normalized by trimming surrounding whitespace before the immutable snapshot is returned. Invalid inputs fail with `INVALID_DEVICE_PROFILE` rather than leaking raw JavaScript `TypeError` failures across the public boundary.

`resolveCapability(profile, capability)` returns:

```ts
type CapabilityResolution = Readonly<{
  capability: PrinterCapability;
  support: CapabilitySupport;
  usable: boolean;
  usesFallback: boolean;
}>;
```

`requireCapability(profile, capability)` returns the same resolution for usable capabilities and throws a structured `UNSUPPORTED_CAPABILITY` error otherwise.

These helpers are hardware-description primitives. They do not prove that a physical printer supports a feature.

## Profiles are data, not brand branches

Application code should not contain logic such as:

```text
if printer.brand == "Epson" ...
if printer.brand == "Star" ...
```

Instead, behavior should flow through a profile:

```text
profile.capabilities.cut
profile.capabilities.qr
profile.capabilities.raster
```

Brand/model metadata can still be recorded for discovery and compatibility evidence, but it should not become application control flow.

## Evidence and unknown compatibility

The current TypeScript contract requires an explicit state for each declared capability. That is intentionally small for the first implementation, but it creates an important rule for compatibility data:

> lack of evidence must not be presented as evidence of support.

A profile should only make claims backed by documented device behavior, tests, or an explicitly chosen generic policy. Broad compatibility data and richer unknown-evidence semantics must be designed before SlipByte presents a compatibility database as authoritative.

Until then, `unsupported` means the profile explicitly says the operation is unavailable; it must not be used as a shortcut for “we have not researched this device yet.”

## Capability areas still to grow

The current seven capability keys are only the first concrete contract. Future profile work may need structured data for:

- printable/media width and raster limits;
- text encodings and code pages;
- font/text metrics;
- full vs partial cut;
- QR/barcode limits;
- cash-drawer pulse parameters;
- status feedback detail;
- protocol-specific quirks;
- safe fallback requirements.

Add these only when a real encoder, transport, device test, or user problem requires them.

## AI-agent requirement

An AI coding agent should be able to inspect a profile and determine what the software claims the device can do, whether a fallback is expected, and which operation should fail explicitly.

Agents must not infer capabilities from model names or undocumented raw-command examples.

## Safety

Disruptive hardware operations must remain explicit and capability-aware.

Normal text content must never be interpreted as raw device control commands.

A future raw-command API, if introduced, must be isolated from safe print intent and clearly documented as protocol/device-specific and unsafe for untrusted input.

## Generality

The capability model must not assume one business domain, human language/script, printer brand, protocol, operating system, or transport.

ESC/POS is the first protocol consumer of this contract, not its definition.
