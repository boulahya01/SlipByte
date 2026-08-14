export type OpenReceiptErrorCode =
  | "INVALID_TEXT"
  | "INVALID_QUANTITY"
  | "INVALID_AMOUNT"
  | "INVALID_FEED_LINES"
  | "INVALID_PAPER_PROFILE"
  | "AMOUNT_FORMAT_FAILED"
  | "LAYOUT_OVERFLOW";

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
