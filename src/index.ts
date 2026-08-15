export { OpenReceiptError } from "./errors.js";
export type { OpenReceiptErrorCode } from "./errors.js";
export {
  defineDeviceProfile,
  requireCapability,
  resolveCapability,
} from "./capabilities.js";
export type {
  CapabilityResolution,
  CapabilitySupport,
  DeviceProfile,
  PrinterCapabilities,
  PrinterCapability,
} from "./capabilities.js";
export {
  createPrintDocument,
  deserializePrintDocument,
  parsePrintDocument,
  PRINT_DOCUMENT_VERSION,
  serializePrintDocument,
} from "./document.js";
export type {
  PrintCutNodeV1,
  PrintDividerNodeV1,
  PrintDocument,
  PrintDocumentNodeV1,
  PrintDocumentV1,
  PrintFeedNodeV1,
  PrintItemNodeV1,
  PrintTextNodeV1,
  PrintTotalNodeV1,
} from "./document.js";
export {
  ESC_POS_ASCII_TEXT_ENCODER,
  encodeEscPos,
} from "./escpos.js";
export type {
  EscPosCutFallback,
  EscPosEncoderOptions,
  EscPosTextEncoder,
} from "./escpos.js";
export {
  GRAPHEME_TEXT_MEASURER,
  layoutReceipt,
  PAPER_58MM,
  PAPER_80MM,
  paperProfile,
} from "./layout.js";
export type {
  BuiltInPaperSize,
  LayoutCutNode,
  LayoutDocument,
  LayoutFeedNode,
  LayoutLineNode,
  LayoutLineSource,
  LayoutNode,
  LayoutOptions,
  LayoutOverflow,
  PaperProfile,
  TextMeasurer,
} from "./layout.js";
export { ReceiptBuilder, receipt } from "./receipt.js";
export type {
  Alignment,
  ReceiptCutNode,
  ReceiptDividerNode,
  ReceiptDocument,
  ReceiptFeedNode,
  ReceiptItemNode,
  ReceiptNode,
  ReceiptTextNode,
  ReceiptTotalNode,
} from "./types.js";
export {
  DEFAULT_TCP_TIMEOUT_MS,
  NODE_TCP_CONNECTOR,
  sendTcp,
} from "./tcp.js";
export type {
  TcpConnection,
  TcpConnector,
  TcpEndpoint,
  TcpTransportOptions,
} from "./tcp.js";
