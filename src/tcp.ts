import { Socket } from "node:net";

import { OpenReceiptError } from "./errors.js";

export type TcpTransportOptions = Readonly<{
  host: string;
  port: number;
  timeoutMs?: number;
}>;

export type TcpEndpoint = Readonly<{
  host: string;
  port: number;
  timeoutMs: number;
}>;

export type TcpConnection = Readonly<{
  write: (data: Uint8Array) => Promise<void>;
  close: () => Promise<void>;
}>;

export type TcpConnector = (endpoint: TcpEndpoint) => Promise<TcpConnection>;

export const DEFAULT_TCP_TIMEOUT_MS = 5_000;

export const NODE_TCP_CONNECTOR: TcpConnector = async (
  endpoint: TcpEndpoint,
): Promise<TcpConnection> => {
  const socket = await connectSocket(endpoint);

  return Object.freeze({
    write: (data: Uint8Array) => writeSocket(socket, data, endpoint),
    close: () => closeSocket(socket, endpoint),
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
    connection = await connector(endpoint);
  } catch (error) {
    if (error instanceof OpenReceiptError) throw error;

    throw new OpenReceiptError(
      "TCP_CONNECT_FAILED",
      "TCP connection failed before print bytes could be written.",
      endpointDetails(endpoint),
    );
  }

  if (
    typeof connection !== "object" ||
    connection === null ||
    typeof connection.write !== "function" ||
    typeof connection.close !== "function"
  ) {
    throw new OpenReceiptError(
      "TCP_CONNECT_FAILED",
      "TCP connector returned an invalid connection object.",
      endpointDetails(endpoint),
    );
  }

  let primaryError: unknown;
  let primaryStage: "write" | "close" | undefined;

  try {
    await connection.write(data);
  } catch (error) {
    primaryError = error;
    primaryStage = "write";
  }

  try {
    await connection.close();
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

  const timeoutMs = candidate.timeoutMs ?? DEFAULT_TCP_TIMEOUT_MS;
  if (
    typeof timeoutMs !== "number" ||
    !Number.isInteger(timeoutMs) ||
    timeoutMs < 1
  ) {
    throw new OpenReceiptError(
      "INVALID_TCP_OPTION",
      "TCP timeoutMs must be a positive integer.",
      { timeoutMs },
    );
  }

  return Object.freeze({
    host: candidate.host.trim(),
    port: candidate.port,
    timeoutMs,
  });
}

async function connectSocket(endpoint: TcpEndpoint): Promise<Socket> {
  const socket = new Socket();
  socket.setNoDelay(true);

  return new Promise<Socket>((resolve, reject) => {
    let settled = false;

    const finish = (error?: OpenReceiptError): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.off("error", onError);

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

    const timer = setTimeout(() => {
      finish(
        new OpenReceiptError(
          "TCP_CONNECT_TIMEOUT",
          "TCP connection timed out.",
          endpointDetails(endpoint),
        ),
      );
    }, endpoint.timeoutMs);

    socket.once("error", onError);

    try {
      socket.connect(endpoint.port, endpoint.host, () => finish());
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
  if (socket.destroyed) {
    throw new OpenReceiptError(
      "TCP_WRITE_FAILED",
      "TCP connection closed before print bytes could be written.",
      endpointDetails(endpoint),
    );
  }

  return new Promise<void>((resolve, reject) => {
    let settled = false;

    const finish = (error?: OpenReceiptError): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.off("error", onError);
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

    const timer = setTimeout(() => {
      socket.destroy();
      finish(
        new OpenReceiptError(
          "TCP_WRITE_TIMEOUT",
          "TCP write timed out.",
          endpointDetails(endpoint),
        ),
      );
    }, endpoint.timeoutMs);

    socket.once("error", onError);

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

    const finish = (error?: OpenReceiptError): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.off("error", onError);
      socket.off("close", onClose);
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
          "TCP_CLOSE_FAILED",
          "TCP connection did not close before the timeout.",
          endpointDetails(endpoint),
        ),
      );
    }, endpoint.timeoutMs);

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

function endpointDetails(endpoint: TcpEndpoint): Readonly<Record<string, unknown>> {
  return Object.freeze({
    host: endpoint.host,
    port: endpoint.port,
    timeoutMs: endpoint.timeoutMs,
  });
}
