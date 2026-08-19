# TCP transport

SlipByte's TCP transport sends already-encoded printer bytes over a raw TCP socket. It does not know about receipt intent, layout, ESC/POS commands, printer brands, or device code pages.

## API

`sendTcp(data, { host, port, connectTimeoutMs, writeTimeoutMs, closeTimeoutMs }, connector?)` accepts a `Uint8Array` payload and an explicit endpoint.

The port is required. SlipByte does not hard-code a printer port because common ESC/POS network conventions are not universal protocol truth.

Defaults:

- `connectTimeoutMs`: `5000`
- `writeTimeoutMs`: `5000`
- `closeTimeoutMs`: `2000`

The stage-specific timeouts are intentionally separate so applications can tune slow network discovery/connect behavior independently from write and shutdown behavior.

## Failure model

Invalid endpoint/options fail before a connection attempt with `INVALID_TCP_OPTION`.

Network stages use structured error codes:

- `TCP_CONNECT_FAILED`
- `TCP_CONNECT_TIMEOUT`
- `TCP_WRITE_FAILED`
- `TCP_WRITE_TIMEOUT`
- `TCP_CLOSED_EARLY`
- `TCP_CLOSE_FAILED`
- `TCP_CLOSE_TIMEOUT`

Error details contain endpoint and timeout metadata only. Arbitrary low-level failure objects and print payload bytes are not copied into structured details, avoiding accidental leakage of receipt data or connector-specific secrets.

## Lifecycle

The transport performs the explicit lifecycle:

1. connect
2. write the complete byte payload
3. close

The built-in Node.js connector uses `node:net`, enables `TCP_NODELAY`, waits for the socket `connect` event, observes write completion, and then performs an orderly `end()`/`close` sequence.

A close attempt still occurs after a write failure. If both write and close fail, the write failure remains primary because it is the first operation that prevented successful printing.

Timeouts can abort the built-in socket. Injected connections may optionally expose `abort()` so the same timeout behavior can release their resources.

## Delivery semantics

A successful TCP write means the transport handed the bytes through the socket lifecycle without a detected transport failure. It does **not** prove that paper physically exited the printer.

SlipByte deliberately performs no automatic retry. A connection can fail after some or all bytes reached the device, so blind retry can create duplicate physical receipts. Retry policy belongs above the transport layer where the application can represent an uncertain print outcome explicitly.

## Testing and alternate runtimes

`TcpConnector` is injectable. Tests and non-Node runtimes can provide a compatible connector without changing the application-facing transport API.

The transport-level timeout guards also wrap injected connectors/connections, preventing a custom connector from hanging `sendTcp()` indefinitely.
