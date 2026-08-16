import {
  OpenReceiptError,
  type OpenReceiptErrorCode,
} from "./errors.js";

export type DiagnosticStage =
  | "input"
  | "document"
  | "layout"
  | "capability"
  | "encoding"
  | "transport"
  | "unknown";

export type RetrySafety =
  | "not-applicable"
  | "safe-after-remediation"
  | "unsafe-without-confirmation"
  | "unknown";

export type DeliveryState =
  | "not-applicable"
  | "not-started"
  | "uncertain"
  | "unknown";

export type OpenReceiptDiagnostic = Readonly<{
  code?: OpenReceiptErrorCode;
  stage: DiagnosticStage;
  summary: string;
  retrySafety: RetrySafety;
  delivery: DeliveryState;
  remediation: readonly string[];
}>;

export function diagnoseError(error: unknown): OpenReceiptDiagnostic {
  if (!(error instanceof OpenReceiptError)) {
    return diagnostic(
      undefined,
      "unknown",
      "The failure is not an OpenReceipt structured error.",
      "unknown",
      "unknown",
      ["Inspect the original failure at the application boundary before retrying."],
    );
  }

  switch (error.code) {
    case "INVALID_TEXT":
    case "INVALID_QUANTITY":
    case "INVALID_AMOUNT":
    case "INVALID_FEED_LINES":
      return diagnostic(
        error.code,
        "input",
        "Receipt input is invalid.",
        "not-applicable",
        "not-applicable",
        ["Correct the application input and rebuild the receipt."],
      );

    case "INVALID_PRINT_DOCUMENT":
    case "UNSUPPORTED_DOCUMENT_VERSION":
      return diagnostic(
        error.code,
        "document",
        "The print-document contract cannot be accepted as provided.",
        "not-applicable",
        "not-applicable",
        ["Validate the serialized document shape and supported schema version."],
      );

    case "INVALID_PAPER_PROFILE":
    case "INVALID_LAYOUT_OPTION":
    case "AMOUNT_FORMAT_FAILED":
    case "TEXT_MEASURE_FAILED":
    case "LAYOUT_OVERFLOW":
      return diagnostic(
        error.code,
        "layout",
        "Receipt layout could not be produced with the current configuration.",
        "not-applicable",
        "not-applicable",
        ["Review paper, overflow, formatter, and text-measurement configuration."],
      );

    case "INVALID_DEVICE_PROFILE":
    case "UNSUPPORTED_CAPABILITY":
      return diagnostic(
        error.code,
        "capability",
        "The configured device profile cannot satisfy the requested operation.",
        "not-applicable",
        "not-applicable",
        ["Review the device profile and requested capability before printing."],
      );

    case "UNSUPPORTED_PROTOCOL":
    case "INVALID_ENCODER_OPTION":
    case "TEXT_ENCODING_FAILED":
      return diagnostic(
        error.code,
        "encoding",
        "Printer bytes could not be encoded with the current protocol configuration.",
        "not-applicable",
        "not-applicable",
        ["Review protocol, encoder, and device text-encoding configuration."],
      );

    case "INVALID_TCP_OPTION":
      return diagnostic(
        error.code,
        "transport",
        "TCP transport configuration is invalid.",
        "not-applicable",
        "not-started",
        ["Correct the TCP endpoint or timeout configuration before retrying."],
      );

    case "TCP_CONNECT_FAILED":
    case "TCP_CONNECT_TIMEOUT":
      return diagnostic(
        error.code,
        "transport",
        "TCP connection failed before print bytes were written.",
        "safe-after-remediation",
        "not-started",
        ["Verify printer reachability, host, port, and network path before retrying."],
      );

    case "TCP_WRITE_FAILED":
    case "TCP_WRITE_TIMEOUT":
    case "TCP_CLOSED_EARLY":
    case "TCP_CLOSE_FAILED":
    case "TCP_CLOSE_TIMEOUT":
      return diagnostic(
        error.code,
        "transport",
        "TCP delivery outcome is uncertain because the failure occurred after connection.",
        "unsafe-without-confirmation",
        "uncertain",
        [
          "Do not blindly retry; first determine whether the printer may already have received the job.",
        ],
      );
  }
}

function diagnostic(
  code: OpenReceiptErrorCode | undefined,
  stage: DiagnosticStage,
  summary: string,
  retrySafety: RetrySafety,
  delivery: DeliveryState,
  remediation: readonly string[],
): OpenReceiptDiagnostic {
  return Object.freeze({
    ...(code ? { code } : {}),
    stage,
    summary,
    retrySafety,
    delivery,
    remediation: Object.freeze([...remediation]),
  });
}
