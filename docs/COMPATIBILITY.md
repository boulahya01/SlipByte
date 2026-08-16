# Compatibility evidence

OpenReceipt separates **declared device behavior** from **evidence about real devices**. A `DeviceProfile` tells encoders what behavior to use. A `CapabilityEvidence` record tells maintainers and tooling why a compatibility claim may be credible.

This distinction prevents a printer model name, an `ESC/POS compatible` label, or a missing research result from silently becoming a hardware-support claim.

## Evidence contract

Each evidence record identifies:

- `profileId`: the device/profile the observation refers to
- `capability`: the observed capability
- `support`: `native`, `fallback`, or `unsupported`
- `source`: `hardware-test`, `manufacturer-documentation`, `vendor-documentation`, or `community-report`
- `reference`: a non-empty reference such as a test-report ID, documentation section, or source URL
- optional `observedAt` and `notes`

`defineCapabilityEvidence()` accepts an untrusted value, validates the complete shape, normalizes text fields, and returns a frozen record. `findCapabilityEvidence()` likewise validates an untrusted collection and query before returning the records for one profile/capability pair. This makes JSON, database, or externally sourced compatibility data cross an explicit runtime-validation boundary instead of relying only on TypeScript annotations.

Malformed values are not copied into structured error details. Validation reports safe field/type metadata so arbitrary external objects, credentials, or source payloads do not accidentally become diagnostics. Evidence text also rejects unsafe control characters so externally sourced references and notes cannot inject terminal/control sequences into later logs or tooling.

## No inferred consensus

Evidence records do not mutate a `DeviceProfile` and OpenReceipt does not automatically collapse multiple records into one truth value. Two sources can disagree. `findCapabilityEvidence()` preserves that disagreement so a maintainer or higher-level policy can resolve it explicitly.

An empty evidence result means **no evidence is recorded**. It does not mean `unsupported`.

This rule is important for compatibility databases and AI coding agents: absence of evidence must remain distinguishable from evidence that a capability is unavailable.

## Evidence quality

The source category records provenance, not a universal confidence score. Hardware tests are meaningful only for the exact tested model/environment. Documentation can be incomplete or firmware-specific. Community reports can reveal real compatibility problems without proving universal behavior.

OpenReceipt should record exact model/environment details in references or notes when real hardware validation begins. Do not turn generic vendor claims into broad model-family support.

## Fixtures versus real compatibility

Repository tests may use fictional `fixture-printer` evidence to verify the contract. Those fixtures are software tests only; they are not hardware compatibility claims.

Real compatibility entries should only be added when the supporting evidence is available and reviewable.
