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
  | "UNSUPPORTED_PROTOCOL"
  | "INVALID_ENCODER_OPTION"
  | "TEXT_ENCODING_FAILED";

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
