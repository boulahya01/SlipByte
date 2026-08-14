import { OpenReceiptError } from "./errors.js";
import type {
  Alignment,
  ReceiptDocument,
  ReceiptNode,
} from "./types.js";

export type BuiltInPaperSize = "58mm" | "80mm";
export type LayoutOverflow = "wrap" | "truncate" | "error";

export type PaperProfile = Readonly<{
  id: string;
  widthMm: number;
  columns: number;
}>;

export type TextMeasurer = Readonly<{
  id?: string;
  measure: (text: string) => number;
}>;

export type LayoutLineSource = "text" | "item" | "total" | "divider";

export type LayoutLineNode = Readonly<{
  type: "line";
  value: string;
  bold: boolean;
  source: LayoutLineSource;
  sourceNodeIndex: number;
}>;

export type LayoutFeedNode = Readonly<{
  type: "feed";
  lines: number;
  sourceNodeIndex: number;
}>;

export type LayoutCutNode = Readonly<{
  type: "cut";
  sourceNodeIndex: number;
}>;

export type LayoutNode = LayoutLineNode | LayoutFeedNode | LayoutCutNode;

export type LayoutDocument = Readonly<{
  paper: PaperProfile;
  nodes: readonly LayoutNode[];
}>;

export type LayoutOptions = Readonly<{
  paper?: BuiltInPaperSize | PaperProfile;
  overflow?: LayoutOverflow;
  formatAmount?: (amount: number) => string;
  textMeasurer?: TextMeasurer;
}>;

export const PAPER_58MM: PaperProfile = Object.freeze({
  id: "58mm",
  widthMm: 58,
  columns: 32,
});

export const PAPER_80MM: PaperProfile = Object.freeze({
  id: "80mm",
  widthMm: 80,
  columns: 48,
});

const graphemeSegmenter = new Intl.Segmenter(undefined, {
  granularity: "grapheme",
});

export const GRAPHEME_TEXT_MEASURER: TextMeasurer = Object.freeze({
  id: "grapheme-cluster",
  measure(text: string): number {
    return segmentGraphemes(text).length;
  },
});

export function paperProfile(size: BuiltInPaperSize): PaperProfile {
  if (size === "58mm") {
    return PAPER_58MM;
  }

  if (size === "80mm") {
    return PAPER_80MM;
  }

  throw new OpenReceiptError(
    "INVALID_PAPER_PROFILE",
    'Built-in paper size must be either "58mm" or "80mm".',
    { size },
  );
}

export function layoutReceipt(
  document: ReceiptDocument,
  options: LayoutOptions = {},
): LayoutDocument {
  const paper = resolvePaper(options.paper ?? "80mm");
  const overflow = resolveOverflow(options.overflow ?? "wrap");
  const formatAmount = options.formatAmount ?? defaultAmountFormatter;
  const textMeasurer = resolveTextMeasurer(
    options.textMeasurer ?? GRAPHEME_TEXT_MEASURER,
  );

  if (typeof formatAmount !== "function") {
    throw new OpenReceiptError(
      "INVALID_LAYOUT_OPTION",
      "formatAmount must be a function when provided.",
      { formatAmountType: typeof formatAmount },
    );
  }

  const nodes: LayoutNode[] = [];

  document.nodes.forEach((node, sourceNodeIndex) => {
    nodes.push(
      ...layoutNode(
        node,
        sourceNodeIndex,
        paper.columns,
        overflow,
        formatAmount,
        textMeasurer,
      ),
    );
  });

  return Object.freeze({
    paper,
    nodes: Object.freeze(nodes.map((node) => Object.freeze({ ...node }))),
  });
}

function layoutNode(
  node: ReceiptNode,
  sourceNodeIndex: number,
  columns: number,
  overflow: LayoutOverflow,
  formatAmount: (amount: number) => string,
  textMeasurer: TextMeasurer,
): LayoutNode[] {
  switch (node.type) {
    case "text":
      return fitText(
        node.value,
        columns,
        overflow,
        sourceNodeIndex,
        textMeasurer,
      ).map((value) =>
        makeLine(
          align(value, columns, node.align, textMeasurer),
          node.bold,
          "text",
          sourceNodeIndex,
        ),
      );

    case "item": {
      const left = node.quantity === 1 ? node.name : `${node.quantity}x ${node.name}`;
      const right = safeFormatAmount(node.quantity * node.unitPrice, formatAmount);
      return layoutColumns(
        left,
        right,
        columns,
        overflow,
        "item",
        sourceNodeIndex,
        textMeasurer,
      );
    }

    case "total":
      return layoutColumns(
        node.label,
        safeFormatAmount(node.amount, formatAmount),
        columns,
        overflow,
        "total",
        sourceNodeIndex,
        textMeasurer,
      );

    case "divider":
      return [makeLine("-".repeat(columns), false, "divider", sourceNodeIndex)];

    case "feed":
      return [{ type: "feed", lines: node.lines, sourceNodeIndex }];

    case "cut":
      return [{ type: "cut", sourceNodeIndex }];
  }
}

