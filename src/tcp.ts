import { Socket } from "node:net";

import { OpenReceiptError } from "./errors.js";

export type TcpTransportOptions = Readonly<{
  host: string;
  port: number;
  connectTimeoutMs?: number;
  writeTimeoutMs?: number;
  closeTimeoutMs?: number;
}>;

export type TcpEndpoint = Readonly<{
  host: string;
  port: number;
  connectTimeoutMs: number;
  writeTimeoutMs: number;
  closeTimeoutMs: number;
}>;

export type TcpConnection = Readonly<{
  write: (data: Uint8Array) => Promise<void>;
  close: () => Promise<void>;
  abort?: () => void;
}>;

export type TcpConnector = (endpoint: TcpEndpoint) => Promise<TcpConnection>;

export const DEFAULT_TCP_CONNECT_TIMEOUT_MS = 5_000;
export const DEFAULT_TCP_WRITE_TIMEOUT_MS = 5_000;
export const DEFAULT_TCP_CLOSE_TIMEOUT_MS = 2_000;

export const NODE_TCP_CONNECTOR: TcpConnector = async (
  endpoint: TcpEndpoint,
): Promise<TcpConnection> => {
  const socket = await connectSocket(endpoint);

  return Object.freeze({
    write: (data: Uint8Array) => writeSocket(socket, data, endpoint),
    close: () => closeSocket(socket, endpoint),
    abort: () => socket.destroy(),
  });
};

export async function sendTcp(
  data: Uint8Array,
  options: TcpTransportOptions,
  connector: TcpConnector = NODE_TCP_CONNECTOR,
): Promise<void> {
  if (!(data instanceof Uint8Array)) {
    throw new OpenReceiptError(
      "INVALID_TCP_OPTION",
      "TCP transport data must be a Uint8Array.",
      { receivedType: typeof data },
    );
  }

  if (typeof connector !== "function") {
    throw new OpenReceiptError(
      "INVALID_TCP_OPTION",
      "TCP connector must be a function.",
      { connectorType: typeof connector },
    );
  }

  const endpoint = resolveTcpEndpoint(options);
  let connection: TcpConnection;

  try {
    connection = await withTimeout(
      connector(endpoint),
      endpoint.connectTimeoutMs,
      () =>
        new OpenReceiptError(
          "TCP_CONNECT_TIMEOUT",
          "TCP connection timed out.",
          endpointDetails(endpoint),
        ),
    );
  } catch (error) {
    if (error instanceof OpenReceiptError) throw error;

    throw new OpenReceiptError(
      "TCP_CONNECT_FAILED",
      "TCP connection failed before print bytes could be written.",
      endpointDetails(endpoint),
    );
  }

  if (!isTcpConnection(connection)) {
    throw new OpenReceiptError(
      "TCP_CONNECT_FAILED",
      "TCP connector returned an invalid connection object.",
      endpointDetails(endpoint),
    );
  }

  let primaryError: unknown;
  let primaryStage: "write" | "close" | undefined;

  try {
    await withTimeout(
      connection.write(data),
      endpoint.writeTimeoutMs,
      () => {
        connection.abort?.();
        return new OpenReceiptError(
          "TCP_WRITE_TIMEOUT",
          "TCP write timed out.",
          endpointDetails(endpoint),
        );
      },
    );
  } catch (error) {
    primaryError = error;
    primaryStage = "write";
  }

  try {
    await withTimeout(
      connection.close(),
      endpoint.closeTimeoutMs,
      () => {
        connection.abort?.();
        return new OpenReceiptError(
          "TCP_CLOSE_TIMEOUT",
          "TCP connection did not close before the timeout.",
          endpointDetails(endpoint),
        );
      },
    );
  } catch (error) {
    if (primaryError === undefined) {
      primaryError = error;
      primaryStage = "close";
    }
  }

  if (primaryError !== undefined) {
    if (primaryError instanceof OpenReceiptError) throw primaryError;

    if (primaryStage === "close") {
      throw new OpenReceiptError(
        "TCP_CLOSE_FAILED",
        "TCP connection failed while closing.",
        endpointDetails(endpoint),
      );
    }

    throw new OpenReceiptError(
      "TCP_WRITE_FAILED",
      "TCP write failed before the print operation completed.",
      endpointDetails(endpoint),
    );
  }
}

