# Device Capabilities

OpenReceipt models hardware behavior through explicit capabilities instead of printer-brand conditionals.

The capability layer sits between hardware-independent print intent/layout and protocol-specific encoding.

```text
Receipt / print intent
        ↓
      Layout
        ↓
Device profile + capability resolution
        ↓
Protocol encoder
        ↓
Transport
        ↓
Hardware
```

## Why capabilities exist

Application code should be able to express intent such as printing text, rendering graphics, cutting paper, opening a drawer, or querying device state without knowing which raw command sequence, protocol extension, transport, or vendor quirk implements it.

## Support states

A capability has one of four support states:

- `native` — the profile has evidence that the feature can be performed directly.
- `fallback` — OpenReceipt can satisfy the intent through a documented fallback path.
- `unsupported` — the profile has evidence that the device cannot provide the capability through the current integration path.
- `unknown` — OpenReceipt does not have enough evidence to claim support or lack of support.

`unknown` is intentionally different from `unsupported`. Missing compatibility data must not become a false hardware claim.

## Generic capability identifiers

Capability IDs are strings rather than a closed printer-specific enum. This keeps the core extensible while allowing conventional documented IDs such as:

```text
cut
cash-drawer
qr
barcode
raster-image
status
text-encoding
```

ESC/POS is the first planned consumer of this contract, not its definition.

## Evidence

A capability may include a concise evidence reference. Evidence can point to a verified fixture, vendor documentation, or tested hardware record.

Evidence is metadata, not executable behavior. A profile must not claim `native` or `unsupported` merely from a brand name or a generic `ESC/POS compatible` label.

## Public API

```ts
const profile = defineDeviceProfile({
  id: "example-device",
  capabilities: [
    { id: "cut", support: "native", evidence: "fixture:cut-v1" },
    { id: "qr", support: "fallback" },
  ],
});

resolveCapability(profile, "cut");
requireCapability(profile, "cut");
```

`resolveCapability(profile, id)` always returns a resolution. If the profile does not describe the requested capability, support is `unknown`.

`requireCapability(profile, id)` is for an operation that cannot safely continue without support. It allows `native` and `fallback`, and throws the structured `UNSUPPORTED_CAPABILITY` error for `unsupported` or `unknown`.

## Profiles are data, not brand branches

A profile may describe a tested printer model, a device family, or a user-supplied generic configuration. Brand/model metadata can eventually help discovery, but application code should consume capabilities rather than branching on vendor names.

## AI-agent requirement

An AI coding agent should be able to inspect a profile and determine what is known, whether a fallback is expected, and when an operation must stop. Agents should not infer capabilities from model names or undocumented raw-command examples.

## Safety and boundaries

Capabilities describe facts and safe resolution paths. They do not contain sockets, USB handles, ESC/POS byte sequences, operating-system driver logic, receipt layout code, or application business rules.

Normal text content must never be interpreted as raw device control commands. Any future raw-command API must remain isolated, explicit, protocol-specific, and unsafe for untrusted input.

The capability model must not assume one business domain, human language, printer brand, protocol, or transport.