function resolvePaper(paper: BuiltInPaperSize | PaperProfile): PaperProfile {
  if (typeof paper === "string") {
    return paperProfile(paper);
  }

  const candidate = paper as Partial<PaperProfile> | null;
  if (
    candidate === null ||
    typeof candidate !== "object" ||
    typeof candidate.id !== "string" ||
    !candidate.id.trim() ||
    typeof candidate.widthMm !== "number" ||
    !Number.isFinite(candidate.widthMm) ||
    candidate.widthMm <= 0 ||
    typeof candidate.columns !== "number" ||
    !Number.isInteger(candidate.columns) ||
    candidate.columns < 8
  ) {
    throw new OpenReceiptError(
      "INVALID_PAPER_PROFILE",
      "Paper profiles require a non-empty id, a positive widthMm, and at least 8 integer columns.",
      { paper },
    );
  }

  return Object.freeze({
    id: candidate.id,
    widthMm: candidate.widthMm,
    columns: candidate.columns,
  });
}

function resolveOverflow(value: LayoutOverflow): LayoutOverflow {
  if (value === "wrap" || value === "truncate" || value === "error") {
    return value;
  }

  throw new OpenReceiptError(
    "INVALID_LAYOUT_OPTION",
    'overflow must be "wrap", "truncate", or "error".',
    { overflow: value },
  );
}

function resolveTextMeasurer(measurer: TextMeasurer): TextMeasurer {
  const candidate = measurer as Partial<TextMeasurer> | null;

  if (
    candidate === null ||
    typeof candidate !== "object" ||
    typeof candidate.measure !== "function"
  ) {
    throw new OpenReceiptError(
      "INVALID_LAYOUT_OPTION",
      "textMeasurer must expose a measure(text) function.",
      { textMeasurerType: typeof measurer },
    );
  }

  const resolved = candidate as TextMeasurer;
  const spaceWidth = measureText(" ", resolved);

  if (spaceWidth !== 1) {
    throw new OpenReceiptError(
      "INVALID_LAYOUT_OPTION",
      "Column-based text measurers must report one layout cell for a normal space.",
      { textMeasurerId: resolved.id, spaceWidth },
    );
  }

  return resolved;
}

function defaultAmountFormatter(amount: number): string {
  return amount.toFixed(2);
}

function safeFormatAmount(
  amount: number,
  formatter: (amount: number) => string,
): string {
  let formatted: unknown;

  try {
    formatted = formatter(amount);
  } catch (cause) {
    throw new OpenReceiptError(
      "AMOUNT_FORMAT_FAILED",
      "The configured amount formatter threw while laying out a receipt.",
      { amount, cause },
    );
  }

  if (typeof formatted !== "string" || !formatted.trim()) {
    throw new OpenReceiptError(
      "AMOUNT_FORMAT_FAILED",
      "The configured amount formatter must return non-empty text.",
      { amount, formatted },
    );
  }

  return formatted;
}

function layoutColumns(
  left: string,
  right: string,
  columns: number,
  overflow: LayoutOverflow,
  source: "item" | "total",
  sourceNodeIndex: number,
  textMeasurer: TextMeasurer,
): LayoutLineNode[] {
  const rightWidth = measureText(right, textMeasurer);

  if (rightWidth >= columns) {
    if (overflow === "error") {
      throw overflowError(right, columns, sourceNodeIndex, textMeasurer);
    }

    if (overflow === "truncate") {
      const leftLine = truncate(
        left,
        columns,
        sourceNodeIndex,
        textMeasurer,
      );
      const rightLine = align(
        truncate(right, columns, sourceNodeIndex, textMeasurer),
        columns,
        "right",
        textMeasurer,
      );
      return [
        makeLine(leftLine, false, source, sourceNodeIndex),
        makeLine(rightLine, false, source, sourceNodeIndex),
      ];
    }

    return [
      ...fitText(
        left,
        columns,
        "wrap",
        sourceNodeIndex,
        textMeasurer,
      ).map((value) => makeLine(value, false, source, sourceNodeIndex)),
      ...fitText(
        right,
        columns,
        "wrap",
        sourceNodeIndex,
        textMeasurer,
      ).map((value) =>
        makeLine(
          align(value, columns, "right", textMeasurer),
          false,
          source,
          sourceNodeIndex,
        ),
      ),
    ];
  }

  const leftColumns = columns - rightWidth - 1;
  const leftLines = fitText(
    left,
    leftColumns,
    overflow,
    sourceNodeIndex,
    textMeasurer,
  );
  const firstLeft = leftLines[0] ?? "";
  const firstValue = `${padEnd(firstLeft, leftColumns, textMeasurer)} ${right}`;

  return [
    makeLine(firstValue, false, source, sourceNodeIndex),
    ...leftLines.slice(1).map((value) =>
      makeLine(value, false, source, sourceNodeIndex),
    ),
  ];
}

