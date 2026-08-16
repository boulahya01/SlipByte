import type { LayoutDocument, LayoutOptions } from "./layout.js";
import { layoutReceipt } from "./layout.js";
import type { ReceiptDocument } from "./types.js";

export const PREVIEW_CUT_MARKER = "[cut]";

export type MockPrintResult = Readonly<{
  layout: LayoutDocument;
  preview: string;
}>;

export function previewLayout(layout: LayoutDocument): string {
  const chunks: string[] = [];

  for (const node of layout.nodes) {
    switch (node.type) {
      case "line":
        chunks.push(node.value, "\n");
        break;
      case "feed":
        chunks.push("\n".repeat(node.lines));
        break;
      case "cut":
        chunks.push(PREVIEW_CUT_MARKER, "\n");
        break;
    }
  }

  return chunks.join("");
}

export function mockPrint(
  document: ReceiptDocument,
  layoutOptions: LayoutOptions = {},
): MockPrintResult {
  const layout = layoutReceipt(document, layoutOptions);

  return Object.freeze({
    layout,
    preview: previewLayout(layout),
  });
}