function resolveTcpEndpoint(options: TcpTransportOptions): TcpEndpoint {
  const candidate = options as Partial<TcpTransportOptions> | null;

  if (
    candidate === null ||
    typeof candidate !== "object" ||
    typeof candidate.host !== "string" ||
    !candidate.host.trim()
  ) {
    throw new OpenReceiptError(
      "INVALID_TCP_OPTION",
      "TCP host must be non-empty text.",
    );
  }

  if (
    typeof candidate.port !== "number" ||
    !Number.isInteger(candidate.port) ||
    candidate.port < 1 ||
    candidate.port > 65_535
  ) {
    throw new OpenReceiptError(
      "INVALID_TCP_OPTION",
      "TCP port must be an integer from 1 through 65535.",
      { port: candidate.port },
    );
  }

  const connectTimeoutMs = validateTimeout(
    candidate.connectTimeoutMs ?? DEFAULT_TCP_CONNECT_TIMEOUT_MS,
    "connectTimeoutMs",
  );
  const writeTimeoutMs = validateTimeout(
    candidate.writeTimeoutMs ?? DEFAULT_TCP_WRITE_TIMEOUT_MS,
    "writeTimeoutMs",
  );
  const closeTimeoutMs = validateTimeout(
    candidate.closeTimeoutMs ?? DEFAULT_TCP_CLOSE_TIMEOUT_MS,
    "closeTimeoutMs",
  );

  return Object.freeze({
    host: candidate.host.trim(),
    port: candidate.port,
    connectTimeoutMs,
    writeTimeoutMs,
    closeTimeoutMs,
  });
}

function validateTimeout(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new OpenReceiptError(
      "INVALID_TCP_OPTION",
      `${field} must be a positive integer.`,
      { [field]: value },
    );
  }
  return value;
}

function isTcpConnection(connection: unknown): connection is TcpConnection {
  return (
    typeof connection === "object" &&
    connection !== null &&
    typeof (connection as TcpConnection).write === "function" &&
    typeof (connection as TcpConnection).close === "function" &&
    ((connection as TcpConnection).abort === undefined ||
      typeof (connection as TcpConnection).abort === "function")
  );
}

async function connectSocket(endpoint: TcpEndpoint): Promise<Socket> {
  const socket = new Socket();
  socket.setNoDelay(true);

  return new Promise<Socket>((resolve, reject) => {
    let settled = false;

    const cleanup = (): void => {
      clearTimeout(timer);
      socket.off("error", onError);
      socket.off("connect", onConnect);
    };

    const finish = (error?: OpenReceiptError): void => {
      if (settled) return;
      settled = true;
      cleanup();

      if (error) {
        socket.destroy();
        reject(error);
      } else {
        resolve(socket);
      }
    };

    const onError = (): void => {
      finish(
        new OpenReceiptError(
          "TCP_CONNECT_FAILED",
          "TCP connection failed before print bytes could be written.",
          endpointDetails(endpoint),
        ),
      );
    };

    const onConnect = (): void => finish();

    const timer = setTimeout(() => {
      finish(
        new OpenReceiptError(
          "TCP_CONNECT_TIMEOUT",
          "TCP connection timed out.",
          endpointDetails(endpoint),
        ),
      );
    }, endpoint.connectTimeoutMs);

    socket.once("error", onError);
    socket.once("connect", onConnect);

    try {
      socket.connect(endpoint.port, endpoint.host);
    } catch {
      finish(
        new OpenReceiptError(
          "TCP_CONNECT_FAILED",
          "TCP connection failed before print bytes could be written.",
          endpointDetails(endpoint),
        ),
      );
    }
  });
}