function fitText(
  value: string,
  columns: number,
  overflow: LayoutOverflow,
  sourceNodeIndex: number,
  textMeasurer: TextMeasurer,
): string[] {
  const paragraphs = value.replaceAll("\r\n", "\n").split("\n");
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    if (measureText(paragraph, textMeasurer) <= columns) {
      lines.push(paragraph);
      continue;
    }

    if (overflow === "error") {
      throw overflowError(paragraph, columns, sourceNodeIndex, textMeasurer);
    }

    if (overflow === "truncate") {
      lines.push(
        truncate(paragraph, columns, sourceNodeIndex, textMeasurer),
      );
      continue;
    }

    lines.push(
      ...wrap(paragraph, columns, sourceNodeIndex, textMeasurer),
    );
  }

  return lines;
}

function wrap(
  value: string,
  columns: number,
  sourceNodeIndex: number,
  textMeasurer: TextMeasurer,
): string[] {
  const words = value.trim().split(/\s+/u).filter(Boolean);
  if (words.length === 0) {
    return [""];
  }

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (measureText(word, textMeasurer) > columns) {
      if (current) {
        lines.push(current);
        current = "";
      }

      const chunks = chunk(
        word,
        columns,
        sourceNodeIndex,
        textMeasurer,
      );
      lines.push(...chunks.slice(0, -1));
      current = chunks.at(-1) ?? "";
      continue;
    }

    const candidate = current ? `${current} ${word}` : word;
    if (measureText(candidate, textMeasurer) <= columns) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function chunk(
  value: string,
  columns: number,
  sourceNodeIndex: number,
  textMeasurer: TextMeasurer,
): string[] {
  const segments = segmentGraphemes(value);
  const chunks: string[] = [];
  let current = "";

  for (const segment of segments) {
    const candidate = `${current}${segment}`;

    if (measureText(candidate, textMeasurer) <= columns) {
      current = candidate;
      continue;
    }

    if (!current) {
      throw overflowError(segment, columns, sourceNodeIndex, textMeasurer);
    }

    chunks.push(current);
    current = segment;

    if (measureText(current, textMeasurer) > columns) {
      throw overflowError(current, columns, sourceNodeIndex, textMeasurer);
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

function truncate(
  value: string,
  columns: number,
  sourceNodeIndex: number,
  textMeasurer: TextMeasurer,
): string {
  if (measureText(value, textMeasurer) <= columns) {
    return value;
  }

  const ellipsis = "…";
  if (measureText(ellipsis, textMeasurer) > columns) {
    throw overflowError(ellipsis, columns, sourceNodeIndex, textMeasurer);
  }

  let result = "";

  for (const segment of segmentGraphemes(value)) {
    const candidate = `${result}${segment}${ellipsis}`;
    if (measureText(candidate, textMeasurer) > columns) {
      break;
    }
    result += segment;
  }

  return `${result}${ellipsis}`;
}

function align(
  value: string,
  columns: number,
  alignment: Alignment,
  textMeasurer: TextMeasurer,
): string {
  const width = measureText(value, textMeasurer);
  if (width >= columns || alignment === "left") {
    return value;
  }

  const remaining = columns - width;
  const leading = alignment === "right" ? remaining : Math.floor(remaining / 2);
  return `${" ".repeat(leading)}${value}`;
}

function padEnd(
  value: string,
  columns: number,
  textMeasurer: TextMeasurer,
): string {
  const width = measureText(value, textMeasurer);
  return `${value}${" ".repeat(Math.max(0, columns - width))}`;
}

function measureText(value: string, textMeasurer: TextMeasurer): number {
  let measured: unknown;

  try {
    measured = textMeasurer.measure(value);
  } catch (cause) {
    throw new OpenReceiptError(
      "TEXT_MEASURE_FAILED",
      "The configured text measurer threw while measuring receipt content.",
      { textMeasurerId: textMeasurer.id, cause },
    );
  }

  if (
    typeof measured !== "number" ||
    !Number.isFinite(measured) ||
    !Number.isInteger(measured) ||
    measured < 0
  ) {
    throw new OpenReceiptError(
      "TEXT_MEASURE_FAILED",
      "Text measurers must return a finite non-negative integer number of layout cells.",
      { textMeasurerId: textMeasurer.id, measured },
    );
  }

  return measured;
}

function segmentGraphemes(value: string): string[] {
  return Array.from(graphemeSegmenter.segment(value), ({ segment }) => segment);
}

function makeLine(
  value: string,
  bold: boolean,
  source: LayoutLineSource,
  sourceNodeIndex: number,
): LayoutLineNode {
  return { type: "line", value, bold, source, sourceNodeIndex };
}

function overflowError(
  value: string,
  columns: number,
  sourceNodeIndex: number,
  textMeasurer: TextMeasurer,
): OpenReceiptError {
  return new OpenReceiptError(
    "LAYOUT_OVERFLOW",
    `Receipt content exceeds the available ${columns} columns.`,
    {
      value,
      columns,
      sourceNodeIndex,
      measuredColumns: measureText(value, textMeasurer),
      textMeasurerId: textMeasurer.id,
    },
  );
}
