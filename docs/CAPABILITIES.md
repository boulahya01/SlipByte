# Device Capabilities

OpenReceipt should model hardware behavior through explicit capabilities instead of printer-brand conditionals.

This document defines the direction for the capability/profile contract that will sit between layout and protocol encoding.

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

without knowing which raw command sequence, protocol extension, or vendor quirk implements it.

The selected device profile and encoder determine whether the operation is:

- supported natively;
- supported through a documented fallback;
- unsupported.

## Capability categories

The first capability model should be general enough to describe at least:

### Media / layout

- printable width
- column/font modes
- text measurement strategy
- raster width limits

### Text

- native text output
- supported encodings/code pages
- emphasis/bold
- alignment
- font modes
- character sizing

### Graphics

- raster image output
- image width/height limits
- native or raster QR
- native or raster barcode

### Hardware actions

- paper feed
- full/partial cut
- cash-drawer pulse

### Device state

- online/offline status
- paper state
- cover state
- error/status query support

## Capability result

A capability should not be represented only as a boolean when more information is required.

Conceptually:

```ts
type Capability<TConfig = undefined> =
  | { support: "native"; config?: TConfig }
  | { support: "fallback"; fallback: string; config?: TConfig }
  | { support: "unsupported"; reason?: string };
```

The exact public type will be designed and tested before the first encoder depends on it.

## Profiles are data, not brand branches

A profile may describe a tested printer model, a device family, or a user-supplied generic configuration.

Application code should not contain logic such as:

```text
if printer.brand == "Epson" ...
if printer.brand == "Star" ...
```

Instead:

```text
profile.capabilities.cut
profile.capabilities.qr
profile.capabilities.raster
```

Brand/model metadata can still be recorded for discovery and compatibility evidence.

## AI-agent requirement

An AI coding agent should be able to inspect a profile and determine:

- what the device can do;
- what configuration is required;
- whether a fallback will be used;
- which operation is unsupported;
- what error/remediation to present.

Agents should not infer capabilities from model names or undocumented raw command examples.

## Safety

Disruptive hardware operations must remain explicit.

Normal text content must never be interpreted as raw device control commands.

A future advanced raw-command API, if one is added, must be isolated from safe print intent and clearly documented as device/protocol-specific and unsafe for untrusted input.

## Generality

The capability model must not assume:

- one business domain;
- one human language;
- one printer brand;
- one protocol;
- one transport.

ESC/POS will be the first consumer of this contract, not its definition.
