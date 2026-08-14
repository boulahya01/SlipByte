export type Alignment = "left" | "center" | "right";

export type ReceiptTextNode = {
  type: "text";
  value: string;
  align: Alignment;
  bold: boolean;
};

export type ReceiptItemNode = {
  type: "item";
  name: string;
  quantity: number;
  unitPrice: number;
};

export type ReceiptTotalNode = {
  type: "total";
  label: string;
  amount: number;
};

export type ReceiptDividerNode = {
  type: "divider";
};

export type ReceiptFeedNode = {
  type: "feed";
  lines: number;
};

export type ReceiptCutNode = {
  type: "cut";
};

export type ReceiptNode =
  | ReceiptTextNode
  | ReceiptItemNode
  | ReceiptTotalNode
  | ReceiptDividerNode
  | ReceiptFeedNode
  | ReceiptCutNode;

export type ReceiptDocument = Readonly<{
  nodes: readonly ReceiptNode[];
}>;
