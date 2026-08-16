export type OpenReceiptErrorCode =
  | "INVALID_TEXT"
  | "INVALID_QUANTITY"
  | "INVALID_AMOUNT"
  | "INVALID_FEED_LINES"
  | "INVALID_PRINT_DOCUMENT"
  | "UNSUPPORTED_DOCUMENT_VERSION"
  | "INVALID_PAPER_PROFILE"
  | "INVALID_LAYOUT_OPTION"
  | "AMOUNT_FORMAT_FAILED"
  | "TEXT_MEASURE_FAILED"
  | "LAYOUT_OVERFLOW"
  | "INVALID_DEVICE_PROFILE"
  | "UNSUPPORTED_CAPABILITY"
  | "INVALID_COMPATIBILITY_EVIDENCE"
  | "INVALID_TEXT_REPRESENTATION_OPTION"
  | "TEXT_REPRESENTATION_FAILED"
  | "UNSUPPORTED_TEXT_REPRESENTATION"
  | "UNSUPPORTED_PROTOCOL"
  | "INVALID_ENCODER_OPTION"
  | "TEXT_ENCODING_FAILED"
  | "INVALID_TCP_OPTION"
  | "TCP_CONNECT_FAILED"
  | "TCP_CONNECT_TIMEOUT"
  | "TCP_WRITE_FAILED"
  | "TCP_WRITE_TIMEOUT"
  | "TCP_CLOSED_EARLY"
  | "TCP_CLOSE_FAILED"
  | "TCP_CLOSE_TIMEOUT";

export class OpenReceiptError extends Error {
  readonly code: OpenReceiptErrorCode;
  readonly details: Readonly<Record<string, unknown>>;

  constructor(
    code: OpenReceiptErrorCode,
    message: string,
    details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "OpenReceiptError";
    this.code = code;
    this.details = Object.freeze({ ...details });
  }
}
