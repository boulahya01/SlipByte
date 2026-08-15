import { OpenReceiptError } from "./errors.js";
import type { Alignment, ReceiptDocument } from "./types.js";

export const PRINT_DOCUMENT_VERSION = 1 as const;

export type PrintTextNodeV1 = Readonly<{
  type: "text";
  value: string;
  align: Alignment;
  bold: boolean;
}>;

export type PrintItemNodeV1 = Readonly<{
  type: "item";
  name: string;
  quantity: number;
  unitPrice: number;
}>;

export type PrintTotalNodeV1 = Readonly<{
  type: "total";
  label: string;
  amount: number;
}>;

export type PrintDividerNodeV1 = Readonly<{ type: "divider" }>;
export type PrintFeedNodeV1 = Readonly<{ type: "feed"; lines: number }>;
export type PrintCutNodeV1 = Readonly<{ type: "cut" }>;

export type PrintDocumentNodeV1 =
  | PrintTextNodeV1
  | PrintItemNodeV1
  | PrintTotalNodeV1
  | PrintDividerNodeV1
  | PrintFeedNodeV1
  | PrintCutNodeV1;

export type PrintDocumentV1 = Readonly<{
  version: typeof PRINT_DOCUMENT_VERSION;
  nodes: readonly PrintDocumentNodeV1[];
}>;

export type PrintDocument = PrintDocumentV1;

export function createPrintDocument(document: ReceiptDocument): PrintDocumentV1 {
  return parsePrintDocument({
    version: PRINT_DOCUMENT_VERSION,
    nodes: document.nodes,
  });
}

export function parsePrintDocument(value: unknown): PrintDocumentV1 {
  if (!isRecord(value)) {
    throw invalidDocument("Print document must be an object.", { receivedType: typeof value });
  }

  if (value.version !== PRINT_DOCUMENT_VERSION) {
    throw new OpenReceiptError(
      "UNSUPPORTED_DOCUMENT_VERSION",
      "Print document version is not supported.",
      { version: value.version },
    );
  }

  if (!Array.isArray(value.nodes)) {
    throw invalidDocument("Print document nodes must be an array.");
  }

  const nodes = value.nodes.map((node, index) => parseNode(node, index));
  return Object.freeze({ version: PRINT_DOCUMENT_VERSION, nodes: Object.freeze(nodes) });
}

export function serializePrintDocument(document: PrintDocument): string {
  return JSON.stringify(parsePrintDocument(document));
}

export function deserializePrintDocument(serialized: string): PrintDocumentV1 {
  if (typeof serialized !== "string") {
    throw invalidDocument("Serialized print document must be a string.", {
      receivedType: typeof serialized,
    });
  }

  let value: unknown;
  try {
    value = JSON.parse(serialized);
  } catch {
    throw invalidDocument("Serialized print document must contain valid JSON.");
  }

  return parsePrintDocument(value);
}

function parseNode(value: unknown, index: number): PrintDocumentNodeV1 {
  if (!isRecord(value) || typeof value.type !== "string") {
    throw invalidDocument("Print document node must be an object with a type.", { index });
  }

  switch (value.type) {
    case "text":
      return Object.freeze({
        type: "text",
        value: requireText(value.value, index, "value"),
        align: requireAlignment(value.align, index),
        bold: requireBoolean(value.bold, index, "bold"),
      });
    case "item":
      return Object.freeze({
        type: "item",
        name: requireText(value.name, index, "name"),
        quantity: requirePositiveNumber(value.quantity, index, "quantity"),
        unitPrice: requireNonNegativeNumber(value.unitPrice, index, "unitPrice"),
      });
    case "total":
      return Object.freeze({
        type: "total",
        label: requireText(value.label, index, "label"),
        amount: requireNonNegativeNumber(value.amount, index, "amount"),
      });
    case "divider":
      return Object.freeze({ type: "divider" });
    case "feed":
      if (!Number.isInteger(value.lines) || (value.lines as number) < 1) {
        throw invalidDocument("Feed node lines must be a positive integer.", { index, field: "lines" });
      }
      return Object.freeze({ type: "feed", lines: value.lines as number });
    case "cut":
      return Object.freeze({ type: "cut" });
    default:
      throw invalidDocument("Print document node type is not supported.", {
        index,
        nodeType: value.type,
      });
  }
}

function requireText(value: unknown, index: number, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw invalidDocument("Print document text field must be non-empty text.", {
      index,
      field,
      receivedType: typeof value,
    });
  }
  if (/[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F]/u.test(value)) {
    throw invalidDocument("Print document text field contains an unsafe control character.", {
      index,
      field,
    });
  }
  return value;
}

function requireAlignment(value: unknown, index: number): Alignment {
  if (value === "left" || value === "center" || value === "right") return value;
  throw invalidDocument("Text node alignment is invalid.", { index, field: "align" });
}

function requireBoolean(value: unknown, index: number, field: string): boolean {
  if (typeof value === "boolean") return value;
  throw invalidDocument("Print document field must be a boolean.", { index, field });
}

function requirePositiveNumber(value: unknown, index: number, field: string): number {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  throw invalidDocument("Print document numeric field must be finite and greater than zero.", { index, field });
}

function requireNonNegativeNumber(value: unknown, index: number, field: string): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) return value;
  throw invalidDocument("Print document numeric field must be finite and non-negative.", { index, field });
}

function invalidDocument(message: string, details: Record<string, unknown> = {}): OpenReceiptError {
  return new OpenReceiptError("INVALID_PRINT_DOCUMENT", message, details);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
