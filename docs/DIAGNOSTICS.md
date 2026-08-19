# Diagnostics and retry safety

SlipByte exposes structured error codes for machine handling. `diagnoseError()` adds a small, stable interpretation layer for applications, support tooling, and coding agents without exposing receipt payloads or arbitrary low-level error objects.

## API

```ts
try {
  await sendTcp(bytes, endpoint);
} catch (error) {
  const diagnostic = diagnoseError(error);

  console.log(diagnostic.stage);
  console.log(diagnostic.retrySafety);
  console.log(diagnostic.delivery);
}
```

A diagnostic contains:

- `stage`: input, document, layout, capability, encoding, transport, or unknown
- `retrySafety`: whether retry is meaningful and whether it is safe without confirming delivery
- `delivery`: not applicable before transport, definitely not started, uncertain after transport begins, or unknown when the failure is outside SlipByte's structured error model
- `remediation`: concise next actions based only on evidence SlipByte actually has

Diagnostics deliberately do not copy `SlipByteError.details`, receipt text, encoded bytes, network credentials, or arbitrary thrown causes.

## TCP delivery semantics

A connection failure or connection timeout occurs before bytes are written. After the endpoint is corrected or reachability is restored, retrying that print job is transport-safe.

Write, early-close, and close-stage failures are different. Some or all bytes may already have reached the device, so SlipByte reports `delivery: "uncertain"` and `retrySafety: "unsafe-without-confirmation"`. Applications should not blindly resend a job in that state because doing so can duplicate a physical print.

Transport success still does not prove that paper physically exited the printer. Device status or application-level confirmation belongs to a separate capability/status path when supported by evidence.

## Unknown errors

Non-SlipByte failures are classified conservatively as `stage: "unknown"`, `retrySafety: "unknown"`, and `delivery: "unknown"`. The diagnostic layer cannot safely infer whether an arbitrary external failure happened before or after delivery began, so callers must inspect the original failure at the application boundary rather than guessing from a printer brand or protocol convention.
