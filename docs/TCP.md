# TCP transport

OpenReceipt's TCP transport sends already-encoded printer bytes over a raw TCP socket. It does not know about receipt intent, layout, ESC/POS commands, printer brands, or device code pages.

## API

`sendTcp(data, { host, port, timeoutMs }, connector?)` accepts a `Uint8Array` payload and an explicit endpoint.

The port is required. OpenReceipt does not hard-code a printer port because common ESC/POS network conventions are not universal protocol truth.

`timeoutMs` defaults to `5000` and applies to connect, write, and close operations in the built-in Node.js connector.

## Failure model

Invalid endpoint/options fail before a connection attempt with `INVALID_TCP_OPTION`.

Network stages use structured error codes:

- `TCP_CONNECT_FAILED`
- `TCP_CONNECT_TIMEOUT`
- `TCP_WRITE_FAILED`
- `TCP_WRITE_TIMEOUT`
- `TCP_CLOSE_FAILED`

Error details contain endpoint metadata only. Arbitrary low-level failure objects are not copied into structured details, avoiding accidental leakage of payload data or connector-specific secrets.

## Lifecycle

The transport performs the explicit lifecycle:

1. connect
2. write the complete byte payload
3. close

A close attempt still occurs after a write failure. If both write and close fail, the write failure remains primary because it is the first operation that prevented successful printing.

## Testing and alternate runtimes

`TcpConnector` is injectable. Tests and non-Node runtimes can provide a compatible connector without changing the application-facing transport API.

The default `NODE_TCP_CONNECTOR` uses Node.js `node:net` and enables `TCP_NODELAY` for the connection. No retry policy is built in; retry decisions belong above the transport boundary where duplicate-print risk can be handled deliberately.