async function writeSocket(
  socket: Socket,
  data: Uint8Array,
  endpoint: TcpEndpoint,
): Promise<void> {
  if (socket.destroyed || !socket.writable) {
    throw new OpenReceiptError(
      "TCP_WRITE_FAILED",
      "TCP connection closed before print bytes could be written.",
      endpointDetails(endpoint),
    );
  }

  return new Promise<void>((resolve, reject) => {
    let settled = false;

    const cleanup = (): void => {
      clearTimeout(timer);
      socket.off("error", onError);
      socket.off("close", onClose);
    };

    const finish = (error?: OpenReceiptError): void => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve();
    };

    const onError = (): void => {
      finish(
        new OpenReceiptError(
          "TCP_WRITE_FAILED",
          "TCP write failed before the print operation completed.",
          endpointDetails(endpoint),
        ),
      );
    };

    const onClose = (): void => {
      finish(
        new OpenReceiptError(
          "TCP_CLOSED_EARLY",
          "TCP connection closed before the write completed.",
          endpointDetails(endpoint),
        ),
      );
    };

    const timer = setTimeout(() => {
      socket.destroy();
      finish(
        new OpenReceiptError(
          "TCP_WRITE_TIMEOUT",
          "TCP write timed out.",
          endpointDetails(endpoint),
        ),
      );
    }, endpoint.writeTimeoutMs);

    socket.once("error", onError);
    socket.once("close", onClose);

    try {
      socket.write(data, (error?: Error | null) => {
        if (error) {
          finish(
            new OpenReceiptError(
              "TCP_WRITE_FAILED",
              "TCP write failed before the print operation completed.",
              endpointDetails(endpoint),
            ),
          );
        } else {
          finish();
        }
      });
    } catch {
      finish(
        new OpenReceiptError(
          "TCP_WRITE_FAILED",
          "TCP write failed before the print operation completed.",
          endpointDetails(endpoint),
        ),
      );
    }
  });
}

async function closeSocket(
  socket: Socket,
  endpoint: TcpEndpoint,
): Promise<void> {
  if (socket.destroyed) return;

  return new Promise<void>((resolve, reject) => {
    let settled = false;

    const cleanup = (): void => {
      clearTimeout(timer);
      socket.off("error", onError);
      socket.off("close", onClose);
    };

    const finish = (error?: OpenReceiptError): void => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve();
    };

    const onError = (): void => {
      finish(
        new OpenReceiptError(
          "TCP_CLOSE_FAILED",
          "TCP connection failed while closing.",
          endpointDetails(endpoint),
        ),
      );
    };

    const onClose = (): void => finish();

    const timer = setTimeout(() => {
      socket.destroy();
      finish(
        new OpenReceiptError(
          "TCP_CLOSE_TIMEOUT",
          "TCP connection did not close before the timeout.",
          endpointDetails(endpoint),
        ),
      );
    }, endpoint.closeTimeoutMs);

    socket.once("error", onError);
    socket.once("close", onClose);

    try {
      socket.end();
    } catch {
      finish(
        new OpenReceiptError(
          "TCP_CLOSE_FAILED",
          "TCP connection failed while closing.",
          endpointDetails(endpoint),
        ),
      );
    }
  });
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError: () => OpenReceiptError,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(timeoutError()), timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

function endpointDetails(endpoint: TcpEndpoint): Readonly<Record<string, unknown>> {
  return Object.freeze({
    host: endpoint.host,
    port: endpoint.port,
    connectTimeoutMs: endpoint.connectTimeoutMs,
    writeTimeoutMs: endpoint.writeTimeoutMs,
    closeTimeoutMs: endpoint.closeTimeoutMs,
  });
}
